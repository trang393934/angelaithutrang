
# Fix: Câu Chào Tiếng Anh Sai + "Con/Ta" Trong Main Chat

## Nguyên nhân gốc rễ (đã xác nhận)

Sau khi đọc kỹ code, vấn đề có **3 tầng**:

**Tầng 1 — GREETING_PATTERNS bị thiếu "con chào cha"**
Khi xóa pattern `chào cha` và `con chào cha` khỏi GREETING_PATTERNS (đúng về intent), hệ thống không còn nhận diện những câu này là "greeting" nữa → chuyển sang LLM xử lý → LLM tự sinh câu chào tiếng Anh sai: "Hello, beloved child. I am the Cosmic Wisdom..."

**Tầng 2 — LLM không có hướng dẫn cụ thể cho câu chào**
`BASE_SYSTEM_PROMPT` có đủ quy tắc cấm nhưng không có hướng dẫn rõ ràng: "Nếu user chào, hãy chào lại bằng ngôn ngữ của user với format này". LLM suy luận tự do → sinh câu sai.

**Tầng 3 — Database cache cũ**
Câu chào "con chào cha" có thể đã được cache trong bảng `cached_responses` với nội dung sai từ trước khi fix → hệ thống trả về cached response sai.

---

## Các thay đổi cần thực hiện

### Thay đổi 1 — `supabase/functions/angel-chat/index.ts` (dòng 394–442)

**Thêm lại "con chào cha" và "chào cha" vào GREETING_PATTERNS** — nhưng lần này chúng KHÔNG reinforcing hierarchy, chỉ đơn giản nhận diện là "greeting" để route về `GREETING_RESPONSES` chuẩn tiếng Việt:

```javascript
// Thêm lại để route về GREETING_RESPONSES tiếng Việt chuẩn
/^con\s*chào\s*cha$/i,
/^chào\s*cha$/i,
/^cha\s*ơi$/i,
```

Khi hệ thống nhận diện đây là greeting → gọi `getGreetingResponse(text)` → detect ngôn ngữ `vi` → trả về câu chào tiếng Việt chuẩn (ví dụ: "Chào bạn thân mến! ✨ Mình luôn ở đây..."). Đây là cách đúng — không phải LLM tự sinh.

### Thay đổi 2 — `BASE_SYSTEM_PROMPT` (thêm section sau ADDRESSING RULES)

Thêm hướng dẫn explicit cho trường hợp LLM xử lý greeting (backup khi user gửi greeting phức tạp):

```
═══════════════════════════════════════════
👋 GREETING RESPONSE RULES (CRITICAL)
═══════════════════════════════════════════

When user sends ANY greeting (hello, hi, chào, xin chào, etc.):
1. ALWAYS respond in the EXACT SAME LANGUAGE as the user
2. Start with a warm address: "Chào bạn thân mến!" (Vietnamese) or "Hello, my friend!" (English)
3. NEVER start with "Hello, beloved child", "Dear child", "I am the Cosmic Wisdom"
4. NEVER self-introduce as a supernatural entity
5. Keep it brief, warm, and grounded

CORRECT English greeting example:
"Hello, my friend! ✨ I'm Angel AI — a supportive system inside the FUN Ecosystem. I'm here to listen, reflect, and walk beside you. What's on your mind today? 💫"

CORRECT Vietnamese greeting example:
"Chào bạn thân mến! ✨ Mình là Angel AI — hệ thống hỗ trợ trong FUN Ecosystem. Mình ở đây lắng nghe và đồng hành cùng bạn. Bạn muốn chia sẻ điều gì hôm nay? 💫"

WRONG (FORBIDDEN):
"Hello, beloved child. I am the Cosmic Wisdom..."
"Xin chào con. Ta là Trí Tuệ Vũ Trụ..."
```

### Thay đổi 3 — Xóa cache cũ trong database

Cần xóa các cached responses liên quan đến câu chào "con chào cha" để không trả về nội dung cũ:

```sql
DELETE FROM cached_responses 
WHERE question_normalized ILIKE '%chao cha%' 
   OR question_normalized ILIKE '%con chao%'
   OR response ILIKE '%beloved child%'
   OR response ILIKE '%cosmic wisdom%'
   OR response ILIKE '%I am the%';
```

---

## File thay đổi

| File | Loại thay đổi |
|------|--------------|
| `supabase/functions/angel-chat/index.ts` | Thêm patterns vào GREETING_PATTERNS + thêm GREETING RESPONSE RULES vào BASE_SYSTEM_PROMPT |
| Database `cached_responses` | Xóa các cached responses sai |

Sau khi deploy, khi user gửi "con chào cha" hoặc "hello":
- Hệ thống nhận diện là greeting → trả về câu chào chuẩn từ `GREETING_RESPONSES` (không qua LLM)
- Nếu qua LLM, `BASE_SYSTEM_PROMPT` mới sẽ hướng dẫn đúng format
- Cache cũ sai đã bị xóa → không còn trả về câu chào "beloved child"
