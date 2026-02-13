
## Gui thong bao va tin nhan tu dong sau khi claim Li Xi thanh cong

### Hien trang

Trong `process-lixi-claim/index.ts`, khi claim thanh cong (dong 200-211), he thong da gui 1 notification `lixi_claim_completed` nhung:
- Noi dung chua day du (thieu ten chuong trinh, thieu tx_hash hien thi)
- Chua gui DM tu ANGEL AI TREASURY
- Notification khong co link BscScan

### Ke hoach thay doi

**1. Cap nhat Edge Function `process-lixi-claim/index.ts`**

Sau khi claim thanh cong (dong 200-211), them logic:

a) **Cap nhat noi dung notification** (dong 201-211):
- Title: "🧧 Chuc mung ban da nhan Li Xi Tet!"
- Content: "Chuc mung! Ban da nhan X Camly Coin tu chuong trinh Li Xi Tet. Giao dich da duoc xac nhan tren blockchain."
- Metadata: them tx_hash, bscscan_url

b) **Gui DM tu ANGEL AI TREASURY** (them moi):
- sender_id: `9aa48f46-a2f6-45e8-889d-83e2d3cbe3ad` (ANGEL AI TREASURY)
- receiver_id: userId
- message_type: `"tet_lixi_receipt"` (loai moi de phan biet voi DM thong bao ban dau)
- content: noi dung chuc mung kem tx_hash va link BscScan
- metadata: `{ camly_amount, fun_amount, tx_hash, bscscan_url, source: "tet_lixi_claim_completed" }`

**2. Tao component `LiXiReceiptCard.tsx`**

File moi: `src/components/messages/LiXiReceiptCard.tsx`

Card hien thi bien nhan chuyen thuong thanh cong:
- Gradient xanh-vang (khac voi card Li Xi do-vang ban dau)
- Icon check thanh cong
- So Camly Coin
- tx_hash rut gon (0x1234...abcd)
- Nut "Xem tren BscScan" -> mo link `https://bscscan.com/tx/{tx_hash}` trong tab moi
- Ten chuong trinh: Li Xi Tet 2026

**3. Cap nhat MessageBubble.tsx**

- Them case `message_type === "tet_lixi_receipt"` -> render `LiXiReceiptCard`
- Truyen metadata (camly_amount, fun_amount, tx_hash) xuong component

**4. Cap nhat notification utils**

File: `src/components/layout/notifications/utils.ts`
- Them case `lixi_claim_completed` vao `getNotificationIcon` -> icon "✅"
- Them case `lixi_claim_completed` vao `getNotificationActionText` -> "Chuc mung! Ban da nhan Camly Coin tu chuong trinh Li Xi Tet"

### Chi tiet ky thuat

**process-lixi-claim/index.ts** - Sua doan success (dong 200-211):

```text
const TREASURY_USER_ID = "9aa48f46-a2f6-45e8-889d-83e2d3cbe3ad";
const bscscanUrl = `https://bscscan.com/tx/${result.hash}`;

// Notification
await adminClient.from('notifications').insert({
  user_id: userId,
  type: 'lixi_claim_completed',
  title: '🧧 Chúc mừng bạn đã nhận Lì Xì Tết!',
  content: `Chúc mừng! Bạn đã nhận ${claim.camly_amount.toLocaleString()} Camly Coin từ chương trình Lì Xì Tết.`,
  metadata: {
    tx_hash: result.hash,
    bscscan_url: bscscanUrl,
    camly_amount: claim.camly_amount,
    fun_amount: claim.fun_amount,
  },
});

// DM tu ANGEL AI TREASURY
await adminClient.from('direct_messages').insert({
  sender_id: TREASURY_USER_ID,
  receiver_id: userId,
  content: `✅ Chúc mừng! Bạn đã nhận ${claim.camly_amount.toLocaleString()} Camly Coin từ chương trình Lì Xì Tết!\n\n📋 Biên nhận: ${result.hash}\n🔗 BscScan: ${bscscanUrl}`,
  message_type: "tet_lixi_receipt",
  metadata: {
    camly_amount: claim.camly_amount,
    fun_amount: claim.fun_amount,
    tx_hash: result.hash,
    bscscan_url: bscscanUrl,
    source: "tet_lixi_claim_completed",
  },
});
```

**LiXiReceiptCard.tsx:**
- Gradient xanh la-vang (thanh cong)
- Hien thi: icon ✅, so Camly, tx_hash rut gon, nut BscScan
- Khong co nut CLAIM (vi da claim xong)

**MessageBubble.tsx:**
- Them: `if (message_type === "tet_lixi_receipt")` -> render `LiXiReceiptCard`

### Danh sach file thay doi
1. `supabase/functions/process-lixi-claim/index.ts` - Them gui DM va cap nhat notification
2. `src/components/messages/LiXiReceiptCard.tsx` (file moi) - Card bien nhan thanh cong
3. `src/components/messages/MessageBubble.tsx` - Them case render LiXiReceiptCard
4. `src/components/layout/notifications/utils.ts` - Them icon va text cho lixi_claim_completed
