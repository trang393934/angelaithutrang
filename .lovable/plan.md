
# Nâng Cấp Flow "Tặng & Thưởng" Trên Angel AI

## Tiến độ

### ✅ Phần 1: Chuẩn Bị Tài Nguyên
- [x] Copy 3 file nhạc Rich vào `public/audio/`
- [x] Download logo Bitcoin vào `src/assets/bitcoin-logo.png`
- [x] Cập nhật TokenSelector: giữ nguyên giao diện, thêm Bitcoin, giữ BNB
- [x] Sửa GiftCoinDialog để tương thích với token mới

### ✅ Phần 2: Bước 1+2 - SendGiftModal (Flow 2 bước cho Internal Camly)
- [x] Step 1: Người gửi (avatar+tên+ví), Người nhận (tìm kiếm), mức nhanh (10/50/100/500), lời nhắn 200 ký tự
- [x] Step 2: Bảng xác nhận đầy đủ (người gửi/nhận, số lượng, lời nhắn, cảnh báo) + nút Quay lại/Xác nhận & Tặng
- [x] Web3 tabs (CAMLY Web3, FUN, BNB, USDT, Bitcoin) vẫn dùng CryptoTransferTab như cũ
- [x] Cập nhật TipCelebrationReceipt hỗ trợ token Bitcoin

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
