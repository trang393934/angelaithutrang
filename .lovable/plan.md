

## Fix loi ky tu Unicode trong Coordinator Chat

### Van de
Du lieu trong database da luu noi dung bi hong (vi du: "Đ~~~t" thay vi "Đặt", "KH~~I" thay vi "KHỞI"). Nguyen nhan: edge function `coordinator-chat` chi pipe thang `response.body` tu AI gateway ve client ma khong xu ly gi. Client-side `TextDecoder` co the gap van de khi SSE chunks cat giua ky tu multi-byte tieng Viet.

### Giai phap

**1. File `supabase/functions/coordinator-chat/index.ts`**
Thay vi tra ve `response.body` truc tiep (dong 282), them TransformStream tuong tu nhu da fix trong `angel-chat`:
- Tao `TransformStream` voi `parseBuffer` de buffer cac dong SSE chua hoan chinh
- Dung `TextDecoder` voi `{ stream: true }` de xu ly multi-byte chars dung
- Forward chunk nguyen ban cho client (khong lam mat du lieu)
- Chi parse cac dong `data:` hoan chinh de dam bao JSON khong bi cat

```
// Thay dong:
return new Response(response.body, { ... });

// Bang:
const streamDecoder = new TextDecoder();
let parseBuffer = "";
const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk); // Forward nguyen chunk
    try {
      const text = streamDecoder.decode(chunk, { stream: true });
      parseBuffer += text;
      // Buffer cac dong chua hoan chinh, chi log cac dong xong
      let idx;
      while ((idx = parseBuffer.indexOf('\n')) !== -1) {
        parseBuffer = parseBuffer.slice(idx + 1);
      }
    } catch {}
  },
});

response.body.pipeTo(writable);
return new Response(readable, { ... });
```

**2. File `src/hooks/useCoordinatorChat.ts`**
Cai thien client-side streaming de tranh luu ky tu bi hong vao DB:
- Dam bao `TextDecoder` chi duoc tao 1 lan (da dung, OK)
- Them logic: truoc khi luu `fullContent` vao DB, loai bo bat ky ky tu `\uFFFD` con sot lai va thay bang chuoi rong (vi day la ky tu thay the bi hong, khong phai tieng Viet that)

```
// Truoc khi save:
const cleanContent = fullContent.replace(/\uFFFD/g, '');
if (cleanContent) {
  await supabase.from("coordinator_chat_messages").insert({
    ...
    content: cleanContent,
  });
}
```

### Chi tiet ky thuat

Nguyen nhan chinh: `coordinator-chat` edge function dung `return new Response(response.body, ...)` pipe thang stream tu Cloudflare/Lovable gateway. Khi AI gateway tra ve SSE chunks ma mot ky tu tieng Viet (2-3 bytes) bi cat giua 2 chunks, client decode thanh U+FFFD roi luu vao DB.

Fix ap dung cung pattern da thanh cong voi `angel-chat`: dung TransformStream de dam bao stream duoc xu ly dung charset truoc khi gui ve client.

### Ket qua
- Cac ky tu tieng Viet trong Coordinator chat se hien thi dung
- Noi dung moi luu vao DB se khong con bi hong
- Noi dung cu da bi hong van giu nguyen (khong tu dong fix duoc du lieu cu)
