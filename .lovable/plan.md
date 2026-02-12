
## Nâng cấp Bộ lọc & Hiển thị Token trong Lịch sử Giao dịch

### Mục tiêu
1. Thêm 2 dropdown mới: **"Tất cả token"** và **"Tất cả trạng thái"** vào thanh bộ lọc
2. Hiển thị đúng **logo + tên token** thực tế (CAMLY, USDT, FUN, BNB, BTC) thay vì luôn hiển thị "CAMLY"
3. Thiết kế bộ lọc theo phong cách Angel AI vàng ánh kim sang trọng với tiêu đề "Bộ lọc & Tìm kiếm"

### Phân tích dữ liệu thực tế
Dữ liệu `gift_type` trong database: `internal`, `web3`, `web3_CAMLY`, `web3_FUN`, `web3_USDT` (tương lai có thể thêm `web3_BNB`, `web3_BTC`).

### Các thay đổi chi tiết

**File duy nhất: `src/pages/ActivityHistory.tsx`**

**A. Thêm bộ lọc mới (filter state + logic)**

1. Thêm state `tokenFilter` (giá trị: `"all"`, `"camly"`, `"fun"`, `"usdt"`, `"bnb"`, `"btc"`)
2. Thêm state `statusFilter` (giá trị: `"all"`, `"confirmed"`, `"pending"`)
3. Cập nhật hàm `filtered` (useMemo) thêm điều kiện lọc theo token và trạng thái

**B. Thiết kế lại khung bộ lọc**

Khung filter section sẽ được nâng cấp:
- Tiêu đề "Bộ lọc & Tìm kiếm" với icon Clock, màu vàng ánh kim
- Thanh tìm kiếm với viền vàng và icon vàng
- 4 dropdown ngang hàng: Token | Loại | Thời gian | Trạng thái
- Toggle "Chỉ onchain" bên phải
- Tất cả dropdown viền vàng, nền ấm, text vàng đậm

Cụ thể 4 dropdown:

| Dropdown | Giá trị |
|---|---|
| Tất cả token | Tất cả token / CAMLY / FUN Money / USDT / BNB / BTC |
| Tất cả loại | Tất cả loại / Tặng thưởng / Donate |
| Tất cả thời gian | Tất cả / Hôm nay / 7 ngày / 30 ngày |
| Tất cả trạng thái | Tất cả / Đã xác nhận / Đang chờ |

**C. Hiển thị đúng token trong TransactionItem**

Hiện tại luôn hiển thị logo CAMLY + text "CAMLY". Sẽ thêm logic nhận diện token từ `gift_type`:

```text
Mapping gift_type -> Token hiển thị:
  "internal" / null / "web3" / "web3_CAMLY"  -> logo CAMLY, text "CAMLY"
  "web3_FUN"                                  -> logo FUN Money, text "FUN"
  "web3_USDT"                                 -> logo USDT, text "USDT"
  "web3_BNB"                                  -> logo BNB, text "BNB"
  "web3_BTC"                                  -> logo BTC, text "BTC"
```

- Import thêm logo từ `TokenSelector.tsx` (funMoneyLogo, bitcoinLogo, USDT_LOGO, BNB_LOGO)
- Tạo hàm `getTokenDisplay(gift_type)` trả về `{ logo, symbol }`
- Cập nhật dòng hiển thị amount trong `TransactionItem` sử dụng logo + symbol đúng

**D. Styling Golden Angel AI**

- Khung filter: `bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80`, viền `border-amber-200/40`
- Tiêu đề: Icon Clock màu vàng, text `text-amber-800 font-bold`
- Dropdown trigger: `border-amber-300/50`, `text-amber-900`
- Dropdown content: `bg-white border-amber-200` (không trong suốt, z-index cao)
- Toggle switch: tông vàng khi bật

### Chi tiết kỹ thuật - Logic lọc token

```text
tokenFilter logic trong useMemo filtered:
  "camly"  -> gift_type IN [null, "internal", "web3", "web3_CAMLY"]
  "fun"    -> gift_type === "web3_FUN"
  "usdt"   -> gift_type === "web3_USDT"
  "bnb"    -> gift_type === "web3_BNB"
  "btc"    -> gift_type === "web3_BTC"
  "all"    -> không lọc

statusFilter logic:
  "confirmed" -> tx_hash !== null (đã có hash on-chain)
  "pending"   -> tx_hash === null
  "all"       -> không lọc
```

### Files thay đổi
1. `src/pages/ActivityHistory.tsx` - Thêm filters, cập nhật hiển thị token, nâng cấp UI bộ lọc
