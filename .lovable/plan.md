
# Redesign Trang Cá Nhân `/user/:userId` — Angel AI Style

## Phân Tích Hình Tham Khảo

Từ hình người dùng cung cấp, layout mới cần có:

1. **Ảnh bìa** — Full width, chiều cao vừa phải, không quá cao
2. **Khu vực avatar** — Nằm bên **trái** (không căn giữa), nổi đè lên cover, có:
   - Vòng tròn xanh (hoặc vàng Angel AI) bao quanh avatar
   - Icon **kim cương 💎** nổi bật phía trên-phải avatar (tương tự hình)
   - Các orbital social icons xoay xung quanh (đã có từ trước, tích hợp lại cho trang này)
   - Icon social links (Facebook v.v.) nổi xung quanh avatar
3. **Thông tin tên** — Nằm cạnh phải avatar (không phải bên dưới)
   - Tên to, đậm
   - `@handle · angel.fun.rich/handle` với nút copy
   - Địa chỉ ví (có chip copy)
   - Vị trí + Ecosystem label (🌏 Việt Nam · 🏢 FUN Ecosystem)
   - Avatar bạn bè xếp chồng nhau bên dưới
4. **Nút hành động** — Bên phải (Chỉnh sửa / Kết bạn / Nhắn tin / Tặng)
5. **Bảng Danh Dự** (góc phải trên) — Card xanh đậm với lưới 2×4 thống kê: Bài viết, Bạn bè, Cảm xúc, Có thể rút, Bình luận, Đã rút, Hôm nay, Tổng thu
6. **Navigation Tabs** — Ngang hàng bên dưới: Tất cả | Giới thiệu | Bạn bè | Ảnh | Reels | Chỉnh sửa hồ sơ — **nút "..." (3 chấm) góc PHẢI của tab bar**

## Màu Sắc Angel AI áp dụng cho `/user/:userId`

- **Nền tổng thể**: Gradient dark `from-[#0a1628] via-[#0d1f3a] to-[#0a1628]` thay vì `bg-[#f0f2f5]` (Facebook trắng)
- **Card**: `bg-[#0d2137]/80` với border `border-amber-900/30`
- **Avatar border**: Vàng kim loại gradient (giống `PublicProfileHeader`)
- **Tab active**: `border-b-[3px] border-amber-400 text-amber-400`
- **"Bảng Danh Dự"**: Nền xanh đậm gradient `from-[#0d3320] to-[#1a4a2e]` với border vàng, chữ trắng/vàng

## Các Thay Đổi Cần Thực Hiện

### File duy nhất: `src/pages/UserProfile.tsx` — REFACTOR TOÀN BỘ PHẦN RENDER

#### A. Nền tổng thể
- Đổi `bg-[#f0f2f5]` → `min-h-screen bg-gradient-to-b from-[#060d1a] via-[#0a1628] to-[#060d1a]`

#### B. Cover Photo
- Giữ nguyên logic hiển thị ảnh bìa
- Chiều cao: `h-[220px] sm:h-[280px]` — hợp lý hơn
- Thêm gradient overlay bottom đậm hơn cho cảm giác Angel AI

#### C. Avatar Section — BÊN TRÁI, có Orbital + Diamond Icon

Thay khối avatar hiện tại bằng:
- **Wrapper** `relative inline-block` với orbital social links giống `PublicProfileHeader`
- **Gold gradient border** (`linear-gradient(135deg, #b8860b, #daa520, #ffd700...)`) 5px
- **Kim cương 💎 badge** — Nổi ở góc trên-phải của avatar, dùng emoji hoặc icon gem màu cyan, kích thước 28px với nền tối và glow effect
  - Logic: hiển thị theo `badgeLevel` (angel → 💎 kim cương, lightworker → ⭐, v.v.) hoặc luôn hiển thị một icon nhất định
- **Orbital social links**: Tích hợp component `OrbitalSocialLinks` từ `PublicProfileHeader` (import hoặc tạo local copy) vào trang này

#### D. Khu vực thông tin — Layout 2 cột: [Avatar + Orbital | Thông tin]

```
┌─────────────────────────────────────────────────────────────┐
│ [cover photo full width]                                    │
├─────────────────────────────────────────────────────────────┤
│  [💎+Orbital+Avatar]  │ Tên Người Dùng                     │
│  (trái, -mt overlap) │ @handle · fun.rich/handle [copy]   │
│                       │ [📋 0xf398...C7A6] [copy]          │
│                       │ 🌏 Việt Nam · 🏢 FUN Ecosystem     │
│                       │ [friend avatars]                    │
│                       │           [Chỉnh sửa] [Nhắn tin]  │
└─────────────────────────────────────────────────────────────┘
```

