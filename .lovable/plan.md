
# Nâng Cấp Social Links Editor & Orbital Display

## Phân Tích Từ 2 Hình Tham Khảo

**Hình 1** (trạng thái chưa cài link): Giao diện chọn platform dạng lưới 3 cột — mỗi ô là 1 button tròn có icon + tên platform. Bên dưới là ô input nhập link. Thứ tự: Angel AI (→ Fun Profile), Fun Play, Facebook, YouTube, Twitter/X, Telegram, TikTok, LinkedIn, Zalo.

**Hình 2** (sau khi thêm links): Hiển thị danh sách các link đã thêm — mỗi item là 1 card có: icon tròn (logo thật của platform), tên platform in đậm, link rút gọn bên dưới, nút X để xóa. Bên dưới là phần "Thêm mạng xã hội" chỉ hiển thị các platform chưa được thêm.

## Các Thay Đổi Cần Thực Hiện

### File 1: `src/components/profile/SocialLinksEditor.tsx` — REFACTOR TOÀN BỘ

**Thứ tự platforms mới (theo đúng hình):**
1. `fun_profile` → "Fun Profile" (dùng logo `fun-profile-logo.png`)
2. `fun_play` → "Fun Play" (dùng logo `fun-play-logo.png`)
3. `facebook` → "Facebook" (icon Facebook xanh)
4. `youtube` → "YouTube" (icon đỏ)
5. `twitter` → "Twitter / X" (icon X đen)
6. `telegram` → "Telegram" (icon xanh sky)
7. `tiktok` → "TikTok" (icon đen)
8. `linkedin` → "LinkedIn" (icon xanh navy)
9. `zalo` → "Zalo" (icon xanh Zalo)

**Loại bỏ:** `instagram`, `website`, `discord` (không có trong hình tham khảo)

**Thêm mới:** `fun_profile`, `fun_play`, `zalo`

**UX mới — 3 bước:**

**Bước 1:** Platform chưa có link → hiển thị dạng grid button (như hình 1). Khi click 1 platform → chuyển sang input mode cho platform đó

**Bước 2:** Có link → hiển thị dạng card list (như hình 2). Card gồm: icon/logo platform, tên, URL rút gọn, nút X xóa

**Bước 3:** Phần "Thêm mạng xã hội" bên dưới chỉ hiển thị platforms chưa có link (grid nhỏ hơn)

**Logic mới:**
```typescript
// Trạng thái:
const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
const [inputValue, setInputValue] = useState("");
// Khi click platform → set selectedPlatform
// Khi nhấn + → save link cho platform đó vào links state
// Khi nhấn X trên card → xóa link đó khỏi state
// Khi nhấn "Cập nhật hồ sơ" → save toàn bộ vào DB
```

**Thiết kế card (hình 2):**
- Border nhẹ, rounded-xl
- Icon platform: 48px × 48px, rounded-full (dùng logo image cho Fun Profile & Fun Play, icon lucide cho Facebook/YouTube/Telegram, text icon cho TikTok/LinkedIn/Zalo)
- Tên platform: font-semibold, text-foreground
- URL: text-sm text-muted-foreground, truncate
- Nút X: absolute top-right, nhỏ

**Thiết kế grid selector (hình 1):**
- Container: dashed border, rounded-xl, bg-muted/20
- Mỗi platform: button dạng flex row (icon + tên), 3 cột trên desktop, 2-3 cột responsive
- Input phía dưới: placeholder thay đổi theo platform được chọn

### File 2: `src/components/public-profile/PublicProfileHeader.tsx` — CẬP NHẬT `PLATFORM_META`

Thêm `fun_profile` và `fun_play` vào `PLATFORM_META`:
```typescript
fun_profile: {
  label: "Fun Profile",
  icon: <img src={funProfileLogo} className="w-5 h-5 object-contain" />,
  bg: "#1a472a", // xanh lá dark
  color: "#ffd700",
},
fun_play: {
  label: "Fun Play",
  icon: <img src={funPlayLogo} className="w-5 h-5 object-contain" />,
  bg: "#0a1a3a", // navy dark
  color: "#ffd700",
},
zalo: {
  label: "Zalo",
  icon: <span className="text-xs font-black">Z</span>,
  bg: "#0068FF",
  color: "#fff",
},
```

Xóa `discord`, `instagram`, `website` khỏi `PLATFORM_META` (không còn dùng).

Cập nhật tooltip nút "+" orbital (chủ sở hữu chưa có link) → text đổi thành "✨ Thêm Mạng Xã Hội".

### File 3: `src/components/public-profile/SocialLinksDisplay.tsx` — CẬP NHẬT

Thêm `fun_profile`, `fun_play`, `zalo` vào `PLATFORM_META` để hiển thị đúng khi render danh sách (dùng ở nơi khác nếu có).

## Thứ Tự Hiển Thị Orbital (Public Profile)

Các vòng tròn orbital trên trang public profile sẽ hiển thị theo đúng thứ tự platform đã được thêm (từ data `social_links`), với icon logo thật cho Fun Profile và Fun Play thay vì text placeholder.

## Kỹ Thuật

- Import logo assets: `import funProfileLogo from "@/assets/fun-profile-logo.png"` và `import funPlayLogo from "@/assets/fun-play-logo.png"`
- Zalo không có icon lucide → dùng text "Z" với màu nền `#0068FF`
- Placeholder input thay đổi động theo platform được chọn (ví dụ "Link trang cá nhân Facebook", "Link kênh YouTube", v.v.)
- Counter: "Mạng xã hội (X/9)" trong tiêu đề section như hình

## Tóm Tắt File Sẽ Sửa

1. `src/components/profile/SocialLinksEditor.tsx` — Refactor UX hoàn toàn theo 2 hình tham khảo
2. `src/components/public-profile/PublicProfileHeader.tsx` — Thêm `fun_profile`, `fun_play`, `zalo` vào PLATFORM_META
3. `src/components/public-profile/SocialLinksDisplay.tsx` — Thêm các platform mới vào PLATFORM_META
