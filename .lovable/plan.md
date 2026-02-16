

# Fix: Hien thi day du giao dich Web3 trong Lich su giao dich

## Nguyen nhan goc

Chuc nang dong bo BSCScan (`sync-bscscan-gifts`) co 2 loi khien nhieu giao dich on-chain khong duoc ghi nhan:

1. **Filter qua chat**: Chi tim user "active" dua tren `gift_type = 'web3'` (exact match), nhung cac giao dich moi dung `web3_CAMLY`, `web3_FUN`, `web3_USDT`... nen bi bo qua
2. **Chi scan CAMLY token**: Chi query BSCScan cho CAMLY contract, bo qua cac token khac (USDT, BNB, FUN...)

Ket qua: Nhieu giao dich on-chain thanh cong (nhu 142,202.6 CAMLY trong hinh) da xay ra nhung khong duoc luu vao database.

## Giai phap

### Thay doi 1: Fix sync-bscscan-gifts Edge Function

**File:** `supabase/functions/sync-bscscan-gifts/index.ts`

- Sua filter `gift_type = 'web3'` thanh `gift_type LIKE 'web3%'` de bao gom tat ca cac loai web3_CAMLY, web3_FUN, web3_USDT, v.v.
- Them scan cho cac token pho bien khac ngoai CAMLY:
  - USDT (BSC): `0x55d398326f99059fF775485246999027B3197955`
  - FUN Money contract (neu co)
- Scan TAT CA wallet da dang ky (262 wallets) thay vi chi "active users" - vi user co the nhan CAMLY tu nguoi ngoai he thong

### Thay doi 2: Mo rong ActivityHistory.tsx

**File:** `src/pages/ActivityHistory.tsx`

- Tang limit query `coin_gifts` tu 500 len 1000 de dam bao lay het tat ca giao dich (hien co 235, se tang sau khi sync)
- Khong can thay doi logic hien thi vi form hien tai da ho tro hien thi tat ca loai gift_type

## Chi tiet ky thuat

### sync-bscscan-gifts/index.ts

Dong 82 hien tai:
```text
.eq("gift_type", "web3");
```
Doi thanh:
```text
.like("gift_type", "web3%");
```

Dong 78-96 - Mo rong "active users" de bao gom tat ca user co wallet:
- Bo gioi han chi scan wallet cua "active users"
- Scan tat ca wallet trong `user_wallet_addresses` (262 wallets)
- Them rate limiting tot hon (delay 3s moi 3 requests thay vi 2s)

Them scan cho USDT token tren BSC:
```text
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
```
- Lap qua walletsToScan 2 lan: 1 lan cho CAMLY, 1 lan cho USDT
- Khi insert USDT transfer, set `gift_type = "web3_USDT"`

### ActivityHistory.tsx

Dong 402: Doi `.limit(500)` thanh `.limit(1000)` cho coin_gifts query.

## Ket qua mong doi

- Tat ca giao dich CAMLY on-chain (bao gom 142,202.6 CAMLY trong hinh) se duoc dong bo va hien thi
- Giao dich USDT on-chain cung se duoc dong bo
- Trang Lich su giao dich se hien thi day du: tang thuong (noi bo + Web3 multi-token), donate, rut thuong, li xi

