
# Mở rộng khung chat - Tăng độ rộng nội dung

## Vấn đề hiện tại

Khung chat đang giới hạn độ rộng nội dung ở `max-w-5xl` (1024px). Với màn hình lớn (laptop/desktop), phần lớn diện tích màn hình bị bỏ trống hai bên, khiến nội dung trò chuyện bị thu hẹp và không phù hợp với lượng text dài.

Sidebar bên trái khi mở rộng chiếm `w-72` (288px), còn khi thu gọn là `w-[60px]`.

## Thay đổi cần thực hiện

Chỉ 1 file: `src/pages/Chat.tsx`

### 1. Tăng max-width container tin nhắn (dòng 989)

```tsx
// Hiện tại
<div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">

// Sửa thành
<div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
```

`max-w-5xl` → `max-w-6xl` (1024px → 1152px)

### 2. Tăng max-width bubble tin nhắn (dòng 998)

```tsx
// Hiện tại
<div className="flex flex-col gap-2 max-w-[95%] sm:max-w-[90%] lg:max-w-[85%]">

// Sửa thành
<div className="flex flex-col gap-2 max-w-[95%] sm:max-w-[92%] lg:max-w-[88%]">
```

Cho phép nội dung tin nhắn chiếm nhiều hơn chiều ngang khung.

### 3. Tăng max-width khu vực nhập liệu (dòng 1117, 1150, 1216)

```tsx
// Hiện tại (x3 vị trí)
<div className="mx-auto max-w-5xl ...">

// Sửa thành
<div className="mx-auto max-w-6xl ...">
```

Để input bar cũng rộng đồng bộ với vùng tin nhắn.

## Kết quả

| Khu vực | Trước | Sau |
|---------|-------|-----|
| Container tin nhắn | max-w-5xl (1024px) | max-w-6xl (1152px) |
| Bubble tin nhắn (desktop) | max 85% | max 88% |
| Input bar | max-w-5xl | max-w-6xl |
| Ảnh upload preview | max-w-5xl | max-w-6xl |
| Mode indicator | max-w-5xl | max-w-6xl |

Trên mobile vẫn giữ nguyên `px-2 sm:px-4` padding, không ảnh hưởng trải nghiệm di động.
