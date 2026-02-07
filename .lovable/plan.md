

# He Thong TIP / TANG THUONG Toan Dien cho Angel AI

## Tong Quan

Du an da co san mot he thong tang thuong co ban (GiftCoinDialog, DonateProjectDialog, GiftHonorBoard, DonationHonorBoard, GiftTransactionHistory, WithdrawalCelebration). Ke hoach nay se nang cap va mo rong he thong hien co thay vi xay lai tu dau.

## Phan Tich Hien Trang

### Da co san:
- Bang `coin_gifts` va `project_donations` trong database
- `GiftCoinDialog` va `DonateProjectDialog` (chon nguoi nhan, nhap amount, message, ca internal va crypto)
- Leaderboard: `GiftHonorBoard` (Top Givers + Top Receivers) va `DonationHonorBoard` (Top Donors/Sponsors)
- `GiftTransactionHistory` + `Web3TransactionHistory`
- `WithdrawalCelebration` (pattern confetti/coins da co san)
- `useCoinGifts` hook (sendGift, donateToProject, leaderboards)
- `process-coin-gift` edge function xu ly backend
- Thu vien `xlsx` da duoc cai dat

### Can xay moi / nang cap:
1. **Nut Tip tren moi PostCard** - Nut "Thuong" tren moi bai viet
2. **Celebration Receipt Card** - Bien nhan an mung giu nguyen cho chup hinh
3. **Tip Message Card trong DM** - Gui tin nhan kem giao dich vao chat
4. **Receipt Page** - Trang xem chi tiet bien nhan cong khai
5. **Export CSV/XLSX** - Xuat bao cao giao dich
6. **Token uu tien** - Hien thi FUN Money lam mac dinh (hien tai chi co Camly Coin)

---

## Giai Doan 1: Database Migration

### 1A. Them cot `receipt_public_id` va `context` vao `coin_gifts`

```sql
ALTER TABLE coin_gifts 
  ADD COLUMN IF NOT EXISTS receipt_public_id TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS context_type TEXT DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS context_id UUID;

CREATE INDEX IF NOT EXISTS idx_coin_gifts_receipt ON coin_gifts(receipt_public_id);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_sender ON coin_gifts(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_receiver ON coin_gifts(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_context ON coin_gifts(context_type, context_id);
```

### 1B. Them cot `tip_gift_id` vao `direct_messages`

```sql
ALTER TABLE direct_messages 
  ADD COLUMN IF NOT EXISTS tip_gift_id UUID REFERENCES coin_gifts(id);
```

Khong tao bang `tokens`, `wallets`, `reward_transactions` moi vi he thong hien tai dang chay on dinh voi `coin_gifts`, `project_donations`, `camly_coin_balances`. Viec tao bang moi se phai migrate du lieu va co the gay loi.

---

## Giai Doan 2: Backend - Nang Cap Edge Function

### 2A. Cap nhat `process-coin-gift` edge function

Them logic:
- Nhan them `context_type` ('global' | 'post') va `context_id` (post_id)
- Tao `receipt_public_id` tu dong
- Tu dong gui tin nhan type='tip' vao `direct_messages` giua 2 user
- Tra ve `receipt_public_id` trong response

### 2B. Tao edge function `get-tip-receipt`

- Nhan `receipt_public_id`
- Tra ve chi tiet giao dich: sender profile, receiver profile, amount, message, context (post), tx_hash, explorer_url, thoi gian

---

## Giai Doan 3: UI Components

### 3A. Nut "Thuong" tren PostCard

Them nut "Thuong" (Gift icon) vao thanh action cua moi PostCard (ben canh Like, Comment, Share).

- Click mo `GiftCoinDialog` voi `preselectedUser = post author`, `contextType='post'`, `contextId=post.id`
- Cap nhat `GiftCoinDialog` nhan them props `contextType` va `contextId`

### 3B. Celebration Receipt Card (TipCelebrationReceipt)

Tao component `TipCelebrationReceipt` - dialog overlay hien thi sau khi tip thanh cong:

- Confetti/phao hoa chay 2-4 giay roi dung
- Receipt card giu nguyen cho den khi user bam "Dong":
  - Tieu de: "Chuc mung ban da chuyen thanh cong!"
  - Avatar + Link profile nguoi gui
  - Avatar + Link profile nguoi nhan
  - Token (Camly Coin) + So luong
  - Thoi gian
  - Loi nhan (message)
  - TX hash + nut "Xem tren BscScan" (neu co)
  - Nut "Sao chep link bien nhan"
  - Nut "Dong"

Tich hop vao `GiftCoinDialog` va `DonateProjectDialog`: Sau khi thanh cong, hien thi `TipCelebrationReceipt` thay vi chi toast.

### 3C. Tip Message Card trong DM

Khi tip thanh cong, tu dong tao tin nhan type='tip' trong `direct_messages`.

Tao component `TipMessageCard` hien thi trong `MessageBubble`:
- Card nho trong bong bong tin nhan
- Hien thi: avatar nguoi gui/nhan, so luong, loi nhan
- Nut "Xem bien nhan" -> link den `/receipt/{receipt_public_id}`