#### E. "Bảng Danh Dự" — Card thống kê Angel AI style

Thay thế sidebar thống kê hiện tại bằng một card nổi bật phía bên phải (hoặc bên dưới thông tin trên mobile):
- Header: Logo FUN Profile + "BẢNG DANH DỰ" chữ in đậm
- Grid 2×4 các ô thống kê:
  - ↑ Bài viết | 👥 Bạn bè
  - ⭐ Cảm xúc (likes) | 🎁 Có thể rút (balance)
  - 💬 Bình luận | 💸 Đã rút
  - 📅 Hôm nay | 💰 Tổng thu (lifetimeEarned)
- Mỗi ô: border vàng, nền xanh gradient, icon + label + số

#### F. Navigation Tabs — Thêm nút "..." bên phải

Tabs mới:
- **Tất cả** | **Giới thiệu** | **Bạn bè** | + nút **"..."** (3 chấm) góc PHẢI
- Nút "..." là `ProfileMoreMenu` component, đặt ở `flex justify-between items-center`
- Xóa nút "..." ở góc cover photo (không cần nữa vì đã chuyển xuống tabs)

#### G. Content layout bên dưới tabs

Giữ nguyên grid `[360px 1fr]` nhưng:
- Card trái ("Giới thiệu"): cập nhật theme Angel AI (dark bg, gold borders)
- Card phải (Posts): giữ nguyên `PostCard` components

## Chi Tiết Kỹ Thuật

### Import mới cần thêm

```typescript
import { OrbitalSocialLinks } from "@/components/public-profile/PublicProfileHeader"; 
// Hoặc trích xuất OrbitalSocialLinks thành file riêng để tái sử dụng
```

> Vì `OrbitalSocialLinks` và `OrbitalIcon` hiện là hàm nội bộ trong `PublicProfileHeader.tsx`, cần **export** chúng hoặc tạo lại local trong `UserProfile.tsx`.

Cách đơn giản nhất: **tạo local copy** của `OrbitalSocialLinks` + `OrbitalIcon` + `PLATFORM_META` trong `UserProfile.tsx` (copy từ `PublicProfileHeader.tsx`).

### Kim cương / Badge trên avatar

```typescript
// Icon theo badge level
const getDiamondIcon = (level: string) => {
  if (level === "angel") return "💎";
  if (level === "lightworker") return "✨";
  if (level === "guardian") return "🛡️";
  return "⭐";
};
```

Rendered as:
```tsx
<div className="absolute -top-1 -right-1 z-30 w-8 h-8 rounded-full bg-[#0a1628] border-2 border-cyan-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(34,211,238,0.5)]">
  💎
</div>
```

### "Bảng Danh Dự" Grid

```tsx
const statItems = [
  { icon: "↑", label: "Bài viết", value: stats.posts },
  { icon: "👥", label: "Bạn bè", value: stats.friends },
  { icon: "⭐", label: "Cảm xúc", value: stats.likes },
  { icon: "🎁", label: "Có thể rút", value: Math.floor(balance) },
  { icon: "💬", label: "Bình luận", value: 0 }, // future
  { icon: "💸", label: "Đã rút", value: 0 }, // future
  { icon: "📅", label: "Hôm nay", value: 0 }, // future
  { icon: "💰", label: "Tổng thu", value: Math.floor(naturalLifetimeEarned) },
];
```

Style: `grid grid-cols-2 gap-2`, mỗi ô `flex justify-between items-center px-3 py-2 rounded-lg bg-[#0a2e18] border border-amber-600/40`

### Tab Navigation mới

```tsx
<div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
  <div className="flex gap-1">
    {["posts", "about", "friends"].map(tab => (
      <button key={tab} ...>{tabLabel}</button>
    ))}
  </div>
  {/* Nút 3 chấm bên phải */}
  <ProfileMoreMenu userId={userId} ... />
</div>
```

## Tóm Tắt File Sẽ Sửa

**1 file duy nhất**: `src/pages/UserProfile.tsx`

Các thay đổi:
1. Đổi background tổng thể → Angel AI dark gradient
2. Refactor khối cover + avatar → layout 2 cột (trái: avatar+orbital+diamond; phải: tên+info+actions)
3. Thêm local `OrbitalSocialLinks` component (copy từ PublicProfileHeader)
4. Thêm kim cương badge trên avatar
5. Thêm "Bảng Danh Dự" card (xanh đậm, lưới 2×4 thống kê)
6. Di chuyển nút "..." từ cover → cuối tab bar (góc phải)
7. Cập nhật style tab navigation → amber/gold active state
8. Điều chỉnh theme card sidebar (Giới thiệu, Bạn bè) → Angel AI dark

Không cần thay đổi database hay edge functions.
