

## Cập nhật hành vi tự động sau tặng thưởng

### Mục tiêu
1. Nút "Đăng Profile" đăng biên nhận tặng thưởng (receipt) theo giao diện cũ kèm hashtag
2. Tự động gửi tin nhắn DM cho người nhận ngay khi tặng thành công (không cần bấm nút)
3. Hiệu ứng pháo hoa + coin rơi chạy liên tục đến khi đóng; nhạc tự động phát 1 lần duy nhất (không loop)

### Các thay đổi chi tiết

**1. File: `src/components/gifts/GiftCelebrationModal.tsx`**

- **Hiệu ứng liên tục**: Xóa timer `setTimeout(() => setShowEffects(false), 8000)`. Thay vào đó `setShowEffects(true)` khi modal mở và chỉ tắt khi đóng modal. Thêm `repeat: Infinity` cho các animation firework và falling coins.
- **Xóa nút "Gửi tin nhắn cho người nhận"**: Vì tin nhắn sẽ được gửi tự động từ `GiftCoinDialog`, không cần nút này nữa.
- **Xóa props `onSendMessage`** khỏi interface và component.

**2. File: `src/components/gifts/CelebrationAudioPlayer.tsx`**

- Xóa thuộc tính `loop` trên thẻ `<audio>`. Nhạc sẽ chỉ phát 1 lần khi modal mở (autoPlay đã có sẵn).
- Khi nhạc kết thúc tự nhiên, cập nhật `isPlaying = false` (đã có `onEnded`).

**3. File: `src/components/gifts/GiftCoinDialog.tsx`**

- **Tự động gửi DM**: Di chuyển logic gửi tin nhắn DM (hiện ở prop `onSendMessage`) vào ngay sau khi `setCelebrationData` + `setShowCelebration(true)` trong cả `handleSendGift` (internal) và `handleCryptoSuccess` (web3). Gửi ngầm không chờ, không hỏi user.
- **Nút "Đăng Profile"**: Thay vì chụp ảnh Celebration Card bằng html2canvas, đăng bài community dạng text biên nhận kèm hashtag:
  ```
  🎁 Biên nhận tặng thưởng
  Người tặng: {senderName}
  Người nhận: {receiverName}
  Số lượng: {amount} {tokenLabel}
  {message nếu có: Lời nhắn: "..."}
  ⏰ {thời gian}
  #AngelAI #TặngThưởng #CamlyCoin #FUNMoney
  ```
  Không cần chụp ảnh card, không dùng html2canvas cho phần này. Vẫn giữ imageUrl nếu muốn đính kèm ảnh card.
- **Xóa prop `onSendMessage`** khỏi `<GiftCelebrationModal>`.

### Luồng hoạt động mới

```text
Tặng thành công
    |
    +-- [TỰ ĐỘNG] Gửi DM cho người nhận (ảnh card + nội dung)
    |
    v
Celebration Modal mở
    - Pháo hoa + coin rơi: LIÊN TỤC đến khi đóng
    - Nhạc: tự động phát 1 lần
    |
    +-- Nút "Đăng Profile" --> Đăng biên nhận text + hashtag
    +-- Nút "Lưu ảnh" --> Tải về máy
    +-- Nút "Chia sẻ" --> Copy link
    |
    v
User đóng modal -> tắt hiệu ứng
```

### Files thay đổi
1. `src/components/gifts/GiftCelebrationModal.tsx` - Hiệu ứng liên tục, xóa nút gửi tin nhắn
2. `src/components/gifts/CelebrationAudioPlayer.tsx` - Nhạc phát 1 lần (không loop)
3. `src/components/gifts/GiftCoinDialog.tsx` - Auto DM, đăng biên nhận text

