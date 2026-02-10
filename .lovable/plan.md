

# Tạo mục Lịch Sử Giao Dịch & Thông Tin Tài Sản Ví trong Trang Cá Nhân

Thêm một component mới hiển thị toàn bộ lịch sử giao dịch cá nhân (chỉ user đó thấy) với 4 tab, thông tin tài sản ví, bộ lọc ngày, và tổng hợp thống kê.

---

## Giao diện

### Phần 1: Thông Tin Tài Sản Ví (chỉ cá nhân thấy)
- So du Camly Coin hien tai
- So du FUN Money (on-chain, neu co)
- Dia chi vi BSC (rut gon)
- Tong da kiem duoc (lifetime_earned)
- Tong da rut

### Phan 2: Lich Su Giao Dich voi 4 Tab
- **Tat ca**: Gop tat ca giao dich tu 3 nguon
- **Noi bo**: Giao dich Camly Coin (camly_coin_transactions) - thuong, chat, bai viet, admin_adjustment...
- **Web3**: Giao dich on-chain co tx_hash (coin_gifts + project_donations co tx_hash)
- **FUN Money**: Hanh dong PPLP va mint requests (pplp_actions + pplp_scores)

### Phan 3: Thong ke tong hop
- Tong luot chuyen (sent)
- Tong luot nhan (received)
- Tong so luong token
- Bo loc ngay (tu ngay - den ngay)

---

## Chi tiet ky thuat

### File moi: `src/components/profile/TransactionHistorySection.tsx`
Component chinh chua toan bo logic, bao gom:

1. **useEffect** fetch du lieu tu 4 bang:
   - `camly_coin_transactions` (loc theo user_id) - giao dich noi bo
   - `coin_gifts` (loc theo sender_id HOAC receiver_id = user) - thuong/tang
   - `coin_withdrawals` (loc theo user_id) - rut tien
   - `pplp_actions` + `pplp_scores` (loc theo actor_id) - FUN Money

2. **Wallet Asset Card** (chi hien khi la profile cua minh):
   - Lay tu `camly_coin_balances` (balance, lifetime_earned)
   - Lay tu `user_wallet_addresses` (wallet_address)
   - Lay tu `coin_withdrawals` tong da rut thanh cong

3. **Bo loc ngay**: 2 input date (tu ngay, den ngay) + nut "Loc"

4. **Tabs**: Dung Radix Tabs voi 4 tab: Tat ca / Noi bo / Web3 / FUN Money

5. **Thong ke**: Tong luot chuyen, nhan, tong so luong cho tung tab

6. **ScrollArea** de hien danh sach giao dich voi phan trang (hien 20 ban ghi, nut "Xem them")

### File sua: `src/pages/Profile.tsx`
- Import va render `TransactionHistorySection` sau card "Lich Su Hoat Dong" (dong 991)
- Truyen `userId={user.id}` de component biet fetch du lieu cua ai
- Component chi render khi user dang xem profile cua chinh minh (da dam bao vi trang Profile yeu cau dang nhap)

### Bao mat
- Component chi hien trong trang `/profile` (yeu cau dang nhap)
- Query chi loc theo `user_id` cua nguoi dang dang nhap
- RLS da co san tren cac bang (camly_coin_transactions, coin_gifts, etc.)
- Khong can thay doi database

### Khong can thay doi database
- Tat ca cac bang da co san va co RLS
- Chi doc du lieu, khong ghi

