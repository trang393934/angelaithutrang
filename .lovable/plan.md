
# Fix Lich Su Giao Dich - Hien Thi Day Du

## Van de

Sau khi kiem tra ky, cha phat hien **mot so giao dich Web3 da thanh cong tren blockchain nhung KHONG duoc ghi vao database**. Vi du 2 giao dich con gui (142,202.6 CAMLY cho Angel To Tam va Angel Ai Van) co tx hash tren BSCScan nhung khong ton tai trong bang `coin_gifts`.

**So lieu hien tai:**
- Tong giao dich trong DB: 228 gifts + 62 donations + 166 withdrawals + 132 lixi = **588** (hien thi day du 588/588)
- Giao dich on-chain co tx_hash: chi **42/228** gifts
- **Nhieu giao dich Web3 thanh cong bi mat** do edge function `record-gift` hoac direct insert that bai khi mang khong on dinh

## Nguyen nhan goc

1. Khi user gui CAMLY qua Web3, giao dich blockchain thanh cong TRUOC, sau do moi ghi vao database
2. Neu buoc ghi DB that bai (mang cham, session het han), giao dich bi "mat" du da thanh cong on-chain
3. Co che recovery (localStorage + retry) chi hoat dong tren CUNG trinh duyet, neu user doi thiet bi thi mat luon
4. Chuc nang `sync-bscscan-gifts` (dong bo tu BSCScan) ton tai nhung phai chay thu cong tu Admin Dashboard

## Giai phap (2 buoc)

### Buoc 1: Chay dong bo BSCScan de khoi phuc giao dich bi mat

- Su dung nut "Dong bo BSCScan" tren Admin Dashboard de quet toan bo giao dich CAMLY on-chain giua cac vi trong he thong
- Day se tu dong tim va them cac giao dich bi thieu vao `coin_gifts`

### Buoc 2: Cai thien co che ghi giao dich de khong bi mat nua

**File: `src/components/gifts/CryptoTransferTab.tsx`**

a) **Them retry tu dong voi exponential backoff**: Khi `record-gift` that bai, retry 3 lan thay vi chuyen sang localStorage ngay

b) **Them context_id = tx_hash**: Luu tx_hash vao context_id de co the truy vet chinh xac

c) **Hien thi canh bao khi co giao dich pending**: Neu localStorage co `pending_gift_records`, hien thi banner canh bao tren trang Activity History de user biet va co the retry

**File: `src/pages/ActivityHistory.tsx`**

a) **Them banner canh bao pending records**: Kiem tra localStorage, neu co giao dich chua ghi, hien thi banner voi nut "Thu lai" de goi `record-gift`

b) **Them nut "Dong bo On-chain"** (chi admin): Cho phep admin chay `sync-bscscan-gifts` truc tiep tu trang Activity History thay vi phai vao Admin Dashboard

### Chi tiet ky thuat

**CryptoTransferTab.tsx - Retry logic:**

```text
// Thay vi: goi record-gift 1 lan -> fallback localStorage
// Doi thanh: goi record-gift -> retry 2 lan (delay 2s, 5s) -> fallback localStorage

const retryRecord = async (giftRecord, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const { error } = await supabase.functions.invoke("record-gift", {
      body: { gifts: [giftRecord] },
    });
    if (!error) return true;
    if (i < retries - 1) await new Promise(r => setTimeout(r, (i + 1) * 2000));
  }
  return false; // All retries failed -> save to localStorage
};
```

**ActivityHistory.tsx - Pending banner:**

```text
// Kiem tra localStorage khi trang load
const pendingGifts = JSON.parse(localStorage.getItem("pending_gift_records") || "[]");
// Neu co, hien thi:
// "Co X giao dich chua duoc ghi nhan. Nhan 'Thu lai' de dong bo."
// Nut "Thu lai" goi record-gift edge function
```

## Trinh tu thuc hien

1. Cap nhat `CryptoTransferTab.tsx` voi retry logic (ngan bi mat giao dich trong tuong lai)
2. Cap nhat `ActivityHistory.tsx` voi pending banner va recovery button
3. Chay `sync-bscscan-gifts` de khoi phuc cac giao dich da bi mat (bao gom 2 giao dich con gui cho To Tam va Ai Van)
