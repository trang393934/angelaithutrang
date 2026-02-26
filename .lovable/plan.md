

## Plan: Tao edge function truy van BSCScan de ra soat vi tong 0xcc07E57E

### Muc tieu

Tao edge function `scan-collector-wallet` de:
1. Goi BSCScan API lay **toan bo giao dich token** (CAMLY, USDT, FUN, BNB) gui **vao** vi `0xcc07E57E53669010881cab278aAEc1A2c4066B8f`
2. Doi chieu tung dia chi vi gui voi database Angel AI (`user_wallet_addresses`, `coin_withdrawals`, `coin_gifts`)
3. Tra ve danh sach day du: vi nao thuoc user nao, tinh trang (active/suspended), so du, tong rut thuong

### Thay doi

| # | File | Mo ta |
|---|---|---|
| 1 | `supabase/functions/scan-collector-wallet/index.ts` | **Tao moi** - Edge function admin-only |

### Logic chi tiet

```text
1. Xac thuc admin (getUser + check user_roles)
2. Nhan tham so: collector_address (mac dinh = 0xcc07E57E...)
3. Goi BSCScan API:
   - tokentx (CAMLY contract) → lay tat ca token transfer DEN vi tong
   - tokentx (USDT contract) → tuong tu
   - tokentx (FUN contract) → tuong tu  
   - txlist (normal BNB) → giao dich BNB gui den vi tong
4. Loc chi giao dich co `to` = collector_address
5. Trich xuat danh sach unique sender addresses
6. Doi chieu voi DB:
   - user_wallet_addresses → tim user_id
   - coin_withdrawals (wallet_address) → tim user_id (fallback)
   - profiles → lay display_name, avatar_url, handle
   - user_suspensions → kiem tra tinh trang ban
   - camly_coin_balances → so du hien tai
   - coin_withdrawals (SUM completed) → tong da rut
7. Tra ve JSON:
   - matched_users: danh sach user khop (ten, vi, tinh trang, so du, tong rut, so giao dich den vi tong, tong so tien)
   - unmatched_wallets: vi khong khop user nao
   - summary: tong ket
```

### Ket qua tra ve (JSON)

```text
{
  collector_address: "0xcc07E57E...",
  total_incoming_txs: 45,
  unique_senders: 22,
  matched_users: [
    {
      wallet: "0x...",
      user_id: "...",
      display_name: "...",
      handle: "...",
      is_suspended: true/false,
      camly_balance: 500000,
      total_withdrawn: 1200000,
      txs_to_collector: 3,
      total_sent_to_collector: "15000 CAMLY",
      tokens: ["CAMLY", "USDT"]
    }
  ],
  unmatched_wallets: ["0x...", "0x..."],
  summary: { matched: 18, unmatched: 4, suspended: 5 }
}
```

### Yeu cau

- **BSCSCAN_API_KEY**: da co trong secrets ✓
- **Chi admin moi goi duoc** (check user_roles)
- **0 thay doi database, 0 migration**
- Rate limit BSCScan: delay 250ms giua cac API call

