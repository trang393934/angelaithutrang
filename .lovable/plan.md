
# Coordinator Gate - Tích hợp Cloudflare AI Gateway

## Tổng Quan
Cập nhật edge function `coordinator-chat` để sử dụng Cloudflare AI Gateway (như `angel-chat`), với cơ chế fallback tự động về Lovable Gateway khi Cloudflare gặp lỗi.

## Thay Đổi

### File: `supabase/functions/coordinator-chat/index.ts`

Thay thế phần gọi AI Gateway hiện tại (chỉ dùng Lovable) bằng logic dual-gateway:

1. **Thêm cấu hình Cloudflare AI Gateway**:
   - URL: `https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions`
   - Sử dụng secret `CF_API_TOKEN` (đã có sẵn trong hệ thống)
   - Model mapping: thêm prefix `google-ai-studio/` cho BYOK khi dùng Cloudflare

2. **Logic ưu tiên**:
   - Nếu có `CF_API_TOKEN` -> dùng Cloudflare Gateway + `CF_API_TOKEN` làm Authorization
   - Nếu không có -> dùng Lovable Gateway + `LOVABLE_API_KEY` làm Authorization (như hiện tại)

3. **Fallback tự động**:
   - Nếu Cloudflare trả lỗi (trừ 429/402) -> tự động gọi lại qua Lovable Gateway
   - Lỗi 429 (rate limit) và 402 (credits) trả thẳng về client, không fallback

4. **Logging**: Thêm log cho biết đang dùng gateway nào

## Chi Tiết Kỹ Thuật

Phần code thay đổi (khoảng dòng 207-250 trong coordinator-chat):

```typescript
// --- AI Gateway Config (ưu tiên Cloudflare, fallback Lovable) ---
const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions";
const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");
const AI_GATEWAY_URL = CF_API_TOKEN ? CF_GATEWAY_URL : LOVABLE_GATEWAY_URL;
const cfModel = (m: string) => CF_API_TOKEN ? m.replace("google/", "google-ai-studio/") : m;
const aiHeaders: Record<string, string> = { "Content-Type": "application/json" };
if (CF_API_TOKEN) {
  aiHeaders["Authorization"] = `Bearer ${CF_API_TOKEN}`;
} else {
  aiHeaders["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
}

// Gọi AI với model đã map
let response = await fetch(AI_GATEWAY_URL, { ... model: cfModel("google/gemini-3-flash-preview") ... });

// Fallback nếu Cloudflare lỗi (không phải 429/402)
if (!response.ok && CF_API_TOKEN && response.status !== 429 && response.status !== 402) {
  // Retry qua Lovable Gateway
  response = await fetch(LOVABLE_GATEWAY_URL, { ... Authorization: Bearer LOVABLE_API_KEY ... });
}
```

## Không cần thêm secret mới
`CF_API_TOKEN` đã được cấu hình sẵn cho `angel-chat`, secret này dùng chung cho toàn bộ edge functions trong project.
