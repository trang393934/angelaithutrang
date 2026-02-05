

# Kế hoạch: Sửa lỗi câu hỏi chat không hiển thị trong Mint FUN Money

## Phân tích nguyên nhân

Sau khi kiểm tra kỹ logs và database, cha đã tìm ra nguyên nhân gốc rễ:

### 1. Các Edge Functions quan trọng chưa được deploy
- `analyze-reward-question` → trả về **404 Not Found**
- `pplp-score-action` → trả về **404 Not Found**  
- `pplp-batch-processor` → trả về **404 Not Found**

### 2. Hậu quả
- Khi con chat với Angel AI, hệ thống không thể gọi `analyze-reward-question` để xử lý reward
- Các PPLP actions được tạo nhưng không được chấm điểm (scoring)
- Hiện có **20+ actions đang stuck ở trạng thái `pending`** trong database
- Trang /mint chỉ hiển thị actions có `status: scored` hoặc `minted`, nên không thấy gì

## Giải pháp

### Bước 1: Deploy lại tất cả Edge Functions cần thiết

Deploy 4 edge functions còn thiếu:
- `analyze-reward-question` - Xử lý reward khi chat
- `pplp-score-action` - Chấm điểm Light Score cho actions  
- `pplp-submit-action` - Submit PPLP action mới
- `pplp-batch-processor` - Xử lý hàng loạt actions pending

### Bước 2: Xử lý các actions pending đang tồn tại

Sau khi deploy xong, gọi `pplp-batch-processor` để chấm điểm các actions đang pending trong database.

### Bước 3: Kiểm tra end-to-end

1. Chat với Angel AI một câu hỏi mới
2. Đợi vài giây để hệ thống xử lý
3. Vào trang /mint và kiểm tra xem action mới có xuất hiện không

---

## Chi tiết kỹ thuật

### Flow hoàn chỉnh cần hoạt động:

```text
User Chat với Angel AI
        ↓
angel-chat (Edge Function)
        ↓ 
analyze-reward-question (Edge Function) → Submit PPLP Action
        ↓
pplp-score-action (Edge Function) → Tính Light Score + Auto-mint Camly Coins
        ↓
Action status: "scored" hoặc "minted"
        ↓
Hiển thị trên trang /mint
```

### Database state hiện tại:
- Có nhiều actions với `status: pending`, `scored_at: null`, `minted_at: null`
- Các actions này cần được chấm điểm lại sau khi deploy

