

## Reset dữ liệu test Lì xì cho ANGEL ÁNH NGUYỆT

### Mục tiêu
Reset trạng thái Lì xì Tết của user **ANGEL ÁNH NGUYỆT** (`user_id: 1096564a-...`) để có thể test lại popup chúc mừng và nút CLAIM từ đầu.

### Các bước thực hiện

1. **Xóa bản ghi claim** trong bảng `lixi_claims` của user này (status đang là `pending`)
2. **Đặt lại notification** `tet_lixi_reward` về `is_read = false`, `read_at = NULL` để popup hiện lại khi đăng nhập
3. **Đăng nhập tài khoản ANGEL ÁNH NGUYỆT** trên trình duyệt để xác nhận popup Lì xì Tết hiển thị
4. **Nhấn nút CLAIM** và xác nhận:
   - Bản ghi mới được tạo trong `lixi_claims` với status `pending`
   - Notification được đánh dấu `is_read = true`
   - Toast thông báo thành công hiển thị
   - Admin nhận notification về yêu cầu claim mới

### Chi tiết kỹ thuật

Hai câu lệnh SQL cần chạy:

```text
-- Bước 1: Xóa claim cũ
DELETE FROM lixi_claims
WHERE user_id = '1096564a-...' AND notification_id = '<notification_id>';

-- Bước 2: Reset notification
UPDATE notifications
SET is_read = false, read_at = NULL
WHERE user_id = '1096564a-...' AND type = 'tet_lixi_reward';
```

Sau khi reset, đăng nhập bằng tài khoản `daothianhnguyet.pt@gmail.com` để test toàn bộ luồng end-to-end.

