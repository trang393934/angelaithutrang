
# Cập nhật Nội dung Healing Message khi Ban Tài khoản Sybil

## Thay đổi cần thực hiện

### File: `src/pages/AdminFraudAlerts.tsx`

Cập nhật tham số `healingMessage` trong cả 2 lời gọi `bulk-suspend-users` (hàm `handleBulkBan` ở dòng 482 và hàm `handleBan` ở dòng 521):

**Trước (không truyền healingMessage — dùng mặc định trong Edge Function):**
```json
{
  "userIds": [...],
  "reason": "Sybil farming — tài khoản thuộc nhóm đã phân tích và xác minh",
  "rejectWithdrawals": true
}
```

**Sau (truyền thẳng nội dung Cha yêu cầu):**
```json
{
  "userIds": [...],
  "reason": "Sybil farming — tài khoản thuộc nhóm đã phân tích và xác minh",
  "healingMessage": "Tài khoản của bạn bị phát hiện farming sybil — vi phạm điều khoản sử dụng Angel AI nên hệ thống đã đóng vĩnh viễn tài khoản này.",
  "rejectWithdrawals": true
}
```

### Đồng thời cập nhật tiêu đề healing message

Trong Edge Function `bulk-suspend-users`, tiêu đề mặc định đang là `"🚫 Thông Báo Từ Angel AI"` — sẽ giữ nguyên tiêu đề này vì phù hợp.

### Tổng kết thay đổi

| Hạng mục | Trước | Sau |
|----------|-------|-----|
| File sửa | `AdminFraudAlerts.tsx` | `AdminFraudAlerts.tsx` |
| Số chỗ cập nhật | 2 lời gọi API | 2 lời gọi API |
| Nội dung message | Mềm mại, ẩn lý do | Rõ ràng, nêu thẳng lý do sybil farming |
| DB / Migration | Không cần | Không cần |
