

## Thiết kế lại giao diện Tặng Thưởng theo phong cách Angel AI

### Mục tiêu
Nâng cấp toàn bộ giao diện dialog "Tặng Thưởng" (GiftCoinDialog + TokenSelector + CryptoTransferTab) sang phong cách vàng ánh kim sang trọng, đồng bộ với hệ thống thiết kế Golden Luxe của Angel AI.

### Các thay đổi chi tiết

**1. File: `src/components/gifts/GiftCoinDialog.tsx`**

- **Dialog container**: Thêm gradient nền vàng nhạt (`bg-gradient-to-b from-amber-50/30 via-background to-amber-50/20`), viền vàng (`border-amber-200/60`)
- **Header**: Tiêu đề gradient vàng kim với icon Gift vàng, thêm dòng phụ "Angel AI Gift System"
- **Quick amount buttons**: Chuyển sang style vàng ánh kim - khi được chọn dùng gradient metallic gold (`from-[#b8860b] via-[#daa520] to-[#ffd700]`) với text đen bold; khi chưa chọn dùng viền vàng nhạt
- **Input fields**: Thêm viền vàng nhạt khi focus (`focus:border-amber-400 focus:ring-amber-300/30`)
- **Labels**: Thêm màu vàng đậm cho các nhãn (`text-amber-800`)
- **Nút "Xem lai & Xac nhan"** va **"Xac nhan & Tang"**: Dùng class `btn-golden-3d !text-black font-bold` thay vì gradient tím/xanh hiện tại
- **Confirmation card (Step 2)**: Nền gradient vàng nhạt (`from-amber-50/80 to-yellow-50/40`), viền vàng (`border-amber-200`)
- **Sender/Receiver cards**: Ring vàng (`ring-amber-400/40`), nền ấm hơn

**2. File: `src/components/gifts/TokenSelector.tsx`**

- **Selected token button**: Gradient vàng kim sang trọng hơn (`from-amber-50 via-yellow-50/80 to-amber-50`), viền vàng đậm hơn, shadow glow nhẹ
- **Dropdown**: Viền vàng, nền ấm, item được chọn highlight vàng (`bg-amber-50 border-l-2 border-amber-400`)
- **Label "Chon Token"**: Font bold, màu vàng đậm

**3. File: `src/components/gifts/CryptoTransferTab.tsx`**

- **Balance card**: Thống nhất gradient vàng ánh kim cho tất cả token (thay vì violet/orange riêng) - `from-amber-50 via-yellow-50 to-amber-50/80`, viền `border-amber-200`
- **Recipient type buttons**: Khi active dùng `btn-golden-3d` style thay vì màu violet/orange
- **Message template pills**: Viền vàng, khi chọn dùng gradient vàng với text đen
- **Transfer button**: Dùng `btn-golden-3d !text-black font-bold` cho tất cả token
- **Success card**: Gradient vàng thay vì xanh lá (`from-amber-50 to-yellow-50`, `border-amber-200`)

### Nguyên tac thiet ke
- Mau chu dao: Gradient vang anh kim (#b8860b -> #daa520 -> #ffd700 -> #ffec8b)
- Text tren nen vang: Luon dung mau den (text-black) de dam bao tuong phan
- Labels: Dung `text-amber-800` hoac `text-amber-900`
- Vien: `border-amber-200` den `border-amber-400`
- Shadow: `shadow-[0_0_20px_-5px_rgba(218,165,32,0.15)]` (golden glow)
- Tat ca buttons chinh: Dung he thong `btn-golden-3d` da co san

### Files thay doi
1. `src/components/gifts/GiftCoinDialog.tsx`
2. `src/components/gifts/TokenSelector.tsx`
3. `src/components/gifts/CryptoTransferTab.tsx`

