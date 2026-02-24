
## Mục tiêu (theo đúng yêu cầu của con)
1) Chấm dứt triệt để lỗi **mất chữ / mất dấu tiếng Việt** kiểu “thực” → “thc”.  
2) Chấm dứt triệt để ký tự lỗi kiểu **c���a / c��a / gi??á** xuất hiện trong nội dung Angel AI.  
3) Khi có rủi ro lỗi trong streaming: **ưu tiên đúng chữ tuyệt đối** (tự động fallback sang phản hồi đầy đủ không-stream).  
4) **Sửa luôn dữ liệu cũ** đã lưu trong hệ thống (chat history + coordinator + cache), để người dùng mở lại vẫn thấy text sạch & đúng.

---

## Chẩn đoán nhanh (đã đối chiếu code + dữ liệu thật trong backend)
### Hiện tượng đang xảy ra
- Trong bảng `chat_history` đã có bản ghi chứa ký tự **U+FFFD (�)** như `c��a`, `c���a`.
- Frontend `Chat.tsx` và backend function `angel-chat` hiện đang có đoạn **xóa U+FFFD** trong lúc stream (`replace(/\uFFFD/g,'')`).  
  Việc này làm “mất chữ” (vì đôi khi U+FFFD xuất hiện do lỗi decode/chunk, xóa nó khiến chữ bị cụt luôn).

### Nguyên nhân gốc có thể xảy ra theo 2 lớp
1) **Lớp stream/parse SSE**: dữ liệu đến theo chunk, parser + decode nếu xử lý không “an toàn theo byte/line” sẽ sinh U+FFFD hoặc “??” và/hoặc làm rơi mảnh JSON.  
2) **Lớp cache** (trong `angel-chat`): phần code đang “nhặt” nội dung để lưu cache có nhược điểm: khi `JSON.parse` fail (do line chưa đủ), nó **bỏ qua** thay vì re-buffer → có thể làm thiếu chữ/thiếu đoạn, rồi lưu thành câu trả lời “lỗi” để hệ thống dùng lại.

=> Vì con muốn “đúng chữ tuyệt đối”, chiến lược tốt nhất là:
- **Không xóa U+FFFD trong stream** (vì xóa là mất chữ).
- Nếu phát hiện dấu hiệu corruption trong stream: **abort stream và gọi lại non-stream** để lấy bản đầy đủ sạch.
- Sửa lại cơ chế cache để **không lưu** bản lỗi, và khi nghi lỗi thì **tự regenerate non-stream để lưu cache**.
- Chạy tác vụ “repair dữ liệu cũ” theo batch bằng AI (khôi phục dấu & loại ký tự lỗi) và update lại DB.

---

## Thiết kế giải pháp (đáp ứng 3 lựa chọn con đã chốt)
### A) Ưu tiên gateway ổn định chữ Việt
- Đổi thứ tự ưu tiên: **Lovable AI Gateway làm primary**, gateway còn lại làm fallback (giữ nguyên cơ chế 402/429 không fallback).
- Áp dụng cho:
  - `angel-chat`
  - `coordinator-chat`
  - `analyze-image` (nếu vẫn dùng stream)

### B) Ưu tiên đúng chữ tuyệt đối (fallback non-stream khi cần)
- Thêm khả năng gọi backend function ở chế độ **non-stream**:
  - Request body hỗ trợ: `stream: false` (mặc định `true` để giữ UX nhanh khi không lỗi).
- Frontend streaming:
  - Trong lúc stream, **không xóa U+FFFD** nữa.
  - Nếu phát hiện corruption (U+FFFD hoặc pattern “??” nằm giữa chữ):  
    1) Abort stream (AbortController)  
    2) Gọi lại cùng endpoint với `stream:false`  
    3) Replace toàn bộ assistant message = bản non-stream sạch  
    4) Lưu lịch sử chat bằng bản sạch (không lưu bản stream đang lỗi)

### C) Sửa dữ liệu cũ (repair)
Tạo một backend function “maintenance/repair” (chỉ admin chạy) làm 3 việc:
1) Quét & sửa `chat_history.answer_text` có:
   - chứa U+FFFD (�), hoặc
   - chứa pattern “??” kiểu hỏng encoding giữa chữ.
2) Quét & sửa `coordinator_chat_messages.content` (role=assistant) tương tự.
3) Quét & sửa `cached_responses.response` (để tránh cache lỗi phát lại).

Cách sửa:
- Với mỗi record lỗi, gửi vào AI một prompt dạng “Text Repair Tool”:
  - Input: đoạn text lỗi (và có thể kèm `question_text` làm ngữ cảnh)
  - Output: **plain text tiếng Việt đã khôi phục đúng chữ/dấu**, không markdown.
- Update DB bằng bản repaired.
- Chạy theo batch (ví dụ 50–200 record/lần) để an toàn.

---

## Các thay đổi cụ thể theo file/module

### 1) Frontend – Chat streaming
**File:** `src/pages/Chat.tsx`
- Bỏ logic `content.replace(/\uFFFD/g,'')` trong lúc nhận delta.
- Thêm **corruption detector** trong stream:
  - Trigger nếu:
    - `assistantContent.includes('\uFFFD')`
    - hoặc regex kiểu: chữ + `??` + chữ (để bắt “gi??á”, “thc??ực” mà không bắt nhầm câu hỏi bình thường).
