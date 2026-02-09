
## Kế hoạch: Thêm quyền Admin cho ANGEL ÁNH NGUYỆT

### Thông tin tài khoản
| Thông tin | Giá trị |
|-----------|---------|
| **Email** | daothianhnguyet.pt@gmail.com |
| **Tên hiển thị** | ANGEL ÁNH NGUYỆT |
| **User ID** | 2a5c721a-c0f8-475e-88fb-a92c816eb7ce |
| **Ngày tạo** | 02/02/2026 |
| **Quyền hiện tại** | Chưa có (user thường) |

### Thay đổi cần thực hiện

**Thêm record vào bảng `user_roles`:**

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('2a5c721a-c0f8-475e-88fb-a92c816eb7ce', 'admin');
```

### Kết quả sau khi hoàn thành
- **ANGEL ÁNH NGUYỆT** sẽ có quyền truy cập vào trang Admin Dashboard (`/admin/dashboard`)
- Có thể quản lý kiến thức, duyệt mint requests, xem thống kê hệ thống
- Ngang hàng với 2 admin hiện tại: **ANGEL THU TRANG** và **Trang393934**

---

### Chi tiết kỹ thuật
- Sử dụng migration tool để thêm record vào bảng `user_roles`
- Không cần thay đổi code frontend - hệ thống tự động nhận diện quyền admin thông qua `useAuth` hook
- RLS policies đã được cấu hình sẵn cho admin
