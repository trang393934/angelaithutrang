
# Kế hoạch: Cải thiện Angel AI xử lý query tìm kiếm thông minh hơn

## Vấn đề phát hiện

Khi người dùng tìm kiếm "Camly Dương" từ Global Search và click "Hỏi Angel AI":
1. Query được chuyển sang Chat page với URL: `/chat?q=Camly Dương`
2. Chat page gửi trực tiếp "Camly Dương" đến angel-chat 
3. Angel AI **không nhận ra đây là một câu hỏi về thông tin** nên trả lời bằng lời chào chung chung
4. Kết quả: Không tìm kiếm trong knowledge base dù có 10+ tài liệu về Camly Dương

## Giải pháp

### Phần 1: Cải thiện cách format query từ GlobalSearch

**File:** `src/components/GlobalSearch.tsx`

Khi chuyển sang Chat page, thay vì gửi query gốc, ta sẽ format thành câu hỏi thực sự:

```text
Trước: /chat?q=Camly Dương
Sau:   /chat?q=Cho con biết về Camly Dương&isSearch=true
```

Thêm flag `isSearch=true` để Chat biết đây là query từ tìm kiếm.

### Phần 2: Chat page xử lý query tìm kiếm đặc biệt

**File:** `src/pages/Chat.tsx`

Khi nhận query có `isSearch=true`:
- Format lại thành câu hỏi hoàn chỉnh nếu chỉ là từ khóa
- Thêm ngữ cảnh "Người dùng đang tìm kiếm thông tin về..."

### Phần 3: Angel Chat nhận diện intent tìm kiếm

**File:** `supabase/functions/angel-chat/index.ts`

Thêm logic phát hiện khi người dùng đang hỏi về một chủ đề/người cụ thể:

```text
Patterns mới:
- Chỉ tên riêng: "Camly Dương", "Cha Vũ Trụ", "8 câu thần chú"
- Từ khóa đơn: "thiền định", "năng lượng", "chữa lành"

Khi phát hiện → Tự động tìm trong knowledge_documents
→ Trả lời với thông tin từ knowledge base
```

## Chi tiết Implementation

### Thay đổi 1: GlobalSearch format query thông minh

```typescript
// src/components/GlobalSearch.tsx
const handleAskAngel = () => {
  setIsOpen(false);
  
  // Format query thành câu hỏi nếu chỉ là từ khóa
  const formattedQuery = formatSearchQueryToQuestion(query);
  navigate(`/chat?q=${encodeURIComponent(formattedQuery)}&isSearch=true`);
  setQuery("");
};

function formatSearchQueryToQuestion(query: string): string {
  const trimmed = query.trim();
  
  // Nếu đã là câu hỏi hoàn chỉnh, giữ nguyên
  if (trimmed.endsWith('?') || 
      /^(cho con|hãy|làm sao|là gì|như thế nào)/i.test(trimmed)) {
    return trimmed;
  }
  
  // Format thành câu hỏi
  return `Cho con biết thông tin về "${trimmed}"`;
}
```

### Thay đổi 2: Chat page xử lý isSearch flag

```typescript
// src/pages/Chat.tsx
useEffect(() => {
  const questionFromQuery = searchParams.get("q");
  const isSearchQuery = searchParams.get("isSearch") === "true";
  
  if (questionFromQuery && hasAgreed && !hasProcessedQuery && !isLoading) {
    setHasProcessedQuery(true);
    setSearchParams({}, { replace: true });
    
    // Nếu từ tìm kiếm, đánh dấu để edge function biết cần search knowledge
    const finalMessage = isSearchQuery 
      ? `[SEARCH_INTENT] ${questionFromQuery}`
      : questionFromQuery;
      
    setTimeout(() => {
      sendMessage(finalMessage);
    }, 300);
  }
}, [...]);
```

### Thay đổi 3: Angel Chat phát hiện search intent

