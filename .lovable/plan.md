

# Thêm Bảng Dữ Liệu Thời Gian Thực vào Trang Lì xì Tết

## Mô tả
Thêm một bảng mới vào trang `/admin/tet-reward` hiển thị dữ liệu FUN Money **tính đến thời điểm hiện tại** (real-time từ database), thay vì snapshot cố định ngày 07/02/2026. Sử dụng cùng công thức **1 FUN = 1.000 Camly Coin**.

## Cách thực hiện

### Chỉnh sửa tệp: `src/pages/AdminTetReward.tsx`

1. **Thêm truy vấn dữ liệu real-time**: Gọi RPC `get_admin_user_management_data` (đã có sẵn) để lấy dữ liệu `fun_money_received` hiện tại của tất cả user, kèm `camly_balance`, `camly_lifetime_earned`, `total_withdrawn`, `light_score`.

2. **Thêm phần "Dữ liệu hiện tại" phía dưới bảng snapshot**: Bao gồm:
   - **Banner tiêu đề**: "Dữ liệu tính đến hiện tại" với thời gian cập nhật
   - **4 thẻ thống kê tổng**:
     - Tổng FUN Money (hiện tại)
     - Tổng Camly Coin quy đổi (FUN x 1.000)
     - Số user đủ điều kiện (FUN > 0)
     - Avg Light Score
   - **Bảng chi tiết user**: Giống bảng snapshot nhưng với cột:
     - Thứ hạng, Tên user, FUN Money nhận được, Camly quy đổi, Camly đang có, Camly đã rút, Light Score
   - **Nút Refresh** để cập nhật lại dữ liệu
   - **Tìm kiếm** riêng cho bảng real-time

3. **Bố cục**: Dùng Tabs để chia thành 2 tab:
   - Tab 1: "Snapshot 07/02/2026" (bảng hiện tại, giữ nguyên)
   - Tab 2: "Dữ liệu hiện tại" (bảng mới, real-time)

### Chi tiết kỹ thuật
- Chỉ chỉnh sửa 1 tệp: `src/pages/AdminTetReward.tsx`
- Tái sử dụng RPC `get_admin_user_management_data` đã có
- Thêm import `Tabs, TabsContent, TabsList, TabsTrigger` từ UI components
- Thêm state cho dữ liệu real-time, search, sort riêng biệt
- Hỗ trợ xuất Excel cho cả 2 tab

