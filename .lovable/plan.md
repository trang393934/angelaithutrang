

## Kết quả kiểm tra: Cấu hình hiện tại của Angel AI

### Bảng so sánh: Thiết lập ban đầu vs Hiện tại

| Chức năng | Thiết lập ban đầu (đúng) | Hiện tại | Trạng thái |
|---|---|---|---|
| **Chat (angel-chat)** | Gemini qua CF AI Gateway | **Lovable AI Gateway** (chính), CF fallback | ❌ Đã bị thay đổi |
| **Chat Demo mode** | Gemini qua CF AI Gateway | **Lovable AI Gateway** (chính), CF fallback | ❌ Đã bị thay đổi |
| **Tạo ảnh Fast** | Flux qua fal.ai | Flux qua fal.ai (+ Gemini enhance prompt) | ✅ Đúng |
| **Tạo ảnh Spiritual** | Gemini qua CF AI Gateway | Google AI Studio trực tiếp (`GOOGLE_AI_API_KEY`) | ⚠️ Thay đổi nhưng vẫn hoạt động |
| **Chỉnh sửa ảnh** | Google AI Studio | Google AI Studio trực tiếp (`GOOGLE_AI_API_KEY`) | ✅ Đúng |

### Chi tiết thay đổi

**1. Chat (angel-chat) — BỊ THAY ĐỔI**

Dòng 1636 hiện tại:
```
const AI_GATEWAY_URL_MAIN = LOVABLE_GATEWAY_URL_MAIN;
// → "https://ai.gateway.lovable.dev/v1/chat/completions"
// Auth: Bearer ${LOVABLE_API_KEY}
```

Lẽ ra phải là:
```
const AI_GATEWAY_URL_MAIN = CF_GATEWAY_URL_MAIN;
// → "https://gateway.ai.cloudflare.com/.../angel-ai/compat/chat/completions"
// Auth: Bearer ${CF_API_TOKEN}
```

Comment dòng 1631 ghi: *"ưu tiên Lovable → Cloudflare fallback"* — đây chính là lúc bị đổi. Cloudflare Gateway chỉ được dùng làm fallback khi Lovable lỗi (trừ 402/429), nghĩa là khi hết credit Lovable thì **không fallback** mà trả lỗi 402 cho user.

**2. Demo mode — CŨNG BỊ THAY ĐỔI**

Dòng 1240-1258: Demo mode cũng dùng Lovable Gateway làm chính, CF làm fallback.

**3. Tạo ảnh Spiritual — THAY ĐỔI NHỎ**

Dòng 212 trong `generate-image`: Gọi trực tiếp Google AI Studio API (`generativelanguage.googleapis.com`) thay vì qua CF Gateway. Vẫn hoạt động vì dùng `GOOGLE_AI_API_KEY` riêng, không tốn Lovable credit.

### Nguyên nhân thay đổi

Dựa trên comment trong code và lịch sử conversation, sự thay đổi xảy ra khi có một lần cập nhật angel-chat với lý do *"Vietnamese text stability"* (dòng 1636 comment: `// Lovable primary for Vietnamese text stability`). Ai đó (hoặc AI) đã đổi primary gateway từ Cloudflare sang Lovable với lý do tiếng Việt ổn định hơn — nhưng điều này khiến chat phụ thuộc hoàn toàn vào Lovable credit.

### Đây là lý do Angel AI bị lỗi 402

- Chat dùng Lovable credit → hết credit → lỗi 402
- Fallback logic bỏ qua 402/429 (dòng 1664: `response.status !== 429 && response.status !== 402`) → **không fallback sang CF**
- Kết quả: user không chat được

### Kế hoạch sửa: Chuyển chat về CF AI Gateway làm chính

| # | Thay đổi | Chi tiết |
|---|---|---|
| 1 | Dòng 1636 | Đổi `AI_GATEWAY_URL_MAIN = CF_GATEWAY_URL_MAIN` |
| 2 | Dòng 1637-1640 | Đổi headers sang `CF_API_TOKEN` |
| 3 | Dòng 1648 | Đổi model sang `google-ai-studio/gemini-2.5-flash` |
| 4 | Dòng 1663-1672 | Đổi fallback sang Lovable Gateway (trừ 402/429) |
| 5 | Demo mode (1240-1272) | Tương tự — CF chính, Lovable fallback |

- **1 file sửa**: `supabase/functions/angel-chat/index.ts`
- **0 file mới, 0 thay đổi database**
- Không cần thay đổi frontend (giữ nguyên OpenAI-compatible format)

