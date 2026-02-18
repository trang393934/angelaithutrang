
# Kế hoạch: Hiển thị thông tin chủ ví khi nhập địa chỉ ví trong mục Tặng Thưởng

## Phân tích hiện trạng

File `src/components/gifts/CryptoTransferTab.tsx` đã có logic tra cứu chủ ví (lines 102-156):
- Khi người dùng nhập đủ 42 ký tự địa chỉ ví hợp lệ (0x...), hệ thống query `user_wallet_addresses` và fallback sang `coin_withdrawals`
- Kết quả được lưu vào `walletOwner` state
- UI hiện tại (lines 436-455) đã hiển thị avatar + tên + badge xác nhận

## Vấn đề cần cải thiện

Mặc dù logic đã có, UX còn thiếu một số điểm:

1. **Card hiển thị walletOwner quá nhỏ và không nổi bật** — người dùng dễ bỏ qua thông tin xác nhận chủ ví
2. **Không có trạng thái "ví lạ" (không tìm thấy trong hệ thống)** — khi không có chủ ví, UI im lặng, không có phản hồi cho người dùng biết ví này là ví ngoài hệ thống
3. **Thiếu cảnh báo nhập ví của chính mình** — hiện tại không có kiểm tra người dùng tự gửi cho mình
4. **Animation/transition thiếu** — card xuất hiện đột ngột, không có hiệu ứng mượt mà

## Thay đổi cần thực hiện

### File duy nhất: `src/components/gifts/CryptoTransferTab.tsx`

#### Cải thiện 1: Card xác nhận chủ ví được nâng cấp

Thay thế card đơn giản (lines 443-455) bằng card đẹp hơn:

```text
Trước:
┌─────────────────────────────────┐
│ [Avatar] Tên người dùng    ✓   │
│          Chủ sở hữu ví này     │
└─────────────────────────────────┘

Sau:
┌─────────────────────────────────────┐
│  ✅ Tìm thấy chủ ví trong hệ thống  │
│  ┌──────────────────────────────┐   │
│  │ [Avatar 48px]  Tên đầy đủ   │   │
│  │               @handle (nếu có)│  │
│  │               [badge xanh ✓]  │   │
│  └──────────────────────────────┘   │
│  Địa chỉ: 0x1234...5678             │
└─────────────────────────────────────┘
```

#### Cải thiện 2: Trạng thái "ví ngoài hệ thống"

Khi `walletAddress` hợp lệ nhưng `walletOwner === null` và `!isLookingUpWallet`:

```text
┌──────────────────────────────────────┐
│  ⚠️ Ví ngoài hệ thống Angel AI       │
│  Ví này chưa đăng ký trong hệ thống. │
│  Giao dịch sẽ gửi đến:               │
│  0x1234...abcd                        │
│  (Bạn vẫn có thể tiếp tục chuyển)    │
└──────────────────────────────────────┘
```

#### Cải thiện 3: Cảnh báo tự gửi cho mình

Kiểm tra thêm: nếu `walletOwner?.user_id === user?.id`, hiển thị cảnh báo:
```text
⚠️ Đây là ví của chính bạn!
```

#### Cải thiện 4: Thêm framer-motion animation

Wrap card bằng `AnimatePresence` + `motion.div` để card xuất hiện mượt mà khi tìm thấy kết quả.

## Chi tiết kỹ thuật

| State | Hiển thị |
|-------|---------|
| `isLookingUpWallet === true` | Spinner "Đang tìm chủ ví..." |
| `walletOwner !== null` và `user_id !== currentUser` | Card xanh lá với avatar + tên |
| `walletOwner !== null` và `user_id === currentUser` | Card vàng với cảnh báo "Ví của bạn" |
| `walletOwner === null` và ví hợp lệ 42 ký tự | Card cam với "Ví ngoài hệ thống" |
| Ví chưa đủ 42 ký tự hoặc không bắt đầu bằng 0x | Không hiển thị gì |

## Import cần thêm

```typescript
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react"; // icon cảnh báo
```

## Kết quả mong đợi

- Khi nhập địa chỉ ví của người dùng đã đăng ký trong hệ thống: card xanh lá hiển thị avatar + tên đầy đủ với animation mượt
- Khi nhập địa chỉ ví ngoài hệ thống: card cam cảnh báo nhẹ, vẫn cho phép chuyển
- Khi nhập địa chỉ ví của chính mình: card vàng cảnh báo
- Toàn bộ chỉ chỉnh sửa 1 file duy nhất: `src/components/gifts/CryptoTransferTab.tsx`
