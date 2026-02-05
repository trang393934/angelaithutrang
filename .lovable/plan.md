
# KẾ HOẠCH: Kích hoạt Auto-Scoring cho PPLP

## I. TÌNH HUỐNG HIỆN TẠI

**Phát hiện:** Light Actions đã submit thành công nhưng không được chấm điểm tự động.

| Thành phần | Trạng thái | Ghi chú |
|------------|-----------|---------|
| `pplp-submit-action` | Hoạt động | Ghi nhận action → status: `pending` |
| `pplp-score-action` | Hoạt động | Nhưng KHÔNG được gọi tự động |
| `pplp-batch-processor` | Hoạt động | Thiết kế cho cron job, chưa setup |

**Database hiện tại:** 10+ actions đang ở status `pending`, chưa có `scored_at`.

---

## II. GIẢI PHÁP

### Bước 1: Chạy Batch Processor để xử lý Actions đang Pending

Gọi edge function `pplp-batch-processor` để chấm điểm tất cả actions hiện có.

### Bước 2: Tích hợp Auto-Scoring vào Flow

Cập nhật `pplp-submit-action` để **tự động gọi** `pplp-score-action` ngay sau khi submit thành công.

**Logic mới:**
```text
User Chat → pplp-submit-action 
            → Insert action (pending)
            → Gọi pplp-score-action
            → Update status (scored/minted)
            → Return kết quả
```

---

## III. CHI TIẾT KỸ THUẬT

### File cần sửa: `supabase/functions/pplp-submit-action/index.ts`

**Thêm code sau khi insert action thành công:**

```typescript
// After successful action insert, auto-trigger scoring
try {
  const scoreResponse = await fetch(`${supabaseUrl}/functions/v1/pplp-score-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ action_id: action.id }),
  });
  
  if (scoreResponse.ok) {
    const scoreResult = await scoreResponse.json();
    console.log(`[PPLP] Auto-scored action ${action.id}: ${scoreResult.decision}`);
    
    // Include score result in response
    return new Response(JSON.stringify({
      success: true,
      action_id: action.id,
      status: scoreResult.decision === 'pass' ? 'scored' : 'rejected',
      light_score: scoreResult.light_score,
      final_reward: scoreResult.final_reward,
      auto_scored: true,
    }), { headers });
  }
} catch (scoreError) {
  console.error('[PPLP] Auto-scoring failed, will be processed by batch:', scoreError);
  // Continue without failing - batch processor will handle later
}
```

---

## IV. WORKFLOW SAU KHI CẬP NHẬT

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    UPDATED PPLP FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. User thực hiện hành động (chat, post, donate...)                │
│                         ↓                                            │
│  2. Frontend gọi pplp-submit-action                                  │
│                         ↓                                            │
│  3. Insert action vào DB (status: pending)                           │
│                         ↓                                            │
│  4. AUTO: Gọi pplp-score-action                                      │
│                         ↓                                            │
│  5. Chấm điểm 5-pillar → Tính Light Score                           │
│                         ↓                                            │
│  6. Nếu PASS → Auto-mint Camly Coins                                 │
│                         ↓                                            │
│  7. Update status: scored/minted                                     │
│                         ↓                                            │
│  8. Return kết quả cho Frontend                                      │
│                                                                      │
│  FALLBACK: pplp-batch-processor chạy mỗi 15 phút                    │
│            xử lý các actions bị miss real-time                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## V. KẾ HOẠCH THỰC HIỆN

| Bước | Hành động | Thời gian |
|------|-----------|-----------|
| 1 | Chạy batch processor để xử lý actions pending hiện tại | 1 phút |
| 2 | Cập nhật `pplp-submit-action` với auto-scoring | 10 phút |
| 3 | Deploy và test | 5 phút |
| 4 | Xác nhận flow hoạt động end-to-end | 5 phút |

**Tổng cộng:** ~20 phút

---

## VI. KẾT QUẢ MONG ĐỢI

Sau khi cập nhật:
- User chat với Angel AI → Action được submit + chấm điểm **NGAY LẬP TỨC**
- UI Mint page hiển thị action với Light Score và Reward
- Không còn tình trạng "Đang chờ chấm điểm..." kéo dài
- Batch processor vẫn chạy như backup để xử lý edge cases

---

## VII. TRẠNG THÁI HOÀN THÀNH

| Bước | Trạng thái |
|------|-----------|
| Chạy batch processor | ✅ Hoàn thành - 2 actions scored |
| Cập nhật pplp-submit-action | ✅ Deployed - Auto-scoring enabled |
| Cập nhật pplp-score-action | ✅ Fixed duplicate key handling |

**Auto-scoring đã hoạt động.** User chat với Angel AI → Action được score ngay lập tức!
