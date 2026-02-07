
## Hoan thien he thong Thong bao (Notification) giong Facebook

### Tong quan

Xay dung he thong thong bao (Notification Center) hoan chinh giong Facebook, bao gom:
1. **Notification Center** (dropdown tren Header + CommunityHeader) voi cac tab "Tat ca" va "Chua doc"
2. **Thong bao nhan qua** tu dong khi nhan Camly Coin / FUN Money / USDT
3. **Tin nhan chuc mung** gui vao DM cua ca 2 user (nguoi tang va nguoi nhan) voi giao dien celebration card

### Hien trang

Hien tai he thong da co:
- **healing_messages** table: Luu thong bao tu Angel AI va thong bao nhan qua (`message_type = 'gift_received'`). Tuy nhien chi hien thi trong `HealingMessagesPanel` o trang Earn, **khong co** dropdown notification tren Header
- **direct_messages**: Da co auto-send tin nhan DM kieu `tip` khi tang qua, nhung chi gui 1 tin nhan cho conversation giua sender va receiver
- **Bell icon** tren CommunityHeader: Da co nhung **chua co chuc nang** (chi hien icon, click khong lam gi)
- Thieu thong bao cho: like bai viet, comment bai viet, follow, va cac su kien khac

### Ke hoach thuc hien

#### Phan 1: Tao bang `notifications` moi

Tao bang `notifications` de luu tat ca loai thong bao (giong Facebook):

| Column | Type | Mo ta |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Nguoi nhan thong bao |
| type | text | Loai: gift_received, post_liked, post_commented, post_shared, friend_request, system, etc. |
| title | text | Tieu de ngan |
| content | text | Noi dung chi tiet |
| actor_id | uuid | Nguoi gay ra su kien (nullable) |
| reference_id | text | ID cua doi tuong lien quan (post_id, gift_id, etc.) |
| reference_type | text | Loai doi tuong: post, gift, comment, etc. |
| is_read | boolean | Da doc chua |
| read_at | timestamptz | Thoi gian doc |
| metadata | jsonb | Du lieu bo sung (amount, receipt_id, avatar, etc.) |
| created_at | timestamptz | Thoi gian tao |

Tao RLS policies:
- User chi doc duoc notifications cua minh
- Chi server (service role) moi insert duoc

Enable realtime cho bang nay.

#### Phan 2: Tao component `NotificationCenter`

Tao file `src/components/NotificationCenter.tsx`:
- Dropdown popup (giong Facebook) voi `Popover` component
- 2 tab: **Tat ca** va **Chua doc**
- Moi notification item hien thi:
  - Avatar cua actor (nguoi thuc hien hanh dong)
  - Noi dung thong bao (vd: "**Trang393934** da tang ban 1,000 Camly Coin")
  - Thoi gian tuong doi (vd: "3 gio truoc")
  - Cham xanh cho thong bao chua doc
  - Click de danh dau da doc va chuyen den trang lien quan
- Nut "Xem tat ca" o cuoi
- Nut "Danh dau tat ca da doc"
- Badge so luong thong bao chua doc tren icon Bell

#### Phan 3: Tao hook `useNotifications`

Tao file `src/hooks/useNotifications.ts`:
- Truy van bang `notifications` theo `user_id`
- Tinh `unreadCount` cho badge
- Cac ham: `markAsRead`, `markAllAsRead`
- Realtime subscription de cap nhat thong bao moi ngay lap tuc
- Hien thi toast khi co thong bao moi (voi avatar + noi dung)

#### Phan 4: Tich hop NotificationCenter vao Header va CommunityHeader

**`src/components/Header.tsx`**:
- Them icon Bell voi badge giua Messages va Camly Coin (desktop)
- Click mo NotificationCenter dropdown
- Them vao mobile menu

**`src/components/community/CommunityHeader.tsx`**:
- Thay the Bell button hien tai (chua co chuc nang) bang NotificationCenter

#### Phan 5: Cap nhat edge function `process-coin-gift` de tao notification

Cap nhat `supabase/functions/process-coin-gift/index.ts`:
- Them insert vao bang `notifications` voi type `gift_received`
- Metadata chua: amount, sender_name, sender_avatar, receipt_public_id, coin_type (Camly Coin)
- Van giu insert vao `healing_messages` de backward compatible

