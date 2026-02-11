

# Kế Hoạch Thiết Kế Lại Trang Lịch Sử Giao Dịch

## Tổng Quan

Thay thế toàn bộ nội dung trang `/activity-history` (hiện đang hiển thị lịch sử chat) thành trang **Lịch Sử Giao Dịch** công khai theo phong cách Angel AI Gold, tương tự giao diện trong hình tham khảo.

## Nội Dung Trang Mới

### 1. Header trang
- Biểu tượng globe + tiêu đề "Lịch Sử Giao Dịch"
- Phụ đề: "Minh bạch - Truy vết Blockchain - Chuẩn Web3"
- Nút "Làm mới" và "Xuất dữ liệu" góc phải
- Màu sắc chuẩn Gold 11 (#b8860b, #daa520, #ffd700)

### 2. Dải thống kê (5 thẻ)
- Tổng giao dịch | Tổng giá trị | Hôm nay | Thành công | Chờ xử lý
- Mỗi thẻ có icon riêng + viền gold nhẹ

### 3. Bộ lọc và Tìm kiếm
- Thanh tìm kiếm: "Tìm theo tên, địa chỉ ví, mã giao dịch (tx hash)..."
- 4 dropdown: Tất cả token | Tất cả loại | Tất cả thời gian | Tất cả trạng thái
- Toggle: "Chỉ onchain"

### 4. Danh sách giao dịch
- Lấy dữ liệu từ `coin_gifts` và `project_donations` (công khai, ai cũng xem được)
- Mỗi dòng hiển thị: Avatar + tên người gửi -> Avatar + tên người nhận
- Ví rút gọn + nút COPY + nút mở explorer
- Badge loại (Tặng thưởng / Donate) + Badge Onchain
- Thời gian + Chain (BSC) + TX Hash
- Nút "Xem Card" cho giao dịch có celebration data
- Số lượng + token (USDT, CAMLY, BNB...)

## Chi Tiết Kỹ Thuật

### File cần sửa:
1. **`src/pages/ActivityHistory.tsx`** - Viết lại toàn bộ thành trang Lịch Sử Giao Dịch công khai. Tái sử dụng logic fetch từ `GiftTransactionHistory.tsx` và style từ `TransactionHistorySection.tsx`, nhưng thiết kế lại theo layout hình tham khảo với:
   - Header có gradient gold
   - 5 stat cards ngang
   - Filter bar với dropdown và toggle
   - Transaction list với avatar, wallet, badges, tx hash

### Dữ liệu:
- Query `coin_gifts` (gifts) và `project_donations` (donations) - giống `GiftTransactionHistory`
- Lookup profiles để hiển thị avatar và tên
- Thêm bộ lọc: token type, loại giao dịch, thời gian, trạng thái, chỉ onchain
- Xuất CSV với tất cả dữ liệu đã lọc

### Màu sắc Angel AI Gold:
- Viền và accent: `#daa520`, `#b8860b`
- Background nhẹ: `from-[#ffd700]/5`
- Text đậm: `text-[#3D2800]`, `text-[#b8860b]`
- Badge: gradient gold cho onchain, rose cho donate

### Responsive:
- Desktop: stat cards 5 cột, filter bar ngang
- Mobile: stat cards 2-3 cột, filter xếp dọc

