

# Kế hoạch: Sửa lỗi Câu hỏi Chat không hiển thị trong Mint FUN Money

## Phân tích nguyên nhân

Sau khi kiểm tra chi tiết, cha xác định được vấn đề chính:

### 1. Edge Function `analyze-reward-question` không phản hồi
- Không có network request từ frontend đến function này trong logs gần đây
- Function logs chỉ thấy "shutdown" - không có processing logs
- Câu hỏi chat cuối cùng được xử lý là lúc 7:39 sáng (5+ tiếng trước)

### 2. Hậu quả  
- Khi con chat với Angel AI, hệ thống nhận câu trả lời nhưng **không gọi được `analyze-reward-question`**
- Không có thông báo thưởng hiển thị (+Camly Coin)
- Không có PPLP Action mới nào được tạo → Không hiển thị trong /mint

### 3. Flow hiện tại bị đứt
```
User gửi câu hỏi → angel-chat trả lời (OK)
                 ↓
           analyzeAndReward() được gọi sau 500ms
                 ↓
           supabase.functions.invoke("analyze-reward-question") ← LỖI Ở ĐÂY
                 ↓
           [Không có response/timeout silently]
```

---

## Giải pháp

### Bước 1: Deploy lại edge function với version tracking

Thêm version logging để theo dõi deployment và debug:

```typescript
// Thêm vào đầu analyze-reward-question/index.ts
const VERSION = "v2.0.1";
console.log(`[analyze-reward-question ${VERSION}] Function booted at ${new Date().toISOString()}`);
```

### Bước 2: Cải thiện error handling phía frontend

Hiện tại `analyzeAndReward()` có try-catch nhưng chỉ log lỗi ra console. Cần thêm thông báo cho user biết khi có lỗi xảy ra.

### Bước 3: Thêm retry logic

Nếu request đầu tiên thất bại, tự động retry 1 lần sau 2 giây.

---

## Chi tiết kỹ thuật

### File cần sửa:

1. **`supabase/functions/analyze-reward-question/index.ts`**
   - Thêm VERSION constant và logging
   - Đảm bảo function handle tất cả edge cases

2. **`src/pages/Chat.tsx`** (function `analyzeAndReward`)
   - Thêm timeout handling (hiện không có timeout)
   - Thêm retry logic cho network failures
   - Hiển thị error toast khi thất bại hoàn toàn

### Cải tiến `analyzeAndReward`:

```typescript
const analyzeAndReward = useCallback(async (questionText: string, aiResponse: string) => {
  if (!user) return;
  
  let retries = 0;
  const maxRetries = 2;
  
  while (retries < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const { data, error } = await supabase.functions.invoke("analyze-reward-question", {
        body: { questionText, aiResponse },
      });
      
      clearTimeout(timeoutId);
      
      if (error) throw error;
      
      // Handle success...
      if (data?.rewarded) {
        setCurrentReward({...});
        refreshBalance();
      }
      return; // Success, exit loop
      
    } catch (error) {
      retries++;
      console.error(`Reward analysis attempt ${retries} failed:`, error);
      
      if (retries >= maxRetries) {
        toast.error("Không thể xử lý thưởng. Vui lòng thử lại sau.");
      } else {
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
      }
    }
  }
}, [user, refreshBalance]);
```

---

## Sau khi triển khai

1. Deploy edge function `analyze-reward-question`
2. Con chat 1 câu hỏi mới với Angel AI 
3. Kiểm tra:
   - Có hiện thông báo thưởng (+Camly Coin) không?
   - Vào /mint có thấy Light Action mới không?
4. Nếu vẫn lỗi, kiểm tra edge function logs để xem version mới đã deploy chưa

