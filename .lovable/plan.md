

## Cập nhật số lượng gợi ý theo từng loại token

### Mục tiêu
Thay đổi các nút gợi ý nhanh (quick amounts) trong dialog Tặng Thưởng để phù hợp với giá trị thực tế của từng loại token, thay vì dùng chung 4 mức [10, 50, 100, 500] cho tất cả.

### Bảng gợi ý mới

| Token | Nút gợi ý |
|---|---|
| Camly Coin (Nội bộ) | 10.000 / 50.000 / 100.000 / 500.000 / 1.000.000 |
| Camly Coin (Web3) | 10.000 / 50.000 / 100.000 / 500.000 / 1.000.000 |
| FUN Money | 10 / 50 / 100 / 500 / 1.000 |
| BNB | 0,01 / 0,05 / 0,1 / 0,5 |
| USDT | 5 / 10 / 50 / 100 |
| Bitcoin (BTC) | 0,001 / 0,005 / 0,01 / 0,05 |

### Chi tiết kỹ thuật

**File: `src/components/gifts/GiftCoinDialog.tsx`**

1. Thay hằng số `QUICK_AMOUNTS = [10, 50, 100, 500]` bằng một object map theo token type:

```text
QUICK_AMOUNTS_MAP: Record<SelectedToken, number[]> = {
  internal:    [10000, 50000, 100000, 500000, 1000000],
  camly_web3:  [10000, 50000, 100000, 500000, 1000000],
  fun_money:   [10, 50, 100, 500, 1000],
  bnb:         [0.01, 0.05, 0.1, 0.5],
  usdt:        [5, 10, 50, 100],
  bitcoin:     [0.001, 0.005, 0.01, 0.05],
}
```

2. Cập nhật phần render nút gợi ý (dòng ~461) thay `QUICK_AMOUNTS` thành `QUICK_AMOUNTS_MAP[activeTab]` (biến `activeTab` chính là `SelectedToken` hiện tại).

3. Chỉ sửa 1 file duy nhất.
