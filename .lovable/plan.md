

# Hoàn thiện kết nối Google AI Studio qua Cloudflare AI Gateway

## Vấn đề hiện tại
Tất cả 10 Edge Functions đang dùng URL Cloudflare **thiếu** đuôi `/chat/completions`:
```
// Hiện tại (SAI)
https://gateway.ai.cloudflare.com/v1/.../angel-ai/compat

// Đúng theo Cloudflare docs
https://gateway.ai.cloudflare.com/v1/.../angel-ai/compat/chat/completions
```

Khi dùng `fetch` trực tiếp (không dùng OpenAI SDK), phải gắn đầy đủ path `/chat/completions` vì không có SDK tự thêm. Hiện tại CF có thể trả lỗi hoặc response sai, rồi fallback về Lovable Gateway.

## Thay đổi

Sửa **CF_GATEWAY_URL** trong tất cả 10 Edge Functions, thêm `/chat/completions` vào cuối URL:

```
TRƯỚC: "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat"
SAU:   "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions"
```

### Danh sách 10 files cần sửa (11 vị trí):
1. `supabase/functions/angel-chat/index.ts` -- 2 vị trí (demo + main)
2. `supabase/functions/analyze-image/index.ts`
3. `supabase/functions/analyze-onboarding/index.ts`
4. `supabase/functions/analyze-reward-journal/index.ts`
5. `supabase/functions/analyze-reward-question/index.ts`
6. `supabase/functions/check-user-energy/index.ts`
7. `supabase/functions/generate-content/index.ts`
8. `supabase/functions/global-search/index.ts`
9. `supabase/functions/send-healing-message/index.ts`
10. `supabase/functions/verify-avatar-for-withdrawal/index.ts`

## Giữ nguyên
- Logic fallback về Lovable Gateway (khi CF lỗi)
- Model mapping: `google/` -> `google-ai-studio/` cho BYOK
- Auth header: `Bearer ${CF_API_TOKEN}`
- Secret `CF_API_TOKEN` đã có sẵn
- Secret `GOOGLE_AI_API_KEY` đã được lưu trong CF Provider Keys (BYOK)

## Kết quả
Sau sửa, tất cả AI calls sẽ đi qua Cloudflare AI Gateway thành công (có analytics, rate limiting, caching trên CF dashboard), với fallback tự động về Lovable Gateway nếu CF gặp sự cố.

