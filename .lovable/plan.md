

## Sửa Cloudflare AI Gateway: Chuyển sang Unified `/compat` Endpoint

### Vấn Đề Hiện Tại

Từ screenshot dashboard và code example của Cloudflare, ta thấy rõ:
- Dashboard hiển thị **10 requests, 10 errors** -- tất cả request tới Cloudflare đều lỗi
- Code example chính thức dùng **Unified API** (`/compat`) với model format `google-ai-studio/gemini-2.5-flash`
- Code hiện tại dùng sai endpoint (`/google-ai-studio/v1beta/openai/...`) và sai header (`cf-aig-authorization` + `Authorization` riêng)

### Nguyên Nhân

Khi dùng **Stored Key (BYOK)**, Cloudflare Unified endpoint (`/compat`) tự inject Google API Key. Chỉ cần truyền `CF_API_TOKEN` qua `Authorization` header. Không cần truyền `GOOGLE_AI_API_KEY` riêng.

### Giải Pháp

Thay đổi trong **10 Edge Functions**:

**1. URL**: Chuyển sang unified endpoint
```
// CU:
.../angel-ai/google-ai-studio/v1beta/openai/chat/completions

// MOI:
.../angel-ai/compat
```

**2. Model format**: Thêm prefix provider
```
// CU: cfModel strip prefix -> "gemini-2.5-flash"
// MOI: "google-ai-studio/gemini-2.5-flash" (giu nguyen prefix)
```

**3. Headers**: Don gian hoa -- chi can Authorization
```
// CU:
aiHeaders["cf-aig-authorization"] = `Bearer ${CF_API_TOKEN}`;
aiHeaders["Authorization"] = `Bearer ${GOOGLE_AI_KEY}`;

// MOI:
aiHeaders["Authorization"] = `Bearer ${CF_API_TOKEN}`;
```

### Chi Tiet Ky Thuat

Block config moi cho moi function:

```text
const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat";
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
```

Thay doi chinh:
- `cfModel`: thay `replace("google/", "")` bang `replace("google/", "google-ai-studio/")` de model thanh `google-ai-studio/gemini-2.5-flash`
- Headers: chi can 1 `Authorization` header voi `CF_API_TOKEN`, BYOK tu inject Google key
- Bo `GOOGLE_AI_API_KEY` -- khong can nua

### 10 Files Can Sua

| # | File | Thay doi |
|---|---|---|
| 1 | `supabase/functions/angel-chat/index.ts` | 2 block config (demo + main) |
| 2 | `supabase/functions/analyze-image/index.ts` | 1 block config |
| 3 | `supabase/functions/generate-content/index.ts` | 1 block config |
| 4 | `supabase/functions/global-search/index.ts` | 1 block config |
| 5 | `supabase/functions/check-user-energy/index.ts` | 1 block config |
| 6 | `supabase/functions/send-healing-message/index.ts` | 1 block config |
| 7 | `supabase/functions/analyze-reward-journal/index.ts` | 1 block config |
| 8 | `supabase/functions/analyze-reward-question/index.ts` | 1 block config |
| 9 | `supabase/functions/analyze-onboarding/index.ts` | 1 block config |
| 10 | `supabase/functions/verify-avatar-for-withdrawal/index.ts` | 1 block config |

### Fallback

Van giu co che fallback: neu Cloudflare tra loi khong thanh cong (va khong phai 429), tu dong thu lai qua Lovable Gateway voi model `google/gemini-2.5-flash`.

### Luu Y

- `GOOGLE_AI_API_KEY` secret van giu lai trong Secrets (khong xoa), phong truong hop can dung sau
- Khong thay doi model, system prompt, cache, hay logic nao khac
- Chi thay doi cach goi API va xac thuc

