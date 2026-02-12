
# Nâng Cấp Trang Lịch Sử Giao Dịch

## Tổng Quan
Thêm nút quay về trang chủ, mở rộng hệ thống thống kê với các chỉ số chi tiết hơn, và thêm chế độ xem "Cá nhân" vs "Tất cả".

## Các Thay Đổi

### 1. Nút quay về trang chủ
- Thêm icon `ArrowLeft` vào header, bên trái logo Globe
- Click sẽ `navigate("/")` về trang chủ

### 2. Mở rộng thống kê (Stat Cards)
Thay 5 thẻ hiện tại bằng hệ thống thống kê chi tiết hơn:

**Hàng 1 - Tổng quan (4 thẻ):**
- Tổng giao dịch (số lượt)
- Tổng gửi đi (số lượt gửi)
- Tổng nhận về (số lượt nhận)
- Onchain (số lượt có tx_hash)

**Hàng 2 - Tổng theo token (hiển thị giá trị):**
- Tổng CAMLY (tổng amount từ tất cả giao dịch, vì hiện tại hệ thống chỉ dùng CAMLY)
- Tổng Donate (tổng amount từ project_donations)
- Tổng Tặng thưởng (tổng amount từ coin_gifts)
- Hôm nay (tổng amount giao dịch trong ngày)

### 3. Chế độ xem "Cá nhân" vs "Tất cả"
- Thêm toggle/tabs ở trên bộ lọc: **"Tất cả"** | **"Cá nhân"**
- "Tất cả": hiển thị toàn bộ giao dịch (mặc định, như hiện tại)
- "Cá nhân": chỉ hiển thị giao dịch liên quan đến user đang đăng nhập (sender_id hoặc receiver_id = current user)
- Khi ở chế độ "Cá nhân", stat cards cũng tính theo dữ liệu cá nhân
- Nếu chưa đăng nhập, tab "Cá nhân" sẽ hiển thị thông báo yêu cầu đăng nhập

## Chi Tiết Kỹ Thuật

### File cần sửa:
**`src/pages/ActivityHistory.tsx`**
- Import thêm `ArrowLeft`, `Users`, `User` từ lucide-react
- Import `useAuth` hook để lấy user hiện tại
- Thêm state `viewMode`: `"all"` | `"personal"`
- Thêm nút Back trong header
- Thay thế grid stat cards thành 2 hàng với 8 thẻ thống kê
- Tính toán stats dựa trên `viewMode`:
  - `totalSent`: đếm/tổng amount giao dịch user là sender
  - `totalReceived`: đếm/tổng amount giao dịch user là receiver
  - `totalCamly`: tổng amount tất cả
  - `totalDonation`: tổng amount loại donation
  - `totalGift`: tổng amount loại gift
- Thêm tabs "Tất cả" / "Cá nhân" vào khu vực filter
- Cập nhật logic filter để lọc theo viewMode
