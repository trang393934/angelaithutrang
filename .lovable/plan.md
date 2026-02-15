

# Them che do Fast/Spiritual cho tao anh

## Van de hien tai

Nhu con thay trong anh chup man hinh, UI chi hien thi dropdown **style** (Spiritual, Realistic, Artistic) - day la phong cach anh, KHONG phai che do tao anh (Fast vs Spiritual).

Hook `useImageGeneration.ts` da co tham so `mode` mac dinh la `"fast"`, nhung trang Chat.tsx **khong truyen** tham so `mode` khi goi `generateImage(prompt, imageStyle)`. Ket qua la backend luon nhan mode mac dinh tu hook (fast), nhung UI khong cho user chon.

## Giai phap

### 1. Them state `imageMode` trong Chat.tsx

Them state moi `imageMode` voi gia tri mac dinh `"fast"`, doc lap voi `imageStyle`.

### 2. Them toggle Fast/Spiritual trong thanh cong cu tao anh

Trong phan header cua che do "Generate Image" (dong 1162-1171), them mot toggle/select cho user chon giua:
- **Sieu toc** (Fast) - mac dinh, dung Fal.ai Flux
- **Tam linh** (Spiritual) - dung Google Gemini

Toggle nay nam ben canh dropdown style hien tai.

### 3. Truyen mode xuong generateImage

Cap nhat `handleGenerateImage` (dong 554):
```
// Truoc
const result = await generateImage(prompt, imageStyle);

// Sau  
const result = await generateImage(prompt, imageStyle, imageMode);
```

### 4. An dropdown style khi mode = "fast"

Khi user chon Fast mode, dropdown style (Spiritual/Realistic/Artistic) khong can thiet vi Flux khong phan biet style. Chi hien dropdown style khi mode = "spiritual".

## File can sua

| File | Thay doi |
|------|----------|
| `src/pages/Chat.tsx` | Them state `imageMode`, them toggle UI, truyen `mode` vao `generateImage`, an style dropdown khi Fast |

## Ket qua mong doi

- Mac dinh la **Sieu toc (Fast)** - tao anh nhanh 1-2s
- User co the chuyen sang **Tam linh (Spiritual)** khi can anh phuc tap, tieng Viet
- Dropdown style chi hien khi chon Spiritual
- Trai nghiem UI ro rang, de hieu

