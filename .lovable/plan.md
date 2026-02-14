
# Cải thiện tự động phát nhạc Valentine + Thanh chỉnh âm lượng

## Vấn đề hiện tại
1. **Nhạc không tự phát**: Trình duyệt chặn autoplay khi chưa có tương tác. Hệ thống đã có fallback (listener click/touchstart) nhưng listener chỉ đăng ký 1 lần trong useEffect init -- nếu audio object chưa sẵn sàng (chưa load xong) thì lần click đầu tiên vẫn không phát được.
2. **Nút tăng/giảm âm lượng**: Đã có nút +/- nhưng chưa có thanh trượt (slider) trực quan.

## Các thay đổi

### 1. `src/components/ValentineMusicPlayer.tsx` - Cải thiện autoplay + Slider âm lượng

**A. Autoplay đáng tin cậy hơn:**
- Thêm sự kiện `canplaythrough` trên audio element -- chỉ gọi `.play()` sau khi audio đã load đủ dữ liệu.
- Listener fallback (click/touchstart) sẽ kiểm tra `canplaythrough` trước khi play, và nếu chưa sẵn sàng thì đợi event rồi play.
- Giữ listener cho đến khi thực sự play thành công (không remove quá sớm).

**B. Thanh trượt âm lượng (Slider):**
- Thay thế nút +/- bằng thanh trượt dọc (vertical slider) sử dụng component `@radix-ui/react-slider` đã có sẵn trong dự án.
- Hiển thị phần trăm âm lượng bên cạnh thanh trượt.
- Giữ nguyên giao diện gradient hồng-đỏ phong cách Valentine.

## Chi tiết kỹ thuật

### Autoplay flow cải thiện:

```text
Component mount
  -> Tạo Audio object, preload="auto"
  -> Lắng nghe "canplaythrough"
  -> Khi sẵn sàng: gọi .play()
     -> Nếu bị chặn: đăng ký listener toàn cục
        -> Khi user click/touch bất kỳ đâu -> play()
        -> Chỉ gỡ listener sau khi play thành công
```

### UI Volume Slider:
- Sử dụng Radix Slider component (đã cài sẵn `@radix-ui/react-slider`)
- Orientation: vertical, chiều cao khoảng 80px
- Range: 0-100, ánh xạ sang volume 0-1
- Màu track: gradient pink/red phù hợp theme Valentine

## File thay đổi
- `src/components/ValentineMusicPlayer.tsx` -- cập nhật logic autoplay và thay UI volume
