

## Them tin nhan tu dong (DM) tu ANGEL AI TREASURY khi duyet thuong Li Xi Tet

### Tong quan
Khi admin duyet thuong Li Xi, ngoai thong bao va healing message, he thong se tu dong gui 1 tin nhan truc tiep (DM) tu tai khoan **ANGEL AI TREASURY** (`9aa48f46-a2f6-45e8-889d-83e2d3cbe3ad`) den nguoi dung. Khi nguoi dung nhan vao tin nhan nay, popup Li Xi se hien thi de thao tac CLAIM.

### Cac thay doi

**1. Database Migration - Them cot `metadata` vao `direct_messages`**

Them cot `metadata jsonb default null` de luu thong tin lien ket voi notification (notification_id, camly_amount, fun_amount, source).

**2. Edge Function - Gui DM tu dong**

File: `supabase/functions/distribute-fun-camly-reward/index.ts`

Sau khi insert notification `tet_lixi_reward` (dong 218-229), them logic:
- Lay `notification_id` tu ket qua insert notification (can sua thanh `.select("id").single()`)
- Insert vao `direct_messages` voi:
  - `sender_id`: **ANGEL AI TREASURY** user_id (hardcode `9aa48f46-a2f6-45e8-889d-83e2d3cbe3ad`)
  - `receiver_id`: user_id nguoi nhan
  - `content`: noi dung tuong tu thong bao
  - `message_type`: `"tet_lixi"`
  - `metadata`: `{ notification_id, camly_amount, fun_amount, source: "tet_lixi_reward" }`

**3. Component moi - LiXiMessageCard**

File moi: `src/components/messages/LiXiMessageCard.tsx`

Card hien thi thong tin Li Xi voi giao dien do-vang (phong cach Tet):
- Icon bao li xi 🧧
- So Camly Coin va FUN Money
- Deadline: 08/02/2026
- Nut "Xem Li Xi" -> goi callback `onOpenLiXi(notificationId)`

**4. Cap nhat MessageBubble**

File: `src/components/messages/MessageBubble.tsx`

- Them prop `onOpenLiXi?: (notificationId: string) => void`
- Them interface field `metadata?: any` cho message
- Khi `message_type === "tet_lixi"`, render `LiXiMessageCard` thay vi text bubble thuong
- Truyen `metadata.notification_id` va `onOpenLiXi` xuong component

**5. Tich hop vao trang Messages**

File: `src/pages/Messages.tsx`

- Import `useLiXiCelebration` hook va `UserLiXiCelebrationPopup`
- Truyen `openPopupForNotification` xuong MessageBubble lam prop `onOpenLiXi`
- Render `<UserLiXiCelebrationPopup />` trong trang Messages

### Chi tiet ky thuat

**Migration SQL:**
```text
ALTER TABLE public.direct_messages ADD COLUMN metadata jsonb DEFAULT null;
```

**Edge Function (distribute-fun-camly-reward):**
Sua doan insert notification thanh `.select("id").single()` de lay notification_id, roi them:
```text
const TREASURY_USER_ID = "9aa48f46-a2f6-45e8-889d-83e2d3cbe3ad";

// Sau khi insert notification thanh cong
const notifId = notifData?.id;
await supabaseAdmin.from("direct_messages").insert({
  sender_id: TREASURY_USER_ID,
  receiver_id: user_id,
  content: `🧧 Angel AI Treasury da gui den ban thong bao ve Li Xi Tet!\n\n💰 ${camlyAmount.toLocaleString("vi-VN")} Camly Coin\n📊 Dua tren ${fun_amount.toLocaleString("vi-VN")} FUN Money\n\n⏰ Ap dung den 08/02/2026`,
  message_type: "tet_lixi",
  metadata: { notification_id: notifId, camly_amount: camlyAmount, fun_amount, source: "tet_lixi_reward" }
});
```

**LiXiMessageCard.tsx:**
- Gradient do-vang, icon 🧧, hien thi so Camly/FUN
- Nut "Xem Li Xi" goi `onOpenLiXi(notificationId)`

**MessageBubble.tsx:**
- Them case `message_type === "tet_lixi"` -> render `LiXiMessageCard`
- Truyen metadata.notification_id va onOpenLiXi callback

**Messages.tsx:**
- Import va su dung `useLiXiCelebration`
- Render `UserLiXiCelebrationPopup`
- Truyen `openPopupForNotification` xuong cac `MessageBubble`

### Danh sach file thay doi
1. Migration SQL - Them cot `metadata` vao `direct_messages`
2. `supabase/functions/distribute-fun-camly-reward/index.ts` - Gui DM tu ANGEL AI TREASURY
3. `src/components/messages/LiXiMessageCard.tsx` (file moi) - Card hien thi Li Xi trong DM
4. `src/components/messages/MessageBubble.tsx` - Them case render LiXiMessageCard
5. `src/pages/Messages.tsx` - Tich hop popup Li Xi

