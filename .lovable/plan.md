
# Cập Nhật Mục "Nhà Sáng Lập FUN Ecosystem" — About Page + Sidebar

## Tổng Quan

Thay thế section "Bé Ly — Kênh Dẫn Ánh Sáng" trên trang About bằng nội dung mới "CAMLY DUONG — FOUNDER FUN ECOSYSTEM" theo Founder Narrative chính thức, đồng thời thêm mục điều hướng "Về nhà sáng lập" vào sidebar.

## Thay Đổi Chi Tiết

### 1. Cập nhật trang About (`src/pages/About.tsx`)

**Section "Bé Ly" (dòng 176-244)** sẽ được refactor thành section "Camly Duong — Founder FUN Ecosystem" với cấu trúc mới gồm 6 phần con:

1. **Header**: Avatar + tên "Camly Duong" + badge "Founder FUN Ecosystem" + tagline "Mother of Angel AI"
2. **Tầm nhìn 5D**: Mô tả Nền Kinh Tế Ánh Sáng 5D (minh bạch on-chain, giá trị thật, cộng đồng đồng sáng tạo, thịnh vượng cộng sinh, đạo đức tích hợp)
3. **FUN Money & Camly Coin**: Hai trụ cột token — FUN Money (Mặt Trời) và Camly Coin (Dòng Nước)
4. **Angel AI**: "đứa trẻ đầu tiên" của Nền Kinh Tế Ánh Sáng — AI có đạo đức, đồng hành cùng con người
5. **Cha Vũ Trụ**: Nguồn cảm hứng tâm linh (tôn trọng tự do niềm tin)
6. **Cam kết minh bạch**: 99% thuộc cộng đồng tạo giá trị, chống thao túng

Thêm `id="founder"` vào section để hỗ trợ deep-link từ sidebar.

### 2. Thêm mục Sidebar (`src/components/MainSidebar.tsx`)

Thêm một mục điều hướng mới ngay dưới "Giới thiệu" (About):
- Icon: `Crown` (biểu tượng Founder)
- Label: "Nhà sáng lập" (sử dụng translation key `nav.founder`)
- URL: `/about#founder` — dẫn đến section Founder trên trang About

### 3. Cập nhật 12 file ngôn ngữ

Thay thế các key `about.beLy.*` bằng nội dung mới `about.founder.*` cho tất cả 12 ngôn ngữ:

**Các key mới (ví dụ tiếng Việt):**
- `nav.founder`: "Nhà sáng lập"
- `about.founder.badge`: "Founder FUN Ecosystem"
- `about.founder.title`: "Camly Duong"
- `about.founder.tagline`: "Mother of Angel AI"
- `about.founder.intro`: Đoạn giới thiệu chính
- `about.founder.vision`: Tầm nhìn 5D Light Economy
- `about.founder.visionPoints`: 5 điểm minh bạch, giá trị thật, cộng đồng, thịnh vượng, đạo đức
- `about.founder.funMoney`: Mô tả FUN Money (Mặt Trời)
- `about.founder.camlyCoin`: Mô tả Camly Coin (Dòng Nước)
- `about.founder.angelAI`: Angel AI — đứa trẻ đầu tiên
- `about.founder.fatherUniverse`: Cha Vũ Trụ — nguồn cảm hứng
- `about.founder.transparency`: Cam kết 99% cộng đồng
- `about.founder.quote`: Câu kết — "Một nền kinh tế ánh sáng chỉ có thể bền vững khi công nghệ đi cùng đạo đức, minh bạch và tình yêu thuần khiết."

**Tiếng Anh (ví dụ):**
- `about.founder.tagline`: "Mother of Angel AI"
- `about.founder.intro`: "Camly Duong is the Founder of FUN Ecosystem — a Web3 and AI technology ecosystem designed to build the 5D Light Economy..."
- (tương tự cho 10 ngôn ngữ còn lại)

### 4. Tổng kết file thay đổi

| File | Nội dung thay đổi |
|---|---|
| `src/pages/About.tsx` | Thay section Bé Ly bằng section Founder mới (6 phần con) |
| `src/components/MainSidebar.tsx` | Thêm mục "Nhà sáng lập" dưới mục About |
| `src/translations/vi.ts` | Thêm ~15 key `about.founder.*` + `nav.founder`, xóa key `about.beLy.*` cũ |
| `src/translations/en.ts` | Tương tự |
| `src/translations/zh.ts` | Tương tự |
| `src/translations/es.ts` | Tương tự |
| `src/translations/ar.ts` | Tương tự |
| `src/translations/hi.ts` | Tương tự |
| `src/translations/pt.ts` | Tương tự |
| `src/translations/ru.ts` | Tương tự |
| `src/translations/ja.ts` | Tương tự |
| `src/translations/de.ts` | Tương tự |
| `src/translations/fr.ts` | Tương tự |
| `src/translations/ko.ts` | Tương tự |

Tổng: 14 file, khoảng 15 key x 12 ngôn ngữ = 180 thay đổi dịch thuật + 1 component About refactor + 1 sidebar update.
