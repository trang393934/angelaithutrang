

## Cập nhật huy hiệu kim cương vàng trên avatar

### Vấn đề hiện tại
- Huy hiệu kim cương vàng vẫn còn nền trắng (từ file JPEG gốc)
- Vị trí kim cương cần dịch lên trên một chút để đáy nhọn chạm viền avatar

### Thay đổi

**1. Xử lý ảnh kim cương - xoá nền trắng**
- Tạo lại file `src/assets/gold-diamond-badge.png` với nền trong suốt (transparent) từ file JPEG gốc

**2. Điều chỉnh vị trí trong `src/pages/UserProfile.tsx`**
- Component `DiamondBadge`: thay đổi `top` từ `-16` sang khoảng `-20` hoặc `-22` để dịch kim cương lên trên
- Đảm bảo đáy nhọn kim cương chạm đúng viền trên của avatar
- Giữ nguyên hiệu ứng ánh sáng vàng (drop-shadow)

### Chi tiết kỹ thuật
- File chỉnh sửa: `src/pages/UserProfile.tsx` (component `DiamondBadge`, dòng 220-237)
- File ảnh: `src/assets/gold-diamond-badge.png` (tạo lại với nền trong suốt)
- Thuộc tính thay đổi: `top: -16` -> `top: -22`, có thể điều chỉnh `width/height` nếu cần

