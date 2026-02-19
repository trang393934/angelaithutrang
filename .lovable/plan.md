
# Sửa Trang Cá Nhân — Fix Nền Trắng Thực Sự + Chuẩn Hóa Màu Vàng Angel AI

## Nguyên Nhân Chính Xác Của Nền Trắng

Qua đọc toàn bộ `UserProfile.tsx`, vấn đề nằm ở **3 nguồn**:

1. **`PostCard` component** — component này dùng `Card` từ Radix/shadcn, bên trong có `bg-card`, `text-card-foreground` từ CSS variables. Khi render trong một `<div>` bình thường (không phải `<html>`), các biến này đọc từ `:root` (light mode) → trắng.

2. **`WalletAddressDisplay`** — có thể dùng `bg-background` hoặc `border-border`

3. **`SocialLinksDisplay`** — render bên trong sidebar, cũng có thể dùng semantic classes

## Giải Pháp Đúng: CSS Custom Properties Override

Thay vì chỉ đổi Tailwind classes trong `UserProfile.tsx`, cần **ghi đè CSS variables tại root wrapper** của trang này bằng `style` attribute trực tiếp:

```tsx
<div
  className="min-h-screen"
  style={{
    background: "linear-gradient(180deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)",
    // Override CSS variables để ép dark mode cho toàn bộ cây component
    "--background": "13 33 55",         // #0d2137
    "--card": "13 33 55",               // #0d2137
    "--card-foreground": "255 255 255", // white
    "--foreground": "255 255 255",      // white
    "--muted-foreground": "255 255 255 / 0.6",
    "--border": "180 144 30 / 0.25",    // amber-ish
    "--popover": "13 33 55",
    "--popover-foreground": "255 255 255",
    "--muted": "13 25 45",
    "--accent": "180 144 30 / 0.15",
    "--accent-foreground": "255 255 255",
    "--input": "13 33 55",
    "--ring": "180 144 30",
  } as React.CSSProperties}
>
```

Cách này **ghi đè CSS variables tại mức DOM node**, khiến tất cả con (kể cả `PostCard`, `Card`, `Dialog`) đọc giá trị mới. Đây là kỹ thuật đúng nhất và sẽ thực sự hoạt động.

## Đổi Màu Xanh Cyan → Vàng Angel AI

Hiện tại `DiamondBadge` dùng màu cyan (`#22d3ee`, `border-cyan-400`). Theo yêu cầu, cần đổi sang vàng ánh kim:

```tsx
// Trước:
border: "2px solid #22d3ee",
boxShadow: "0 0 12px rgba(34,211,238,0.6), ...",

// Sau (vàng kim):
border: "2px solid #ffd700",
boxShadow: "0 0 12px rgba(255,215,0,0.7), 0 0 24px rgba(218,165,32,0.3)",
background: "linear-gradient(135deg, #b8860b, #0a1628)",
```

## Cải Thiện Cover Photo & Avatar

Nhìn hình tham khảo: cover photo chiếm ~35% viewport height, avatar nổi đè lên bottom-left của cover:
- Cover: `h-[220px] sm:h-[280px]` (giảm một chút để cân đối)
- Avatar wrapper: giảm `marginTop` để avatar không bị quá thấp
- Gradient overlay trên cover: `from-[#060d1a]/80` (đủ tối nhưng vẫn thấy ảnh)

## Thêm "Sửa ảnh bìa" Button Cho Owner

Từ hình tham khảo: button "Sửa ảnh bìa" xuất hiện ở góc dưới phải ảnh bìa với icon camera — đã có code này nhưng cần giữ.

## Cải Thiện Bảng Danh Dự

Theo hình: các ô thống kê có màu nền xanh đậm, chữ vàng cho số, bo tròn lớn (pill shape). Cập nhật:
- Mỗi ô: `rounded-full px-4 py-2` (pill style như hình)
- Màu nền ô: `#0d3320` (xanh đậm)
- Icon bên trái, số bên phải màu vàng `#ffd700`
- Border: `border-amber-500/40`

## Chi Tiết Các Thay Đổi

### 1. Main wrapper — Ghi đè CSS Variables
Thay `style={{ background: "..." }}` → thêm đầy đủ CSS variable overrides

### 2. `DiamondBadge` — Đổi cyan → gold
```tsx
style={{
  background: "linear-gradient(135deg, #b8860b, #0a1628)",
  border: "2px solid #ffd700",
  boxShadow: "0 0 14px rgba(255,215,0,0.7), 0 0 28px rgba(218,165,32,0.3)",
}}
```

### 3. Orbital track ring — Đổi từ `border-amber-400/20` → giữ nguyên (đã đúng)

### 4. "Bảng Danh Dự" ô thống kê — Pill style
Từ `rounded-lg` → `rounded-full`, layout `flex justify-between` giữ nguyên, tăng padding

### 5. Tab active indicator — Giữ nguyên `border-amber-400` (đã đúng)

### 6. PostCard wrapper — Không cần thêm gì vì CSS var override sẽ fix toàn bộ

## File Sẽ Sửa

**1 file duy nhất**: `src/pages/UserProfile.tsx`

Thay đổi:
1. **Main wrapper**: Thêm CSS custom properties override vào `style` attribute để ép dark mode cho toàn bộ cây component
2. **`DiamondBadge`**: Đổi màu cyan → vàng ánh kim (#ffd700, gold gradient)
3. **Cover height**: `h-[220px] sm:h-[280px]` (tối ưu cân đối)
4. **Bảng Danh Dự**: Ô thống kê dạng pill (rounded-full), màu nền/chữ chuẩn hơn theo hình
5. **Tab navigation**: Giữ nguyên vị trí "..." bên phải (đã đúng)
6. **Orbital wrapper**: Đảm bảo `wrapperSize` và `marginTop` phù hợp với avatar mới
