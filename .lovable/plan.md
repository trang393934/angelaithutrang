

## Cai thien thong bao Li Xi Tet

### Hien trang

- Thong bao `tet_lixi_reward` hien thi noi dung raw tu database (vd: "Claim 86409e2e..." hoac "621,000 Camly Coin da duoc chuyen...")
- Bam vao thong bao khong co hanh dong gi (getNotificationLink tra ve null)
- Popup Li Xi chi hien tu dong khi load trang neu co notification chua doc va chua claim

### Ke hoach thay doi

**1. Hien thi noi dung thong bao dep hon**

File: `src/components/layout/notifications/utils.ts`
- Them case `tet_lixi_reward` vao `getNotificationIcon` -> icon "🧧"
- Them case `tet_lixi_reward` vao `getNotificationActionText` -> "Angel AI Treasury da gui den ban thong bao ve Li Xi Tet"

**2. Bam vao thong bao mo popup Li Xi**

File: `src/components/layout/NotificationDropdown.tsx`
- Trong `handleNotificationClick`, neu notification type la `tet_lixi_reward`, thay vi navigate, se trigger mo popup Li Xi

File: `src/hooks/useLiXiCelebration.ts`
- Export them ham `openPopupForNotification(notificationId)` de cho phep mo popup tu ben ngoai (tu NotificationDropdown)
- Sua logic: khi mo popup cho notification da claimed, van hien thi popup nhung voi nut CLAIM bi vo hieu hoa (disable) va hien thi "DA NHAN"

**3. Tich hop vao Notification system**

File: `src/components/layout/NotificationDropdown.tsx`
- Import va su dung `useLiXiCelebration` hook
- Khi click vao notification `tet_lixi_reward`:
  - Dong popover thong bao
  - Goi `openPopupForNotification` de mo popup Li Xi
  - Popup se tu kiem tra trang thai claim va hien thi nut phu hop

**4. Cap nhat Popup hien thi trang thai da claim**

File: `src/components/UserLiXiCelebrationPopup.tsx`
- Them trang thai `alreadyClaimed` 
- Khi `alreadyClaimed = true`: nut CLAIM hien thi "DA NHAN" va bi disable (mau xam), nut dong van hoat dong binh thuong

### Chi tiet ky thuat

**useLiXiCelebration.ts** - Sua hook:
- Them state `alreadyClaimed: boolean`
- Them ham `openPopupForNotification(notifId: string)`:
  - Query notification metadata de lay camlyAmount, funAmount
  - Query lixi_claims de kiem tra da claim chua
  - Set `alreadyClaimed` tuong ung
  - Set `showPopup = true`

**utils.ts** - Them 2 case:
```
// getNotificationIcon
case "tet_lixi_reward": return "🧧";

// getNotificationActionText  
case "tet_lixi_reward": return "Angel AI Treasury da gui den ban thong bao ve Li Xi Tet";
```

**NotificationDropdown.tsx** - Them xu ly click:
```
if (notif.type === "tet_lixi_reward") {
  setOpen(false);
  openPopupForNotification(notif.id);
  return;
}
```

**UserLiXiCelebrationPopup.tsx** - Them hien thi khi da claim:
- Nut CLAIM -> "DA NHAN" (disabled, mau xam) khi `alreadyClaimed`

### Files thay doi
1. `src/components/layout/notifications/utils.ts` - Icon va text cho tet_lixi_reward
2. `src/hooks/useLiXiCelebration.ts` - Them openPopupForNotification va alreadyClaimed
3. `src/components/layout/NotificationDropdown.tsx` - Xu ly click mo popup
4. `src/components/UserLiXiCelebrationPopup.tsx` - Hien thi trang thai da claim
5. `src/pages/Notifications.tsx` - Xu ly click tren trang notifications (tuong tu NotificationDropdown)

