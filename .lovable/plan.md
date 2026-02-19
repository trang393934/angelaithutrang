
# Nâng Cấp Giao Diện Trang Cá Nhân — Angel AI Style

## Mục Tiêu
Redesign `PublicProfileHeader` và `SocialLinksDisplay` để tạo hiệu ứng **các vòng tròn mạng xã hội xoay quanh avatar** theo phong cách Angel AI (gold/dark). Các thay đổi tập trung vào component `src/components/public-profile/PublicProfileHeader.tsx` và `src/components/public-profile/SocialLinksDisplay.tsx`.

---

## Phân Tích Hình Tham Khảo
Từ hình người dùng cung cấp:
- Avatar lớn, nổi bật ở giữa/trái
- Các icon mạng xã hội (Facebook, v.v.) là **vòng tròn nhỏ nổi xung quanh avatar**, mỗi cái link đến trang mạng xã hội tương ứng
- Các vòng tròn này di chuyển/xoay liên tục theo quỹ đạo hình tròn quanh avatar
- Màu sắc Angel AI: vàng kim loại (gold gradient), nền sáng/tối sang trọng
- Tên + handle to, rõ ràng bên dưới
- Layout tổng thể: cover photo → avatar nổi lên + vòng tròn xoay → tên/thông tin

---

## Các File Sẽ Chỉnh Sửa

### 1. `src/components/public-profile/PublicProfileHeader.tsx` — CHỈNH SỬA CHÍNH

**Thay đổi:**

**A. Orbiting Social Circles quanh Avatar**
- Tạo một `OrbitalSocialLinks` component con ngay trong file
- Dùng `framer-motion` (đã có sẵn) để animate các vòng tròn icon
- Mỗi mạng xã hội → 1 vòng tròn nhỏ (32x32px) với icon thương hiệu, màu nền đặc trưng, border gold
- Các vòng tròn sắp xếp theo quỹ đạo tròn quanh avatar, mỗi cái bắt đầu tại góc phân bổ đều (360° / số lượng)
- Animation: `rotate` vô hạn, nhưng bản thân icon **counter-rotate** để icon không bị quay ngược
- Khi hover vào 1 vòng tròn: dừng xoay, scale lên, hiện tooltip tên platform
- Click → mở link mạng xã hội trong tab mới
- Bán kính quỹ đạo: ~90px cho desktop, ~70px cho mobile

**B. Avatar Container**
- Tăng size avatar: 140px mobile, 168px desktop
- Border: 5px vàng kim loại gradient (`from-amber-400 via-yellow-300 to-amber-500`)
- Ring ngoài: `ring-2 ring-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.3)]` — hiệu ứng glow
- Wrapper `div` có `position: relative` chứa cả avatar + vòng tròn xoay
- Wrapper phải đủ rộng để vòng tròn không bị clip: `w-[280px] h-[280px]` với avatar ở giữa

**C. Bố cục tổng thể**
- Chuyển từ layout hàng ngang (Facebook style) sang layout **căn giữa** (như hình tham khảo)
- Cover photo giữ nguyên phía trên
- Avatar + orbital circles căn giữa, nổi lên từ cover (-mt-[70px])
- Tên, handle, bio, thông tin → căn giữa bên dưới avatar
- Bỏ `SocialLinksDisplay` dạng danh sách dọc (vì social links đã được hiển thị qua orbital circles)

---

### 2. `src/components/public-profile/SocialLinksDisplay.tsx` — CẬP NHẬT

- Giữ nguyên file này nhưng không dùng trong `PublicProfileHeader` nữa (thay bằng orbital)
- Hoặc export thêm hàm `getSocialPlatformMeta(platform)` để `PublicProfileHeader` tái sử dụng icon/màu của từng platform

---

## Chi Tiết Kỹ Thuật

### Orbital Animation Logic

```text
Mỗi icon được đặt tại:
  x = cx + R * cos(angle + time * speed)
  y = cy + R * sin(angle + time * speed)

Trong framer-motion, dùng:
  animate={{ rotate: 360 }}
  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}

Wrapper xoay tròn → icon children counter-rotate ngược lại để icon thẳng đứng
```

### Platform Icons trong Orbital Circles

| Platform | Màu nền | Icon |
|----------|---------|------|
| Facebook | Xanh dương | `Facebook` lucide |
| Instagram | Hồng tím gradient | `Instagram` lucide |
| TikTok | Đen | 🎵 |
| YouTube | Đỏ | `Youtube` lucide |
| LinkedIn | Xanh navy | `in` text |
| Twitter/X | Đen | 𝕏 |
| Website | Xanh lá | `Globe` lucide |
| Telegram | Xanh trời | `MessageCircle` lucide |
| Discord | Tím | `D` text |

### Màu Sắc Angel AI Áp Dụng

- Avatar border: `linear-gradient(135deg, #b8860b, #daa520, #ffd700, #ffec8b, #daa520, #b8860b)`
- Vòng tròn social: border `ring-1 ring-amber-400/60`, `shadow-[0_2px_8px_rgba(0,0,0,0.3)]`
- Nền vòng tròn: màu đặc trưng của platform nhưng thêm shimmer edge vàng khi hover
- Quỹ đạo path: có thể vẽ một vòng tròn nhạt `border border-primary/10 rounded-full absolute` làm "đường ray" cho đẹp

---

## Các Bước Thực Hiện

1. **Cập nhật `PublicProfileHeader.tsx`:**
   - Thêm `OrbitalSocialLinks` component
   - Dùng `framer-motion` `motion.div` với `animate={{ rotate: 360 }}` cho wrapper quỹ đạo
   - Đặt avatar ở giữa wrapper, các icon ở positions tuyệt đối theo góc phân bổ
   - Chuyển layout từ hàng ngang sang căn giữa
   - Xóa `<SocialLinksDisplay>` khỏi header (đã thay bằng orbital)

2. **Cập nhật `src/pages/HandleProfile.tsx`:**
   - Xóa phần render `<SocialLinksDisplay>` riêng lẻ nếu có (vì đã tích hợp vào header)

3. **Không cần migration database** — chỉ thay đổi UI, dữ liệu `social_links` từ database vẫn dùng như cũ.

---

## Kết Quả Cuối Cùng

```text
┌──────────────────────────────────────────────┐
│          [COVER PHOTO — full width]          │
│                                              │
│         ╭─────────────────────╮             │
│    TG ○ │  ╭─────────────╮  │ ○ FB        │
│         │  │  [AVATAR]   │  │              │
│   YT ○  │  │             │  │  ○ IG        │
│         │  ╰─────────────╯  │              │
│    DC ○ ╰─────────────────────╯ ○ TW       │
│                                              │
│           Tên Hiển Thị                      │
│      @handle · angel.fun.rich/handle         │
│            Bio của người dùng                │
│         [Wallet] · [Joined date]             │
└──────────────────────────────────────────────┘
```

Các vòng tròn icon xoay liên tục theo chiều kim đồng hồ. Hover = dừng + tooltip. Click = mở link mới.
