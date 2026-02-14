

# Thay logo coin ở popup Lì xì và thêm hiệu ứng xoay

## Tổng quan
Thay thế 2 logo coin ở góc dưới popup Lì xì bằng logo mới và thêm hiệu ứng xoay liên tục.

## Chi tiết thay đổi

### 1. Copy 2 logo mới vào project
- `user-uploads://13-2.png` -> `src/assets/camly-coin-3d.png` (Camly Coin logo mới)
- `user-uploads://12.png` -> `src/assets/fun-money-3d.png` (FUN Money logo mới)

### 2. Sửa file `src/components/UserLiXiCelebrationPopup.tsx`

**Import thêm logo FUN Money mới:**
```typescript
import camlyCoin3D from "@/assets/camly-coin-3d.png";
import funMoney3D from "@/assets/fun-money-3d.png";
```

**Góc trái dưới (dòng 574-599):** Thay 3 hình `camlyCoinNew` chồng nhau bằng 1 logo Camly Coin mới (`camly-coin-3d.png`) với hiệu ứng xoay 360 độ liên tục bằng framer-motion `animate={{ rotate: 360 }}`.

**Góc phải dưới (dòng 601-614):** Thay hình `camlyCoinNew` bằng logo FUN Money mới (`fun-money-3d.png`) với hiệu ứng xoay tương tự.

Cả 2 coin sẽ có:
- Xoay liên tục 360 độ (duration ~4-5s)
- Hiệu ứng lên xuống nhẹ (y bobbing)
- Drop-shadow vàng
- Kích thước ~56-60px

Chỉ sửa 1 file, không ảnh hưởng logic.
