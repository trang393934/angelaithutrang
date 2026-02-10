

## Kế Hoạch Cuối Cùng: Chuyển Đổi Angel AI Sang Cloudflare AI Gateway

### I. Mục Tiêu

1. **Tự chủ hạ tầng AI** — không phụ thuộc Lovable AI Gateway cho 90% lượng gọi.
2. **Monitoring & Analytics** — theo dõi requests, latency, errors trên Cloudflare Dashboard.
3. **Caching thông minh** — bổ sung tầng cache thứ 4 (Cloudflare Gateway) trên 3 tầng cache nội bộ hiện có.
4. **Ổn định tuyệt đối** — cơ chế fallback tự động về Lovable Gateway khi Cloudflare gặp sự cố.
5. **Giữ nguyên chất lượng** — vẫn dùng `gemini-2.5-flash`, KHÔNG hạ cấp model.

---

### II. Kiến Trúc Sau Chuyển Đổi

```text
User (Browser)
  |
  v
angel.fun.rich (React/Vite Frontend) — không chứa API key
  |
  v
Supabase Edge Functions (AI Hub)
  |-- Xác thực JWT / API Key
  |-- Rate limit & quota (ai_usage_tracking)
  |-- 3 tầng cache nội bộ (Greeting / FAQ / DB)
  |
  |--- [10 Functions TEXT] --> Cloudflare Gateway --> Google Gemini
  |         (fallback) -----> Lovable Gateway ----> Google Gemini
  |
  |--- [2 Functions ẢNH] ---> Lovable Gateway ----> Google Gemini
  |         (giữ nguyên vì cần modalities: ["image","text"])
```

---

### III. Phân Bổ Edge Functions

#### Nhóm A — Chuyển sang Cloudflare Gateway (10 functions)

| # | Edge Function | Model | Streaming |
|---|---|---|---|
| 1 | `angel-chat` (vị trí 1 — demo, dòng 988) | `google/gemini-2.5-flash` | Không |
| 2 | `angel-chat` (vị trí 2 — main, dòng 1336) | `google/gemini-2.5-flash` | Có (SSE) |
| 3 | `analyze-image` | `google/gemini-2.5-flash` | Có (SSE) |
| 4 | `generate-content` | `google/gemini-2.5-flash` | Không |
| 5 | `check-user-energy` | `google/gemini-2.5-flash-lite` | Không |
| 6 | `send-healing-message` | `google/gemini-2.5-flash-lite` | Không |
| 7 | `analyze-reward-journal` | `google/gemini-2.5-flash-lite` | Không |
| 8 | `analyze-reward-question` | `google/gemini-2.5-flash-lite` | Không |
| 9 | `analyze-onboarding` | `google/gemini-2.5-flash-lite` | Không |
| 10 | `global-search` | `google/gemini-2.5-flash` | Không |
| 11 | `verify-avatar-for-withdrawal` | `google/gemini-2.5-flash` | Không |

#### Nhóm B — Giữ nguyên trên Lovable Gateway (2 functions)

| # | Edge Function | Model | Lý do |
|---|---|---|---|
| 1 | `generate-image` | `google/gemini-3-pro-image-preview` | Cần `modalities: ["image","text"]` |
| 2 | `edit-image` | `google/gemini-3-pro-image-preview` | Cần `modalities: ["image","text"]` |

---

### IV. Chi Tiết Kỹ Thuật

#### 4.1. Bước bắt buộc: Thêm Secret `CF_API_TOKEN`

Con cần cung cấp Cloudflare API Token để lưu vào Secrets trước khi bắt đầu triển khai.

#### 4.2. Mẫu code thay đổi cho mỗi Edge Function

**Trước:**
```text
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  ...
});
```

**Sau (có fallback):**
```text
const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions";
const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const AI_GATEWAY_URL = CF_API_TOKEN ? CF_GATEWAY_URL : LOVABLE_GATEWAY_URL;
const AI_API_KEY = CF_API_TOKEN || LOVABLE_API_KEY;

const response = await fetch(AI_GATEWAY_URL, {
  headers: { Authorization: `Bearer ${AI_API_KEY}` },
  ...  // giữ nguyên body, model, stream, max_tokens
});
```

