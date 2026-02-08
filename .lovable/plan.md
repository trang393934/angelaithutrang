

# Tạo bảng thông báo chúc mừng Lì xì cho người dùng

## Mục tiêu

Tạo popup chúc mừng Lì xì cho người dùng theo đúng mẫu thiết kế đã đính kèm, với giao diện phong cách Tết truyền thống (nền vàng gold, viền giấy cổ, hoa đào, đèn lồng), hiển thị số lượng Camly Coin và FUN Money cá nhân của từng user. Thêm logo đồng FUN Money và đồng Camly Coin vào vị trí phù hợp trên mẫu.

## Luồng hoạt động

```text
Admin duyệt và chuyển thưởng Lì xì tại /admin/tet-reward
              |
              v
  Edge Function xử lý:
    1. Cập nhật số dư Camly Coin (đã có)
    2. Ghi giao dịch (đã có)
    3. Gửi healing_messages (đã có)
    4. [MỚI] Chèn notification loại "tet_lixi_reward" với metadata
              |
              v
  Người dùng truy cập trang cá nhân (/profile)
              |
              v
  Hook useLiXiCelebration phát hiện notification chưa đọc
              |
              v
  Hiện popup chúc mừng theo mẫu Tết + hiệu ứng confetti
              |
              v
  Người dùng nhấn "CLAIM" -> đóng popup, đánh dấu đã đọc
  Người dùng nhấn "Thêm thông tin" -> mở /admin/tet-reward
```

## Thiết kế giao diện (theo đúng mẫu đính kèm)

Popup sẽ tái tạo lại mẫu với CSS/Tailwind, bao gồm:

- **Nền ngoài**: Gradient vàng gold (Gold 11) với hoa đào, cành cây, đèn lồng đỏ bằng emoji/CSS
- **Bao lì xì đỏ**: Icon bao lì xì ở trên cùng giữa (emoji)
- **Khung giấy cổ**: Nền trắng kem với viền trang trí, bo góc, chứa nội dung chính
- **Nội dung bên trong khung**:
  - Tiêu đề: "Chúc mừng bạn đã nhận được Lì xì!"
  - Dòng 1: Icon quà + "Bạn nhận được **{camly_amount}** Camly Coin," kèm **logo đồng Camly** bên cạnh
  - Dòng phụ: "được quy đổi dựa trên **{fun_amount}** FUN Money." kèm **logo đồng FUN** bên cạnh
  - Dòng 2: Icon quà + "Chương trình Lì xì Tết tổng giá trị **26.000.000.000 VND**,"
  - Dòng phụ: "được phân phối bằng FUN Money & Camly Coin."
- **2 nút hành động**:
  - "CLAIM" (nút xanh lá đậm, bo tròn, chữ in hoa trắng)
  - "Thêm thông tin" (nút viền xám, có icon tay chỉ)
- **Dòng cuối**: "Áp dụng đến 08/02/2026"
- **Logo đồng coin**: 
  - Đồng Camly Coin ở góc dưới trái (giống mẫu)
  - Đồng FUN Money ở góc dưới phải (vị trí đối xứng)

## Chi tiết kỹ thuật

### Bước 1: Sao chép hình ảnh logo vào dự án

Sao chép 2 logo đồng coin mà con đã upload vào thư mục `src/assets/`:
- `user-uploads://16-3.png` -> `src/assets/fun-money-coin.png` (logo đồng FUN Money mới)
- `user-uploads://17-2.png` -> `src/assets/camly-coin-new.png` (logo đồng Camly Coin mới)

### Bước 2: Cập nhật Edge Function `distribute-fun-camly-reward`

**Tệp chỉnh sửa**: `supabase/functions/distribute-fun-camly-reward/index.ts`

Thêm đoạn chèn notification sau dòng gửi `healing_messages` (dòng 211):

