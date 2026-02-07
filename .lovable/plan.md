
# Cập nhật thuật ngữ và hiển thị số trong hệ thống Tặng Thưởng

## Tổng quan

Chỉnh sửa toàn bộ giao diện để thống nhất thuật ngữ theo yêu cầu: thay "Tip/Mẹo" bằng "Thưởng/Tặng", đổi "Lời khuyên" thành "Tin nhắn", cập nhật popup chúc mừng, và đảm bảo số lớn hiển thị rõ ràng với dấu phân cách hàng nghìn.

---

## 1. Thay đổi thuật ngữ

### Tiếng Việt
- "Tip" / "Mẹo" --> "Thưởng" hoặc "Tặng" (tùy ngữ cảnh)
- "Lời khuyên đi kèm" --> "Tin nhắn"
- "Popup Ăn Mừng" --> "Chúc mừng bạn đã chuyển thành công!"

### Tiếng Anh
- "Tip" --> "Reward" hoặc "Donate" (tùy ngữ cảnh)
- "Accompanying advice" --> "Message"

---

## 2. Popup chúc mừng - WithdrawalCelebration.tsx

Thay đổi tiêu đề và nội dung:
- Heading: "Chuc mung!" --> "Chuc mung ban da chuyen thanh cong!"
- Duy trì confetti + hiệu ứng coin rơi hiện tại
- Giữ popup cho đến khi user bấm đóng (hiện đang auto-close sau 8 giây --> bỏ auto-close)

---

## 3. Hiển thị số lớn rõ ràng

Đảm bảo tất cả các con số sử dụng `toLocaleString()` hoặc `Intl.NumberFormat` để hiển thị dấu phân cách hàng nghìn:
- VD: 1000000 --> 1.000.000 (tiếng Việt) hoặc 1,000,000 (tiếng Anh)

Các vị trí cần kiểm tra và cập nhật:
- `GiftCoinDialog.tsx`: balance, amount hiển thị
- `Web3TransactionHistory.tsx`: totalAmount, tx amount
- `GiftTransactionHistory.tsx`: totalGiftAmount, totalDonationAmount
- `WithdrawalCelebration.tsx`: (đã dùng `Intl.NumberFormat('vi-VN')` -- OK)

---

## Chi tiết kỹ thuật

### Files cần sửa:

**1. `src/components/WithdrawalCelebration.tsx`**
- Dong 202-207: Đổi heading "Chuc mung!" thanh "Chuc mung ban da chuyen thanh cong!"
- Dong 77-90: Bỏ auto-close timer 8 giây, để popup giữ nguyên cho đến khi user bấm đóng

**2. `src/components/gifts/GiftCoinDialog.tsx`**
- Dong 673-675: Đổi "Giao dich thanh cong tren blockchain!" thành "Chuc mung ban da chuyen thanh cong!"
- Dong 687: Đổi "Da sao chep TX Hash!" cho phù hợp

**3. `src/components/community/GiftTransactionHistory.tsx`**
- Dong 284: Đổi "Lich Su Giao Dich Qua" --> "Lich Su Thuong va Tang"
- Dong 307: Đổi "Tang qua" --> "Thuong"
- Dong 314: Giữ "Donate du an" hoặc đổi thành "Tang du an"
- Dong 327: "Chua co giao dich qua nao" --> "Chua co giao dich thuong/tang nao"
- Dong 361: "Lich Su Giao Dich Qua Tang" --> "Lich Su Thuong & Tang"
- Dong 388: Tab "Tang" --> "Thuong"

**4. `src/components/community/Web3TransactionHistory.tsx`**
- Dong 97: "Tang Qua" --> "Thuong" cho gift type
- Dong 291: "Giao Dich Web3 On-Chain" --> giữ nguyên (đã đúng)
- Dong 334-336: "Chua co giao dich Web3 nao" + description cập nhật thuật ngữ

**5. `src/translations/vi.ts`**
- "gift.title": "Tang Camly Coin" --> "Thuong Camly Coin"
- "gift.message": "Loi nhan (tuy chon)" --> "Tin nhan (tuy chon)" 
- "gift.messagePlaceholder": cập nhật
- "gift.confirm": "Xac nhan tang" --> "Xac nhan thuong"
- "gift.honorTitle": "Bang Vinh Danh Tang Qua" --> "Bang Vinh Danh Thuong & Tang"
- "gift.topGivers": "Top Nguoi Tang" --> "Top Nguoi Thuong"
- Các key khác liên quan

**6. `src/translations/en.ts`**
- "gift.title": "Gift Camly Coin" --> "Reward Camly Coin"
- "gift.confirm": "Confirm Gift" --> "Confirm Reward"
- "gift.message": "Message (optional)" --> giữ nguyên (đã đúng)
- "gift.honorTitle": "Gift Honor Board" --> "Reward & Donate Honor Board"
- "gift.topGivers": "Top Givers" --> "Top Rewards"
- Các key donate giữ nguyên "Donate" (đã đúng)

**7. `src/components/EarlyAdopterRewardPopup.tsx`**
- Không cần thay đổi (đã dùng "Reward" đúng cách)

### Thứ tự thực hiện:
1. Cập nhật translation files (vi.ts, en.ts) -- thay đổi thuật ngữ
2. Cập nhật WithdrawalCelebration -- heading + bỏ auto-close
3. Cập nhật GiftCoinDialog -- thông báo thành công
4. Cập nhật GiftTransactionHistory -- header, tabs, labels
5. Cập nhật Web3TransactionHistory -- labels
6. Kiểm tra tất cả số lớn đều có dấu phân cách
