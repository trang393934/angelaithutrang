
# Nâng Cấp Flow "Tặng & Thưởng" Trên Angel AI

## Tiến độ

### ✅ Phần 1: Chuẩn Bị Tài Nguyên
- [x] Copy 3 file nhạc Rich vào `public/audio/`
- [x] Download logo Bitcoin vào `src/assets/bitcoin-logo.png`
- [x] Cập nhật TokenSelector: bỏ USDC/BNB, thêm Bitcoin (giữ nguyên giao diện cũ)
- [x] Sửa GiftCoinDialog để tương thích với token mới

### 🔲 Phần 2: Bước 1 - SendGiftModal (Refactor GiftCoinDialog thành flow 3 bước)
- [ ] Refactor UI step 1: người gửi/nhận info, quick amounts, bỏ slider
- [ ] Step 2: bảng xác nhận đầy đủ trước ký MetaMask
- [ ] Step 3: chuyển sang GiftCelebrationModal

### 🔲 Phần 3: GiftCelebrationModal (Celebration Card)
- [ ] Tạo CelebrationThemeSelector (6 chủ đề, 3 background/chủ đề, upload ảnh)
- [ ] Tạo CelebrationAudioPlayer (3 bản Rich, nghe thử)
- [ ] Tạo GiftCelebrationModal (card đầy đủ + theme + nhạc + hiệu ứng)
- [ ] Hiệu ứng pháo hoa + coin bay
- [ ] Nút: lưu ảnh, chia sẻ, copy tx, đăng profile, gửi tin nhắn

### 🔲 Phần 4: Hành Vi Tự Động
- [ ] Auto post lên Profile (community_posts) với Celebration Card
- [ ] Auto gửi tin nhắn (direct_messages) cho người nhận
- [ ] Thêm "Xem Card Chúc Mừng" trong lịch sử giao dịch

### 🔲 Phần 5: Database Migration
- [ ] Thêm cột celebration_theme, celebration_background vào coin_gifts

### 🔲 Phần 6: Dọn Dẹp
- [ ] Xóa toàn bộ GIF ngẫu nhiên
- [ ] Đảm bảo mọi text tiếng Việt có dấu
