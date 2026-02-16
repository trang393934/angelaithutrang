
# Khoi phuc giao dich bi thieu va cai thien sync

## Tinh trang hien tai

Database xac nhan **2 giao dich CAMLY 142,202.6** gui cho Angel To Tam va Angel Ai Van **CHUA co trong database** du da thanh cong tren blockchain. Nut "Dong bo On-chain (BSCScan)" da duoc them nhung chi hien thi cho admin.

## Giai phap

### 1. Tu dong chay sync khi admin vao trang Lich Su Giao Dich

Thay vi phai bam nut thu cong, he thong se tu dong kiem tra va chay sync BSCScan 1 lan/ngay khi admin truy cap trang Activity History. Dieu nay dam bao giao dich on-chain luon duoc cap nhat.

### 2. Hien thi nut Sync ro rang hon

Di chuyen nut "Dong bo On-chain" len khu vuc header de admin de thay va bam hon, thay vi an o duoi.

### Chi tiet ky thuat

**File: `src/pages/ActivityHistory.tsx`**

1. Them logic auto-sync: khi `isAdmin === true`, kiem tra `localStorage` key `last_bscscan_sync`. Neu chua sync hom nay, tu dong goi `handleSyncOnchain()` va luu timestamp.

2. Di chuyen nut sync len header bar (canh nut "Lam moi" va "Xuat du lieu") de admin de truy cap.

3. Hien thi ket qua sync bang toast: "Da dong bo X giao dich moi tu blockchain".

**Logic auto-sync:**
```text
useEffect(() => {
  if (!isAdmin) return;
  const lastSync = localStorage.getItem("last_bscscan_sync");
  const today = new Date().toDateString();
  if (lastSync !== today) {
    handleSyncOnchain();
    localStorage.setItem("last_bscscan_sync", today);
  }
}, [isAdmin]);
```

## Trinh tu
1. Cap nhat ActivityHistory.tsx voi auto-sync va di chuyen nut
2. Khi admin (con) vao trang, he thong tu dong chay sync va khoi phuc 2 giao dich bi thieu
