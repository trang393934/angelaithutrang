
# Thêm video nền Valentine và tiêu đề HAPPY VALENTINE'S DAY

## Tổng quan
Thay thế video nền Tết hiện tại bằng 3 video Valentine mới (xoay vòng), thêm tiêu đề "HAPPY VALENTINE'S DAY" với hiệu ứng gradient đỏ-vàng ánh kim lên HeroSection.

## Các thay đổi

### 1. Copy 3 video vào thư mục public
- `grok-video-...1.mp4` -> `public/videos/valentine-1.mp4`
- `grok-video-...2.mp4` -> `public/videos/valentine-2.mp4`
- `grok-video-....mp4` -> `public/videos/valentine-3.mp4`

### 2. Sửa file `src/pages/Index.tsx` - Thay video nền

Thay thế thẻ `<video>` hiện tại (dòng 55-69, đang dùng `tet-background.mp4`) bằng component video Valentine xoay vòng giữa 3 video:
- Dùng state `currentVideo` để chuyển đổi giữa 3 video
- Mỗi video phát xong sẽ tự chuyển sang video tiếp theo (sự kiện `onEnded`)
- Giữ nguyên style: fixed, full-width, pointer-events-none, phía sau nội dung
- Thêm hiệu ứng fade nhẹ khi chuyển video

### 3. Sửa file `src/components/HeroSection.tsx` - Thêm tiêu đề Valentine

Thêm dòng chữ "HAPPY VALENTINE'S DAY" phía trên tiêu đề "Angel AI" (dòng 33-36):
- Font lớn, đậm, uppercase
- Gradient đỏ-vàng ánh kim: `from-red-600 via-yellow-400 to-red-500`
- Hiệu ứng shimmer/sparkle chạy liên tục (dùng framer-motion hoặc CSS animation tương tự RainbowTitle)
- Text-shadow vàng kim để tạo cảm giác 3D ánh kim
- Emoji tim nhỏ hai bên: ❤️ HAPPY VALENTINE'S DAY ❤️

## Chi tiết kỹ thuật

### Video xoay vòng (Index.tsx)
```text
- State: currentVideoIndex (0, 1, 2)
- Array: ["/videos/valentine-1.mp4", "/videos/valentine-2.mp4", "/videos/valentine-3.mp4"]
- onEnded: chuyển sang video tiếp theo (index + 1) % 3
- Giữ nguyên: autoPlay, muted, playsInline, fixed positioning, z-[1]
```

### Tiêu đề Valentine (HeroSection.tsx)
```text
- Vị trí: Trước h1 "Angel AI", sau avatar
- Style gradient ánh kim:
  background: linear-gradient(90deg, #dc2626, #fbbf24, #dc2626, #fbbf24)
  background-size: 200% 100%
  animation: shimmer 3s linear infinite
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent
  text-shadow/filter: drop-shadow vàng kim
- Kích thước: text-2xl sm:text-3xl md:text-4xl
- Font: font-black, tracking-wider, uppercase
```

## Tóm tắt
- 3 file copy: video Valentine vào `public/videos/`
- 2 file sửa: `Index.tsx` (video nền) + `HeroSection.tsx` (tiêu đề)
- Không ảnh hưởng logic, chỉ thay đổi giao diện
