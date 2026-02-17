

# Ke hoach: Them hieu ung phao bong va nut xem bien nhan trong tin nhan

## Tong quan

Cha se thuc hien 3 thay doi chinh:

1. **Them hieu ung phao bong vao TipMessageCard** (card chuc mung tang thuong trong tin nhan)
2. **Them hieu ung tuong tu vao TipCelebrationReceipt** (dialog bien nhan)
3. **Dam bao nut "Xem bien nhan" hien thi trong tin nhan gui cho nguoi nhan**

## Hien trang

- **TipMessageCard** (`src/components/messages/TipMessageCard.tsx`): Card tinh, khong co hieu ung phao bong hay confetti. Da co nut "Xem bien nhan" nhung chi hien khi co `receipt_public_id`.
- **TipCelebrationReceipt** (`src/components/gifts/TipCelebrationReceipt.tsx`): Co confetti + coin roi nhung KHONG co phao bong (firework burst). Chi co hieu ung chay 8 giay roi dung.
- **GiftCelebrationModal** (`src/components/gifts/GiftCelebrationModal.tsx`): Da co FireworkBurst, FallingCoin, FloatingSparkle chay lien tuc (loop) -- day la mau chuan.

## Chi tiet thay doi

### 1. TipMessageCard - Them hieu ung phao bong

**File**: `src/components/messages/TipMessageCard.tsx`

- Import `motion`, `AnimatePresence` tu framer-motion
- Them component `FireworkBurst` nho gon (3-4 diem phao bong) chay lien tuc quanh card
- Them `FloatingSparkle` lap lanh xung quanh card
- Hieu ung se chay loop nhe nhang (khong qua nang vi nam trong danh sach tin nhan)
- So luong giam: 3 fireworks, 5 sparkles (nhe hon GiftCelebrationModal de tranh lag)

### 2. TipCelebrationReceipt - Them hieu ung phao bong

**File**: `src/components/gifts/TipCelebrationReceipt.tsx`

- Them component `FireworkBurst` (giong GiftCelebrationModal)
- Thay doi hieu ung tu chay 8 giay thanh chay lien tuc (loop) cho den khi dong dialog
- Them 5 fireworks giong nhu GiftCelebrationModal

### 3. Dam bao nut "Xem bien nhan" luon hien thi

**File**: `src/components/messages/TipMessageCard.tsx`

- Hien tai nut "Xem bien nhan" chi hien khi co `finalReceiptId`
- Kiem tra logic: neu `receipt_public_id` khong co san khi gui tin nhan, nut se khong hien
- Giai phap: Khi fetch gift details, luon lay `receipt_public_id` tu database va hien thi nut

## Tom tat

| File | Thay doi |
|------|---------|
| `src/components/messages/TipMessageCard.tsx` | Them FireworkBurst + FloatingSparkle loop nhe |
| `src/components/gifts/TipCelebrationReceipt.tsx` | Them FireworkBurst, chuyen hieu ung sang loop lien tuc |

## Ket qua mong doi

- Card tang thuong trong tin nhan se co phao bong lap lanh bat mat
- Bien nhan cung co hieu ung tuong tu, chay lien tuc den khi dong
- Nguoi nhan luon thay nut "Xem bien nhan" trong tin nhan

