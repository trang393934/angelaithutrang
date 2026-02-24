

## BÀI 8 — Microservice Routing Architecture (Phan tich & Mapping)

### Ket luan chinh

BÀI 8 mo ta kien truc **microservice ly tuong** cho giai doan scale. He thong hien tai la **monolithic SPA + Supabase Edge Functions**, da implement day du cac chuc nang tuong duong nhung chua tach thanh service rieng. Day la tai lieu kien truc tham chieu (reference architecture), **khong can thay doi code** tai thoi diem nay.

### Mapping hien trang vs Spec

| Service (BÀI 8) | Hien tai | Component/File | Trang thai |
|---|---|---|---|
| **Edge Router / API Gateway** | React Router (client-side) + Supabase Edge Functions | `App.tsx` (routing), `DynamicRoute.tsx` (username vs system route) | Tuong duong, client-side |
| **Identity Service** (username to user_id) | Query truc tiep `profiles` table | `DynamicRoute.tsx`, `PostDetail.tsx`, `HandleProfile.tsx` | Da co, chua cache |
| **Content Service** (slug lookup) | Query truc tiep `community_posts` table | `PostDetail.tsx`, `process-community-post` edge function | Da co |
| **Redirect Service** (slug_history) | Client-side redirect trong `PostDetail.tsx` | `PostDetail.tsx` (line ~60: check slug_history, navigate replace) | Da co (client 302, khong phai server 301) |
| **SEO/Render Service** (SSR, OG, canonical) | Client-side injection (seoHelpers.ts) | `seoHelpers.ts`, `HandleProfile.tsx`, `PostDetail.tsx` | Da co (client-side, khong SSR) |
| **Search/Index Service** (sitemap) | Edge function generate XML | `supabase/functions/sitemap/index.ts` | Da co |

### Flow request hien tai vs spec

```text
Spec (Microservice):                    Hien tai (Monolith SPA):
                                        
GET /leminhtri/post/chuc_mung_nam_moi   GET /leminhtri/post/chuc_mung_nam_moi
                                        
1. Gateway (parse path)                 1. React Router match /:username/post/:slug
                                           -> PostDetail component
                                        
2. Identity Service                     2. PostDetail.tsx: query profiles
   username -> user_id (cached)            WHERE handle ILIKE username
                                           (khong cache, query moi lan)
                                        
3. Content Service                      3. PostDetail.tsx: query community_posts
   query by (user_id, type, slug)          WHERE user_id = X AND slug = Y
                                        
4. Redirect Service                     4. PostDetail.tsx: neu khong tim thay
   slug_history -> 301                     -> query slug_history
                                           -> navigate(newSlug, replace)
                                           (client redirect, khong 301 server)
                                        
5. SEO/Render Service                   5. seoHelpers.ts: inject canonical,
   SSR HTML + OG + JSON-LD                 OG tags, JSON-LD (client-side JS)
                                        
6. Response HTML                        6. React render PostCard component
```

### Cache strategy (hien tai vs spec)

| Cache layer (BÀI 8) | Hien tai | Ghi chu |
|---|---|---|
| username to user_id (Redis, TTL dai) | Khong cache, query moi request | Co the them React Query cache client-side |
| Public content HTML (CDN edge, stale-while-revalidate) | Khong cache HTML (SPA render client) | Can SSR/SSG de lam duoc |
| Sitemap cache | Edge function tra Cache-Control: max-age=3600 | Da co |

### Hanh dong khuyen nghi

BÀI 8 la **tai lieu tham chieu kien truc** cho giai doan migration sang microservice. Tai thoi diem hien tai:

**Khong can thay doi code** — he thong da co day du chuc nang tuong duong:
- Routing: DynamicRoute + PostDetail xu ly dung
- Identity lookup: profiles query hoat dong
- Slug redirect: slug_history + client redirect hoat dong
- SEO: canonical + OG + JSON-LD + sitemap da implement (BÀI 7)
- Slug governance: rate limit + collision handling da implement (BÀI 5-6)

**Khi can scale (tuong lai):**
1. Tach Identity Service: tao edge function `resolve-identity` rieng, tra ve user_id tu handle, co cache header
2. Tach Redirect Service: xu ly 301 tai CDN/edge level thay vi client-side
3. Them SSR layer: dung framework nhu Next.js hoac Cloudflare Workers de render HTML server-side cho social crawlers
4. Them Redis cache: cho identity lookup va content rendering

### Tai lieu luu tru

Noi dung BÀI 8 nen duoc luu vao `docs/MICROSERVICE_ROUTING_ARCHITECTURE.md` de team tham chieu khi bat dau giai doan scale. File nay se chua:
- So do kien truc microservice muc tieu
- Mapping hien tai vs muc tieu
- Cache strategy chi tiet
- Ke hoach migration tung buoc

**Tong ket:** Tao 1 file documentation duy nhat. Khong thay doi code hay database.

