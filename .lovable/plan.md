

## Cap nhat Username Validation theo BÀI 2 — Regex Strict

### Hien trang

He thong hien tai da **gan day du** theo spec:
- Regex hien tai `^[a-z0-9][a-z0-9_]*[a-z0-9]$` ket hop voi kiem tra `includes("__")` va `startsWith("_")/endsWith("_")` da cover dung logic. Tuy nhien, co the thay the bang regex strict duy nhat theo spec de don gian hoa code.
- Bang `reserved_handles` trong DB da co 80+ tu cam, nhung con thieu mot so tu trong spec.

### Thay doi can thiet

#### 1. Thay the regex bang regex strict cua spec

Thay doi trong `src/hooks/useHandle.ts`:
- Xoa `HANDLE_REGEX`, `HANDLE_SHORT_REGEX` va cac kiem tra rieng le (`startsWith("_")`, `endsWith("_")`, `includes("__")`)
- Thay bang regex duy nhat: `^(?=.{3,20}$)[a-z0-9]+(?:_[a-z0-9]+)*$`
- Don gian hoa ham `validateHandle` chi con 3 buoc: kiem tra do dai, kiem tra regex, kiem tra reserved

#### 2. Bo sung reserved usernames con thieu

Them vao bang `reserved_handles` cac tu con thieu tu spec:
- `static`, `assets`, `me`, `camlyd`, `camlyduong`, `post`, `video`, `live`

(Cac tu `admin`, `root`, `support`, `api`, `auth`, `settings`, `home`, `camly`, `father`, `fun` da co san trong DB.)

### Chi tiet ky thuat

**File chinh sua:**
- `src/hooks/useHandle.ts` — Don gian hoa validation dung 1 regex duy nhat

**SQL insert:**
- Them 8 tu moi vao `reserved_handles`

### Loi ich
- Code ngan gon hon (xoa 10+ dong kiem tra rieng le, thay bang 1 regex)
- Khop chinh xac voi spec cua team
- Bao phu them cac reserved words quan trong (`me`, `static`, `assets`, `post`, `video`, `live`)