```typescript
// supabase/functions/angel-chat/index.ts

// Detect if message is a search/info request
function isSearchIntent(message: string): boolean {
  // Check for explicit search marker
  if (message.startsWith('[SEARCH_INTENT]')) return true;
  
  // Check for name patterns (2-4 words, title case)
  if (/^[A-ZÀÁẢÃẠ][a-zàáảãạ]+(\s+[A-ZÀÁẢÃẠ][a-zàáảãạ]+){0,3}$/u.test(message.trim())) {
    return true;
  }
  
  // Check for info-seeking patterns
  const infoPatterns = [
    /cho con biết.*về/i,
    /thông tin.*về/i,
    /giới thiệu.*về/i,
    /(ai|là gì|là ai)\s*$/i,
  ];
  
  return infoPatterns.some(p => p.test(message));
}

// Trong main handler:
if (isSearchIntent(userQuestion)) {
  // Force knowledge search với keyword từ query
  const searchKeyword = userQuestion.replace('[SEARCH_INTENT]', '').trim();
  // Tìm trong knowledge_documents với keyword này
  // Trả lời dựa trên kết quả tìm kiếm
}
```

### Thay đổi 4: Cải thiện Knowledge Search

Khi phát hiện search intent, tìm kiếm mở rộng hơn:

```typescript
// Tìm tất cả documents liên quan
const { data: documents } = await supabase
  .from("knowledge_documents")
  .select("title, description, extracted_content")
  .or(`title.ilike.%${searchKeyword}%,extracted_content.ilike.%${searchKeyword}%`)
  .limit(5);

// Build AI prompt với context từ knowledge
const searchContext = documents?.map(d => 
  `📚 ${d.title}\n${d.extracted_content?.substring(0, 1500)}`
).join('\n\n---\n\n');

// System prompt đặc biệt cho search intent
const searchSystemPrompt = `
Người dùng đang TÌM KIẾM THÔNG TIN về: "${searchKeyword}"

KIẾN THỨC TÌM ĐƯỢC:
${searchContext}

HƯỚNG DẪN:
- Tổng hợp thông tin từ kiến thức trên
- Nếu có nhiều tài liệu, liệt kê các nội dung chính
- Trả lời TRỰC TIẾP vào chủ đề được hỏi
- KHÔNG chào hỏi dài dòng
`;
```

## Luồng xử lý mới

```text
┌───────────────────────────────────────────────────────────┐
│  User tìm kiếm: "Camly Dương"                             │
│         ↓                                                 │
│  GlobalSearch format: "Cho con biết về Camly Dương"       │
│         ↓                                                 │
│  Navigate: /chat?q=...&isSearch=true                      │
│         ↓                                                 │
│  Chat.tsx: Gửi với marker [SEARCH_INTENT]                 │
│         ↓                                                 │
│  angel-chat: Phát hiện search intent                      │
│         ↓                                                 │
│  Tìm kiếm knowledge_documents: 10+ docs về Camly Dương    │
│         ↓                                                 │
│  AI trả lời với context từ knowledge base ✅               │
└───────────────────────────────────────────────────────────┘
```

## Kết quả mong đợi

| Trước | Sau |
|-------|-----|
| "Camly Dương" → Lời chào chung | "Camly Dương" → Thông tin từ 10+ tài liệu |
| Không tìm knowledge | Tự động tìm và tổng hợp |
| Trả lời dài dòng, lạc đề | Trả lời đúng trọng tâm |

## Files cần chỉnh sửa

1. **`src/components/GlobalSearch.tsx`**
   - Format query thành câu hỏi
   - Thêm isSearch flag

2. **`src/pages/Chat.tsx`**  
   - Xử lý isSearch flag
   - Thêm marker cho edge function

3. **`supabase/functions/angel-chat/index.ts`**
   - Phát hiện search intent
   - Mở rộng knowledge search cho search queries
   - System prompt đặc biệt cho search mode
