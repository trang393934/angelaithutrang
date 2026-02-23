
## Fix loi hien thi ky tu Tieng Viet bi mat trong chat Angel AI

### Van de
- Cac ky tu Tieng Viet co dau nhu "a", "ay" bi mat khi hien thi (vi du: "day" thanh "dy", "khac" thanh "khc")
- Ky hieu thay the Unicode (U+FFFD) xuat hien trong cau tra loi (hien thi la "khc" hoac khi copy ra ngoai)

### Nguyen nhan goc

**1. `src/lib/stripMarkdown.ts`** - Ham nay dang xoa tat ca ky tu `\uFFFD` (dong `result = result.replace(/\uFFFD/g, '');`). Khi streaming AI tra ve ky tu bi hong (vi du "kh\uFFFD\uFFFDc"), ham nay xoa chung di va chi con lai "khc" thay vi "khac".

**2. `supabase/functions/angel-chat/index.ts`** - TransformStream dung TextDecoder de thu thap noi dung cache. Khi chunk tu AI gateway cat giua mot ky tu multi-byte (tieng Viet nhu "a" = 2 bytes), TextDecoder co the tao ra ky tu \uFFFD trong fullResponse duoc cache.

### Giai phap

**Buoc 1: Fix `src/lib/stripMarkdown.ts`**
- Xoa dong `result = result.replace(/\uFFFD/g, '');` - khong nen xoa ky tu thay the vi no lam mat chu
- Hoac thay bang logic thong minh hon: chi xoa khi ky tu nam giua 2 ky tu ASCII (truong hop khong phai tieng Viet)

**Buoc 2: Fix `supabase/functions/angel-chat/index.ts`**
- Cai thien TransformStream: Tach viec thu thap fullResponse khoi viec forward stream
- Su dung mot buffer rieng cho viec parsing JSON tu stream chunks, dam bao khong mat ky tu khi JSON line bi cat giua multi-byte character
- Them logic xu ly: khi mot `data:` line bi cat giua 2 chunk, buffer lai va xu ly o chunk tiep theo

### Chi tiet ky thuat

**stripMarkdown.ts** - Thay doi:
```
// XOA dong nay:
result = result.replace(/\uFFFD/g, '');

// KHONG thay bang gi ca - de nguyen ky tu, 
// vi fix streaming se ngan chan \uFFFD tu dau
```

**angel-chat/index.ts** - TransformStream cai tien:
```
let fullResponse = "";
let parseBuffer = ""; // Buffer cho viec parsing SSE lines

const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk); // Forward nguyen chunk cho client
    
    // Thu thap noi dung cho cache voi buffer rieng
    try {
      const text = streamDecoder.decode(chunk, { stream: true });
      parseBuffer += text;
      
      // Chi xu ly cac dong hoan chinh (ket thuc bang \n)
      let newlineIdx;
      while ((newlineIdx = parseBuffer.indexOf('\n')) !== -1) {
        const line = parseBuffer.slice(0, newlineIdx);
        parseBuffer = parseBuffer.slice(newlineIdx + 1);
        
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullResponse += content;
          } catch {}
        }
      }
    } catch {}
  },
  // flush giu nguyen
});
```

### Ket qua
- Ky tu tieng Viet hien thi dung va day du (khong mat dau)
- Khong con ky hieu (U+FFFD) trong cau tra loi
- Copy text ra ngoai cung chinh xac
- Cache response cung duoc luu dung
