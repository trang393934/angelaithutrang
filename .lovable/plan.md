

# Nang cap Vi Blockchain day du cho ANGEL AI

## Tong quan

Hien tai, lich su giao dich chi hien thi cac giao dich noi bo (thuong, tang, donate trong he thong Angel AI). Yeu cau nay se nang cap de moi vi hoat dong nhu mot vi blockchain day du: hien thi tat ca giao dich on-chain (bao gom ca giao dich tu ben ngoai), dong bo so du thuc te, va phan loai ro nguon goc.

## Pham vi thay doi

### 1. Edge Function moi: `fetch-wallet-transactions`

Tao mot Edge Function moi goi BSCScan API de lay toan bo giao dich on-chain cua mot dia chi vi cu the:

- **Normal Transactions** (`action=txlist`): Giao dich BNB thuong (incoming/outgoing)
- **BEP-20 Token Transfers** (`action=tokentx`): Tat ca token transfers (CAMLY, USDT, FUN, v.v.)
- **Internal Transactions** (`action=txlistinternal`): Internal contract calls

Logic xu ly:
- Nhan `wallet_address` tu client
- Goi 3 API BSCScan song song
- Hop nhat va sap xep theo thoi gian
- Phan loai moi giao dich:
  - **"Angel AI"**: neu dia chi doi tac nam trong bang `user_wallet_addresses` hoac la Treasury wallet
  - **"External"**: neu dia chi doi tac la vi ngoai he thong
- Tra ve danh sach giao dich da phan loai, bao gom: tx_hash, from, to, value, token info, timestamp, source label

### 2. Edge Function moi: `fetch-wallet-balances`

Tao Edge Function lay so du on-chain thuc te:
- Goi BSCScan API `action=tokenbalance` cho CAMLY token
- Goi BSCScan API `action=balance` cho BNB balance
- Co the mo rong them cac token khac (USDT, FUN)
- Tra ve so du on-chain chinh xac

### 3. Cap nhat `TransactionHistorySection.tsx`

Them tab/filter moi "On-Chain" ben canh cac tab hien tai:
- Goi Edge Function `fetch-wallet-transactions` khi user co `wallet_address`
- Hien thi tat ca giao dich on-chain voi badge phan loai:
  - Badge "Angel AI" (mau xanh la) cho giao dich noi bo he thong
  - Badge "External" (mau xam) cho giao dich tu ben ngoai
- Hien thi day du thong tin: token name, amount, from/to address, tx hash voi link BSCScan
- Ho tro pending transactions (confirmations < 12)

### 4. Cap nhat Wallet Assets Card

Them hien thi so du on-chain thuc te:
- So du CAMLY on-chain (tu BSCScan)
- So du BNB on-chain
- So sanh voi so du noi bo he thong

### 5. Khong lam sai lech logic ke toan noi bo

- Du lieu on-chain chi dung de **hien thi** (read-only)
- Khong thay doi so du `camly_coin_balances` dua tren du lieu on-chain
- Logic tinh diem, thuong, mint van giu nguyen

## Chi tiet ky thuat

### Edge Function `fetch-wallet-transactions`

```text
Input:  { wallet_address: string }
Output: {
  transactions: [{
    hash, from, to, value, tokenSymbol, tokenDecimal,
    timestamp, type: "normal"|"token"|"internal",
    source: "angel_ai"|"external",
    direction: "in"|"out",
    counterparty_name?: string  // Ten user Angel AI neu co
  }],
  balances: { bnb: string, camly: string }
}
```

- Su dung `BSCSCAN_API_KEY` da co san
- Rate limiting: delay 200ms giua cac API call
- Cache ket qua trong 30 giay (client-side)
- Gioi han 500 giao dich gan nhat cho moi loai

### Xu ly Pending & Re-org

- Giao dich voi `confirmations` thap (<12) duoc danh dau "Pending"
- Client tu dong refresh sau 30 giay cho cac pending tx
- Neu tx bi xoa (re-org), no se khong xuat hien trong ket qua BSCScan tiep theo

### Phan loai nguon goc

```text
known_wallets = SELECT wallet_address FROM user_wallet_addresses
treasury_wallet = "0x416336c3b7ACAe89F47EAD2707412f20DA159ac8"

if counterparty in known_wallets OR counterparty == treasury:
  source = "angel_ai", resolve user name
else:
  source = "external"
```

### Cac file can thay doi

| File | Thay doi |
|------|----------|
| `supabase/functions/fetch-wallet-transactions/index.ts` | Tao moi - Edge Function chinh |
| `src/components/profile/TransactionHistorySection.tsx` | Them tab On-Chain va hien thi giao dich blockchain |
| `src/hooks/useOnChainTransactions.ts` | Tao moi - Hook goi Edge Function va quan ly state |
| `src/hooks/useOnChainBalances.ts` | Tao moi - Hook lay so du on-chain |

### Bao mat

- Edge Function yeu cau xac thuc (Authorization header)
- Chi cho phep user xem giao dich cua chinh vi cua minh (verify wallet ownership qua `user_wallet_addresses`)
- BSCScan API key duoc luu an toan trong secrets

