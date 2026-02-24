

## BÀI 9 — Checklist Kiem Tra & Chot Spec

Ket qua kiem tra toan bo he thong URL Governance (BÀI 1-8):

### Ket qua Checklist

| # | Hang muc | Trang thai | Chi tiet |
|---|---|---|---|
| 1 | **Regex username + reserved list** | DA XONG | `useHandle.ts`: regex `^(?=.{3,20}$)[a-z0-9]+(?:_[a-z0-9]+)*$`, reserved list 30+ tu khoa, kiem tra them bang `reserved_handles` trong DB |
| 2 | **Slugify chuan** (remove accents, lowercase, whitelist) | DA XONG | `slugify.ts`: NFD normalization, lowercase, chi cho a-z0-9_, gioi han 60 ky tu, fallback "post" |
| 3 | **Unique index (user_id, type, slug)** | DA XONG | Unique index tren `community_posts(user_id, slug)` + collision handling `makeUniqueSlug` (50 lan + random fallback) |
| 4 | **Slug history + redirect 301** | DA XONG (client-side) | `slug_history` table luu thay doi, `PostDetail.tsx` query slug cu va `navigate(replace)`. Luu y: la client redirect, khong phai server 301 (gioi han SPA) |
| 5 | **Canonical + OG tags + JSON-LD** | DA XONG | `seoHelpers.ts` utility, `HandleProfile.tsx` (Person JSON-LD), `PostDetail.tsx` (Article JSON-LD), `Index.tsx` (homepage canonical) |
| 6 | **Sitemap** | DA XONG (can fix nho) | Edge function `sitemap/index.ts` generate XML, gioi han 50,000 URL, cache 1h. **Van de:** query `profiles` 2 lan (lan 1 khong co user_id, lan 2 co) — can go bo query thua |
| 7 | **Robots.txt** | DA XONG | Chan `/admin/`, `/auth`, `/profile`, `/api/`, `/messages`, `/notifications`, etc. Sitemap URL tro den domain chinh |
| 8 | **HTTPS redirect + domain canonical** | NGOAI PHAM VI | Do Lovable platform xu ly (auto HTTPS, domain config). Khong the cau hinh www/non-www redirect tu code |
| 9 | **CDN caching + SSR pipeline** | CHUA CO (theo ke hoach) | Ghi nhan trong `docs/MICROSERVICE_ROUTING_ARCHITECTURE.md` la giai doan scale tuong lai. Hien tai dung client-side rendering |

### 2 van de can fix

#### Fix 1: Sitemap query thua

File `supabase/functions/sitemap/index.ts` query `profiles` **2 lan** — lan dau khong lay `user_id` (vo ich), lan hai moi lay day du. Can xoa query dau tien (dong 24-29) va vong lap trong (dong 39-42) de chi giu 1 query duy nhat.

#### Fix 2: Sitemap chua tach theo type (sitemap index)

Spec yeu cau sitemap_index.xml voi cac sitemap con (posts, users). Hien tai chi co 1 sitemap duy nhat. Tuy nhien voi quy mo hien tai (chua vuot 50,000 URL), 1 sitemap la du. Ghi nhan de scale sau — **khong can fix ngay**.

### Ke hoach thay doi

Chi can 1 file thay doi nho:

**`supabase/functions/sitemap/index.ts`**:
- Xoa query `profiles` lan dau (dong 24-29, chi lay `handle, updated_at` ma khong co `user_id`)
- Xoa vong lap trong rong (dong 39-42)
- Giu nguyen query `profilesFull` (dong 45-50) lam query chinh duy nhat

Khong thay doi gi khac. Toan bo spec BÀI 1-8 da implement day du.

### Tom tat tong the BÀI 1-9

```text
BÀI 1: URL Structure          -> DA XONG (DynamicRoute, /:username/post/:slug)
BÀI 2: Username Validation    -> DA XONG (regex, reserved list, DB check)
BÀI 3: Slug Generation        -> DA XONG (NFD, lowercase, underscore, 60 char)
BÀI 4: Slug History           -> DA XONG (slug_history table, auto-log)
BÀI 5: Slug Redirect          -> DA XONG (PostDetail query slug_history, client redirect)
BÀI 6: URL Governance         -> DA XONG (cooldown 30d, rate limit 3/day, collision cap 50)
BÀI 7: SEO (Canonical/OG/LD) -> DA XONG (seoHelpers, sitemap, robots.txt)
BÀI 8: Microservice Arch      -> DA XONG (documentation, migration roadmap)
BÀI 9: Checklist              -> FIX NHO (xoa query thua trong sitemap)
```
