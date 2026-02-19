
# Sửa Trang Cá Nhân `/user/:userId` — Fix Nền Trắng + Cải Thiện Layout

## Nguyên Nhân Gốc Rễ

Class `dark` trong Tailwind chỉ hoạt động khi được đặt ở thẻ `<html>` (do `next-themes` kiểm soát). Khi thêm `class="dark"` vào một `<div>` con, các CSS variables như `--background`, `--card`, `--foreground` vẫn đọc từ `:root` (light mode). Vì vậy tất cả `Card`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`... đều vẫn hiển thị màu sáng.

## Giải Pháp

Thay vì dựa vào CSS variables của Tailwind dark mode, **dùng màu hardcoded hoàn toàn** (inline styles + Tailwind classes cụ thể như `text-white`, `text-amber-400`, `bg-[#0d2137]`) cho mọi phần tử trong trang. Đây là cách duy nhất đảm bảo trang luôn tối bất kể theme hệ thống.

## Các Thay Đổi Cụ Thể

### 1. Xóa class `dark` khỏi wrapper chính
Thay `className="dark min-h-screen"` → `className="min-h-screen"`, giữ nguyên `style` background gradient.

### 2. Thay tất cả Tailwind "semantic" classes bằng màu cụ thể

| Thay thế | Bằng |
|---|---|
| `text-foreground` | `text-white` |
| `text-muted-foreground` | `text-white/60` |
| `bg-card` | `bg-[#0d1f3a]` |
| `border-border` | `border-amber-900/30` |
| `bg-background` | `bg-[#060d1a]` |
| `text-card-foreground` | `text-white` |

### 3. Các Component cần đổi màu cụ thể

- **`<h1>` tên người dùng**: `className="... text-white"` (không dùng `text-foreground`)
- **Badge level chip**: `text-amber-300` (đã đúng), giữ nguyên
- **`@handle`**: `text-amber-400` (đã đúng)
- **Muted text** (ngày tham gia, FUN Ecosystem, v.v.): `text-white/60`
- **`<Separator />`**: Thêm `className="bg-amber-900/30"` (đã có)
- **Tab buttons** — tab không active: `text-white/60 hover:text-white` (bỏ `hover:text-foreground`)
- **Intro Card (sidebar trái)**: Tất cả text → `text-white` / `text-white/60`
- **"Bảng Danh Dự"**: Đã đúng (dùng inline styles)

### 4. Cải thiện ảnh bìa

Từ hình tham khảo: ảnh bìa hiện tại đang hiển thị content FUN Ecosystem (banner). Chiều cao sẽ điều chỉnh:
- Desktop: `h-[260px] sm:h-[320px]` — tăng lên để cân đối hơn với avatar
- `object-cover` giữ nguyên để ảnh fill đẹp
- Gradient overlay bottom dày hơn: `from-[#060d1a]/90` để transition mượt vào nền tối

### 5. Thiết kế Avatar

Từ hình tham khảo người dùng gửi trước (hình reference): avatar có viền tròn vàng, kim cương ở góc trên phải, orbital icons xung quanh. Hiện tại code đã có logic này nhưng chưa hiển thị đúng vì CSS variables bị ảnh hưởng. Sau khi fix màu hardcoded:
- Avatar size tăng lên: `w-[130px] h-[130px] sm:w-[160px] sm:h-[160px]`  
- Orbital wrapper tăng tương ứng: `orbitRadius = 100`
- Kim cương badge `💎` giữ nguyên logic hiện có

### 6. Layout tổng thể

Giữ nguyên cấu trúc 2 cột (avatar trái + info phải) và "Bảng Danh Dự" bên phải — chỉ fix màu sắc để đảm bảo tối hoàn toàn.

## Kỹ Thuật

Cụ thể sẽ scan toàn bộ file `src/pages/UserProfile.tsx` và thay thế:

```tsx
// TRƯỚC (dùng CSS variables, bị light mode):
<h1 className="text-2xl font-extrabold text-foreground">
<span className="text-xs text-muted-foreground">
<div className="hover:text-foreground">

// SAU (màu hardcoded, luôn tối):
<h1 className="text-2xl font-extrabold text-white">
<span className="text-xs text-white/60">
<div className="hover:text-white">
```

## File Sẽ Sửa

**1 file duy nhất**: `src/pages/UserProfile.tsx`

Thay đổi:
1. Xóa class `dark` khỏi wrapper (không cần thiết và gây nhầm lẫn)
2. Thay toàn bộ `text-foreground` → `text-white`
3. Thay toàn bộ `text-muted-foreground` → `text-white/60`
4. Thay `hover:text-foreground` → `hover:text-white`
5. Thay `hover:bg-white/5` → `hover:bg-white/10`
6. Tăng chiều cao ảnh bìa lên `h-[260px] sm:h-[320px]`
7. Tăng kích thước avatar `orbitRadius` lên `100` và avatar size tăng lên `w-[130px] h-[130px] sm:w-[160px] sm:h-[160px]`
8. Đảm bảo gradient overlay ảnh bìa đủ đậm để blend vào nền tối
