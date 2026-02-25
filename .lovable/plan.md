

## Kế hoạch: Nâng cấp Celebration Post trên Newsfeed + Biên nhận trong DM

### Yêu cầu
1. **Bài đăng Newsfeed (24h)**: Hiển thị card giống TipCelebrationReceipt (có pháo bông, confetti, nhạc, hiệu ứng) thay vì text đơn giản hiện tại
2. **Tin nhắn tự động (DM)**: Gửi biên nhận dạng card (message_type: "tip_receipt") với nút "Xem biên nhận" thay vì text thuần

### Phân tích hiện trạng
- **PostCard.tsx**: Celebration post hiện chỉ hiển thị badge vàng + text amount đơn giản (dòng 459-477)
- **autoSendDM**: Gửi tin nhắn dạng `message_type: "tip"` với nội dung text thuần, không có `tip_gift_id` → TipMessageCard hiển thị fallback text (không có card đẹp)
- **autoPostCelebration**: Lưu đủ metadata (sender/receiver info, tx_hash, receipt_id, amount, token) nhưng PostCard không render đầy đủ

### Thay đổi chi tiết

| # | File | Thay đổi |
|---|---|---|
| 1 | `src/components/community/PostCard.tsx` | Thay thế celebration card đơn giản bằng card sang trọng: avatar sender→receiver, amount nổi bật, pháo bông (framer-motion), confetti, falling coins, nhạc tự động, nút xem biên nhận |
| 2 | `src/components/gifts/GiftCoinDialog.tsx` | Cập nhật `autoPostCelebration` lưu thêm `sender_avatar`, `receiver_avatar`, `sender_wallet`, `receiver_wallet`, `explorer_url`, `created_at` vào metadata. Cập nhật `autoSendDM` gửi `message_type: "tip_receipt"` với metadata chứa thông tin biên nhận |
| 3 | `src/components/messages/MessageBubble.tsx` | Thêm handler cho `message_type === "tip_receipt"` render card biên nhận mới |
| 4 | `src/components/messages/TipReceiptMessageCard.tsx` | **File mới** — Card biên nhận trong DM: hiển thị sender→receiver, amount, token logo, lời nhắn, thời gian, nút "Xem biên nhận" link đến `/receipt/{id}` |

### Chi tiết kỹ thuật

**1. PostCard Celebration Card (PostCard.tsx)**
- Thay block `{isCelebration && celebrationMeta && (...)}` (dòng 460-478) bằng card đầy đủ:
  - Avatar sender → ArrowRight → Avatar receiver (giống TipCelebrationReceipt)
  - Amount box với token logo, số lượng, tên token
  - Lời nhắn (nếu có)
  - Mini firework bursts + sparkles (framer-motion, lightweight - 3 fireworks, 5 sparkles)
  - Nút "Xem biên nhận" link đến `/receipt/{receipt_public_id}`
  - Nút phát nhạc chúc mừng (sử dụng audio từ `/audio/rich-1.mp3`)
- Giữ nguyên badge "Thiệp Tặng Thưởng" + countdown ở trên

**2. autoPostCelebration metadata mở rộng (GiftCoinDialog.tsx)**
- Thêm vào metadata object:
  - `sender_avatar`: senderAvatar
  - `receiver_avatar`: recipientUser?.avatar_url
  - `sender_wallet`: senderWallet (từ web3 context)
  - `receiver_wallet`: targetAddress
  - `explorer_url`: resolvedExplorer
  - `created_at`: new Date().toISOString()
  - `message`: celData.message

**3. autoSendDM gửi biên nhận (GiftCoinDialog.tsx)**
- Thay `message_type: "tip"` bằng `message_type: "tip_receipt"`
- Thêm `metadata`:
  ```json
  {
    "amount": 10000,
    "token_type": "camly_web3",
    "token_symbol": "CAMLY",
    "sender_name": "...",
    "receiver_name": "...",
    "sender_avatar": "...",
    "receiver_avatar": "...",
    "tx_hash": "0x...",
    "receipt_public_id": "...",
    "explorer_url": "https://bscscan.com",
    "message": "Tặng bạn...",
    "created_at": "2026-02-25T..."
  }
  ```

**4. TipReceiptMessageCard (file mới)**
- Card gradient vàng-hổ phách
- Header: token logo + "Biên nhận tặng thưởng"
- Sender → Receiver (avatar + tên)
- Amount box (token logo + số + label)
- Lời nhắn italic
- Thời gian
- Nút "📄 Xem biên nhận" link đến `/receipt/{receipt_public_id}`
- Nút "🔗 Xem trên BscScan" (nếu có tx_hash)

**5. MessageBubble.tsx**
- Thêm case `message_type === "tip_receipt"` trước case `"tip"`:
  ```tsx
  : message.message_type === "tip_receipt" ? (
    <TipReceiptMessageCard metadata={message.metadata} />
  )
  ```

### Tóm tắt
- **1 file mới**: `TipReceiptMessageCard.tsx`
- **3 file sửa**: `PostCard.tsx`, `GiftCoinDialog.tsx`, `MessageBubble.tsx`
- **0 thay đổi database** (metadata JSONB đã có sẵn, message_type không cần migration)

