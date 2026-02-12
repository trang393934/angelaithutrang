

## Sửa lỗi: Tự động gửi tin nhắn & Tự động phát âm thanh

### Vấn đề phát hiện

**1. Âm thanh không tự động phát**

Trong `CelebrationAudioPlayer.tsx`, useEffect autoPlay phụ thuộc vào `[autoPlay]`:
```
useEffect(() => {
  if (autoPlay && audioRef.current) {
    audioRef.current.play().catch(() => {});
  }
}, [autoPlay]);
```

Vấn đề: Khi modal mở, component mount với `autoPlay=true` ngay từ đầu. Effect chạy 1 lần nhưng:
- Trình duyệt chặn autoplay nếu chưa có tương tác người dùng gần đây
- `.catch(() => {})` nuốt lỗi im lặng, không retry
- Audio element có thể chưa load xong khi effect chạy

**Giải pháp**: Thêm delay nhỏ (300ms) để đợi audio element sẵn sàng, retry play khi `canplaythrough` event fire, và thêm `preload="auto"` cho audio tag. Vì người dùng đã click nút tặng (user interaction), trình duyệt sẽ cho phép play nếu timing đúng.

**2. Tin nhắn tự động không gửi được**

Trong `autoSendDM`, có guard:
```
if (!celData.receiver_id || !user?.id) return;
```

Với giao dịch Web3 đến địa chỉ ví ngoài (không chọn user), `receiver_id` = `""` (empty string), nên hàm return sớm mà không gửi. Ngoài ra, insert vào `direct_messages` cần đúng format và receiver phải là user hợp lệ trong hệ thống.

**Giải pháp**: Chỉ gửi DM khi `receiver_id` là UUID hợp lệ (người nhận có tài khoản), log rõ ràng hơn khi không gửi được. Đồng thời thêm `console.log` debug để theo dõi luồng thực thi.

### Thay đổi chi tiết

**File 1: `src/components/gifts/CelebrationAudioPlayer.tsx`**

- Thêm `preload="auto"` vào thẻ `<audio>`
- Thay đổi useEffect autoPlay: thêm delay 300ms + lắng nghe event `canplaythrough` để retry play
- Thêm ref `hasAutoPlayed` để đảm bảo chỉ auto-play 1 lần duy nhất
- Log lỗi thay vì nuốt im lặng

**File 2: `src/components/gifts/GiftCoinDialog.tsx`**

- Thêm console.log trong `autoSendDM` để debug (log khi gọi, log khi skip, log khi thành công/thất bại)
- Validate `receiver_id` là UUID hợp lệ trước khi insert
- Đảm bảo toast thông báo rõ ràng khi gửi thành công hoặc khi không thể gửi (người nhận không có tài khoản)

### Files thay đổi
1. `src/components/gifts/CelebrationAudioPlayer.tsx` - Fix autoplay timing
2. `src/components/gifts/GiftCoinDialog.tsx` - Fix auto DM validation + debug logs
