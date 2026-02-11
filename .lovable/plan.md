

# Trang Quản Lý User Toàn Diện (Admin User Management)

## Tổng quan

Tạo trang admin mới tại đường dẫn `/admin/user-management` hiển thị danh sách tất cả người dùng với đầy đủ thông tin hoạt động, điểm số, tài chính, lịch sử giao dịch -- hỗ trợ lọc nâng cao và xuất file Excel/CSV về máy.

---

## Cấu trúc trang

### 1. Cơ sở dữ liệu: Tạo hàm RPC mới

Tạo một hàm database `get_admin_user_management_data` để tổng hợp dữ liệu từ nhiều bảng trong 1 truy vấn duy nhất, tránh giới hạn 1000 dòng và giảm số lượng request:

- `profiles` -- tên, ảnh đại diện, handle
- `camly_coin_balances` -- số dư, tổng đã kiếm, tổng đã tiêu
- `user_light_totals` -- điểm ánh sáng, điểm PoPL, hành động tích cực/tiêu cực
- `camly_coin_transactions` -- tổng thưởng theo từng loại (chat, nhật ký, đăng nhập hàng ngày...)
- `community_posts` -- số bài đăng
- `community_comments` -- số bình luận
- `coin_gifts` -- số lần tặng/nhận, tổng số lượng
- `coin_withdrawals` -- tổng đã rút, số yêu cầu
- `pplp_actions` -- số hành động, số đã đúc tiền
- `fun_distribution_logs` -- tổng FUN Money đã nhận
- `user_light_agreements` -- ngày tham gia

### 2. Giao diện: Trang AdminUserManagement

**Tệp mới:** `src/pages/AdminUserManagement.tsx`

Bao gồm các thành phần sau:

#### Thẻ thống kê tổng quan (Stats Cards)
- Tổng số người dùng
- Tổng Camly Coin đã phát
- Tổng FUN Money đã đúc
- Tổng giao dịch nội bộ
- Tổng giao dịch Web3

#### Bộ lọc nâng cao
- Tìm theo tên hoặc handle
- Lọc theo khoảng thời gian tham gia
- Lọc theo mức điểm ánh sáng (cao / trung bình / thấp)
- Lọc theo trạng thái (có FUN Money hay không, có rút tiền hay không)

#### Bảng dữ liệu chính

| Cột | Nguồn dữ liệu |
|-----|----------------|
| Ảnh đại diện + Tên + Handle | profiles |
| Ngày tham gia | user_light_agreements |
| Số bài đăng / Bình luận | community_posts, community_comments |
| Điểm Ánh sáng (Light Score) | user_light_totals.total_points |
| Điểm PoPL | user_light_totals.popl_score |
| Số dư Camly Coin | camly_coin_balances.balance |
| Tổng thưởng Camly (trọn đời) | camly_coin_balances.lifetime_earned |
| FUN Money đã nhận | fun_distribution_logs (tổng) |
| Tổng tặng nội bộ (gửi đi) | coin_gifts (người gửi, nội bộ) |
| Tổng tặng nội bộ (nhận về) | coin_gifts (người nhận, nội bộ) |
| Tổng tặng Web3 (gửi đi) | coin_gifts (người gửi, Web3) |
| Tổng tặng Web3 (nhận về) | coin_gifts (người nhận, Web3) |
| Tổng đã rút | coin_withdrawals (hoàn thành) |
| Địa chỉ ví BSC | profiles hoặc coin_withdrawals |

#### Chức năng xuất file
- Tái sử dụng mẫu thiết kế từ `TransactionExportButton` và `ExportDateRangeDialog`
- Hỗ trợ xuất Excel (.xlsx) với nhiều sheet:
  - Sheet 1: Toàn bộ người dùng
  - Sheet 2: Chi tiết thưởng Camly Coin
  - Sheet 3: Giao dịch nội bộ và Web3
- Hỗ trợ xuất CSV

#### Hộp thoại chi tiết người dùng
Nhấp vào một dòng trong bảng sẽ mở hộp thoại hiển thị:
- Thông tin cá nhân đầy đủ
- Bảng phân tích thưởng theo từng loại (trò chuyện, nhật ký, bài đăng, đăng nhập hàng ngày, chia sẻ...)
- Lịch sử giao dịch gần nhất (tặng / nhận / rút)
- Điểm số chi tiết theo 5 trụ cột PPLP (nếu có)

### 3. Thêm vào thanh điều hướng Admin

Thêm mục "Quản lý User" vào nhóm "Người dùng" trong `AdminNavToolbar.tsx`, sử dụng biểu tượng `UserCog`.

### 4. Thêm đường dẫn trong App.tsx

Thêm route `/admin/user-management` trỏ đến trang mới.

---

## Chi tiết kỹ thuật

### Các tệp sẽ tạo mới
1. `src/pages/AdminUserManagement.tsx` -- Trang chính (khoảng 600-800 dòng)
2. `src/components/admin/UserManagementExportButton.tsx` -- Nút xuất file
3. `src/components/admin/UserDetailDialog.tsx` -- Hộp thoại chi tiết người dùng

### Các tệp sẽ chỉnh sửa
1. `src/components/admin/AdminNavToolbar.tsx` -- Thêm mục điều hướng mới
2. `src/App.tsx` -- Thêm route mới

### Thay đổi cơ sở dữ liệu
Tạo hàm RPC `get_admin_user_management_data` để tổng hợp dữ liệu hiệu quả từ nhiều bảng, trả về một bảng kết quả gọn gàng cho giao diện.

