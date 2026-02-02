
# Kế Hoạch: Hệ Thống Tặng Quà CamlyCoin

## Tổng Quan
Xây dựng tính năng cho phép người dùng tặng CamlyCoin cho nhau và donate cho dự án Angel AI, kèm theo các bảng vinh danh riêng biệt trên trang Cộng đồng.

---

## Phần 1: Database Schema

### 1.1 Bảng `coin_gifts` (Tặng quà giữa người dùng)
```sql
CREATE TABLE public.coin_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 1.2 Bảng `project_donations` (Donate cho dự án)
```sql
CREATE TABLE public.project_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 1.3 Thêm loại giao dịch mới
```sql
ALTER TYPE coin_transaction_type ADD VALUE 'gift_sent';
ALTER TYPE coin_transaction_type ADD VALUE 'gift_received';
ALTER TYPE coin_transaction_type ADD VALUE 'project_donation';
```

### 1.4 RLS Policies
- `coin_gifts`: User có thể xem quà mình gửi/nhận, tạo quà với sender_id = auth.uid()
- `project_donations`: User có thể xem donate của mình, tạo donate với donor_id = auth.uid()
- Cả 2 bảng cho phép SELECT công khai để hiển thị bảng vinh danh

---

## Phần 2: Backend Edge Functions

### 2.1 `process-coin-gift/index.ts`
**Chức năng:**
- Xác thực JWT, lấy sender_id từ token
- Nhận `receiver_id`, `amount`, `message` từ body
- Kiểm tra:
  - Sender != Receiver
  - Số dư sender >= amount
  - Amount > 0 (có thể đặt minimum 100 coin)
- Thực hiện giao dịch atomic:
  1. Trừ số dư sender (transaction_type: 'gift_sent')
  2. Cộng số dư receiver (transaction_type: 'gift_received')
  3. Insert vào `coin_gifts`
- Gửi thông báo cho receiver qua `healing_messages`

### 2.2 `process-project-donation/index.ts`
**Chức năng:**
- Xác thực JWT, lấy donor_id từ token
- Nhận `amount`, `message` từ body
- Kiểm tra số dư donor >= amount
- Thực hiện giao dịch:
  1. Trừ số dư donor (transaction_type: 'project_donation')
  2. Insert vào `project_donations`
  3. (Tùy chọn) Gọi Edge Function để chuyển token thật về ví dự án

---

## Phần 3: Frontend Components

### 3.1 `GiftCoinDialog.tsx`
**Giao diện:**
- Modal tặng coin với:
  - Ô tìm kiếm user (autocomplete từ profiles)
  - Input số lượng coin
  - Textarea lời nhắn (optional)
  - Hiển thị số dư hiện tại
  - Nút xác nhận với animation confetti

### 3.2 `DonateProjectDialog.tsx`
**Giao diện:**
- Modal donate cho dự án với:
  - Logo Angel AI + thông điệp cảm ơn
  - Input số lượng coin
  - Textarea lời nhắn (optional)
  - Hiển thị số dư hiện tại
  - Nút xác nhận

### 3.3 `GiftHonorBoard.tsx` (Bảng vinh danh tặng quà)
**Hiển thị:**
- Top 5 người tặng nhiều nhất (tổng amount)
- Top 5 người nhận nhiều nhất
- Thống kê tổng quà đã tặng trong cộng đồng
- Thiết kế phong cách vàng kim như HonorBoard hiện tại

### 3.4 `DonationHonorBoard.tsx` (Bảng vinh danh donate)
**Hiển thị:**
- Top 10 người donate nhiều nhất cho dự án
- Tổng số coin đã donate
- Thiết kế đặc biệt với biểu tượng tim/ánh sáng

### 3.5 Hook `useCoinGifts.ts`
- Fetch lịch sử tặng/nhận
- Realtime subscription cho cập nhật
- Function `sendGift(receiverId, amount, message)`
- Function `donateToProject(amount, message)`

