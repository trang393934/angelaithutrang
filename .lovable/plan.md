

## Phan tich va Ke hoach — 3 van de can xu ly

### Van de 1: Social Media Preview (OG Image) khong hien thi dung

**Nguyen nhan goc:** Day la ung dung SPA (Single Page Application). Khi chia se link len Facebook, Zalo, Twitter... cac crawler cua mang xa hoi **khong chay JavaScript**. Chung chi doc noi dung HTML tinh tu `index.html`. Vi vay, du `PostDetail.tsx` da set `og:image` bang JavaScript, crawler chi thay OG image mac dinh cua trang chu (logo Angel AI), khong thay hinh cua bai viet cu the.

**Giai phap:** Tao mot Edge Function `og-image-render` de tra ve HTML voi meta tags dong (OG title, OG image, OG description) dua tren URL. Sau do, cap nhat `index.html` de trang chu co fallback OG image tot.

**Chi tiet ky thuat:**
- Tao Edge Function `supabase/functions/og-image-render/index.ts`
- Function nhan `path` param (vd: `/thutrang/post/chuc_mung_nam_moi`)
- Parse path → query database → tra ve HTML ngan voi meta tags chinh xac
- Uu tien hinh: `image_urls[0]` → `user avatar` → `Angel AI logo`
- Twitter card: `summary_large_image` (hinh lon nhu YouTube)

**Luu y:** Vi day la SPA tren Lovable, khong co server-side rendering. Edge Function se la endpoint rieng (`/functions/v1/og-image-render?path=...`). De crawler thuc su lay duoc meta tags nay, can cau hinh proxy/redirect o tang CDN hoac dung `<noscript>` trick. Tuy nhien, giai phap hieu qua nhat trong gioi han hien tai la:
1. Cap nhat `index.html` co fallback OG image tot
2. Tao edge function de phuc vu cho cac truong hop can share preview dong

### Van de 2: Guest bi chan boi "Luat Anh Sang"

**Phat hien sau khi kiem tra code:**
- `PostDetail.tsx`: **KHONG** co LightGate hay ProfileCompletionGate → Guest co the doc bai binh thuong
- `Community.tsx`: **KHONG** co gate nao → Guest co the xem feed
- `HandleProfile.tsx`: **KHONG** co gate → Guest co the xem profile
- RLS policy tren `community_posts`: `qual: true` (public SELECT) → Database cho phep doc

**Van de thuc su:** Khi Guest chua dang nhap va truy cap mot so tinh nang (chat, earn, mint...), `ProfileCompletionGate` trong App.tsx kiem tra auth → hien man hinh "Vui long dang nhap" hoac "Cong Anh Sang Dang Dong". Nhung cac trang **doc noi dung** (PostDetail, Community, HandleProfile) da open san.

**Kiem tra them:** Co the Guest truy cap tu mot link ma roi vao route `/:username` → `DynamicRoute` → `UserProfile`, va `UserProfile` co the co logic chan. Tuy nhien, sau khi kiem tra, `UserProfile.tsx` cung khong co gate.

**Ket luan:** Cac trang doc noi dung da open cho Guest. Neu Guest van bi chan, nguyen nhan co the la:
1. Guest click vao mot hanh dong (like, comment, share) → `SignupPromptDialog` hien len (day la dung thiet ke)
2. Hoac mot redirect logic nao do trong auth flow

**Giai phap:** Them banner/CTA nhe nhang o cuoi bai viet cho Guest thay vi chan hoan toan. Dam bao `PostDetail` hien thi day du noi dung truoc khi show bat ky prompt nao.

### Van de 3: OG Image fallback chain

Hien tai trong `PostDetail.tsx` dong 137:
```
const firstImage = postData?.image_urls?.[0] || postData?.image_url || undefined;
```
Neu bai viet khong co hinh, `ogImage` = `undefined` → OG image fallback ve logo mac dinh trong `index.html`. Can them avatar cua nguoi dang va Angel AI logo lam fallback.

---

### KE HOACH THAY DOI

#### File 1: `src/pages/PostDetail.tsx`
- **OG Image fallback chain**: Thay dong 137 tu:
  ```
  const firstImage = postData?.image_urls?.[0] || postData?.image_url || undefined;
  ```
  thanh:
  ```
  const firstImage = postData?.image_urls?.[0] || postData?.image_url || profileData?.avatar_url || '/og-image.png';
  ```
  → Dam bao luon co hinh khi share: hinh bai viet → avatar nguoi dang → logo Angel AI

- **Twitter card luon la `summary_large_image`**: Dong 148, thay:
  ```
  twitterCard: firstImage ? "summary_large_image" : "summary",
  ```
  thanh:
  ```
  twitterCard: "summary_large_image",
  ```
  → Luon hien hinh lon khi share len mang xa hoi (giong YouTube)

- **Them setMetaTags cho Twitter image**: Hien tai `setMetaTags` khong set `twitter:image` rieng. Can bo sung de dam bao Twitter/Zalo doc duoc hinh.

#### File 2: `src/lib/seoHelpers.ts`
- Bo sung set `twitter:title`, `twitter:description`, `twitter:image` trong ham `setMetaTags` de day du cho tat ca mang xa hoi.

#### File 3: `src/pages/HandleProfile.tsx`
- **OG Image fallback**: Tuong tu, dam bao `ogImage` luon co gia tri (avatar → fallback logo)
- **Twitter card**: Luon `summary_large_image`

#### File 4: `index.html`
- Dam bao `og:image` mac dinh co kich thuoc chuan (1200x630) va URL tuyet doi. Hien tai da co, chi can kiem tra va giu nguyen.

#### File 5: `supabase/functions/og-image-render/index.ts` (FILE MOI)
- Edge Function tra ve HTML voi dynamic OG tags dua tren URL path
- Crawler tu mang xa hoi co the goi truc tiep endpoint nay
- Logic: parse path → query DB → tra ve HTML voi meta tags chinh xac
- Ho tro: `/{username}/post/{slug}`, `/{username}`, `/post/{postId}`

---

### TOM TAT

| # | Thay doi | File | Muc dich |
|---|---|---|---|
| 1 | OG image fallback chain | `PostDetail.tsx` | Luon co hinh khi share (post image → avatar → logo) |
| 2 | Twitter card luon `summary_large_image` | `PostDetail.tsx`, `HandleProfile.tsx` | Hinh lon khi share len mang xa hoi |
| 3 | Bo sung twitter meta tags | `seoHelpers.ts` | Twitter/Zalo doc duoc hinh va mo ta |
| 4 | OG image fallback cho profile | `HandleProfile.tsx` | Profile luon co hinh khi share |
| 5 | Edge Function dynamic OG | `og-image-render/index.ts` | Crawler doc meta tags dong |

- **4 file sua**
- **1 file moi** (Edge Function)
- **0 thay doi database**

**Ghi chu ve Guest access:** Sau khi kiem tra ky, cac trang doc noi dung (`PostDetail`, `Community`, `HandleProfile`) **da open** cho Guest. Khong co `LightGate` hoac `ProfileCompletionGate` nao bao boc cac route nay. Neu con van thay bi chan, xin cho Cha biet cu the URL nao va man hinh nao hien ra de Cha trace chinh xac.

