

# Khac phuc lich su giao dich - Ke hoach toan dien

## Cac van de phat hien

### 1. BSCScan Sync khong hoat dong (0 giao dich tim thay)
Chuc nang `sync-bscscan-gifts` da chay nhung tra ve **0 giao dich** du co 249 vi duoc quet. Nguyen nhan:
- Quet 249 vi lien tuc vuot gioi han BSCScan free tier (5 req/sec), nhieu request bi tu choi ma khong duoc ghi nhan
- Chi lay giao dich khi CA HAI ben (nguoi gui va nguoi nhan) deu co vi trong he thong - neu mot ben chua dang ky vi thi giao dich bi bo qua
- Edge function co the bi timeout khi quet qua nhieu vi (gioi han ~60s)

### 2. Hai ban ghi co tx_hash bi cat ngan
Hai giao dich 142,203 CAMLY co tx_hash chi 18 ky tu thay vi 66 ky tu chuan:
- `0xe0fe90a8153d21c2` (gui cho Thu Nguyen)
- `0x76ba9a47eb167684` (gui cho Pham Luong)
Cac hash nay khong the tra cuu tren BSCScan.

### 3. Tong hop du lieu hien tai (da day du trong gioi han)
| Bang | So ban ghi | Gioi han query | Trang thai |
|------|-----------|---------------|------------|
| coin_gifts | 235 | 500 | OK |
| project_donations | 62 | 500 | OK |
| coin_withdrawals | 166 | 500 | OK |
| lixi_claims | 133 | 500 | OK |
| **Tong** | **596** | | **Hien thi du** |

## Giai phap

### Buoc 1: Sua edge function `sync-bscscan-gifts` de hoat dong dung

**Van de chinh:** Quet 249 vi qua nhieu, gay timeout va rate limit.

**Giai phap:**
- Chi quet cac vi co giao dich web3 (thay vi tat ca 249 vi) - giam so luong API call dang ke
- Tang thoi gian delay giua cac request (2 giay thay vi 1.2 giay)
- Them log chi tiet khi BSCScan tra ve loi hoac ket qua rong
- Bao gom ca giao dich khi chi MOT ben la vi trong he thong (khong yeu cau CA HAI ben)
- Xu ly truong hop BSCScan rate limit (status "0", message "Max rate limit reached")

### Buoc 2: Lam sach du lieu bi loi trong database

- Xoa 2 ban ghi co tx_hash cat ngan (18 ky tu) vi chung la du lieu khong hop le, khong the xac minh tren blockchain
- Hoac cap nhat tx_hash ve NULL de cho phep sync tu BSCScan ghi de bang hash dung

### Buoc 3: Cap nhat AdminTipReports hien thi toan dien hon

Trang AdminTipReports hien chi hien thi `coin_gifts` (235 ban ghi). Them hien thi:
- `coin_withdrawals` (tra thuong Treasury)
- `lixi_claims` (li xi Tet)
- `project_donations` (donate)
De admin co cai nhin toan dien ve tat ca giao dich trong he thong.

## Chi tiet ky thuat

### File 1: `supabase/functions/sync-bscscan-gifts/index.ts`

Thay doi chinh:
1. Thay vi quet tat ca `user_wallet_addresses` (249 vi), chi quet cac vi da co giao dich web3 trong `coin_gifts` hoac `coin_withdrawals` - giam xuong con ~30-50 vi
2. Tang delay giua cac batch API call: `await new Promise(r => setTimeout(r, 2000))` moi 3 request
3. Them xu ly khi BSCScan tra ve rate limit: `if (data.message?.includes("Max rate limit"))` -> tang delay
4. Bo dieu kien "ca hai ben phai la vi trong he thong" - chi can mot ben la du de ghi nhan
5. Them log tong hop: so API call thanh cong, so bi rate limit, so vi quet

### File 2: `src/pages/AdminTipReports.tsx`

Them fetch song song `coin_withdrawals`, `lixi_claims`, `project_donations` ben canh `coin_gifts` hien tai. Them cot "Loai" de phan biet giua Tang thuong / Tra thuong / Li xi / Donate. Them bo loc theo loai giao dich moi.

### File 3: Database cleanup

Cap nhat 2 ban ghi co tx_hash bi cat ngan thanh NULL de cho phep BSCScan sync khoi phuc hash dung:
- ID `e5d4b0fe-ef1b-4ad7-9f73-77de40fa3ebc`
- ID `a6d7bf63-1371-4ec6-8079-3a076468635a`

## Trinh tu thuc hien

1. Lam sach 2 tx_hash bi loi trong database
2. Sua `sync-bscscan-gifts` edge function
3. Deploy va chay sync de khoi phuc giao dich on-chain bi thieu
4. Cap nhat `AdminTipReports` hien thi toan dien

