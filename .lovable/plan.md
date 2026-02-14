
# Cập nhật xưng hô Angel AI tại 2 vị trí trong hình

## Vấn đề
Hai chỗ trên giao diện vẫn còn dùng xưng hô cũ "Ta/con":
1. **Trang Chat** -- lời chào "Xin chào, con yêu dấu của Ta. Ta là Trí Tuệ Vũ Trụ..."
2. **Widget Demo trên trang chủ** -- lời chào "Xin chào, con yêu dấu. Ta là Angel AI – Trí Tuệ Ánh Sáng của Cha Vũ Trụ..."

## Các file cần sửa

### 1. `src/translations/vi.ts`

**Dòng 159** -- `chat.welcome`:
- Cũ: "Xin chào, con yêu dấu của Ta. Ta là Trí Tuệ Vũ Trụ, mang Tình Yêu Thuần Khiết đến với con. Ta có thể trò chuyện, tạo hình ảnh, và phân tích ảnh cho con. Hãy chia sẻ những thắc mắc trong lòng! 💫"
- Mới: "Xin chào bạn thân mến! Mình là Angel AI, luôn sẵn sàng đồng hành cùng bạn. Mình có thể trò chuyện, tạo hình ảnh, và phân tích ảnh cho bạn. Hãy chia sẻ những thắc mắc trong lòng nhé! 💫"

**Dòng 937** -- `chatDemo.title`:
- Cũ: "✨ Thử Nói Chuyện Với Cha Ngay ✨"
- Mới: "✨ Thử Nói Chuyện Với Angel AI Ngay ✨"

**Dòng 943** -- `chatDemo.welcomeMessage`:
- Cũ: "Xin chào, con yêu dấu. Ta là Angel AI - Trí Tuệ Ánh Sáng của Cha Vũ Trụ. Hãy chia sẻ với Ta bất cứ điều gì trong lòng con! 💫"
- Mới: "Xin chào bạn thân mến! Mình là Angel AI, người bạn đồng hành của bạn. Hãy chia sẻ với mình bất cứ điều gì trong lòng bạn nhé! 💫"

**Dòng 941** -- `chatDemo.limitMessage`:
- Cũ: "Con đã trải nghiệm Ánh Sáng của Cha..."
- Mới: "Bạn đã trải nghiệm Angel AI..."

### 2. `src/components/ChatDemoWidget.tsx`

**Dòng 274-285** -- hàm `getWelcomeMessage()` (fallback khi không có bản dịch):
- Đổi tất cả 12 ngôn ngữ sang xưng hô ngang hàng, bỏ "dear soul", "con yêu dấu", "Father Universe"
- Ví dụ tiếng Việt: "Xin chào bạn thân mến! Mình là Angel AI, người bạn đồng hành của bạn. Hãy chia sẻ với mình bất cứ điều gì nhé! 💫"

### 3. Các file liên quan cần cập nhật thêm

Trong quá trình tìm kiếm, phát hiện thêm các chỗ còn dùng xưng hô cũ:

- **`supabase/functions/send-healing-message/index.ts` (dòng 114-116)**: Prompt còn "Xưng 'Ta', gọi user là 'con yêu dấu'" -- cần đổi sang "Xưng 'mình', gọi user là 'bạn'"
- **`supabase/functions/analyze-image/index.ts` (dòng 84)**: Còn "Trí Tuệ Vũ Trụ" -- cần đổi sang "Angel AI, hệ thống AI hỗ trợ phát triển nhận thức"
- **`src/components/ChatShareDialog.tsx` (dòng 12)**: Còn "Trí Tuệ Vũ Trụ trả lời" -- cần đổi sang "Angel AI trả lời"
- **`src/translations/vi.ts` (dòng 589)**: Còn "Không thể kết nối với Trí Tuệ Vũ Trụ" -- đổi sang "Không thể kết nối với Angel AI"

## Tóm tắt
- Sửa 4 file, không tạo file mới
- Tất cả thay đổi đều là đổi nội dung text theo guideline mới: "mình/bạn" thay "Ta/con"
- Giữ nguyên logic và cấu trúc code
