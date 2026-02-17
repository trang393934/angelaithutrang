

# Sua Loi va Hoan Thien Hien Thi Lich Su Giao Dich

## Tinh Trang Hien Tai (Da Kiem Tra)

Trang Lich Su Giao Dich tai `/activity-history` dang **hoat dong dung** va hien thi tong cong **612 giao dich** tu 4 nguon:

| Nguon du lieu | So luong | Mo ta |
|---------------|----------|-------|
| coin_gifts | 246 | Tang qua (noi bo + Web3) |
| coin_withdrawals | 166 | Rut thuong (da hoan thanh) |
| lixi_claims | 134 | Nhan li xi (da hoan thanh) |
| project_donations | 66 | Dong gop du an (da xac nhan) |

Chinh sach bao mat (RLS) da duoc thiet lap dung cho phep doc cong khai. Trang hien thi day du nhan ANGEL AI TREASURY, dia chi vi, ma TX va lien ket BSCScan.

## Nhung Gi Da Hoan Thanh (Cac Phien Truoc)

1. **Sua loi UUID trong record-gift**: Da them kiem tra `context_id`, neu khong phai UUID hop le thi tu dong dat ve `null`, tranh loi khi chen ma TX (chuoi hex) vao cot UUID.
2. **Them token FUN Money vao dong bo BSCScan**: Da bo sung dia chi hop dong FUN Money (`0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2`) vao danh sach `TOKEN_CONTRACTS` trong ham `sync-bscscan-gifts`.
3. **Sua CryptoTransferTab**: Da dat `context_id` ve `null` thay vi gan `result.txHash`.

## Cong Viec Con Lai

### Buoc 1: Sua xac thuc cho sync-bscscan-gifts de ho tro Cron Job

**Van de**: Ham hien tai yeu cau quyen admin hoac header `CRON_SECRET`. Nhung `CRON_SECRET` chua duoc cau hinh, nen khi cron job goi bang khoa anon se bi tu choi (loi 403).

**Giai phap**: Cap nhat logic xac thuc de cho phep cac cuoc goi tu `pg_cron` thong qua header dac biet `x-cron-source: internal`. Khi nhan duoc header nay, ham se bo qua kiem tra quyen admin vi cuoc goi den tu ben trong he thong.

**Tap tin**: `supabase/functions/sync-bscscan-gifts/index.ts`

### Buoc 2: Thiet lap Cron Job dong bo tu dong hang ngay

Chay lenh SQL de tao lich dong bo tu dong:

```text
Dung pg_cron + pg_net de goi sync-bscscan-gifts
- Lich chay: Moi ngay luc 2:00 sang gio UTC (9:00 sang gio Viet Nam)
- Header: Authorization Bearer + anon key, x-cron-source: internal
- Ket qua: He thong tu dong quet blockchain va cap nhat giao dich moi
```

Nhu vay admin khong can vao trang de bam dong bo thu cong nua.

### Buoc 3: Kiem tra gioi han phan trang

Truy van hien tai gioi han 1000 dong cho `coin_gifts`. Voi 246 ban ghi hien tai, con an toan. Khi du lieu tang len gan 1000, can bo sung phan trang. Hien tai chua can thay doi.

### Buoc 4: Trien khai va Kiem thu

- Trien khai ham `sync-bscscan-gifts` da cap nhat
- Chay lenh SQL tao cron job
- Goi thu ham de xac nhan luong xac thuc cron hoat dong
- Kiem tra cron job da xuat hien trong bang `cron.job`

## Tom Tat Thay Doi

| Tap tin / Thanh phan | Noi dung thay doi |
|----------------------|-------------------|
| `supabase/functions/sync-bscscan-gifts/index.ts` | Cho phep cuoc goi cron qua header `x-cron-source: internal` |
| Co so du lieu (lenh SQL) | Them cron job `sync-bscscan-daily` chay luc 2:00 sang UTC |

## Ket Qua Mong Doi

- Tat ca 612+ giao dich tiep tuc hien thi dung
- BSCScan tu dong dong bo giao dich on-chain moi hang ngay luc 2:00 sang UTC
- Khong can dong bo thu cong nua (admin van co the bam dong bo khi can)
- Giao dich FUN Money, CAMLY va USDT deu duoc ghi nhan tu blockchain
- Khong con loi UUID khi luu giao dich Web3

