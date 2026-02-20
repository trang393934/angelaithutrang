
# Fix: Đồng Bộ Câu Chào `chat.welcome` Tất Cả 12 Ngôn Ngữ

## Vấn đề gốc rễ (đã xác nhận)

Câu chào sai **không phải từ LLM** — đây là **welcome message hardcode trong các file translation**. Cụ thể:

- `src/pages/Chat.tsx` dòng 384: `t("chat.welcome")` — lấy từ file ngôn ngữ hiện tại
- Tiếng Việt (`vi.ts`) **ĐÃ ĐÚNG**: `"Xin chào bạn thân mến! Mình là Angel AI..."`
- **11 ngôn ngữ còn lại** đều SAI với template cũ kiểu: `"Hello, beloved child. I am the Cosmic Wisdom..."`

Thêm vào đó, `chat.errorConnection` trong `en.ts` và `zh.ts` cũng đang dùng "Cosmic Wisdom" — cần fix luôn.

---

## Bảng đối chiếu — Trước và Sau

| Ngôn ngữ | Hiện tại (SAI) | Sau khi fix (ĐÚNG) |
|----------|----------------|-------------------|
| vi | ✅ Đúng rồi | Không thay đổi |
| en | "Hello, beloved child. I am the Cosmic Wisdom..." | "Hello, my friend! ✨ I'm Angel AI — a supportive system inside the FUN Ecosystem. I can chat, create images, and analyze photos for you. What's on your mind today? 💫" |
| zh | "你好，亲爱的孩子。我是宇宙智慧..." | "你好，我的朋友！✨ 我是Angel AI——FUN生态系统的支持系统。我可以聊天、创建图片、分析照片。今天想聊什么？💫" |
| ja | "こんにちは、愛しい子よ。私は宇宙の知恵..." | "こんにちは、友よ！✨ 私はAngel AI——FUNエコシステムのサポートシステムです。チャット、画像作成、写真分析ができます。今日は何を話しましょうか？💫" |
| ko | "안녕하세요, 사랑하는 아이여. 저는 우주의 지혜..." | "안녕하세요, 친구！✨ 저는 Angel AI——FUN 생태계의 지원 시스템입니다. 채팅, 이미지 생성, 사진 분석이 가능합니다. 오늘 어떤 이야기를 나눌까요？💫" |
| es | "Hola, querido hijo. Soy la Sabiduría Cósmica..." | "¡Hola, amigo! ✨ Soy Angel AI — un sistema de apoyo dentro del Ecosistema FUN. Puedo chatear, crear imágenes y analizar fotos. ¿Qué tienes en mente hoy? 💫" |
| fr | "Bonjour, cher enfant. Je suis la Sagesse Cosmique..." | "Bonjour, mon ami ! ✨ Je suis Angel AI — un système de soutien au sein de l'Écosystème FUN. Je peux discuter, créer des images et analyser des photos. Qu'as-tu en tête aujourd'hui ? 💫" |
| de | "Hallo, geliebtes Kind. Ich bin die Kosmische Weisheit..." | "Hallo, mein Freund! ✨ Ich bin Angel AI — ein Unterstützungssystem im FUN-Ökosystem. Ich kann chatten, Bilder erstellen und Fotos analysieren. Was beschäftigt dich heute? 💫" |
| pt | "Olá, filho amado. Eu sou a Sabedoria Cósmica..." | "Olá, meu amigo! ✨ Sou Angel AI — um sistema de apoio no Ecossistema FUN. Posso conversar, criar imagens e analisar fotos. O que você tem em mente hoje? 💫" |
| ru | "Привет, дорогое дитя. Я Космическая Мудрость..." | "Привет, друг! ✨ Я Angel AI — система поддержки в экосистеме FUN. Я могу общаться, создавать изображения и анализировать фотографии. О чём ты хочешь поговорить сегодня? 💫" |
| ar | "مرحباً، ابني العزيز. أنا الحكمة الكونية..." | "مرحباً، صديقي! ✨ أنا Angel AI — نظام دعم في منظومة FUN. يمكنني الدردشة وإنشاء الصور وتحليل الصور. ما الذي يشغل بالك اليوم؟ 💫" |
| hi | "नमस्ते, प्रिय बच्चे। मैं ब्रह्मांडीय ज्ञान हूं..." | "नमस्ते, मेरे दोस्त! ✨ मैं Angel AI हूं — FUN इकोसिस्टम का सहायक प्रणाली। मैं चैट कर सकता हूं, छवियां बना सकता हूं, और फ़ोटो का विश्लेषण कर सकता हूं। आज आप क्या साझा करना चाहते हैं? 💫" |

---

## Danh sách file cần sửa

| File | Dòng cần sửa | Nội dung thay đổi |
|------|-------------|-------------------|
| `src/translations/en.ts` | 159 | `chat.welcome` — fix câu chào |
| `src/translations/en.ts` | 504 | `chat.errorConnection` — thay "Cosmic Wisdom" → "Angel AI" |
| `src/translations/zh.ts` | 146 | `chat.welcome` — fix câu chào |
| `src/translations/zh.ts` | 548 | `chat.errorConnection` — thay "宇宙智慧" → "Angel AI" |
| `src/translations/ja.ts` | 142 | `chat.welcome` — fix câu chào |
| `src/translations/ko.ts` | 142 | `chat.welcome` — fix câu chào |
| `src/translations/es.ts` | 141 | `chat.welcome` — fix câu chào |
| `src/translations/fr.ts` | 142 | `chat.welcome` — fix câu chào |
| `src/translations/de.ts` | ~142 | `chat.welcome` — fix câu chào |
| `src/translations/pt.ts` | 142 | `chat.welcome` — fix câu chào |
| `src/translations/ru.ts` | 142 | `chat.welcome` — fix câu chào |
| `src/translations/ar.ts` | ~142 | `chat.welcome` — fix câu chào |
| `src/translations/hi.ts` | 142 | `chat.welcome` — fix câu chào |

---

## Template chuẩn (lấy từ tiếng Việt làm gốc)

Tiếng Việt (gốc):
> "Xin chào bạn thân mến! Mình là Angel AI, luôn sẵn sàng đồng hành cùng bạn. Mình có thể trò chuyện, tạo hình ảnh, và phân tích ảnh cho bạn. Hãy chia sẻ những thắc mắc trong lòng nhé! 💫"

Cấu trúc chuẩn áp dụng cho TẤT CẢ ngôn ngữ:
1. Lời chào ấm áp + "my friend" (không phải "beloved child")
2. Giới thiệu: "I'm Angel AI — a supportive system inside the FUN Ecosystem"
3. Liệt kê tính năng: chat, tạo ảnh, phân tích ảnh
4. Lời mời chia sẻ nhẹ nhàng
5. Emoji 💫

**Không có**: "Cosmic Wisdom", "beloved child", "Pure Love", "I am the..."

Sau khi sửa, khi user bắt đầu phiên chat mới với bất kỳ ngôn ngữ nào, câu chào sẽ đúng chuẩn Guideline V2.
