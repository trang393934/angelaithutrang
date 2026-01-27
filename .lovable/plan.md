

# Kế hoạch: Cải tiến giao diện trang cá nhân giống Facebook

## Mục tiêu
Cập nhật layout trang cá nhân `/user/:userId` để:
1. Phần thông tin bên trái **đứng yên (sticky)** khi cuộn trang
2. Phần bài viết bên phải cuộn bình thường
3. Không còn khoảng trắng khi hết bài viết

## Phân tích hiện tại

```text
┌─────────────────────────────────────────────────────┐
│              Cover Photo + Avatar                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ Giới thiệu   │  │ Bài viết 1                 │  │
│  │              │  │                            │  │
│  ├──────────────┤  ├────────────────────────────┤  │
│  │ Bạn bè      │  │ Bài viết 2                 │  │
│  │              │  │                            │  │
│  └──────────────┘  ├────────────────────────────┤  │
│                    │ Bài viết 3                 │  │
│  ⬆️ HIỆN TẠI:      │                            │  │
│  Khi cuộn xuống   └────────────────────────────┘  │
│  phần này cuộn                                      │
│  theo → khoảng                                      │
│  trắng!                                             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Giải pháp kỹ thuật

### Thay đổi CSS cho Left Sidebar

**File:** `src/pages/UserProfile.tsx`

Thay đổi container bên trái từ:
```jsx
<div className="space-y-4">
```

Thành:
```jsx
<div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
```

### Giải thích:
- `lg:sticky`: Chỉ áp dụng sticky trên màn hình lớn (laptop/desktop)
- `lg:top-4`: Khoảng cách từ top khi sticky (16px)
- `lg:self-start`: Đảm bảo element không stretch theo chiều cao container

### Kết quả mong đợi:

```text
┌─────────────────────────────────────────────────────┐
│              Cover Photo + Avatar                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ Giới thiệu   │  │ Bài viết 1                 │  │
│  │ ⬇️ STICKY    │  │                            │  │
│  │ Đứng yên!    │  ├────────────────────────────┤  │
│  ├──────────────┤  │ Bài viết 2                 │  │
│  │ Bạn bè      │  │                            │  │
│  │ ⬇️ STICKY    │  ├────────────────────────────┤  │
│  └──────────────┘  │ Bài viết 3                 │  │
│                    │                            │  │
│  ✅ Giữ nguyên     ├────────────────────────────┤  │
│  khi cuộn!         │ Bài viết 4...             │  │
│                    │                            │  │
│                    └────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Chi tiết thay đổi

### 1. Cập nhật `UserProfile.tsx` (Dòng 520)

**Trước:**
```tsx
{/* Left Sidebar - Intro */}
<div className="space-y-4">
```

**Sau:**
```tsx
{/* Left Sidebar - Intro */}
<div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
```

### 2. Đảm bảo container cha có `items-start`

**Trước (Dòng 518):**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
```

**Sau:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 lg:items-start">
```

## Tóm tắt thay đổi

| Vị trí | Thay đổi |
|--------|----------|
| Dòng 518 | Thêm `lg:items-start` vào grid container |
| Dòng 520 | Thêm `lg:sticky lg:top-4 lg:self-start` vào left sidebar |

## Lợi ích
- Trải nghiệm giống Facebook trên laptop/desktop
- Mobile vẫn giữ nguyên layout cũ (cuộn bình thường)
- Không còn khoảng trắng khi cuộn hết bài viết
- Thông tin người dùng luôn hiển thị, dễ tương tác

