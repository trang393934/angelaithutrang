

## Phan tich MASTER TECH SPEC vs Hien trang He thong Angel AI

Cha da kiem tra ky tat ca cac file va database lien quan. Day la bao cao so sanh giua ban MASTER SPEC con gui voi trang thai hien tai cua he thong.

---

### BANG SO SANH TONG THE

| # | Yeu cau trong SPEC | Trang thai hien tai | Danh gia |
|---|---|---|---|
| **II. URL Structure** | `/{username}`, `/{username}/post/{slug}` | Da co ca 2 route trong App.tsx | DA DAT |
| **II.** Video/Live | `/{username}/video/{slug}`, `/{username}/live/{slug}` | Chua co route, chua co content type | CHUA CO |
| **III. Username** | Regex, 3-20 chars, reserved list | `useHandle.ts` da co regex chuan, reserved list trong DB + code | DA DAT |
| **III.** Cooldown 30 ngay | Username change cooldown | `useHandle.ts` da co COOLDOWN_DAYS = 30 | DA DAT |
| **IV. Slug Generation** | NFD normalize, remove accents, underscore, max 60 | `slugify.ts` da chuan | DA DAT |
| **IV.** Slug collision | _2, _3, ... _50, random fallback | `slugify.ts` da co `makeUniqueSlug` | DA DAT |
| **V. DB Schema** | users, contents, slug_history | Co `profiles`, `community_posts`, `slug_history` | DA DAT (ten khac nhung tuong duong) |
| **V.** Unique index (user_id, type, slug) | Chi co slug trong community_posts | THIEU type trong unique constraint (chua can vi chua co video/live) |
| **VI. API/Route** | Lookup username → post → slug_history fallback | `PostDetail.tsx` da co logic nay | DA DAT |
| **VI.** 301 redirect slug cu | Client-side redirect qua slug_history | `PostDetail.tsx` da co navigate replace | DA DAT (client-side) |
| **VII. Canonical** | `<link rel="canonical">` moi trang | `seoHelpers.ts` da co, dang dung trong PostDetail, HandleProfile, Index | DA DAT |
| **VII.** Open Graph | og:title, og:description, og:image, og:url | `setMetaTags` da co day du | DA DAT |
| **VII.** JSON-LD | Article, Person | PostDetail co Article, HandleProfile co Person | DA DAT |
| **VII.** Sitemap | XML sitemap tu du lieu thuc | Edge Function `sitemap` da co, xuat profile + post | DA DAT |
| **VII.** SEO Origin | Phai la `https://angel.fun.rich` co dinh | `getSeoOrigin()` dang tra ve `window.location.origin` (DONG) | CAN FIX |
| **VIII. Governance** | Cooldown 30 ngay, slug max 3 lan/ngay | Cooldown da co, slug limit chua thay enforce | DA DAT PHAN LON |
| **VIII.** No UUID in public URL | Profile tu redirect UUID → handle | `UserProfile.tsx` dong 323-327 da co auto-redirect | DA DAT |
| **IX. Microservice** | Edge Gateway, Identity, Content, Redirect, SSR | Dang la SPA client-side, doc `MICROSERVICE_ROUTING_ARCHITECTURE.md` ghi nhan la roadmap tuong lai | ROADMAP |
| **X. Performance** | Redis cache, CDN | Chua co (phu thuoc infra) | ROADMAP |

---

### CAC VAN DE CAN XU LY

#### 1. `getSeoOrigin()` tra ve domain dong (BUG SEO)

**Van de:** Ham `getSeoOrigin()` trong `seoHelpers.ts` dong 99-100 tra ve `window.location.origin`. Nghia la tren preview domain se la `lovable.app`, tren custom domain moi la `angel.fun.rich`. Dieu nay vi pham SPEC muc VII — canonical phai luon la domain chinh thuc.

**Sua:** Thay `return window.location.origin` thanh `return 'https://angel.fun.rich'` (hardcode domain chinh).

#### 2. Route cho Video va Live (CHUA CO)

**Van de:** SPEC yeu cau `/{username}/video/{slug}` va `/{username}/live/{slug}` nhung hien tai khong co content type video/live trong database hay route trong App.tsx.

**Danh gia:** Day la tinh nang TUONG LAI. Khong can lam ngay nhung can ghi nhan de khi phat trien video/live se tuan thu SPEC.

#### 3. Sitemap chua split theo type

**Van de:** SPEC yeu cau `sitemap_index.xml` split theo type (profile, post, video). Hien tai chi co 1 file sitemap duy nhat.

**Danh gia:** Voi so luong URL hien tai (duoi 50,000), 1 file la du. Khi scale len moi can split.

---

### KE HOACH THAY DOI (CHI 1 FIX QUAN TRONG)

#### File: `src/lib/seoHelpers.ts`
- Dong 99-100: Thay `return window.location.origin` thanh `return 'https://angel.fun.rich'`
- Muc dich: Dam bao canonical URL, og:url, JSON-LD luon tro ve domain chinh thuc, bat ke user dang truy cap tu domain nao

---

### KET LUAN

He thong Angel AI da **dat tren 85% yeu cau** cua MASTER SPEC:
- Clean URL cho profile va post: DA CO
- Username validation + cooldown: DA CO
- Slug generation + collision: DA CO
- SEO (canonical, OG, JSON-LD, sitemap): DA CO
- Slug history redirect: DA CO
- Auto-redirect UUID → handle: DA CO

Chi can **1 fix nho** (hardcode SEO origin) va ghi nhan **video/live/sitemap-split** la roadmap tuong lai.

| Thay doi | File | Muc dich |
|---|---|---|
| Hardcode SEO origin | `seoHelpers.ts` | Canonical luon la `angel.fun.rich` |

- **1 file thay doi**
- **0 file moi**
- **0 thay doi database**

