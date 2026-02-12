
## Hành vi tự động sau khi tặng thưởng thành công

### Tổng quan
Hoàn thiện quy trình sau tặng thưởng: (1) Nút "Chia sẻ" tự động đăng bài Profile với ảnh Celebration Card, (2) Tự động gửi tin nhắn cho người nhận kèm ảnh Card, (3) Nút "Xem Card Chúc Mừng" trong lịch sử giao dịch mở đúng Celebration Modal với hiệu ứng. Xóa toàn bộ GIF ngẫu nhiên.

### Các thay đổi chi tiết

**1. File: `src/components/gifts/GiftCoinDialog.tsx`**

Truyền 2 handler `onPostToProfile` và `onSendMessage` vào `GiftCelebrationModal` (hiện đang thiếu):

- **`onPostToProfile`**: Dùng `html2canvas` chụp Celebration Card thành ảnh PNG, upload lên Supabase Storage, rồi gọi `process-community-post` edge function để tạo bài đăng với nội dung:
  ```
  🎁 Đã tặng {amount} {tokenLabel} cho {receiverName}!
  {message nếu có}
  #AngelAI #TặngThưởng #CamlyCoin #FUNMoney
  ```
  Kèm ảnh Celebration Card (không dùng GIF).

- **`onSendMessage`**: Chụp Celebration Card thành ảnh, upload lên Storage, rồi gửi tin nhắn DM cho người nhận qua bảng `direct_messages` với:
  - Ảnh Celebration Card đính kèm
  - Nội dung: "🎁 Chúc mừng {receiverName}! Bạn nhận được {amount} {token} từ {senderName}. Xem Card Chúc Mừng: {link}"
  - `message_type: "tip"`

**2. File: `src/components/gifts/GiftCelebrationModal.tsx`**

- Thêm logic chụp ảnh Card (html2canvas) và upload lên Storage trong component (hàm `captureCardImage`)
- Cập nhật nút "Đăng Profile" thành nút nổi bật hơn, hiển thị trạng thái loading khi đang xử lý
- Cập nhật nút "Gửi tin nhắn cho người nhận" tương tự
- Xóa mọi tham chiếu GIF ngẫu nhiên (nếu có)

**3. File: `src/pages/ActivityHistory.tsx`**

- Thay link "Xem Card" (hiện chỉ trỏ đến `/receipt/:id`) thành nút mở `GiftCelebrationModal` inline:
  - Thêm state `celebrationModalData` và `showCelebrationModal`
  - Khi click "Xem Card Chúc Mừng", fetch dữ liệu giao dịch từ `coin_gifts` và mở `GiftCelebrationModal` với đầy đủ hiệu ứng (pháo hoa, coin rơi, nhạc)
  - Import `GiftCelebrationModal` component
  - Vẫn giữ link `/receipt/:id` cho "Xem biên nhận" riêng biệt

### Luồng hoạt động

```text
Tặng thành công
    |
    v
Celebration Modal mở (pháo hoa + nhạc)
    |
    +-- Nút "Đăng Profile" --> Chụp Card --> Upload ảnh --> Tạo bài đăng Community
    |
    +-- Nút "Gửi tin nhắn" --> Chụp Card --> Upload ảnh --> Gửi DM cho người nhận
    |
    +-- Nút "Lưu ảnh" --> Tải về máy
    |
    v
Lịch sử giao dịch: Nút "Xem Card Chúc Mừng" --> Mở lại Celebration Modal
```

### Ràng buộc
- Xóa toàn bộ GIF ngẫu nhiên (Giphy, randomGif) - chỉ dùng Celebration Card do hệ thống tạo
- Mọi text bằng tiếng Việt có dấu
- Ảnh đăng Profile = ảnh chụp từ Celebration Card (.png)
- Hashtag mặc định: #AngelAI #TặngThưởng

### Files thay đổi
1. `src/components/gifts/GiftCoinDialog.tsx` - Thêm handlers onPostToProfile, onSendMessage
2. `src/components/gifts/GiftCelebrationModal.tsx` - Thêm logic chụp + upload ảnh Card
3. `src/pages/ActivityHistory.tsx` - Thêm nút "Xem Card Chúc Mừng" mở Celebration Modal
