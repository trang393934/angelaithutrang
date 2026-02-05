

# Kế hoạch: Sửa lỗi Action "đang xử lý" không được chấm điểm tự động

## Vấn đề đã xác định

### 1. Action pending mới nhất
- **ID**: `663f26b8-7544-4eb0-9ee1-626d63b291c6`
- **Thời gian**: 12:51 UTC (khoảng 30 phút trước)
- **Status**: `pending` (chưa được chấm điểm)
- **scored_at**: `null`

### 2. Nguyên nhân gốc rễ
Edge function `analyze-reward-question` hiện tại:
- Dòng 621: Gọi `submitPPLPAction()` - chỉ **TẠO** action với status `pending`
- **KHÔNG** gọi `submitAndScorePPLPAction()` - function này mới **TỰ ĐỘNG CHẤM ĐIỂM**

```typescript
// Hiện tại (CHỈ TẠO, KHÔNG CHẤM ĐIỂM):
const pplpResult = await submitPPLPAction(supabase, { ... });

// Cần sửa thành (TẠO + CHẤM ĐIỂM NGAY):
const pplpResult = await submitAndScorePPLPAction(supabase, { ... });
```

### 3. Tại sao các action cũ được scored?
- Các action cũ được chấm điểm nhờ `pplp-batch-processor` chạy định kỳ
- Nhưng batch processor chưa được trigger cho action mới nhất này

---

## Giải pháp

### Bước 1: Sửa `analyze-reward-question` để chấm điểm ngay lập tức

Thay đổi từ `submitPPLPAction` sang `submitAndScorePPLPAction`:

```typescript
// File: supabase/functions/analyze-reward-question/index.ts

// Cập nhật import (dòng 3):
import { 
  submitAndScorePPLPAction,  // <-- Thêm function này
  PPLP_ACTION_TYPES, 
  generateContentHash 
} from "../_shared/pplp-helper.ts";

// Thay đổi dòng 621:
const pplpResult = await submitAndScorePPLPAction(supabase, {
  action_type: PPLP_ACTION_TYPES.QUESTION_ASK,
  actor_id: userId,
  // ... rest of params
});

// Log kết quả scoring
if (pplpResult.success) {
  console.log(`[PPLP] Action ${pplpResult.action_id} scored=${pplpResult.scored}, minted=${pplpResult.minted}`);
}
```

### Bước 2: Deploy lại edge functions

Deploy:
- `analyze-reward-question` (với fix trên)
- `pplp-score-action` (đảm bảo đã deploy)

### Bước 3: Xử lý action pending hiện tại

Chạy batch processor hoặc gọi trực tiếp `pplp-score-action` để chấm điểm action đang pending.

---

## Chi tiết kỹ thuật

### Flow sau khi fix:

```text
User gửi câu hỏi → angel-chat trả lời
        ↓
  analyzeAndReward() (Frontend)
        ↓
  analyze-reward-question (Edge Function)
        ↓
  submitAndScorePPLPAction()   ← SỬA Ở ĐÂY
        ├─→ INSERT pplp_actions (status: pending)
        └─→ CALL pplp-score-action 
              ├─→ Tính Light Score
              ├─→ UPDATE status → 'scored' hoặc 'minted'
              └─→ Trả về kết quả
        ↓
  Action hiển thị ngay trong /mint với trạng thái "Sẵn sàng claim"
```

### Database state hiện tại:
| action_id | status | scored_at |
|-----------|--------|-----------|
| 663f26b8... | **pending** | null |
| dc9d1e22... | minted | 2026-02-05 07:45 |
| 5a3ddd87... | minted | 2026-02-05 04:44 |
| ... | scored | ... |

### File cần sửa:
1. `supabase/functions/analyze-reward-question/index.ts`
   - Dòng 3: Thêm import `submitAndScorePPLPAction`
   - Dòng 621: Thay `submitPPLPAction` → `submitAndScorePPLPAction`

---

## Kết quả mong đợi

Sau khi triển khai:
1. Khi con chat với Angel AI, action sẽ được **chấm điểm ngay lập tức** (không cần đợi batch processor)
2. Action mới sẽ xuất hiện trong /mint với trạng thái "Sẵn sàng claim" thay vì "Đang xử lý"
3. Flow nhanh hơn ~15 phút (không cần đợi batch processor cycle)

