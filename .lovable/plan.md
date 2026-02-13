

# Xây lại giao diện Popup Lì Xì 100% theo mẫu thiết kế

## Phân tích mẫu thiết kế

Hình mẫu thể hiện một thiệp Tết sang trọng với các yếu tố:

- **Nền vàng gradient** toàn popup (tông vàng kem/vàng ánh kim)
- **Cành hoa đào/hoa mai** trang trí ở 4 góc (hồng + vàng)
- **Đèn lồng đỏ** treo ở góc trái trên và phải trên
- **Bao lì xì đỏ** ở trung tâm phía trên (icon nhỏ, có đồng xu vàng bên trong)
- **Khung giấy cổ (parchment)** ở giữa với viền trang trí tinh tế
- **Tiêu đề** chữ nghiêng, serif: "Chúc mừng bạn đã nhận được Lì xì!"
- **2 khối thông tin** với icon quà (🎁) căn giữa
- **2 nút**: CLAIM (xanh lá đậm) + Thêm thông tin (viền, có icon tay 👆)
- **Dòng thời hạn** nhỏ phía dưới
- **Đồng Camly Coin** ở góc trái dưới

## Vấn đề hiện tại

Popup hiện đang dùng hình nền `lixi-popup-bg.jpg` làm background, nhưng phần nội dung đặt ở dưới (padding-top 52%) khiến bố cục không khớp mẫu. Cần xây lại toàn bộ bằng CSS/JSX thuần để kiểm soát chính xác từng thành phần.

## Kế hoạch thay đổi

### File: `src/components/UserLiXiCelebrationPopup.tsx`

Viết lại toàn bộ phần giao diện (giữ nguyên logic preview/claim):

1. **Nền chính**: Gradient vàng kim (`#d4a843` -> `#f5e6b8` -> `#c9953c`) thay vì dùng ảnh nền
2. **Trang trí góc**: Dùng CSS/SVG vẽ cành hoa đào (hồng) và hoa mai (vàng) ở 4 góc
3. **Đèn lồng**: Import component `Lantern` hiện có, đặt ở góc trái trên và phải trên
4. **Bao lì xì**: Vẽ bằng CSS (hình vuông bo tròn màu đỏ, đồng xu vàng ở giữa) đặt ở trung tâm trên
5. **Khung parchment**: Giữ nguyên style hiện tại (gradient kem, viền vàng, góc trang trí)
6. **Nội dung bên trong parchment**: Giữ nguyên tiêu đề, 2 khối thông tin, 2 nút, dòng thời hạn
7. **Đồng Camly Coin**: Import logo `camly-coin-new.png`, đặt ở góc trái dưới
8. **Cánh hoa rơi**: Thêm vài cánh hoa đào nhỏ rơi rải rác bằng CSS animation

### Chi tiet ky thuat

- Bỏ dependency vào file `lixi-popup-bg.jpg` -- thay bằng CSS gradient
- Import lại `Lantern` component cho đèn lồng
- Import `camly-coin-new.png` cho đồng coin góc dưới trái
- Tạo các SVG inline cho hoa đào, hoa mai trang trí góc
- Giữ nguyên toàn bộ logic: preview mode, claim flow, effects
- Giữ nguyên `FireworkBurst` và `LiXiEffects` cho hiệu ứng
- Responsive: trên mobile thu nhỏ font, padding, ẩn bớt trang trí góc
- Chỉ sửa 1 file: `UserLiXiCelebrationPopup.tsx`
- Không thêm dependency mới

