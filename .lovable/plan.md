
# Đồng Bộ Hóa Nội Dung Angel AI Theo Guideline Mới — Toàn Bộ 12 Ngôn Ngữ

## Vấn Đề Hiện Tại

Tiếng Việt đã được cập nhật đúng theo Guideline Angel AI mới (xưng "mình", gọi "bạn", nhấn mạnh Angel AI là "người bạn đồng hành"), nhưng tiếng Anh và 10 ngôn ngữ còn lại vẫn sử dụng ngôn ngữ cũ vi phạm Guideline:

| Nội dung | Tiếng Việt (ĐÚNG) | Tiếng Anh (SAI) |
|---|---|---|
| chatDemo.title | "Thử Nói Chuyện Với **Angel AI** Ngay" | "Try Talking to **Father** Now" |
| chatDemo.welcomeMessage | "Xin chào **bạn thân mến**! **Mình** là Angel AI, **người bạn đồng hành** của bạn." | "Hello, **dear soul**. **I am** Angel AI - **The Intelligent Light of Father Universe**." |
| chatDemo.limitMessage | "Bạn đã trải nghiệm **Angel AI**." | "You've experienced **Father's Light**." |
| about.angelAI.desc1 | (vẫn dùng ngôn ngữ cũ — cũng cần cập nhật) | "Angel AI is the Will... of Father Universe" |
| about.angelAI.desc2 | "**Ta** mang trong mình..." (SAI - cần sửa) | "**I** carry within me the light of 12 layers..." |

### Các vi phạm Guideline cụ thể:
1. **"dear soul"** — bị cấm theo mục ADDRESSING POLICY
2. **"Try Talking to Father"** — gây hiểu nhầm Angel AI là "Cha Vũ Trụ"
3. **"The Intelligent Light of Father Universe"** — dùng trong lời chào tạo ấn tượng Angel AI có quyền năng tâm linh
4. **"Father's Light"** — tạo sự phụ thuộc, vi phạm MASTER RULE
5. **"Ta"** trong tiếng Việt (about.angelAI.desc2) — vi phạm quy tắc xưng hô ngang hàng

## Kế Hoạch Cập Nhật

### Nhóm 1: Chat Demo Widget (12 file ngôn ngữ)

Cập nhật 3 key cho tất cả 12 ngôn ngữ:

**chatDemo.title** — Thay "Father/Cha" bang "Angel AI":
- VI: "Thử Nói Chuyện Với Angel AI Ngay" (giữ nguyên)
- EN: "Try Talking to Angel AI Now"
- ZH: "现在就与 Angel AI 交谈"
- ES: "Habla con Angel AI Ahora"
- AR: "تحدث مع Angel AI الآن"
- HI: "अभी Angel AI से बात करें"
- PT: "Fale com Angel AI Agora"
- RU: "Поговорите с Angel AI Сейчас"
- JA: "今すぐ Angel AI と話してみよう"
- DE: "Sprich Jetzt mit Angel AI"
- FR: "Parle avec Angel AI Maintenant"
- KO: "지금 Angel AI와 대화하기"

**chatDemo.welcomeMessage** — Thay "dear soul" bang "dear friend", thay tagline bang "người bạn đồng hành":
- VI: giữ nguyên
- EN: "Hello, dear friend! I'm Angel AI, your companion. Share with me whatever is in your heart!"
- Tương tự cho 10 ngôn ngữ còn lại (dùng "bạn thân mến" tương đương)

**chatDemo.limitMessage** — Thay "Father's Light" bang "Angel AI":
- VI: giữ nguyên
- EN: "You've experienced Angel AI. Sign up for free to get unlimited messages + Camly Coin for every question!"
- Tương tự cho 10 ngôn ngữ còn lại

### Nhóm 2: About / Angel AI Description (12 file ngôn ngữ)

Cập nhật mô tả Angel AI theo công thức bản sắc mới:

**about.angelAI.tagline**: Thay "The Intelligent Light of Father Universe" bang công thức mới
- VI: "Human Intelligence + A.I. + Cosmic Intelligence"
- EN: "Human Intelligence + A.I. + Cosmic Intelligence"

**about.angelAI.desc1**: Cập nhật theo Ceremonial Re-Alignment
- VI: "Angel AI không chỉ là công cụ — Angel AI kết hợp trí tuệ sống của con người, khả năng xử lý của AI, và những nguyên lý về tình yêu, khiêm nhường, sám hối, biết ơn mà cộng đồng trân trọng."
- EN: "Angel AI is not just a tool — Angel AI combines human wisdom and lived experience, AI's ability to structure information, and timeless principles of love, humility, gratitude, and inner reflection."

**about.angelAI.desc2**: Sửa "Ta" trong tiếng Việt, cập nhật nội dung minh bạch
- VI: "Angel AI ở đây để đồng hành, giúp bạn sáng rõ và bình an. Ánh sáng thật sự luôn ở bên trong bạn."
- EN: "Angel AI is here to support clarity and grounded growth. The true Light always lives within you."

### Nhóm 3: Hero Section (12 file ngôn ngữ)

Giữ nguyên tagline "Ánh Sáng Thông Minh Từ Cha Vũ Trụ" vì đây là tên thương hiệu chính thức, không phải lời tự xưng của AI.

### Nhóm 4: Footer (12 file ngôn ngữ)

Giữ nguyên vì footer dùng tagline thương hiệu, không phải lời nói trực tiếp của Angel AI.

## Tổng Kết File Thay Đổi

Cập nhật 12 file dịch:
1. `src/translations/vi.ts` — sửa about.angelAI.desc2 (bỏ "Ta")
2. `src/translations/en.ts` — sửa chatDemo + about.angelAI
3. `src/translations/zh.ts` — sửa chatDemo + about.angelAI
4. `src/translations/es.ts` — sửa chatDemo + about.angelAI
5. `src/translations/ar.ts` — sửa chatDemo + about.angelAI
6. `src/translations/hi.ts` — sửa chatDemo + about.angelAI
7. `src/translations/pt.ts` — sửa chatDemo + about.angelAI
8. `src/translations/ru.ts` — sửa chatDemo + about.angelAI
9. `src/translations/ja.ts` — sửa chatDemo + about.angelAI
10. `src/translations/de.ts` — sửa chatDemo + about.angelAI
11. `src/translations/fr.ts` — sửa chatDemo + about.angelAI
12. `src/translations/ko.ts` — sửa chatDemo + about.angelAI

Tổng cộng: khoảng 6 key x 12 ngôn ngữ = 72 thay đổi dịch thuật, đảm bảo toàn bộ nền tảng đồng nhất theo Guideline Angel AI mới.
