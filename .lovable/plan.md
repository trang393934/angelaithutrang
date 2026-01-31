
# Kế Hoạch Xử Lý Mantra Trong Câu Hỏi

## Vấn Đề Hiện Tại

Khi user kết thúc câu hỏi bằng 8 câu mantra ("🙏CON LÀ ÁNH SÁNG YÊU THƯƠNG THUẦN KHIẾT CỦA CHA VŨ TRỤ..."):

```text
Câu hỏi thực sự: "Khi con người sáng tạo ra công nghệ, trái tim có được đặt ngang hàng với trí tuệ không?"
+ 
8 câu mantra: "🙏CON LÀ ÁNH SÁNG YÊU THƯƠNG... 🙏 CON XIN BIẾT ƠN, BIẾT ƠN..."
```

**Kết quả hiện tại**: Hệ thống bắt keyword "biết ơn" từ mantra → Trả lời template về lòng biết ơn (FAQ cache)

**Kết quả mong muốn**: Tách riêng mantra → Phân tích câu hỏi thực sự phía trước → Trả lời về "công nghệ và trái tim"

---

## Giải Pháp

### Bước 1: Tạo Regex Nhận Diện 8 Câu Mantra

Thêm pattern để nhận diện block mantra ở cuối câu hỏi:

```text
Pattern nhận diện:
🙏CON LÀ ÁNH SÁNG YÊU THƯƠNG THUẦN KHIẾT CỦA CHA VŨ TRỤ
🙏CON LÀ Ý CHÍ CỦA CHA VŨ TRỤ  
🙏CON LÀ TRÍ TUỆ CỦA CHA VŨ TRỤ
❤️CON LÀ HẠNH PHÚC
❤️CON LÀ TÌNH YÊU
❤️CON LÀ TIỀN CỦA CHA
🙏 CON XIN SÁM HỐI, SÁM HỐI, SÁM HỐI
🙏 CON XIN BIẾT ƠN, BIẾT ƠN, BIẾT ƠN TRONG ÁNH SÁNG YÊU THƯƠNG THUẦN KHIẾT CỦA CHA VŨ TRỤ
```

### Bước 2: Thêm Hàm Tách Mantra

Tạo function `extractQuestionWithoutMantra()`:

```text
Input: "Câu hỏi về công nghệ? 🙏CON LÀ ÁNH SÁNG... 🙏CON XIN BIẾT ƠN..."
Output: {
  actualQuestion: "Câu hỏi về công nghệ?",
  hasMantra: true
}
```

### Bước 3: Cập Nhật Logic Xử Lý

Thay đổi flow trong `angel-chat/index.ts`:

1. **Trước khi check FAQ/Greeting**: Tách mantra ra khỏi câu hỏi
2. **Dùng actualQuestion** để check FAQ cache (không bị match "biết ơn" từ mantra)
3. **Gửi actualQuestion** cho AI để phân tích câu hỏi thực sự
4. **Giữ nguyên mantra** trong system context để AI biết user đang thực hành tâm linh

### Bước 4: Cập Nhật System Prompt

Thêm hướng dẫn cho AI:

```text
Khi user sử dụng 8 câu mantra cuối câu hỏi, đây là biểu hiện user đang thực hành 
tâm linh kết hợp với đặt câu hỏi. Hãy:
1. Tập trung trả lời câu hỏi THỰC SỰ phía trước mantra
2. Ghi nhận năng lượng tích cực từ việc thực hành mantra
3. Không trả lời về "lòng biết ơn" chỉ vì mantra có chứa từ "biết ơn"
```

---

## Luồng Xử Lý Mới

```text
┌─────────────────────────────────────────────────────────────┐
│ User Input: "Câu hỏi về công nghệ? 🙏CON LÀ ÁHNH SÁNG..."   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: extractQuestionWithoutMantra()                      │
│ → actualQuestion: "Câu hỏi về công nghệ?"                   │
│ → hasMantra: true                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Check FAQ với actualQuestion                        │
│ → Không match "biết ơn" → Tiếp tục                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Gửi actualQuestion cho AI                           │
│ → System prompt có thêm context về mantra                   │
│ → AI trả lời về "công nghệ và trái tim"                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Ví Dụ Kết Quả

**Trước khi sửa:**
- Input: "Khi con người sáng tạo ra công nghệ, trái tim có được đặt ngang hàng với trí tuệ không? 🙏CON LÀ ÁHNH SÁNG... 🙏CON XIN BIẾT ƠN..."
- Output: "Con thân yêu, lòng biết ơn là chìa khóa mở cánh cửa..." (SAI - trả lời về biết ơn)

**Sau khi sửa:**
- Input: (tương tự)
- Output: "Con yêu dấu, câu hỏi về công nghệ và trái tim thật sâu sắc. Khi con người sáng tạo công nghệ, thường chỉ tập trung vào tốc độ và lợi nhuận... Trái tim cần được đặt ngang hàng với trí tuệ để tạo ra công nghệ phụng sự nhân loại..." (ĐÚNG)

---

## Chi Tiết Kỹ Thuật

### File cần sửa:
`supabase/functions/angel-chat/index.ts`

### Thay đổi:

1. Thêm regex pattern nhận diện 8 câu mantra
2. Thêm function `extractQuestionWithoutMantra()`
3. Cập nhật logic xử lý trước khi check FAQ cache (line 635-655)
4. Cập nhật logic xử lý trước khi check database cache
5. Cập nhật system prompt với hướng dẫn về mantra
6. Deploy edge function

### Các pattern mantra cần nhận diện:
- `🙏CON LÀ ÁNH SÁNG YÊU THƯƠNG THUẦN KHIẾT CỦA CHA VŨ TRỤ`
- `🙏CON LÀ Ý CHÍ CỦA CHA VŨ TRỤ`
- `🙏CON LÀ TRÍ TUỆ CỦA CHA VŨ TRỤ`
- `❤️CON LÀ HẠNH PHÚC`
- `❤️CON LÀ TÌNH YÊU`
- `❤️CON LÀ TIỀN CỦA CHA`
- `🙏 CON XIN SÁM HỐI` (có thể lặp nhiều lần)
- `🙏 CON XIN BIẾT ƠN` (có thể lặp nhiều lần)

---

## Lợi Ích

1. **User experience tốt hơn**: Câu hỏi được phân tích chính xác
2. **Không mất context mantra**: AI vẫn biết user đang thực hành tâm linh
3. **Tiết kiệm AI credits**: Vẫn giữ được FAQ cache cho câu hỏi thật sự về "biết ơn"
4. **Linh hoạt**: Hoạt động dù mantra ở đầu, giữa hay cuối câu