```typescript
// Gửi notification cho popup chúc mừng Lì xì
await supabaseAdmin.from("notifications").insert({
  user_id,
  type: "tet_lixi_reward",
  title: "Chúc mừng bạn đã nhận được Lì xì!",
  content: `Bạn nhận được ${camlyAmount.toLocaleString("vi-VN")} Camly Coin, được quy đổi dựa trên ${fun_amount.toLocaleString("vi-VN")} FUN Money.`,
  metadata: {
    camly_amount: camlyAmount,
    fun_amount: fun_amount,
    source: "fun_to_camly_reward",
    batch_date: batchDate,
  },
});
```

### Bước 3: Tạo hook `useLiXiCelebration`

**Tệp mới**: `src/hooks/useLiXiCelebration.ts`

Chức năng:
- Khi người dùng đăng nhập, truy vấn bảng `notifications` tìm loại `tet_lixi_reward` chưa đọc (`is_read = false`)
- Lấy `camly_amount` và `fun_amount` từ trường `metadata`
- Cung cấp hàm `claim()` để đánh dấu `is_read = true`
- Trả về trạng thái `showPopup`, `camlyAmount`, `funAmount` để hiển thị popup

### Bước 4: Tạo component `UserLiXiCelebrationPopup`

**Tệp mới**: `src/components/UserLiXiCelebrationPopup.tsx`

Giao diện tái tạo theo mẫu đính kèm:
- Tái sử dụng hiệu ứng `ConfettiPiece`, `FallingCoin`, `FloatingSparkle` từ `LiXiCelebrationDialog`
- Nền gradient vàng gold với trang trí Tết (hoa đào, đèn lồng, cành cây bằng emoji/CSS)
- Khung giấy cổ trắng kem chứa nội dung chính
- Import và hiển thị **logo đồng FUN Money** (`fun-money-coin.png`) ở góc dưới phải
- Import và hiển thị **logo đồng Camly** (`camly-coin-new.png`) ở góc dưới trái
- Nút "CLAIM" màu xanh lá đậm + nút "Thêm thông tin" viền xám
- Dòng cuối: "Áp dụng đến 08/02/2026"

### Bước 5: Tích hợp vào trang Profile

**Tệp chỉnh sửa**: `src/pages/Profile.tsx`

Thêm component `UserLiXiCelebrationPopup` vào cuối trang Profile (trước thẻ đóng `</div>` cuối cùng, khoảng dòng 1619):

```tsx
import { UserLiXiCelebrationPopup } from "@/components/UserLiXiCelebrationPopup";

// Trong JSX:
<UserLiXiCelebrationPopup />
```

Component tự động kiểm tra và hiển thị khi có notification Lì xì chưa đọc. Nếu không có, không render gì cả.

## Tóm tắt tác động

| STT | Tệp | Hành động | Mô tả |
|-----|------|-----------|-------|
| 1 | `src/assets/fun-money-coin.png` | Sao chép | Logo đồng FUN Money từ file upload |
| 2 | `src/assets/camly-coin-new.png` | Sao chép | Logo đồng Camly Coin từ file upload |
| 3 | `supabase/functions/distribute-fun-camly-reward/index.ts` | Chỉnh sửa | Thêm gửi notification loại `tet_lixi_reward` |
| 4 | `src/hooks/useLiXiCelebration.ts` | Tạo mới | Hook kiểm tra notification Lì xì chưa đọc |
| 5 | `src/components/UserLiXiCelebrationPopup.tsx` | Tạo mới | Popup chúc mừng theo mẫu Tết + logo 2 đồng coin |
| 6 | `src/pages/Profile.tsx` | Chỉnh sửa | Tích hợp popup vào giao diện trang cá nhân |

**Tổng cộng**: 2 file ảnh sao chép, 2 file mới, 2 file chỉnh sửa. Không cần thay đổi cơ sở dữ liệu (bảng `notifications` đã có sẵn các cột `type`, `metadata`, `is_read`).

