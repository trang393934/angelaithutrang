

# Reset 2 lệnh chuyển Lì xì theo quy trình mới

## Tình trạng hiện tại

| User | Balance hiện tại | Lifetime Earned | Lì xì đã cộng | Claim |
|------|-----------------|-----------------|----------------|-------|
| Angel Ai Van | 1,121,997 | 1,233,997 | 1,073,000 | Co (pending) |
| ANGEL ANH NGUYET | 628,400 | 640,500 | 621,000 | Chua |

Vấn đề: Camly Coin từ Lì xì Tết đã được cộng thẳng vào `balance` và `lifetime_earned`, chưa đi theo quy trình claim mới (user nhấn CLAIM -> admin chuyển on-chain).

## Các bước thực hiện

### Bước 1: Trừ số Lì xì khỏi balance và lifetime_earned

Trừ lại số Camly Coin Lì xì đã cộng nhầm vào `camly_coin_balances`:

- **Angel Ai Van**: balance 1,121,997 -> 48,997 | lifetime_earned 1,233,997 -> 160,997
- **ANGEL ANH NGUYET**: balance 628,400 -> 7,400 | lifetime_earned 640,500 -> 19,500

Giao dịch `camly_coin_transactions` vẫn giữ nguyên làm lịch sử kiểm toán (dùng để hiển thị riêng trong mục "Nhận thưởng Lì xì Tết").

### Bước 2: Reset notification Lì xì

Đặt lại `is_read = false` cho 2 notification `tet_lixi_reward` để user thấy lại popup chúc mừng và có thể nhấn CLAIM theo quy trình mới.

### Bước 3: Xóa lixi_claims cũ

Xóa record claim hiện tại của Angel Ai Van (đã tạo theo quy trình mới nhưng dựa trên dữ liệu cũ) để user claim lại sạch sẽ.

## Kết quả sau reset

| User | Balance moi | Lifetime Earned moi | Li xi (rieng) | Notification | Claim |
|------|------------|--------------------|--------------:|--------------|-------|
| Angel Ai Van | 48,997 | 160,997 | 1,073,000 | Popup hien lai | Cho claim lai |
| ANGEL ANH NGUYET | 7,400 | 19,500 | 621,000 | Popup hien lai | Cho claim lai |

Profile se hien thi:
- **So du hien tai**: chi gom Camly tu hoat dong tu nhien (chat, bai viet, nhat ky...)
- **Tong tich luy**: chi tinh tu hoat dong dong gop (da tru Li xi)
- **Nhan thuong Li xi Tet**: hien thi rieng biet so Camly Coin tu chuong trinh Li xi

## Quy trinh moi sau reset

```text
User mo app -> Thay popup Li xi
      |
      v
User nhan CLAIM -> Tao lixi_claims (pending)
      |
      v
Admin thay claim tren /admin/tet-reward
      |
      v
Admin chuyen CAMLY token on-chain tu vi Treasury
      |
      v
Cap nhat lixi_claims -> status: completed + tx_hash
```

## Chi tiet ky thuat

4 lenh SQL can thuc hien (chi la data update, khong thay doi schema):

1. UPDATE `camly_coin_balances` SET balance = balance - 1073000, lifetime_earned = lifetime_earned - 1073000 WHERE user_id = Angel Ai Van
2. UPDATE `camly_coin_balances` SET balance = balance - 621000, lifetime_earned = lifetime_earned - 621000 WHERE user_id = ANGEL ANH NGUYET
3. UPDATE `notifications` SET is_read = false, read_at = NULL WHERE type = 'tet_lixi_reward'
4. DELETE FROM `lixi_claims` WHERE user_id = Angel Ai Van

Khong can sua code, chi cap nhat du lieu.

