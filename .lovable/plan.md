

## Sửa Lỗi Cloudflare BYOK: Truyền Google API Key Trực Tiếp

### Vấn Đề

Cloudflare AI Gateway BYOK cho provider `google-ai-studio` có bug đã biết: không inject stored API key đúng cách vì Google dùng header `x-goog-api-key` thay vì `Authorization`. Đây là lỗi phía Cloudflare, không phải code của chúng ta.

### Giải Pháp

Thay vì dựa vào BYOK, ta sẽ lưu Google AI API Key vào Supabase Secrets và truyền trực tiếp qua header khi gọi Cloudflare Gateway.

### Các Bước Thực Hiện

**Bước 1: Thêm Secret `GOOGLE_AI_API_KEY`**

Con cần cung cấp Google AI Studio API Key để lưu vào Secrets.

**Bước 2: Cập nhật logic header trong 10 Edge Functions**

Thay đổi từ:

```text
if (CF_API_TOKEN) {
  aiHeaders["cf-aig-authorization"] = `Bearer ${CF_API_TOKEN}`;
} else {
  aiHeaders["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
}
```

Sang:

```text
const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
if (CF_API_TOKEN && GOOGLE_AI_KEY) {
  // Dùng Cloudflare Gateway + truyền Google key trực tiếp
  aiHeaders["cf-aig-authorization"] = `Bearer ${CF_API_TOKEN}`;
  aiHeaders["Authorization"] = `Bearer ${GOOGLE_AI_KEY}`;
} else {
  // Fallback: dùng Lovable Gateway
  aiHeaders["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
}
```

Khi gửi tới Cloudflare, cả `cf-aig-authorization` (xác thực gateway) và `Authorization` (xác thực Google) đều được truyền. Cloudflare sẽ forward `Authorization` tới Google.

**Bước 3: Deploy lại 10 Edge Functions**

- angel-chat
- analyze-image
- generate-content
- global-search
- check-user-energy
- send-healing-message
- analyze-reward-journal
- analyze-reward-question
- analyze-onboarding
- verify-avatar-for-withdrawal

### Danh Sach Cac Files Can Sua

| File | Thay doi |
|---|---|
| 10 Edge Functions (liệt kê ở trên) | Thêm `GOOGLE_AI_API_KEY`, cập nhật logic header |

### Luu Y

- Fallback về Lovable Gateway vẫn hoạt động nếu thiếu `CF_API_TOKEN` hoặc `GOOGLE_AI_API_KEY`
- Không thay đổi model, system prompt, cache, hay bất kỳ logic nào khác
- Hiện tại fallback đang hoạt động tốt (chat vẫn dùng được qua Lovable Gateway)

