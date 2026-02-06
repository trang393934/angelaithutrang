

# Chuyển Đổi Màu Chủ Đạo Angel AI: Từ Xanh Sapphire Sang Vàng Kim Loại

## Tổng Quan
Thay đổi toàn bộ bảng màu chủ đạo (primary) của Angel AI từ tông xanh sapphire (hue ~214) sang tông vàng kim loại (metallic gold) - sang trọng, quý phái, ấm áp. Nền sẽ ửng vàng rất nhẹ thay vì trắng lạnh, các nút bấm và chữ đều đi theo tông vàng đậm/nhạt.

## Bảng Màu Mới - Golden Luxe

| Vai trò | Cũ (Sapphire Blue) | Mới (Metallic Gold) |
|---------|-------------------|---------------------|
| Primary | hsl(214, 82%, 34%) | hsl(38, 70%, 38%) - Vàng kim đậm |
| Primary Deep | hsl(214, 90%, 28%) | hsl(35, 75%, 28%) - Vàng nâu sâu |
| Primary Medium | hsl(210, 79%, 46%) | hsl(40, 65%, 50%) - Vàng ấm |
| Primary Soft | hsl(207, 73%, 57%) | hsl(42, 60%, 60%) - Vàng mềm |
| Primary Light | hsl(207, 89%, 86%) | hsl(45, 70%, 88%) - Vàng nhạt |
| Primary Pale | hsl(207, 100%, 94%) | hsl(47, 80%, 95%) - Vàng rất nhạt |
| Background | hsl(0, 0%, 98%) | hsl(45, 15%, 98%) - Trắng ửng vàng |
| Background Pure | hsl(0, 0%, 100%) | hsl(45, 10%, 99.5%) - Trắng ấm |
| Primary Foreground | Trắng | Trắng (giữ nguyên, chữ trên nền vàng đậm) |

## Phong Cách Thiết Kế
- Sang trọng, quý phái (luxury gold aesthetic)
- Ấm áp, yêu thương (warm & loving tone)
- Gradient vàng kim loại thay cho gradient sapphire
- Shadow/glow chuyển sang tông vàng ấm
- Nền tổng thể ửng vàng rất nhẹ, tạo cảm giác ấm áp

## Chi Tiết Kỹ Thuật

### 1. File `src/index.css` - CSS Variables (Core)

**:root (Light mode)** - Thay toàn bộ hue sapphire sang gold:

- `--primary`: 214 -> 38 (golden deep)
- `--primary-deep`: 214 -> 35 (dark gold/brown-gold)
- `--primary-medium`: 210 -> 40 (warm gold)
- `--primary-soft`: 207 -> 42 (soft gold)
- `--primary-light`: 207 -> 45 (light gold)
- `--primary-pale`: 207 -> 47 (pale gold)
- `--background`: thêm chút warm tint (45, 15%, 98%)
- `--background-pure`: ửng vàng nhẹ (45, 10%, 99.5%)
- `--secondary`: chuyển sang tông vàng nhạt
- `--accent-foreground`: theo tông gold
- `--border` / `--input`: thêm warm tint
- `--ring`: theo primary gold mới

**Gradients** - Cập nhật tất cả:
- `--gradient-cosmic`: từ trắng -> vàng nhạt
- `--gradient-sapphire` -> `--gradient-gold`: gradient vàng kim loại
- `--gradient-hero`: nền hero ửng vàng ấm
- `--gradient-light`: trắng sang vàng rất nhạt

**Shadows** - Chuyển sang gold hue:
- `--shadow-soft`: hsla(38, ...) thay vì hsla(214, ...)
- `--shadow-glow`: tông vàng
- `--shadow-divine`: tông vàng
- `--shadow-button`: tông vàng

**Sidebar** - Cập nhật sidebar variables theo gold

**Dark mode** - Cập nhật tương ứng với gold tone cho dark theme

**Component classes** - Cập nhật:
- `.btn-sacred:hover` box-shadow: tông vàng
- `.input-sacred:focus` box-shadow: tông vàng
- `.angel-wing-bg::before` radial-gradient: tông vàng
- `.light-ray::after` conic-gradient: tông vàng
- `@keyframes sacred-pulse`: tông vàng
- `.scrollbar-sacred` colors: tông vàng

### 2. File `tailwind.config.ts` - Keyframes

Cập nhật các keyframes animation:
- `glow-pulse`: hsla sapphire -> hsla gold
- `rank-highlight`: từ vàng (đã đúng) giữ nguyên
- Các animation khác liên quan đến primary color

### 3. File `src/components/MainSidebar.tsx`

- Active state gradient: `from-primary to-primary-deep` (tự động theo CSS variable mới)
- Sidebar background: đã dùng amber tones - phù hợp, có thể tinh chỉnh nhẹ

### 4. File `src/components/Header.tsx`

- `.bg-sapphire-gradient` class sẽ tự động cập nhật khi CSS variable đổi
- Mobile nav gradient colors: cập nhật `from-primary-deep/90` (tự động)
- Login button: `bg-sapphire-gradient` -> rename thành `bg-golden-gradient` trong CSS

### 5. File `src/components/HeroSection.tsx`

- Dùng CSS variables (`text-primary-deep`, `text-primary-medium`, etc.) - tự động cập nhật
- `btn-sacred` và `btn-sacred-outline` - tự động theo CSS mới

### 6. File `src/components/Footer.tsx`

- `bg-primary-deep` / `text-primary-foreground` - tự động theo CSS variable mới
- Footer sẽ chuyển sang nền vàng kim đậm thay vì xanh đậm

### 7. CSS Class Rename

Đổi tên class cho nhất quán:
- `.bg-sapphire-gradient` -> `.bg-golden-gradient` (và cập nhật tất cả 24 files sử dụng)
- Hoặc đổi tên thành `.bg-brand-gradient` để tránh phải đổi lại nếu thay màu trong tương lai
- `.gradient-sapphire` variable -> giữ tên cũ nhưng đổi giá trị (ít rủi ro hơn)

### 8. Các trang/component có hardcoded purple/indigo colors

Một số trang (PoPL Whitepaper, Vision Board, Admin) sử dụng hardcoded `purple-*` và `indigo-*`. Các màu này phục vụ mục đích riêng (VD: PoPL branding) nên sẽ giữ nguyên, chỉ thay đổi primary system colors.

## Thứ Tự Triển Khai

1. **`src/index.css`**: Cập nhật tất cả CSS variables (`:root` + `.dark`) + component classes + keyframes
2. **`tailwind.config.ts`**: Cập nhật keyframe animation colors
3. **Rename gradient class**: Đổi `gradient-sapphire` value (giữ tên, đổi giá trị) để tự động áp dụng cho toàn bộ 24+ files sử dụng `.bg-sapphire-gradient`
4. **Kiểm tra trực quan**: Review trên preview để đảm bảo tông màu hài hòa

## Lưu Ý Quan Trọng

- Vì hệ thống dùng CSS variables, ~80% thay đổi chỉ cần sửa trong `src/index.css`
- Các component dùng `text-primary`, `bg-primary-deep`, `border-primary` sẽ tự động cập nhật
- `--gradient-sapphire` variable sẽ đổi giá trị sang gold gradient, tất cả `.bg-sapphire-gradient` tự động theo
- Không cần sửa từng component riêng lẻ (trừ hardcoded inline colors)
- `primary-foreground` giữ trắng vì chữ trắng trên nền vàng đậm vẫn đẹp và dễ đọc

