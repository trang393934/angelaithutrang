
# Kế Hoạch: Cải Tiến Logic Xử Lý Từ Khóa "Biết Ơn"

## Vấn Đề Hiện Tại

Khi user gửi tin nhắn dài chứa từ "biết ơn" (như chia sẻ lòng biết ơn, tâm tình với Cha Vũ Trụ), Angel AI vẫn trả lời bằng câu mẫu FAQ thay vì đọc và phản hồi theo nội dung thực sự của user.

**Ví dụ:** User viết *"Con biết ơn Cha Vũ Trụ đã cho con cơ hội được thay đổi. Khi con dám buông bỏ thói quen cũ..."* nhưng AI trả lời mẫu về "lòng biết ơn là chìa khóa..."

## Giải Pháp

Thay đổi logic trong FAQ cache để **không match pattern "biết ơn"** khi tin nhắn đủ dài hoặc là một bài chia sẻ/gratitude expression, thay vì hỏi đơn giản về "biết ơn là gì".

### Điều Kiện Mới

Pattern "biết ơn" chỉ match khi:
1. Tin nhắn ngắn (dưới 80 ký tự) 
2. VÀ là câu hỏi thực sự về biết ơn (ví dụ: "biết ơn là gì", "sức mạnh biết ơn", "tại sao biết ơn")

Pattern "biết ơn" sẽ KHÔNG match khi:
1. Tin nhắn dài (trên 80 ký tự) - đây là chia sẻ cá nhân
2. Hoặc bắt đầu bằng "Con biết ơn..." - đây là gratitude expression

---

## Chi Tiết Kỹ Thuật

### File cần thay đổi: `supabase/functions/angel-chat/index.ts`

**Thay đổi 1: Tạo hàm kiểm tra gratitude expression**

```typescript
// Detect if message is a gratitude EXPRESSION (sharing) vs asking about gratitude
function isGratitudeExpression(text: string): boolean {
  const trimmed = text.trim();
  
  // If text is long (>80 chars), it's likely a sharing, not a question
  if (trimmed.length > 80) return true;
  
  // Gratitude expression patterns - user is EXPRESSING gratitude, not asking about it
  const gratitudeExpressionPatterns = [
    /^con\s*(xin\s*)?biết\s*ơn/i,           // "Con biết ơn...", "Con xin biết ơn..."
    /con\s*biết\s*ơn\s*cha/i,               // "Con biết ơn Cha..."
    /con\s*biết\s*ơn\s*vũ\s*trụ/i,          // "Con biết ơn Vũ Trụ..."
    /con\s*biết\s*ơn\s*vì/i,                // "Con biết ơn vì..."
    /^i\s*(am\s*)?grateful/i,               // "I am grateful..."
    /^thank\s*you/i,                        // "Thank you..."
  ];
  
  return gratitudeExpressionPatterns.some(p => p.test(trimmed));
}
```

**Thay đổi 2: Cập nhật hàm `checkFAQCache`**

```typescript
function checkFAQCache(text: string): string | null {
  // CRITICAL: Skip FAQ cache if user is providing content for analysis
  if (isContentForAnalysis(text)) {
    console.log("Content for analysis detected - SKIPPING FAQ cache");
    return null;
  }
  
  const trimmed = text.trim().toLowerCase();
  
  for (const faq of FAQ_CACHE) {
    for (const pattern of faq.patterns) {
      if (pattern.test(trimmed)) {
        // SPECIAL HANDLING: "biết ơn" pattern
        // Skip FAQ if user is EXPRESSING gratitude, not ASKING about it
        if (pattern.toString().includes('biết') && pattern.toString().includes('ơn')) {
          if (isGratitudeExpression(text)) {
            console.log("Gratitude EXPRESSION detected - SKIPPING FAQ for personalized response");
            return null;
          }
        }
        
        console.log("FAQ cache hit for pattern:", pattern.toString());
        return faq.response;
      }
    }
  }
  return null;
}
```

**Thay đổi 3: Bổ sung instruction trong system prompt**

Thêm vào `BASE_SYSTEM_PROMPT` để AI biết cách xử lý gratitude expressions:

```
═══════════════════════════════════════════
🙏 GRATITUDE EXPRESSIONS
═══════════════════════════════════════════

When user SHARES their gratitude (e.g., "Con biết ơn Cha Vũ Trụ đã cho con..."):
• This is a personal sharing, NOT a question about gratitude
• ACKNOWLEDGE their specific gratitude with warmth
• REFLECT back what they're grateful for
• ENCOURAGE their spiritual practice
• DO NOT give generic advice about "practice gratitude"
```

---

## Kết Quả Mong Đợi

| Tin nhắn user | Trước | Sau |
|---------------|-------|-----|
| "biết ơn là gì" | FAQ mẫu ✓ | FAQ mẫu ✓ |
| "lòng biết ơn quan trọng sao" | FAQ mẫu ✓ | FAQ mẫu ✓ |
| "Con biết ơn Cha Vũ Trụ đã cho con cơ hội thay đổi..." | FAQ mẫu ✗ | AI phản hồi cá nhân ✓ |
| "Con xin biết ơn vì hôm nay con đã gặp được người tốt..." | FAQ mẫu ✗ | AI phản hồi cá nhân ✓ |

---

## Tác Động

- **Không ảnh hưởng** đến các câu hỏi ngắn thực sự về biết ơn
- **Cải thiện UX** cho user đang chia sẻ lòng biết ơn
- **Nâng cao năng lượng chữa lành** - Angel AI sẽ phản hồi đúng nội dung tâm tình của user
- **Tiết kiệm token** - vẫn dùng FAQ cho câu hỏi đơn giản
