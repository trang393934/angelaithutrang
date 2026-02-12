

## Hiển thị Lịch sử Trả thưởng từ Angel AI Treasury

### Tổng quan
Tích hợp dữ liệu trả thưởng từ ví Treasury (withdrawals + lì xì Tết) vào trang Lịch sử Giao Dịch hiện tại (`/activity-history`), hiển thị Angel AI Treasury là người gửi với đầy đủ thông tin on-chain.

### Nguồn dữ liệu
- **`coin_withdrawals`** (status = 'completed'): Trả thưởng rút CAMLY
- **`lixi_claims`** (status = 'completed'): Lì xì Tết

### Thay đổi chi tiết

**File: `src/pages/ActivityHistory.tsx`**

1. **Mở rộng Transaction interface**: Thêm type mới `"treasury_reward" | "treasury_lixi"` vào union type.

2. **Fetch thêm 2 bảng dữ liệu** trong `fetchTransactions`:
   - Query `coin_withdrawals` (status = 'completed') lấy id, user_id, amount, wallet_address, tx_hash, created_at
   - Query `lixi_claims` (status = 'completed') lấy id, user_id, camly_amount, wallet_address, tx_hash, claimed_at
   - Gộp user_id vào danh sách để fetch profiles + wallets

3. **Map dữ liệu Treasury thành Transaction**:
   - `sender_id`: Cố định = "ANGEL_AI_TREASURY"
   - `sender_name`: "Angel AI Treasury"
   - `sender_avatar`: Logo dự án (`angel-ai-golden-logo.png`)
   - `sender_wallet`: Địa chỉ Treasury cố định (`0x416336c3b7ACAe89F47EAD2707412f20DA159ac8`)
   - `receiver_id/name/avatar/wallet`: Lấy từ profile + wallet user nhận
   - `tx_hash`: Từ dữ liệu giao dịch (link trực tiếp BscScan)
   - `type`: `"treasury_reward"` hoặc `"treasury_lixi"`

4. **Cập nhật TransactionItem** để hiển thị đặc biệt cho Treasury:
   - Nếu sender = Treasury: hiển thị badge "Verified" xanh lá kèm icon shield
   - Loại giao dịch hiển thị: "Trả thưởng" / "Lì xì" thay vì "Tặng thưởng"
   - Icon gradient xanh/tím thay vì vàng gold
   - Không link đến profile cho Treasury sender (vì không phải user)

5. **Cập nhật bộ lọc**: Thêm option "Trả thưởng" và "Lì xì" vào dropdown loại giao dịch.

6. **Cập nhật thống kê**: Thêm stat card "Treasury" đếm tổng giao dịch từ Treasury.

### Nguyên tắc bảo đảm
- Tất cả dữ liệu lấy trực tiếp từ database (không tạo dữ liệu ảo)
- Mỗi giao dịch có tx_hash link trực tiếp đến BscScan
- Dữ liệu chỉ đọc, không chỉnh sửa được từ frontend
- Realtime subscription cho cả 2 bảng mới

### Files thay đổi
1. `src/pages/ActivityHistory.tsx` - Tích hợp treasury data, UI, filters