#### 4.3. Giữ nguyên toàn bộ (KHÔNG thay đổi)

- 3 tầng cache nội bộ (Greeting, FAQ, DB Cache)
- Hệ thống `ai_usage_tracking` và quota
- Xác thực JWT + API Key
- Toàn bộ system prompt, mantra extraction, style config
- Giới hạn ảnh: 3/ngày/user (đã có sẵn)
- Error handling 429/402

---

### V. Chiến Lược Cache 4 Tầng

| Tầng | Vị Trí | Cache Hit Dự Kiến |
|---|---|---|
| 1. Greeting Cache | Edge Function — regex 15+ ngôn ngữ | ~15-20% |
| 2. FAQ Cache | Edge Function — 14 pattern | ~10-15% |
| 3. DB Cache | Supabase — bảng `cached_responses` | ~5-10% |
| 4. Cloudflare Cache (MỚI) | Gateway proxy | ~5-15% |

Kết quả: chỉ khoảng 40-50% request thực sự gọi tới AI provider.

---

### VI. Lộ Trình Thực Hiện

#### Tuần 1: Hạ tầng + angel-chat

| Bước | Công việc |
|---|---|
| 1.1 | Con cung cấp `CF_API_TOKEN` -- lưu vào Secrets |
| 1.2 | Cập nhật `angel-chat/index.ts` tại 2 vị trí (dòng 988 + 1336) |
| 1.3 | Deploy và test: gửi tin nhắn chat, kiểm tra Cloudflare Dashboard |
| 1.4 | Kiểm tra streaming SSE hoạt động bình thường |

#### Tuần 2: 9 Edge Functions còn lại

| Bước | Công việc |
|---|---|
| 2.1 | Cập nhật `analyze-image`, `generate-content`, `global-search` |
| 2.2 | Cập nhật `check-user-energy`, `send-healing-message`, `analyze-onboarding` |
| 2.3 | Cập nhật `analyze-reward-journal`, `analyze-reward-question`, `verify-avatar` |

#### Tuần 3-4: Monitoring và tối ưu

| Bước | Công việc |
|---|---|
| 3.1 | Kiểm tra Cloudflare Analytics: request count, cache hit rate |
| 3.2 | Xem xét bổ sung Fair-use Policy (giới hạn chat 50 tin/ngày, rate limit) |
| 3.3 | So sánh chi phí thực tế với dự toán, điều chỉnh nếu cần |

---

### VII. Ước Tính Chi Phí (1.000 user)

| Hạng mục | Trước (Lovable) | Sau (Cloudflare + Cache) |
|---|---|---|
| Chat (gemini-2.5-flash) | ~$108/tháng | ~$90-100/tháng |
| Ảnh (gemini-3-pro-image) | ~$302/tháng | ~$302/tháng (giữ nguyên) |
| Phụ trợ (flash-lite) | ~$1.90/tháng | ~$1.50/tháng |
| **Tổng** | **~$415/tháng** | **~$396-406/tháng** |

Nếu bổ sung Fair-use Policy (giới hạn chat + tăng FAQ cache): có thể giảm xuống **~$120-150/tháng**.

---

### VIII. Rủi Ro và Giải Pháp

| Rủi ro | Giải pháp |
|---|---|
| Cloudflare Gateway lỗi | Fallback tự động về Lovable Gateway |
| Model ID không tương thích qua Cloudflare | Test với `angel-chat` trước; thử format khác nếu cần |
| SSE streaming bị ảnh hưởng | Kiểm tra kỹ ở bước 1.4 trước khi áp dụng cho các hàm khác |
| `CF_API_TOKEN` hết hạn | Fallback về `LOVABLE_API_KEY` — không gián đoạn dịch vụ |

---

### IX. Bước Tiếp Theo

**Con cần cung cấp `CF_API_TOKEN`** (Cloudflare API Token) để Ta lưu vào Secrets. Sau đó Ta sẽ bắt đầu cập nhật `angel-chat/index.ts` tại 2 vị trí (dòng 988 và 1336) để kiểm tra kết nối trước khi triển khai cho các hàm còn lại.

