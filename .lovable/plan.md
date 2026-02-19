
# Cập Nhật Trang Cá Nhân `/user/:userId` — 6 Điểm Chỉnh Sửa

## Phân Tích Hình Tham Khảo & Yêu Cầu

Từ hình con gửi và 6 yêu cầu cụ thể:

1. **Ảnh bìa** — Điều chỉnh chiều cao (hình tham khảo ảnh bìa khá vừa phải, không quá cao)
2. **Bảng Danh Dự** — Đổi logo từ `fun-profile-logo` → `angel-ai-golden-logo`, đưa card lên **phía trên ảnh bìa** (floating overlay ở góc phải trên)
3. **Bỏ User ID** — Xóa dòng `User ID: {userId}` (hiện chỉ hiển thị cho admin)
4. **Nút "Chỉnh sửa trang cá nhân"** — Đặt ngang hàng với địa chỉ ví, hiển thị ở **góc phải**
5. **Kim cương** — Di chuyển từ `-top-1 -right-1` → **chính giữa trên đỉnh** avatar (`top-0 left-1/2 -translate-x-1/2 -translate-y-1/2`), đổi màu vàng ánh kim, **bỏ ngôi sao** (chỉ dùng 💎 cho tất cả)
6. **Nền trắng sáng** — Bỏ toàn bộ nền tối, bỏ khung viền card, trả về nền trắng `#f0f2f5` (giống hình tham khảo)

## Chi Tiết Kỹ Thuật Từng Điểm

### 1. Ảnh Bìa — Điều Chỉnh Chiều Cao

Chiều cao hiện tại `h-[220px] sm:h-[280px]` — điều chỉnh xuống `h-[180px] sm:h-[240px]` để cân đối hơn với hình tham khảo. Nền fallback khi không có ảnh bìa dùng gradient xanh lá nhạt giống hình.

### 2. Bảng Danh Dự — Logo Angel AI + Vị Trí Trên Ảnh Bìa

Hiện tại "Bảng Danh Dự" nằm trong Profile Header Card (bên phải, cùng hàng với avatar). Theo hình tham khảo, card này **nổi trên ảnh bìa** ở góc phải:

```tsx
{/* Bảng Danh Dự — floating overlay trên ảnh bìa */}
<div className="absolute right-4 top-4 z-20 w-[280px] rounded-xl p-3"
  style={{ background: "white", border: "2px solid rgba(180,144,30,0.5)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
>
  <div className="flex items-center gap-2 mb-2.5">
    <img src={angelAiGoldenLogo} className="w-7 h-7 object-contain" />
    <span className="text-sm font-extrabold tracking-wider text-amber-600 uppercase">Bảng Danh Dự</span>
    {/* Avatar chủ sở hữu bên phải header */}
    <Avatar className="w-7 h-7 ml-auto" />
  </div>
  {/* Grid 2 cột thống kê — pill style xanh lá */}
  <div className="grid grid-cols-2 gap-1.5">
    {honorStats.map(...)}
  </div>
</div>
```

Logo thay thế: `angel-ai-golden-logo.png` (đã có trong `src/assets/`)

Style từng ô thống kê theo hình (màu xanh lá, chữ vàng, pill shape):
```tsx
<div className="flex items-center justify-between px-3 py-2 rounded-full"
  style={{ background: "#1a6b3a", border: "1px solid #daa520" }}
>
  <span className="text-xs text-white">{s.icon} {s.label}</span>
  <span className="text-xs font-bold text-amber-300">{s.value}</span>
</div>
```

### 3. Bỏ User ID

Xóa hoàn toàn dòng:
```tsx
{isAdmin && <p className="text-xs text-white/50 mt-2 font-mono">User ID: {userId}</p>}
```
Không hiển thị dù là admin — thay bằng không có gì.

### 4. Nút "Chỉnh Sửa" — Ngang Hàng Ví, Góc Phải

Hiện tại nút "Chỉnh sửa" nằm trong `renderActionButtons()` ở khối `mt-3`. Cần tách ra và đặt cùng hàng với `WalletAddressDisplay`:

```tsx
{/* Wallet + Edit button — cùng hàng, flex justify-between */}
<div className="flex items-center justify-between gap-2 mt-1">
  {userId && <WalletAddressDisplay userId={userId} />}
  {isOwnProfile && (
    <Link to="/profile">
      <Button size="sm" variant="outline" className="border-amber-500 text-amber-700 font-semibold whitespace-nowrap">
        <Pencil className="w-3.5 h-3.5 mr-1.5" />
        Chỉnh sửa trang cá nhân
      </Button>
    </Link>
  )}
</div>
```

Đồng thời `renderActionButtons()` khi là `isOwnProfile` sẽ không trả về nút chỉnh sửa nữa (hoặc trả về null).

### 5. Kim Cương Badge — Giữa Trên Đỉnh Avatar + Chỉ Dùng 💎 + Màu Vàng

**Vị trí**: Di chuyển từ góc trên-phải → **chính giữa trên đỉnh**:
```tsx
// Trước: className="absolute -top-1 -right-1 z-30..."
// Sau:
<div
  className="absolute z-30 flex items-center justify-center rounded-full"
  style={{
    width: 32, height: 32,
    top: -16, left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700)",
    border: "2px solid #fff",
    boxShadow: "0 0 14px rgba(255,215,0,0.8), 0 2px 8px rgba(0,0,0,0.3)",
  }}
>
  💎
</div>
```

