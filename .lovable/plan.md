
# Thêm "Quản lý User" vào Sidebar (công khai cho tất cả)

## Tổng Quan
Giữ nguyên sidebar hiện tại (Tích lũy ánh sáng, Tặng thưởng), chỉ thêm mục "Quản lý User" ngay dưới "Lịch sử giao dịch", mở quyền cho tất cả user.

## Thay Đổi

### File: `src/components/MainSidebar.tsx`
- Import thêm `Shield` từ `lucide-react`
- Thêm mục "Quản lý User" ngay sau "Lịch sử giao dịch" (dòng 128):
  - Icon: `Shield` (màu primary)
  - Link: `/admin/user-management`
  - Hiển thị cho **tất cả** user (không kiểm tra admin)
  - Style giống các mục nav khác (active state gradient, hover)

Không thay đổi gì khác -- giữ nguyên "Tích lũy ánh sáng" (Earn), "Tặng thưởng" (Gift), và "Lịch sử giao dịch".