Cap nhat `MessageBubble` de nhan biet `message_type === 'tip'` va render `TipMessageCard`.

### 3D. Receipt Page

Route moi: `/receipt/:receiptId`

- Fetch `coin_gifts` by `receipt_public_id`
- Hien thi chi tiet:
  - Sender profile (avatar, ten, link)
  - Receiver profile (avatar, ten, link)
  - Amount + Token
  - Thoi gian
  - Loi nhan
  - Post link (neu context_type = 'post')
  - BSCScan link (neu co tx_hash)

### 3E. Nut "Tang thuong" tren trang chinh (Homepage)

Them nut "Tang thuong" noi bat tren Index page header hoac tren MainSidebar, mo `GiftCoinDialog` voi context_type='global'.

---

## Giai Doan 4: Leaderboard Nang Cap

He thong da co `GiftHonorBoard` (Top Givers, Top Receivers) va `DonationHonorBoard` (Top Sponsors).

Nang cap:
- Them bo loc thoi gian: 7 ngay / 30 ngay / Tat ca
- Them tab "Top Sponsors" (Manh thuong quan) vao `GiftHonorBoard` dialog
- Link moi user den profile va danh sach receipt cua ho

---

## Giai Doan 5: Export CSV / XLSX

### 5A. Trang Bao Cao Giao Dich (`/admin/tip-reports`)

Route moi cho admin:
- Bo loc: khoang thoi gian, loai giao dich (gift/donation), trang thai, sender, receiver
- Bang hien thi giao dich (dung `Table` component co san)
- Nut Export CSV va Export XLSX (dung thu vien `xlsx` da cai san)

### 5B. Export Sponsor List

- Danh sach rieng: sponsor_name, total_donated, so giao dich, lan donate cuoi
- Export CSV/XLSX

### 5C. Logic Export

```text
Su dung thu vien xlsx da cai:
- import * as XLSX from 'xlsx'
- Tao workbook tu du lieu giao dich
- Xuat file .xlsx hoac .csv
- Columns: created_at, id, sender, receiver, amount, context_type, status, chain, tx_hash, message, receipt_public_id
```

---

## Giai Doan 6: Realtime & Notification

- Da co san: Realtime subscriptions trong `useCoinGifts` hook va `GiftTransactionHistory`
- Nang cap: Them badge pulse animation khi co giao dich moi
- Toast notification da co san, chi can dam bao hien thi nhat quan

---

## Giai Doan 7: Chong Gian Lan

Da co san:
- Chan self-tipping (check sender !== receiver trong edge function)
- So du toi thieu 100 Camly Coin

Them:
- Rate limit: toi da 10 giao dich tip/ngay cho moi user (kiem tra trong edge function)
- Log metadata de phuc vu Light Score

---

## Thu Tu Trien Khai

1. Database migration (them cot moi)
2. Cap nhat `process-coin-gift` edge function
3. Tao `get-tip-receipt` edge function
4. Tao `TipCelebrationReceipt` component
5. Cap nhat `GiftCoinDialog` (them context props + celebration)
6. Them nut "Thuong" tren `PostCard`
7. Tao `TipMessageCard` + cap nhat `MessageBubble`
8. Tao `/receipt/:receiptId` page
9. Them nut "Tang thuong" tren trang chinh
10. Nang cap Leaderboard (bo loc thoi gian)
11. Tao trang `/admin/tip-reports` + Export CSV/XLSX
12. Polish: animations, realtime badges

---

## Chi Tiet Ky Thuat

### Files moi:
- `src/components/gifts/TipCelebrationReceipt.tsx` - Bien nhan an mung
- `src/components/messages/TipMessageCard.tsx` - Card tip trong DM
- `src/pages/Receipt.tsx` - Trang bien nhan cong khai
- `src/pages/AdminTipReports.tsx` - Trang bao cao + export
- `supabase/functions/get-tip-receipt/index.ts` - Edge function lay chi tiet receipt

### Files cap nhat:
- `supabase/functions/process-coin-gift/index.ts` - Them context, receipt_public_id, auto-DM
- `src/components/gifts/GiftCoinDialog.tsx` - Them context props, hien celebration receipt
- `src/components/gifts/DonateProjectDialog.tsx` - Hien celebration receipt
- `src/components/community/PostCard.tsx` - Them nut "Thuong"
- `src/components/messages/MessageBubble.tsx` - Render TipMessageCard
- `src/hooks/useCoinGifts.ts` - Them context params vao sendGift
- `src/App.tsx` - Them route /receipt/:receiptId va /admin/tip-reports
- `src/pages/Index.tsx` - Them nut "Tang thuong"
- `supabase/config.toml` - Them get-tip-receipt function

### Luu y quan trong:
- Khong tao bang database moi khong can thiet - tan dung bang hien co
- Giu nguyen toan bo logic hien tai, chi bo sung tinh nang moi
- Thu vien `xlsx` da cai san, khong can them dependency
- Pattern `WithdrawalCelebration` (confetti + receipt) da co san de tham khao
- FUN Money uu tien: Hien tai he thong chi co Camly Coin, viec them FUN Money se duoc danh dau la tab mac dinh trong GiftCoinDialog khi he thong FUN Money on-chain san sang