---

## Phần 4: Tích Hợp UI

### 4.1 Trang Community (Right Sidebar)
Thêm 2 card mới vào sidebar:
```
1. HonorBoard (có sẵn)
2. GiftHonorBoard (MỚI) - Bảng vinh danh tặng quà
3. DonationHonorBoard (MỚI) - Bảng vinh danh donate
4. CommunityGuidelinesCard
5. CirclesSidebar
...
```

### 4.2 Nút Tặng Quà
**Vị trí đặt nút:**
- Trên UserProfile page (`/user/:userId`) - Nút "Tặng Camly Coin"
- Trong PostCard - Menu dropdown có option "Tặng coin cho tác giả"
- Trong header của trang Earn hoặc Profile

### 4.3 Nút Donate Dự Án
**Vị trí đặt nút:**
- Footer của trang chính
- Sidebar trái (FunEcosystemSidebar)
- Trang About Angel AI

---

## Phần 5: Translations (12 ngôn ngữ)

```typescript
// Thêm vào các file translation
"gift.title": "Tặng Camly Coin",
"gift.searchUser": "Tìm người nhận",
"gift.amount": "Số lượng",
"gift.message": "Lời nhắn (tùy chọn)",
"gift.confirm": "Xác nhận tặng",
"gift.success": "Đã tặng {amount} Camly Coin cho {name}!",
"gift.received": "Bạn nhận được {amount} Camly Coin từ {name}!",
"gift.honorTitle": "Bảng Vinh Danh Tặng Quà",
"gift.topGivers": "Top Người Tặng",
"gift.topReceivers": "Top Người Nhận",

"donate.title": "Donate cho Angel AI",
"donate.description": "Ủng hộ dự án phát triển",
"donate.confirm": "Xác nhận donate",
"donate.success": "Cảm ơn bạn đã donate {amount} Camly Coin!",
"donate.honorTitle": "Bảng Vinh Danh Mạnh Thường Quân",
"donate.totalDonated": "Tổng đã donate",
```

---

## Phần 6: Flow Chi Tiết

### Flow Tặng Quà User-to-User
```text
1. User A click "Tặng Camly Coin" trên profile User B
2. Dialog mở ra với User B đã được chọn sẵn
3. User A nhập số lượng + lời nhắn
4. Gọi Edge Function process-coin-gift
5. Backend xử lý atomic transaction
6. Cả 2 user đều thấy số dư cập nhật realtime
7. User B nhận notification
8. Bảng vinh danh cập nhật
```

### Flow Donate Dự Án
```text
1. User click "Donate cho Angel AI"
2. Dialog mở ra với thông tin dự án
3. User nhập số lượng + lời nhắn
4. Gọi Edge Function process-project-donation
5. Backend trừ số dư, ghi transaction
6. Hiển thị cảm ơn với animation
7. Bảng vinh danh mạnh thường quân cập nhật
```

---

## Phần 7: Bảo Mật & Validation

### Frontend
- Validate amount > 0 và <= balance
- Không cho tặng cho chính mình
- Rate limiting UI (debounce button)

### Backend (Edge Functions)
- JWT authentication bắt buộc
- Double-check balance trước khi trừ
- Atomic transactions với service role
- Log tất cả giao dịch

### Database
- CHECK constraint: amount > 0
- RLS policies đảm bảo chỉ user có thể tạo gift/donate của mình
- Index trên sender_id, receiver_id, donor_id để query nhanh

---

## Tóm Tắt Công Việc

| Hạng mục | Files cần tạo/sửa |
|----------|-------------------|
| Database | 1 migration (2 tables + 3 enum values + RLS) |
| Edge Functions | 2 functions mới |
| Components | 4 components mới |
| Hooks | 1 hook mới |
| Trang Community | Sửa để thêm 2 honor boards |
| Translations | Sửa 12 files ngôn ngữ |
| UserProfile | Thêm nút tặng quà |
