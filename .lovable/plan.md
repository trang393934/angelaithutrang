
# Sua Loi Thong Ke: Tach Biet FUN Money (On-Chain) va Camly Coin (Off-Chain)

## Van De Hien Tai

Bang thong ke truoc do dang **lay du lieu tu bang `camly_coin_transactions`** (Camly Coin - diem thuong off-chain) va goi nham la "FUN Money Mint Statistics". Day la SAI hoan toan vi:

- **Camly Coin**: Diem thuong off-chain, duoc tang truc tiep cho user khi thuc hien hanh dong (chat, nhat ky, dang nhap...). Luu trong bang `camly_coin_transactions`. Tong: ~63 trieu.
- **FUN Money**: Token on-chain BEP-20, phai duoc danh gia qua giao thuc PPLP (Light Score >= 60), roi mint tren blockchain. Luu trong bang `pplp_actions`, `pplp_scores`, `pplp_mint_requests`. Tong: ~147,706 FUN (chua co giao dich nao thuc su mint on-chain).

## Du Lieu Thuc Te FUN Money (Tu PPLP)

| Hang muc (action_type) | Tong hanh dong | Pass | Fail | Tong FUN Reward | Users |
|------------------------|---------------|------|------|-----------------|-------|
| QUESTION_ASK           | 3,171         | 933  | 2,224| 137,642         | 175   |
| POST_CREATE            | 126           | 49   | 71   | 9,360           | 66    |
| GRATITUDE_PRACTICE     | 664           | 11   | 653  | 414             | 127   |
| CONTENT_CREATE         | 2             | 2    | 0    | 248             | 1     |
| JOURNAL_WRITE          | 3             | 1    | 2    | 42              | 2     |
| LEARN_COMPLETE         | 1             | 0    | 1    | 0               | 1     |

Mint Requests: 9 tao, 6 da ky (signed), 0 da mint (minted).

## Giai Phap

Tao trang admin moi `/admin/mint-stats` lay du lieu tu **dung nguon**:

- **`pplp_actions`** - Cac hanh dong da ghi nhan
- **`pplp_scores`** - Diem Light Score va ket qua pass/fail
- **`pplp_mint_requests`** - Yeu cau mint on-chain

### Thong Tin Hien Thi Cho Moi User

| Cot | Nguon du lieu | Mo ta |
|-----|---------------|-------|
| User | `profiles` | Ten va avatar |
| QUESTION_ASK | `pplp_actions` + `pplp_scores` | FUN tu hoi dap |
| POST_CREATE | `pplp_actions` + `pplp_scores` | FUN tu dang bai |
| GRATITUDE_PRACTICE | `pplp_actions` + `pplp_scores` | FUN tu biet on |
| CONTENT_CREATE | `pplp_actions` + `pplp_scores` | FUN tu tao noi dung |
| JOURNAL_WRITE | `pplp_actions` + `pplp_scores` | FUN tu nhat ky |
| LEARN_COMPLETE | `pplp_actions` + `pplp_scores` | FUN tu hoc tap |
| Tong FUN | Tong cong | Tong FUN da earn |
| Pass/Fail | `pplp_scores` | Ty le pass/fail |
| Avg Light Score | `pplp_scores` | Diem trung binh |
| Mint Status | `pplp_mint_requests` | Da mint / Chua mint |

### Stats Cards Tong Quan

1. **Tong FUN da cham diem (Pass)**: 147,706 FUN - tu `pplp_scores` WHERE `decision = 'pass'`
2. **Tong hanh dong PPLP**: 3,967 - tu `pplp_actions`
3. **Ty le Pass**: 25.1% (996/3,967)
4. **Users du dieu kien**: 125 users - tu `pplp_actions` JOIN `pplp_scores` WHERE pass
5. **Mint Requests**: 9 (6 signed, 0 minted)
6. **Avg Light Score (Pass)**: ~84 diem

### Realtime Update

Su dung Supabase realtime subscription tren `pplp_actions` de tu dong cap nhat khi co hanh dong moi duoc ghi nhan.

## Cac File Can Tao/Sua

| File | Thao Tac | Noi Dung |
|------|----------|----------|
| `src/pages/AdminMintStats.tsx` | Tao moi | Trang thong ke FUN Money tu PPLP data |
| `src/App.tsx` | Cap nhat | Them route `/admin/mint-stats` |
| `src/pages/AdminDashboard.tsx` | Cap nhat | Them link "FUN Money Stats" vao header |

## Chi Tiet Ky Thuat

### Query Chinh (Lay Tu PPLP Tables)

Truy van chinh de lay FUN Money stats theo user:

```text
SELECT 
  a.actor_id,
  a.action_type,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN s.decision = 'pass' THEN 1 END) as passed,
  COUNT(CASE WHEN s.decision = 'fail' THEN 1 END) as failed,
  COALESCE(SUM(CASE WHEN s.decision = 'pass' THEN s.final_reward ELSE 0 END), 0) as total_fun,
  COALESCE(AVG(CASE WHEN s.decision = 'pass' THEN s.light_score END), 0) as avg_light_score
FROM pplp_actions a
LEFT JOIN pplp_scores s ON s.action_id = a.id
GROUP BY a.actor_id, a.action_type
```

Ket hop profiles:
```text
SELECT user_id, display_name, avatar_url FROM profiles
```

Va mint requests:
```text
SELECT actor_id, status, amount, signature, tx_hash, created_at 
FROM pplp_mint_requests
```

### Giao Dien

- Giong phong cach cac trang admin hien co (AdminStatistics, AdminDashboard)
- Header voi link ve Admin Dashboard, nut Lam moi, bo loc thoi gian
- Stats cards tong quan (6 the)
- Bang chinh: tung user voi cac cot FUN theo action_type, ty le pass/fail, avg light score, mint status
- Tim kiem user, sap xep cot, xuat Excel
- Realtime subscription tren `pplp_actions`

### Luu Y Quan Trong

- **KHONG truy van `camly_coin_transactions`** - do la Camly Coin off-chain
- Chi truy van `pplp_actions`, `pplp_scores`, `pplp_mint_requests` - do la FUN Money on-chain
- Don vi FUN Money la wei (18 decimals) trong mint_requests, nhung final_reward trong pplp_scores la so nguyen don gian
- Hien thi ro trang thai: Scored (pass/fail) -> Mint Request (pending/signed/minted)
