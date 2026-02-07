

## Thêm Banner FUN Money Stats trên trang Earn

### Mục tiêu
Thêm một card/banner tóm tắt thống kê FUN Money (on-chain) trên trang Earn (`/earn`) để user có thể xem nhanh tổng quan số FUN Money đã mint theo từng trạng thái mà không cần chuyển sang trang `/mint`.

### Thiết kế giao diện

Card sẽ được đặt ngay **sau phần Early Adopter Progress** và **trước phần Main Content Grid** (Earn Progress + Streak Calendar). Card có gradient vàng-cam phù hợp với branding FUN Money, bao gồm:

- Logo FUN Money + tiêu đề "FUN Money (On-chain)"
- Tổng số FUN Money (tổng 3 trạng thái)
- 3 chỉ số trạng thái hiển thị dạng grid:
  - **Da mint** (Minted) - icon Coins, màu xanh lá
  - **Da ky** (Signed) - icon CheckCircle, màu xanh dương  
  - **Dang cho** (Pending) - icon Lock, màu vàng
- Nút "Xem chi tiết" dẫn đến trang `/mint`
- Nếu user chưa có FUN Money nào (totalAmount = 0), card vẫn hiển thị với thông điệp khuyến khích và nút đến trang Mint

### Chi tiết kỹ thuật

**File cần chỉnh sửa:**

1. **`src/pages/Earn.tsx`**
   - Import hook `useFUNMoneyStats` và logo `fun-money-logo.png`
   - Import thêm icons: `Lock`, `CheckCircle` từ lucide-react
   - Gọi `useFUNMoneyStats(user?.id)` trong component
   - Thêm card FUN Money Stats vào JSX giữa `<EarlyAdopterProgress />` và phần "Main content grid"

2. **`src/translations/vi.ts`** - Thêm translation keys mới:
   - `earn.funMoney.title`: "FUN Money (On-chain)"
   - `earn.funMoney.total`: "Tong FUN Money"
   - `earn.funMoney.minted`: "Da mint"
   - `earn.funMoney.signed`: "Da ky"
   - `earn.funMoney.pending`: "Dang cho"
   - `earn.funMoney.viewDetails`: "Xem chi tiet & Mint"
   - `earn.funMoney.emptyMessage`: "Ban chua co FUN Money nao. Bat dau dong gop de mint!"

3. **`src/translations/en.ts`** (va cac file ngon ngu khac) - Them translation keys tuong ung:
   - `earn.funMoney.title`: "FUN Money (On-chain)"
   - `earn.funMoney.total`: "Total FUN Money"
   - `earn.funMoney.minted`: "Minted"
   - `earn.funMoney.signed`: "Signed"
   - `earn.funMoney.pending`: "Pending"
   - `earn.funMoney.viewDetails`: "View Details & Mint"
   - `earn.funMoney.emptyMessage`: "You don't have any FUN Money yet. Start contributing to mint!"

### Cấu trúc card

```text
+-----------------------------------------------------------+
|  [FUN Logo] FUN Money (On-chain)        [Xem chi tiết ->] |
|                                                           |
|  Tổng: 12,500 FUN                                        |
|                                                           |
|  +----------------+ +----------------+ +----------------+ |
|  | Coins  Đã mint | | Check  Đã ký  | | Lock  Đang chờ | |
|  | 8,000 FUN      | | 3,000 FUN      | | 1,500 FUN      | |
|  +----------------+ +----------------+ +----------------+ |
+-----------------------------------------------------------+
```

### Lưu ý
- Sử dụng hook `useFUNMoneyStats` đã có sẵn, không cần tạo thêm hook mới
- Tuân thủ quy tắc i18n: tất cả text đều dùng translation keys, không hardcode
- Khi đang loading, hiển thị skeleton/spinner thay vì số 0
- Style nhất quán với các card Camly Coin phía trên (gradient, border, shadow)