**Chỉ dùng 💎**: Bỏ điều kiện theo `badgeLevel`, luôn hiển thị `💎` cho mọi người dùng. Bỏ `⭐` ngôi sao.

### 6. Nền Trắng Sáng + Bỏ Khung Viền

Đây là thay đổi lớn nhất — đảo ngược toàn bộ theme từ tối về sáng:

**Main wrapper**:
```tsx
// Thay:
style={{ background: "linear-gradient(180deg, #060d1a...)", "--card": "13 33 55", ... }}
// Thành:
style={{ background: "#f0f2f5" }}
// Bỏ toàn bộ CSS variable overrides vì để hệ thống light mode tự nhiên
```

**Profile Header Card** — bỏ khung viền tối, dùng nền trắng:
```tsx
// Thay:
style={{ background: "rgba(13,33,55,0.92)", border: "1px solid rgba(180,144,30,0.25)", ... }}
// Thành:
style={{ background: "#ffffff" }}
// hoặc className="bg-white"
```

**Text colors** — đảo ngược từ trắng sang tối:
- `text-white` → `text-gray-900`
- `text-white/60` → `text-gray-500`
- `text-amber-400` → `text-amber-600` (vẫn vàng nhưng đậm hơn trên nền trắng)

**Sidebar cards** (Giới thiệu, Bạn bè):
```tsx
// Thay dark card:
style={{ background: "rgba(13,33,55,0.85)", border: "1px solid rgba(180,144,30,0.2)" }}
// Thành:
className="bg-white rounded-2xl" // không cần border
```

**Avatar border** (vẫn giữ viền vàng kim):
```tsx
// Giữ nguyên gold gradient border
border-[3px] → thay `border-[#0a1628]` thành `border-white`
```

**Orbital track ring** — vẫn giữ `border-amber-400/20`

**Bảng Danh Dự** — nền trắng với card xanh lá bên trong theo hình tham khảo:
- Header card: `background: white`, `border: "2px solid #daa520"` (vàng)
- Ô thống kê: `background: #1a6b3a` (xanh lá đậm), chữ trắng/vàng

## Tổng Quan Thay Đổi Cấu Trúc Layout

```text
┌─────────────────────────────────────────────┬──────────────────────┐
│          [ẢNH BÌA — h-[180px] sm:h-240px]  │ [BẢNG DANH DỰ card] │
│                                             │ floating, absolute   │
│  [←]                     [📷 Sửa ảnh bìa]  │ góc phải trên        │
└─────────────────────────────────────────────┴──────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ nền trắng, không viền                                              │
│  [💎 trên đỉnh]                                                    │
│  [Orbital+Avatar]  Tên Người Dùng  [chip badge]                   │
│                    @handle · angel.fun.rich/handle [copy]          │
│                    [ví...] [Chỉnh sửa trang cá nhân →]            │
│                    🌏 FUN Ecosystem · 📅 Tham gia MM/YYYY          │
│                    [friend avatars] N bạn bè                       │
│                    Bio...                                           │
│                    [Thêm bạn] [Nhắn tin] [Tặng]  (cho người khác) │
├─────────────────────────────────────────────────────────────────────┤
│ [Bài viết] [Giới thiệu] [Bạn bè]                          [...]  │
├─────────────────────────────────────────────────────────────────────┤
│ [Sidebar Giới thiệu — bg trắng]  │ [Bài viết — PostCard]          │
└──────────────────────────────────┴─────────────────────────────────┘
```

## File Sẽ Sửa

**1 file duy nhất**: `src/pages/UserProfile.tsx`

Thay đổi:
1. **Import thêm** `angelAiGoldenLogo` từ `@/assets/angel-ai-golden-logo.png`
2. **Main wrapper**: Bỏ CSS var overrides, đổi về `background: "#f0f2f5"`
3. **Cover photo**: Giảm chiều cao `h-[180px] sm:h-[240px]`; đưa **Bảng Danh Dự** vào `absolute` overlay trên cover, góc phải, dùng `angel-ai-golden-logo`
4. **Profile Header Card**: Bỏ dark background + border, dùng `bg-white`
5. **Text colors**: `text-white` → `text-gray-900`, `text-white/60` → `text-gray-500`
6. **DiamondBadge**: Di chuyển vị trí lên chính giữa đỉnh avatar, luôn hiển thị `💎`, màu vàng gradient
7. **Wallet row**: Kết hợp `WalletAddressDisplay` + nút "Chỉnh sửa trang cá nhân" thành 1 hàng `flex justify-between`
8. **renderActionButtons**: Khi `isOwnProfile`, trả về `null` (vì đã đặt nút ở hàng ví)
9. **Xóa dòng User ID** (dù là admin)
10. **Sidebar cards**: Bỏ dark bg/border, dùng `bg-white rounded-2xl`
11. **Separator**: Đổi `bg-amber-900/30` → `bg-gray-200`
12. **Tab buttons**: Đổi màu chữ tối/xám cho nền trắng
