

# Thêm nhạc nền Valentine 14/02 cho toàn bộ platform

## Tổng quan
Thêm file nhạc `VALENTINE.mp3` làm nhạc nền cho toàn bộ Angel AI platform, kèm nút bật/tắt nhạc nổi bật ở góc màn hình. Nhạc chỉ phát khi người dùng chủ động bật (tránh vi phạm chính sách autoplay của trình duyệt).

## Các thay đổi

### 1. Copy file nhạc vào project
- `user-uploads://VALENTINE.mp3` -> `public/audio/valentine-bg.mp3`
- Đặt trong `public/audio/` vì đây là file media lớn, không cần bundling.

### 2. Tạo component `ValentineMusicPlayer.tsx`

File mới: `src/components/ValentineMusicPlayer.tsx`

- Nút tròn nổi, cố định ở **góc phải dưới** (hoặc trái dưới tùy layout), z-index cao để luôn hiển thị trên mọi trang.
- Icon nhạc (Music / Music2 từ lucide-react) với hiệu ứng xoay khi đang phát.
- Gradient hồng/đỏ Valentine phù hợp ngày 14/02.
- Click để bật/tắt nhạc, lưu trạng thái vào `localStorage` để nhớ lựa chọn người dùng giữa các lần truy cập.
- Audio loop liên tục, preload metadata.
- Tooltip hiển thị "Bật nhạc Valentine" / "Tắt nhạc".
- Hiệu ứng pulse nhẹ khi chưa bật để thu hút chú ý.

### 3. Thêm component vào `App.tsx`

- Import `ValentineMusicPlayer` và đặt bên trong `BrowserRouter` (cùng cấp với `BackToTopButton`), để nút hiển thị trên mọi trang.

## Chi tiết kỹ thuật

```text
ValentineMusicPlayer:
- State: isPlaying (boolean), lưu localStorage key "valentine_music_playing"
- Audio ref: HTMLAudioElement, src="/audio/valentine-bg.mp3", loop=true
- Nút: fixed bottom-6 right-20 (tránh chồng BackToTopButton), z-50
- Style: gradient from-pink-500 to-red-500, shadow-lg, rounded-full w-12 h-12
- Khi phát: icon xoay (animate-spin chậm ~3s), ring pulse hồng
- Khi tắt: icon tĩnh, pulse nhẹ mời gọi
```

## Tóm tắt
- 1 file mới: `src/components/ValentineMusicPlayer.tsx`
- 1 file copy: `public/audio/valentine-bg.mp3`
- 1 file sửa: `src/App.tsx` (thêm import + render component)
- Không ảnh hưởng logic hiện tại

