

# Mở quyền truy cập "Quản lý User" cho tất cả người dùng

## Tổng Quan
Hiện tại trang `/admin/user-management` chỉ cho phép admin truy cập (redirect về trang login nếu không phải admin). Cần mở công khai cho tất cả -- kể cả khách chưa đăng ký -- nhưng giới hạn: khách không thể nhấp vào chi tiết từng user.

## Chi Tiết Thay Đổi

### File: `src/pages/AdminUserManagement.tsx`

**1. Bỏ kiểm tra admin/redirect (dòng 87-93)**
- Xóa logic `useEffect` kiểm tra `isAdmin` và redirect về `/admin/login`
- Thay bằng: luôn gọi `fetchUsers()` khi component mount (không cần auth)

**2. Bỏ phụ thuộc admin trong header (dòng 231-238)**
- Ẩn nút LogOut và AdminNavToolbar cho khách (chỉ hiển thị khi `user` tồn tại)

**3. Giới hạn nhấp chi tiết cho khách (dòng 513-516)**
- Khi `user` chưa đăng nhập: click vào hàng user sẽ hiển thị dialog yêu cầu đăng nhập (dùng toast hoặc dialog nhắc đăng ký) thay vì mở `UserDetailDialog`
- Khi `user` đã đăng nhập: giữ nguyên hành vi mở `UserDetailDialog`

**4. Loading state**
- Bỏ phụ thuộc `authLoading` trong loading screen -- chỉ cần `isLoading` data

Kết quả: Tất cả mọi người đều thấy bảng tổng quan (stats, danh sách user, số liệu), nhưng chỉ user đã đăng nhập mới xem được chi tiết từng người.
