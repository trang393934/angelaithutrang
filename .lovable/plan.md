

# Cập Nhật Lịch Sử Giao Dịch — Chỉ Hiển Thị Giao Dịch Của Người Dùng

## Vấn Đề Hiện Tại

Component `GiftTransactionHistory` trên trang Community đang hiển thị **tất cả** giao dịch của **mọi người dùng** (fetch toàn bộ `coin_gifts` và `project_donations` không lọc theo user). Người dùng muốn chỉ thấy giao dịch **liên quan đến chính họ**.

## Giải Pháp

Cập nhật `GiftTransactionHistory` để:
1. Thêm `useAuth` để lấy user hiện tại
2. Lọc `coin_gifts` theo `sender_id = user.id` HOẶC `receiver_id = user.id`
3. Lọc `project_donations` theo `donor_id = user.id`
4. Thêm hiển thị hướng giao dịch (Gửi/Nhận) cho rõ ràng
5. Nếu chưa đăng nhập, hiển thị thông báo yêu cầu đăng nhập

## Chi Tiết Kỹ Thuật

### File thay đổi: `src/components/community/GiftTransactionHistory.tsx`

**1. Thêm import và auth:**
- Import `useAuth` từ `@/hooks/useAuth`
- Lấy `user` từ `useAuth()`

**2. Cập nhật `fetchTransactions`:**

Thay vì fetch toàn bộ:
```
// Hiện tại (SAI - lấy tất cả)
.from("coin_gifts").select(...).order(...).limit(100)
```

Sửa thành 2 query riêng cho gifts (gửi + nhận):
```
// Query gifts user GỬI
.from("coin_gifts").select(...)
.eq("sender_id", user.id)

// Query gifts user NHẬN
.from("coin_gifts").select(...)
.eq("receiver_id", user.id)

// Query donations của user
.from("project_donations").select(...)
.eq("donor_id", user.id)
```

**3. Cập nhật TransactionRow:**
- Thêm prop `currentUserId` để xác định hướng giao dịch
- Hiển thị icon mũi tên lên (gửi) hoặc mũi tên xuống (nhận) tùy theo hướng
- Với gift: nếu sender = user thì hiển thị "Bạn -> [receiver]", ngược lại "[sender] -> Bạn"

**4. Cập nhật header và stats:**
- Đổi tiêu đề thành "Giao Dịch Của Bạn" thay vì "Lịch Sử Thưởng & Tặng" chung
- Stats tách rõ: Đã gửi vs Đã nhận vs Đã donate

**5. Trường hợp chưa đăng nhập:**
- Hiển thị thông báo "Đăng nhập để xem lịch sử giao dịch"

### Tổng kết
| File | Thay đổi |
|---|---|
| `src/components/community/GiftTransactionHistory.tsx` | Thêm useAuth, lọc theo user ID, cập nhật UI hướng giao dịch |

Chỉ thay đổi 1 file, không ảnh hưởng đến các component khác.

