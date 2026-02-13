

# Chỉnh sửa Popup Lì Xì theo đúng mẫu thiết kế

## Phân tích sự khác biệt giữa popup hiện tại và mẫu

Sau khi so sánh screenshot hiện tại với hình mẫu, con xác định các điểm cần sửa:

1. **Nút CLAIM và "Thêm thông tin" hiện nằm NGOÀI khung giấy cổ** -- trong mẫu chúng nằm BÊN TRONG khung giấy cổ (parchment)
2. **Dòng "Áp dụng đến 08/02/2026" cũng nằm ngoài** -- trong mẫu nằm bên trong khung, dưới 2 nút
3. **Nút CLAIM có emoji 🧧** -- trong mẫu chỉ có chữ "CLAIM" không có emoji
4. **Nút "Thêm thông tin" có 👉 và icon ExternalLink** -- trong mẫu chỉ có icon tay trỏ 👆 ở cuối, không có 👉
5. **Nội dung phần thưởng thứ 2 căn trái** -- trong mẫu căn giữa: "Chương trình Lì xì Tết tổng giá trị" rồi số tiền lớn ở giữa
6. **Font chữ nội dung phần thưởng** cần lớn hơn, rõ ràng hơn

## Chi tiết thay đổi

### File: `src/components/UserLiXiCelebrationPopup.tsx`

1. **Di chuyển 2 nút hành động VÀO TRONG khung giấy cổ (parchment)**: Đưa block nút CLAIM + "Thêm thông tin" từ ngoài vào bên trong `motion.div` của khung giấy cổ, nằm dưới phần chi tiết phần thưởng

2. **Di chuyển dòng thời hạn vào trong khung giấy cổ**: Đưa "Áp dụng đến 08/02/2026" vào trong parchment, dưới 2 nút

3. **Nút CLAIM**: Bỏ emoji 🧧, chỉ giữ chữ "CLAIM"

4. **Nút "Thêm thông tin"**: Thay 👉 và icon ExternalLink bằng emoji tay trỏ 👆 ở cuối chữ. Bỏ icon ExternalLink

5. **Phần thưởng thứ 2 (26 tỷ VND)**: Căn giữa text thay vì căn trái. Số tiền "26,000,000,000 VND" hiển thị lớn và đậm ở giữa

6. **Phần thưởng thứ 1**: Giữ format "Bạn nhận được X Camly Coin, được quy đổi dựa trên Y FUN Money." nhưng gộp thành 2 dòng gọn hơn theo mẫu

7. **Bỏ emoji ⏰** khỏi dòng thời hạn, giữ text đơn giản như mẫu

## Phần kỹ thuật
- Chỉ thay đổi 1 file: `UserLiXiCelebrationPopup.tsx`
- Thay đổi thuần style/layout, không ảnh hưởng logic claim
- Giữ nguyên chế độ preview (`?preview_lixi=true`) để kiểm tra
- Không thêm dependency mới

