
## Tạo hệ thống Lì xì Tết: Chuyển thưởng FUN Money sang Camly Coin

### Tổng quan

Xây dựng tính năng **"Lì xì Tết"** trên trang `/admin/mint-stats`, gồm:
1. **Bảng thông báo chúc mừng** (popup Dialog) phong cách vàng kim loại ánh kim
2. **Edge Function** xử lý chuyển thưởng hàng loạt theo công thức 1 FUN = 1.000 Camly Coin
3. **Giao diện admin** với checkbox chọn user, xác nhận, và theo dõi tiến trình
4. **Thông báo tự động** gửi cho người nhận

### Dữ liệu hiện tại

| Thông số | Giá trị |
|----------|---------|
| Tổng users có FUN | 190 |
| Tổng FUN (Pass) | ~203.419 |
| Tổng Camly cần thưởng | ~203.419.000 |
| Hạn chương trình | 08/02/2026 |

### Thiết kế bảng thông báo chúc mừng

Bảng popup sử dụng phong cách **vàng kim loại ánh kim** (metallic gold) giống hình tham khảo, với hiệu ứng confetti và đồng Camly rơi. Nội dung:

- Tiêu đề: "Chúc mừng bạn được Lì xì"
- Số lượng Camly Coin nhận được (ví dụ: 2.652.000)
- Dựa trên số FUN Money (ví dụ: 2.652)
- Thông tin chương trình: "Chương trình Lì xì Tết 26.000.000.000 VND bằng Fun Money và Camly Coin"
- Hạn: "Áp dụng đến ngày 08/02/2026"
- 2 nút: **"Claim"** (đóng popup) và **"Thêm Thông Tin"** (mở /admin/mint-stats)

### Chi tiết kỹ thuật

#### File 1 (Mới): `supabase/functions/distribute-fun-camly-reward/index.ts`

Edge Function xử lý chuyển thưởng hàng loạt:
- Kiểm tra quyền admin qua bảng `user_roles`
- Nhận danh sách `recipients: [{ user_id, fun_amount }]`
- Với mỗi user:
  - Tính Camly = fun_amount x 1.000
  - Kiểm tra đã thưởng trước đó chưa (tránh trùng lặp) bằng metadata `source: "fun_to_camly_reward"`
  - Cập nhật `camly_coin_balances` (upsert: cộng balance và lifetime_earned)
  - Ghi giao dịch vào `camly_coin_transactions` với type `admin_adjustment`
  - Gửi thông báo `healing_messages` cho user
- Trả về kết quả: số user thành công, thất bại, tổng Camly đã chuyển

#### File 2 (Mới): `src/components/admin/LiXiCelebrationDialog.tsx`

Component Dialog chúc mừng Lì xì:
- Nền gradient vàng kim loại: `linear-gradient(135deg, #8B6914, #C49B30, #E8C252, #F5D976, #E8C252, #C49B30)`
- Hiệu ứng confetti và Camly coin rơi (tái sử dụng pattern từ `TipCelebrationReceipt`)
- Hiệu ứng sparkle lấp lánh
- Nội dung:
  - Logo Camly Coin xoay
  - "Chúc mừng bạn được Lì xì"
  - Số lượng Camly Coin (định dạng số Việt Nam)
  - "dựa trên [X] Fun Money"
  - Thông tin chương trình và hạn
- 2 nút hành động:
  - "Claim" (variant default, golden 3D) - đóng popup
  - "Thêm Thông Tin" (variant outline) - mở link /admin/mint-stats trong tab mới

#### File 3 (Sửa): `src/pages/AdminMintStats.tsx`

Thêm tính năng chuyển thưởng hàng loạt:
- **State mới**: `selectedUsers`, `isDistributing`, `distributionProgress`, `showCelebration`, `lastDistributionResult`
- **Cột "Thưởng Camly"**: Hiển thị `total_fun x 1.000` ở cuối bảng
- **Checkbox**: Mỗi dòng có checkbox để chọn user, header có "Chọn tất cả"
- **Thanh hành động**: Hiện khi có user được chọn, gồm:
  - Số user đã chọn và tổng Camly sẽ chuyển
  - Nút "Chuyển thưởng Lì xì" với Dialog xác nhận
  - Thanh progress khi đang xử lý
- **Kết quả**: Hiện popup LiXiCelebrationDialog khi hoàn tất

### Quy trình chuyển thưởng

```text
Admin chon user(s) --> Bam "Chuyen thuong Li xi"
    --> Dialog xac nhan (hien danh sach, tong so)
    --> Goi Edge Function distribute-fun-camly-reward
    --> Progress bar theo doi tien do
    --> Hoan tat --> Hien LiXiCelebrationDialog
    --> User nhan thong bao healing_messages
```

### Cơ chế chống thưởng trùng lặp

Trước khi thưởng, Edge Function kiểm tra `camly_coin_transactions` xem đã có bản ghi nào với:
- `user_id` = user cần thưởng
- `transaction_type` = `admin_adjustment`
- `metadata->>'source'` = `fun_to_camly_reward`

Nếu đã có, sẽ bỏ qua user đó và đếm vào danh sách "đã thưởng trước đó".

### Ghi nhận giao dịch

Mỗi giao dịch lưu trong `camly_coin_transactions`:
- `transaction_type`: `admin_adjustment`
- `description`: "Lì xì Tết: [X] FUN x 1.000 = [Y] Camly Coin"
- `metadata`: `{ source: "fun_to_camly_reward", fun_amount, multiplier: 1000, batch_date, distributed_by }`

### Thông báo cho user

Mỗi user nhận được tin nhắn trong `healing_messages`:
- `message_type`: "reward"
- `title`: "🧧 Chúc mừng! Bạn được Lì xì Camly Coin!"
- `content`: Nội dung chi tiết về số lượng FUN, Camly nhận được, và thông tin chương trình
- `triggered_by`: "fun_to_camly_reward"

### Không thay đổi database schema

Sử dụng các bảng hiện có (`camly_coin_balances`, `camly_coin_transactions`, `healing_messages`). Enum `admin_adjustment` đã có sẵn. Không cần migration.