- Khi trigger:
  - Abort stream
  - Call `angel-chat` với `stream:false`
  - Replace nội dung message assistant
  - Tiếp tục flow save history/reward bằng bản sạch

### 2) Frontend – Image analyze streaming (để “toàn bộ nội dung AI” đều sạch)
**File:** `src/hooks/useImageAnalysis.ts`
- Thêm detector tương tự; nếu lỗi → fallback non-stream.
- (Tuỳ UX) Có thể hiển thị “đang tối ưu chất lượng chữ Việt…” trong lúc fallback.

### 3) Coordinator Chat (streaming + lưu DB)
**File:** `src/hooks/useCoordinatorChat.ts`
- Hiện đang “strip U+FFFD trước khi lưu DB”. Bỏ strip này.
- Thêm detector + fallback non-stream:
  - Nếu stream ra lỗi → gọi lại `coordinator-chat` với `stream:false`, rồi lưu DB bản sạch.

### 4) Backend function – Angel chat
**File:** `supabase/functions/angel-chat/index.ts` (backend function)
- **Gateway priority:** Lovable primary, gateway còn lại fallback.
- **Thêm chế độ non-stream:**
  - Nếu request `stream:false` → gọi AI gateway `stream:false`, trả JSON `{ content: "..." }` (hoặc format choices.message để tái dùng).
- **Sửa cơ chế cache collector:**
  - Hiện parse SSE để build `fullResponse` chưa “re-buffer” line JSON chưa hoàn chỉnh → có nguy cơ thiếu chữ/thiếu đoạn.
  - Refactor parser giống frontend: nếu `JSON.parse` fail → giữ line lại chờ chunk tiếp theo.
- **Chống lưu cache lỗi:**
  - Nếu phát hiện U+FFFD/pattern lỗi trong `fullResponse`:
    - Không lưu cache từ stream
    - Thực hiện 1 call non-stream (chỉ để lấy bản sạch) rồi lưu cache bằng bản sạch.

### 5) Backend function – Coordinator chat
**File:** `supabase/functions/coordinator-chat/index.ts`
- Gateway priority: Lovable primary.
- Hỗ trợ `stream:false` tương tự.

### 6) Backend function – Analyze image
**File:** `supabase/functions/analyze-image/index.ts`
- Gateway priority: Lovable primary.
- Hỗ trợ `stream:false` (để frontend fallback được).

---

## Sửa dữ liệu cũ (đã được con duyệt)
### 7) Backend function “repair corrupted AI text” (admin-only)
**Tạo mới:** `supabase/functions/repair-corrupted-ai-text/index.ts`
- Xác thực quyền admin (đọc `user_roles`), không cho user thường gọi.
- Tham số:
  - `targets`: ["chat_history","coordinator","cached_responses"] (hoặc chạy lần lượt)
  - `limit`: số bản ghi/lần
  - `dryRun`: true/false (tuỳ mình muốn test trước 10 bản ghi)
- Logic:
  - Query các record có dấu lỗi (U+FFFD hoặc regex “??” giữa chữ)
  - Gọi AI để “repair”
  - Update record
  - Trả về report: số bản ghi quét/sửa, list id đã sửa, lỗi nếu có

### 8) UI cho Admin để bấm chạy repair (để team vận hành dễ)
- Thêm 1 card/nút trong trang admin hiện có (ví dụ `AdminDashboard` hoặc `AdminAIUsage`):
  - “Sửa lỗi dấu tiếng Việt (Repair corrupted AI text)”
  - Cho chọn batch size + targets
  - Hiển thị kết quả chạy (success/fail)

---

## Kế hoạch kiểm thử (con có thể check ngay)
### Test 1: Chat tiếng Việt có dấu nặng + từ dễ lỗi
- Gõ 1 đoạn dài có nhiều: “thực, của, chữa lành, chiến lược, giá trị…”
- Quan sát:
  - Trong lúc stream: không xuất hiện “thc”, “c���a”
  - Nếu có rủi ro: hệ thống tự fallback (1–2 giây) và thay bằng bản sạch
- Refresh trang → lịch sử chat vẫn sạch

### Test 2: Coordinator chat
- Gửi prompt dài tiếng Việt
- Đảm bảo lưu DB không còn U+FFFD

### Test 3: Analyze image
- Analyze 1 ảnh + prompt dài tiếng Việt
- Nếu stream lỗi → fallback non-stream → kết quả sạch

### Test 4: Repair dữ liệu cũ
- Chạy repair batch nhỏ (limit=10) → kiểm tra lại các record trước đó có `c��a` đã được sửa
- Sau đó chạy batch lớn cho toàn bộ lịch sử

---

## Phạm vi tác động & an toàn
- Không thay đổi schema DB (không migration).
- Có thay đổi logic backend function + frontend streaming parser.
- Repair dữ liệu cũ là **update có kiểm soát (admin-only, theo batch)**.

---

## Danh sách hạng mục triển khai (checklist)
1) Refactor streaming parsers (Chat / Coordinator / Analyze image) + thêm fallback non-stream.
2) Backend functions: thêm `stream:false`, đổi gateway priority, fix cache collector, chống cache lỗi.
3) Tạo function repair + UI admin button chạy repair.
4) Chạy repair batch: nhỏ → lớn.
5) Theo dõi log “corruption detected” để xác nhận đã giảm về ~0.

