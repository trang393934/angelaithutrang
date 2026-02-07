
## Nâng cấp tất cả nút thành phong cách Vàng Golden 3D sang trọng

Thay đổi toàn bộ hệ thống nút bấm trên Angel AI sang phong cách vàng metallic 3D, gradient nổi bật, hiệu ứng ánh sáng lướt qua, và màu chữ tương phản rõ ràng -- áp dụng trên tất cả các trang.

### Thay đổi gì

**1. Cập nhật Button component (`src/components/ui/button.tsx`)**
- Variant `default`: Gradient vàng metallic 3D (từ vàng đậm sang vàng sáng), chữ trắng, hiệu ứng nổi 3D với box-shadow
- Variant `destructive`: Giữ màu đỏ nhưng thêm hiệu ứng 3D và gradient
- Variant `outline`: Viền vàng gradient, chữ vàng đậm, hover chuyển sang nền vàng gradient
- Variant `secondary`: Gradient vàng nhạt sang trọng, chữ vàng đậm
- Variant `ghost`: Hover hiển thị nền vàng nhạt
- Variant `link`: Chữ vàng đậm

**2. Thêm CSS hiệu ứng 3D vào `src/index.css`**
- Thêm class `.btn-golden-3d` với hiệu ứng:
  - Gradient metallic nhiều lớp (vàng đậm -> vàng sáng -> vàng đậm)
  - Box-shadow 3D (bóng đổ nhiều tầng tạo cảm giác nổi)
  - Hiệu ứng ánh sáng lướt qua (shimmer) khi hover
  - Inset highlight tạo cảm giác kim loại bóng
  - Transition mượt mà khi hover (nâng lên, phóng to nhẹ)
- Thêm class `.btn-golden-outline` cho variant outline
- Thêm class `.btn-golden-secondary` cho variant secondary

### Hiệu ứng chi tiết

- **Gradient**: `linear-gradient(135deg, #8B6914, #C49B30, #E8C252, #F5D976, #E8C252, #C49B30, #8B6914)`
- **3D Shadow**: Nhiều tầng bóng đổ tạo chiều sâu
- **Shimmer**: Ánh sáng trắng mờ lướt qua nút khi hover
- **Hover**: Nút nâng lên 2px, phóng to 2%, bóng đổ mạnh hơn
- **Chữ**: Trắng tinh (#FFFFFF) trên nền vàng, đen trên nền nhạt -- tương phản tối đa

### Phạm vi áp dụng

Vì thay đổi ở component `Button` gốc và CSS toàn cục, tất cả các trang sẽ tự động được cập nhật:
- Trang chủ, Chat, Cộng đồng, Earn, Swap, Profile
- Sidebar, Header, Footer
- Dialog, Form, Card buttons
- Tất cả admin pages

### Chi tiết kỹ thuật

**File thay đổi:**
- `src/components/ui/button.tsx` -- Cập nhật các variant classes
- `src/index.css` -- Thêm CSS cho hiệu ứng 3D golden

**Không cần thay đổi:**
- Không cần sửa từng trang riêng lẻ
- Không cần thay đổi database hay backend
