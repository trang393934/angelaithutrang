
# Tong hop quy trinh thuong Li Xi Tet - Ket qua kiem tra

## Quy trinh tong the (3 giai doan)

```text
GIAI DOAN 1: ADMIN DUYET THUONG
distribute-fun-camly-reward
        |
        +-- Cap nhat so du Camly Coin (camly_coin_balances)
        +-- Ghi giao dich (camly_coin_transactions, type: admin_adjustment)
        +-- Gui Healing Message (healing_messages)
        +-- Gui Notification (type: tet_lixi_reward)
        +-- Gui DM tu ANGEL AI TREASURY (message_type: tet_lixi)
        
GIAI DOAN 2: USER CLAIM ON-CHAIN
useLiXiCelebration hook -> process-lixi-claim edge function
        |
        +-- Tao ban ghi lixi_claims (status: pending -> processing)
        +-- Chuyen CAMLY token on-chain qua BSC
        +-- Cap nhat lixi_claims (status: completed, tx_hash)
        +-- Ghi giao dich (camly_coin_transactions, type: lixi_claim)
        +-- Gui Notification (type: lixi_claim_completed, kem tx_hash)
        +-- Gui DM tu ANGEL AI TREASURY (message_type: tet_lixi_receipt, kem tx_hash + BscScan)

GIAI DOAN 3: USER XEM KET QUA
        |
        +-- Notification -> bam -> mo popup (da claimed thi hien "DA NHAN")
        +-- DM tet_lixi -> hien LiXiMessageCard (do-vang) -> bam "Xem Li Xi" -> mo popup
        +-- DM tet_lixi_receipt -> hien LiXiReceiptCard (xanh-vang) -> xem tx_hash + BscScan
        +-- Notification lixi_claim_completed -> icon ✅ + text chuc mung
```

## Trang thai hien tai cac file

### Backend (Edge Functions)

| File | Chuc nang | Trang thai |
|------|-----------|------------|
| `distribute-fun-camly-reward/index.ts` | Admin duyet thuong: cap nhat balance, ghi TX, gui healing msg, notification, DM | Hoan chinh |
| `process-lixi-claim/index.ts` | User claim on-chain: chuyen CAMLY, ghi TX, gui notification + DM kem tx_hash | Hoan chinh |

### Frontend - Hooks

| File | Chuc nang | Trang thai |
|------|-----------|------------|
| `useLiXiCelebration.ts` | Quan ly popup claim: auto-show, openPopupForNotification, claim flow, alreadyClaimed | Hoan chinh |
| `useLixiClaims.ts` | Admin: fetch/update claims, realtime subscription | Hoan chinh |

### Frontend - Components

| File | Chuc nang | Trang thai |
|------|-----------|------------|
| `UserLiXiCelebrationPopup.tsx` | Popup claim voi hieu ung Tet, nut CLAIM / DA NHAN | Hoan chinh |
| `LiXiMessageCard.tsx` | Card DM do-vang (truoc khi claim), nut "Xem Li Xi" | Hoan chinh |
| `LiXiReceiptCard.tsx` | Card DM xanh-vang (sau khi claim), hien tx_hash + BscScan | Hoan chinh |
| `MessageBubble.tsx` | Render card dung loai: tet_lixi -> LiXiMessageCard, tet_lixi_receipt -> LiXiReceiptCard | Hoan chinh |

### Frontend - Notification System

| File | Chuc nang | Trang thai |
|------|-----------|------------|
| `notifications/utils.ts` | Icon 🧧 cho tet_lixi_reward, ✅ cho lixi_claim_completed, text tuong ung | Hoan chinh |
| `NotificationDropdown.tsx` | Bam notification tet_lixi_reward -> mo popup Li Xi | Hoan chinh |
| `Notifications.tsx` (page) | Tuong tu dropdown, bam -> mo popup | Hoan chinh |
| `Messages.tsx` (page) | Render UserLiXiCelebrationPopup, truyen handleOpenLiXi xuong MessageBubble | Hoan chinh |

## Bao mat va chong gian lan

| Lop bao ve | Vi tri | Mo ta |
|------------|--------|-------|
| Chong trung lap duyet thuong | distribute-fun-camly-reward | Kiem tra metadata `source: fun_to_camly_reward` truoc khi duyet |
| Chong trung lap claim | process-lixi-claim | Kiem tra status `pending` va dedup theo `notification_id` |
| Status machine | process-lixi-claim | pending -> processing -> completed/failed (khong cho retry processing) |
| Xac nhan on-chain | process-lixi-claim | Chi cap nhat completed khi `receipt.status === 1` |
| Thong bao admin khi loi | process-lixi-claim | Gui notification cho admin khi claim that bai |

## Ket luan

He thong thuong Li Xi Tet da duoc xay dung hoan chinh voi day du 3 giai doan. Moi giai doan deu co:
- Thong bao (notification) voi icon va noi dung phu hop
- Tin nhan truc tiep (DM) tu ANGEL AI TREASURY voi card chuyen dung
- Popup tuong tac cho nguoi dung
- Bao mat chong gian lan da lop

Khong can thay doi gi them. He thong da san sang hoat dong.
