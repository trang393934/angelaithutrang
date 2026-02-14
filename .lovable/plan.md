
# Fix Lịch Sử Giao Dịch — Thống Kê Chính Xác Theo Chế Độ Xem

## Van De

Trang "Lich Su Giao Dich" (/activity-history) dang tron lan so lieu ca nhan vao che do xem "Tat ca":
- "Tong gui: 19" va "Tong nhan: 4" la so giao dich CÁ NHÂN cua nguoi dung dang dang nhap, nhung hien thi trong tab "Tat ca" (toan he thong)
- Dung ra, khi o che do "Tat ca", cac so lieu phai phan anh TOAN BO giao dich cua he sinh thai

## Giai Phap

### File thay doi: `src/pages/ActivityHistory.tsx`

**Sua logic tinh stats (dong 501-513):**

Hien tai:
```
sentCount = user ? data.filter(tx => tx.sender_id === user.id).length : ...
receivedCount = user ? data.filter(tx => tx.receiver_id === user.id).length : ...
```

Sua thanh phan biet theo `viewMode`:
- **Che do "Tat ca"**: 
  - "Tong gui" = tong so gift transactions (type === "gift") = 218
  - "Tong nhan" = tong so donations (type === "donation") = 61
  - Doi nhan "Tong nhan" thanh "Donate" cho ro nghia
- **Che do "Ca nhan"**:
  - "Tong gui" = giao dich ma user la sender
  - "Tong nhan" = giao dich ma user la receiver

Cu the:
```typescript
const sentCount = viewMode === "personal" && user
  ? data.filter(tx => tx.sender_id === user.id).length
  : data.filter(tx => tx.type === "gift").length;

const receivedCount = viewMode === "personal" && user
  ? data.filter(tx => tx.receiver_id === user.id).length
  : data.filter(tx => tx.type === "donation").length;
```

**Cap nhat labels cho stat cards (dong 614-621):**

Khi o che do "Tat ca":
- "Tong gui" doi thanh "Tang thuong" (so luong gift)
- "Tong nhan" doi thanh "Donate" (so luong donation)

Khi o che do "Ca nhan":
- Giu nguyen "Tong gui" va "Tong nhan"

### Tom tat

| Thay doi | Chi tiet |
|---|---|
| Stats logic | Phan biet viewMode khi tinh sentCount/receivedCount |
| Stat card labels | Hien thi dung nhan theo che do xem |
| File | `src/pages/ActivityHistory.tsx` — chi 1 file |

Sau khi fix, tab "Tat ca" se hien thi: Tang thuong: 218, Donate: 61 thay vi so ca nhan 19/4.
