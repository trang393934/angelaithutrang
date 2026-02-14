
# Bật nhạc Valentine mặc định + Sidebar trong suốt

## Tổng quan
1. Nhạc Valentine tự động phát khi người dùng vào trang (mặc định bật). Người dùng nhấn nút để tắt khi không muốn nghe.
2. Sidebar trang chủ có nền trong suốt hơn để nhìn thấy video nền Valentine phía sau.

## Các thay đổi

### 1. `src/components/ValentineMusicPlayer.tsx` - Mặc định bật nhạc

Thay đổi logic khởi tạo state `isPlaying`:
- Hiện tại: mặc định `false`, chỉ `true` khi localStorage đã lưu `"true"`
- Mới: mặc định `true` nếu localStorage chưa có giá trị (lần đầu vào). Chỉ `false` khi người dùng đã chủ động tắt (localStorage = `"false"`).

```text
// Cũ:
localStorage.getItem("valentine_music_playing") === "true"

// Mới:
localStorage.getItem("valentine_music_playing") !== "false"
```

Điều này có nghĩa: lần đầu truy cập -> nhạc tự bật. Nếu người dùng tắt -> localStorage lưu "false" -> lần sau vào sẽ không tự phát.

### 2. `src/components/MainSidebar.tsx` - Nền trong suốt

Thay đổi className của component `Sidebar`:
- Hiện tại: `bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50` (nền trắng/amber đục)
- Mới: `bg-gradient-to-b from-amber-50/40 via-white/30 to-amber-50/30 backdrop-blur-sm` (nền trong suốt hơn, có hiệu ứng blur nhẹ để vẫn đọc được chữ)

Tương tự cho border-bottom của header, hover states, và footer border -- giảm opacity để hài hòa.

## Tóm tắt
- 2 file sửa: `ValentineMusicPlayer.tsx` (mặc định bật nhạc) + `MainSidebar.tsx` (nền trong suốt)
- Không ảnh hưởng logic hoạt động
