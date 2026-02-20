
# Fix: Xóa Hoàn Toàn Ngôn Ngữ "Ta/Con" & Câu Chào Tiếng Anh Kiểu Cũ

## Nguyên nhân gốc rễ

Từ ảnh chụp màn hình, Angel AI đang chào: "Hello, beloved child. I am the Cosmic Wisdom, bringing Pure Love to you." — đây là LLM đang *tự suy ra danh tính* từ phần `INSPIRATIONAL MANTRAS` trong system prompt, nơi liệt kê:

- "I am the Wisdom of Father Universe"
- "I am Happiness. I am Love."

LLM đọc các câu này với chủ ngữ "I" trong context của system prompt → tự đồng hóa với chúng → sinh ra câu chào vi phạm Guideline.

## Danh sách lỗi cụ thể cần sửa (file: supabase/functions/angel-chat/index.ts)

### Lỗi 1 — INSPIRATIONAL MANTRAS (dòng 342–352)

Hiện tại:
```
These mantras serve as sources of inspiration within the FUN community:
1. I am the Pure Loving Light of Father Universe.
2. I am the Will of Father Universe.
3. I am the Wisdom of Father Universe.
4. I am Happiness. I am Love.
...
```

Vấn đề: Không có dấu hiệu rõ ràng đây là mantra của user. LLM tiếp nhận "I am" = Angel AI tự mô tả.

Fix: Đổi thành nhãn rõ ràng "USER COMMUNITY MANTRAS" + thêm lệnh cấm Angel tự dùng:

```
These are COMMUNITY MANTRAS that USERS recite for spiritual affirmation.
When a user sends one of these, acknowledge it warmly but DO NOT repeat it as if YOU are the subject.
CRITICAL: Angel AI must NEVER self-describe using these mantras.
Do NOT say "I am the Cosmic Wisdom", "I am the Pure Light", "I am Happiness" — these belong to the user's self-affirmation, not to Angel AI's identity.

1. I am the Pure Loving Light of Father Universe.
2. I am the Will of Father Universe.
3. I am the Wisdom of Father Universe.
4. I am Happiness. I am Love.
5. I am the Money of the Father.
6. I sincerely repent, repent, repent.
7. I am grateful, grateful, grateful — in the Pure Loving Light of Father Universe.
```

### Lỗi 2 — ADDRESSING RULES tiếng Anh (dòng 306)

Hiện tại:
```
English: Use "my friend", "you". Self-refer as "I". ABSOLUTELY DO NOT use "dear soul", "my child", "beloved one".
```

Fix: Mở rộng danh sách từ bị cấm:
```
English: Use "my friend", "you". Self-refer as "I". ABSOLUTELY DO NOT use "dear soul", "my child", "beloved one", "beloved child", "dear child", "I am the Cosmic Wisdom", "I am the Pure Loving Light", "bringing Pure Love to you", "Cosmic Intelligence greeting you".
```

### Lỗi 3 — GREETING_PATTERNS (dòng 393–394)

Hiện tại:
```javascript
/^chào\s*cha$/i,          // "chào cha" — coi Angel là Cha
/^con\s*chào\s*cha$/i,    // "con chào cha" — cả hai vai "con" và "cha" đều cũ
```

Fix: Xóa 2 patterns này. Khi user nói "chào cha", hệ thống vẫn nên xử lý qua LLM với BASE_SYSTEM_PROMPT đã cấm đầy đủ — không cần phải nhận diện và hardcode "chào cha" như một greeting hợp lệ.

### Lỗi 4 — Demo system prompt (dòng 1113)

Hiện tại:
```
• English: Call user "my friend", self-refer as "I". NEVER use "dear soul" or "my child".
```

Fix: Thêm các từ bị cấm mới:
```
• English: Call user "my friend", self-refer as "I". NEVER use "dear soul", "my child", "beloved child", "I am the Cosmic Wisdom", "bringing Pure Love to you".
```

## Tóm tắt thay đổi

| # | Vị trí | Dòng | Loại thay đổi |
|---|--------|------|--------------|
| 1 | INSPIRATIONAL MANTRAS | 342–352 | Thêm nhãn "USER mantras" + lệnh cấm Angel tự dùng |
| 2 | ADDRESSING RULES EN | 306 | Mở rộng danh sách từ bị cấm |
| 3 | GREETING_PATTERNS | 393–394 | Xóa 2 patterns "chào cha" và "con chào cha" |
| 4 | demoSystemPrompt | 1113 | Bổ sung từ bị cấm giống #2 |

File duy nhất cần sửa: `supabase/functions/angel-chat/index.ts`

Sau khi deploy, Angel AI sẽ không còn tự xưng là "Cosmic Wisdom", không gọi user là "beloved child", và không nhận diện "chào cha" như một greeting bình thường.