#### Phan 6: Hoan thien tin nhan chuc mung trong DM

Cap nhat `supabase/functions/process-coin-gift/index.ts`:
- Gui **2 tin nhan DM** thay vi 1:
  - Tin nhan cho **nguoi nhan**: "Chuc mung! Ban da nhan duoc 1,000 Camly Coin tu Trang393934. [Xem bien nhan]"
  - Tin nhan cho **nguoi gui** (conversation voi chinh minh hoac voi receiver): "Ban da tang thanh cong 1,000 Camly Coin cho Angel Lam. [Xem bien nhan]"
- Tin nhan co `message_type = 'tip'` va `tip_gift_id` de render TipMessageCard

#### Phan 7: Nang cap TipMessageCard

Cap nhat `src/components/messages/TipMessageCard.tsx`:
- Hien thi giao dien tuong tu TipCelebrationReceipt nhung compact hon
- Hien thi avatar cua sender va receiver
- Hien thi so luong Camly Coin voi logo
- Hien thi loi nhan (neu co)
- Nut "Xem bien nhan" link den `/receipt/:id`
- Fetch `receipt_public_id` tu `coin_gifts` table thong qua `tip_gift_id`

#### Phan 8: Cap nhat translations

Them cac translation key moi cho `vi.ts` va `en.ts`:
- `notifications.title`: "Thong bao" / "Notifications"
- `notifications.all`: "Tat ca" / "All"
- `notifications.unread`: "Chua doc" / "Unread"
- `notifications.viewAll`: "Xem tat ca" / "View all"
- `notifications.markAllRead`: "Danh dau tat ca da doc" / "Mark all as read"
- `notifications.empty`: "Khong co thong bao moi" / "No new notifications"
- `notifications.giftReceived`: "da tang ban {amount} Camly Coin" / "sent you {amount} Camly Coin"
- `notifications.giftSent`: "Ban da tang thanh cong {amount} Camly Coin cho {name}" / "You sent {amount} Camly Coin to {name}"

### Cau truc file

```text
Tao moi:
  src/components/NotificationCenter.tsx    -- Dropdown thong bao
  src/hooks/useNotifications.ts            -- Hook quan ly thong bao

Chinh sua:
  src/components/Header.tsx                -- Them Bell icon + NotificationCenter
  src/components/community/CommunityHeader.tsx -- Thay Bell button
  src/components/messages/TipMessageCard.tsx -- Nang cap giao dien
  supabase/functions/process-coin-gift/index.ts -- Them notification + DM cho sender
  src/translations/vi.ts                   -- Them translation keys
  src/translations/en.ts                   -- Them translation keys

Migration SQL:
  Tao bang notifications
  Enable RLS
  Enable realtime
```

### Chi tiet ky thuat

**Notification Types** (mo rong trong tuong lai):
- `gift_received` -- Nhan qua Camly Coin
- `gift_sent` -- Da gui qua thanh cong (cho sender)
- `post_liked` -- Bai viet duoc like (tuong lai)
- `post_commented` -- Bai viet duoc comment (tuong lai)
- `system` -- Thong bao he thong

**Realtime flow**:
1. User A tang Camly Coin cho User B
2. Edge function `process-coin-gift` insert vao `notifications` cho User B
3. User B nhan realtime event --> hien badge + toast
4. User B click thong bao --> danh dau da doc, chuyen den receipt hoac conversation

**DM flow moi**:
1. User A tang qua --> Edge function gui 2 DM:
   - Sender -> Receiver: "Chuc mung {receiver}! Ban da nhan {amount} Camly Coin tu {sender}"
   - Sender -> Receiver (hoac self): "Ban da tang {amount} Camly Coin cho {receiver}"
2. Ca 2 tin nhan deu co `message_type = 'tip'` va `tip_gift_id`

### Luu y
- Giu backward compatible voi `healing_messages` (van insert)
- Notification Center chi fetch 20 thong bao gan nhat de toi uu performance
- Su dung lazy loading neu user scroll xuong de xem them
- Thong bao realtime hien toast chi 1 lan, khong spam
