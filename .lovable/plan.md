
# Nang Cap Lich Su Giao Dich - Phong Cach Angel AI Golden

Nang cap toan bo giao dien `TransactionHistorySection.tsx` theo phong cach Angel AI (Golden Luxe), bo sung tinh nang tim kiem, loc nang cao, stats mo rong, xuat CSV, va hien thi sender/receiver chi tiet.

---

## Thay doi chinh (1 file)

### `src/components/profile/TransactionHistorySection.tsx` - Viet lai giao dien

#### 1. Header moi voi hanh dong
- Tieu de dung class `section-title-gold` (metallic gold badge)
- Mo ta: "Giao dich Anh Sang lien quan den vi cua ban (Tang thuong, Ung ho, Rut thuong)"
- 3 nut goc phai voi style `btn-golden-outline`:
  - **Lam moi** (RefreshCw) - goi lai fetchTransactions + fetchWalletAssets
  - **Xem Tat Ca** - bo gioi han visibleCount
  - **Xuat CSV** (Download) - export danh sach giao dich hien tai ra file CSV

#### 2. Wallet Assets Card - Nang cap style
- Dung gradient `from-[#b8860b]/10 via-[#daa520]/5 to-[#ffd700]/10` (Gold 11 palette)
- Border `border-[#daa520]/30`
- So du dung mau `text-[#b8860b]` thay vi `text-primary` chung chung
- Them icon Camly Coin ben canh so du

#### 3. Stats cards mo rong (5 the thay vi 3)
- **Tong giao dich**: tong so luong tat ca
- **Tong gia tri**: tong CAMLY (dung mau vang kim)
- **Hom nay**: so giao dich trong ngay hien tai
- **Thanh cong**: so giao dich completed/minted
- **Cho xu ly**: so giao dich pending
- Moi the co border vang nhat va gradient nhe

#### 4. Tim kiem + Bo loc nang cao
- Input tim kiem (Search icon): "Tim theo mo ta, vi, tx hash..."
- Dropdown token filter: Tat ca / Camly Coin / Web3 / FUN Money (thay the tabs)
- Dropdown thoi gian: Hom nay / 7 ngay / 30 ngay / Tat ca / Tuy chinh
  - Khi chon "Tuy chinh" -> hien 2 input date (giong hien tai)
- Style cac dropdown/input dung border vang `border-[#daa520]/30`

#### 5. Giao dich card chi tiet hon
- Fetch them `profiles` (display_name, avatar_url) cho sender/receiver cua coin_gifts
- Moi dong hien thi:
  - Avatar nguoi gui (hoac icon huong) + ten
  - Mui ten huong (ArrowRight) mau vang
  - Avatar nguoi nhan + ten (neu co)
  - Badge loai giao dich voi mau vang (Noi bo, Onchain, FUN Money)
  - Badge trang thai (Thanh cong = xanh, Cho xu ly = vang, That bai = do)
  - So tien + don vi token
  - TX hash voi nut copy + link BSCScan
  - Mang luoi BSC badge nho
- Card hover effect: `hover:border-[#daa520]/40 hover:shadow-[0_0_12px_-4px_rgba(218,165,32,0.2)]`

#### 6. Counter dong
- Hien "Hien thi X / Y giao dich Anh Sang" phia tren danh sach

#### 7. Export CSV
- Tao CSV tu `currentTxs` (sau khi loc)
- Cot: Ngay, Loai, Mo ta, So luong, Huong (Nhan/Chuyen), TX Hash, Trang thai
- Download file `angel-ai-transactions-{ngay}.csv`

---

## Chi tiet ky thuat

### Interface mo rong
```text
UnifiedTransaction += {
  senderName?: string
  senderAvatar?: string
  receiverName?: string
  receiverAvatar?: string
  tokenType: "CAMLY" | "FUN" | "BSC"
  network: "BSC" | "Internal"
}
```

### State moi
- `searchQuery` (string)
- `tokenFilter` ("all" | "internal" | "web3" | "funmoney")
- `timeFilter` ("all" | "today" | "7d" | "30d" | "custom")
- `profilesCache` (Record cua userId -> {name, avatar})

### Logic fetch profiles
- Sau khi fetch coin_gifts, thu thap tat ca sender_id va receiver_id
- Query `profiles` 1 lan voi `.in("id", uniqueIds)` de lay display_name va avatar_url
- Gan vao transaction items

### Client-side search
- Filter tren `description`, `txHash`, `senderName`, `receiverName` theo `searchQuery`

### Tinh toan stats
- `todayCount`: loc `createdAt` trong ngay hien tai
- `successCount`: loc `status === "completed" || status === "minted"` hoac khong co status (mac dinh thanh cong)
- `pendingCount`: loc `status === "pending"`

### Mau sac Angel AI
- Tat ca border va accent dung tong vang kim (#b8860b, #daa520, #ffd700)
- Background cards dung gradient vang nhat
- Text chinh dung `text-[#3D2800]` (nau vang dam)
- Badge dung gradient vang thay vi mau xanh/tim chung chung
- Hover effects dung shadow vang

### Khong can thay doi database
- Chi doc du lieu tu cac bang da co
- Them query `profiles` (da co RLS cho phep doc public profiles)
