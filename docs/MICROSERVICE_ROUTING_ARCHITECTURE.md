# BÀI 8 — Microservice Routing Architecture

> Tài liệu tham chiếu kiến trúc cho giai đoạn scale. Không yêu cầu thay đổi code tại thời điểm hiện tại.

## 1. Kiến trúc Microservice mục tiêu

```
┌─────────────┐
│   Client     │
│  (Browser)   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Edge Router /   │  Parse path → route to service
│  API Gateway     │  Rate limiting, auth check
└──┬───┬───┬───┬───┘
   │   │   │   │
   ▼   │   │   │
┌──────┐   │   │
│Identity  │   │   username → user_id (Redis cached, TTL dài)
│Service│  │   │
└──┬───┘   │   │
   │       ▼   │
   │  ┌────────┐
   │  │Content │   slug lookup, content rendering API
   │  │Service │   query by (user_id, type, slug)
   │  └──┬─────┘
   │     │     ▼
   │     │ ┌────────┐
   │     │ │Redirect│  slug_history → 301
   │     │ │Service │  username change mapping
   │     │ └────────┘
   │     │         ▼
   │     │   ┌──────────┐
   │     │   │SEO/Render│  SSR HTML, OG tags, canonical, JSON-LD
   │     │   │Service   │
   │     │   └──────────┘
   │     │
   ▼     ▼
┌──────────────┐
│Search/Index  │  Sitemap generator, indexing
│Service       │
└──────────────┘
```

## 2. Mapping hiện trạng vs Mục tiêu

| Service (Mục tiêu) | Hiện tại | Component/File | Trạng thái |
|---|---|---|---|
| **Edge Router / API Gateway** | React Router (client-side) + Edge Functions | `App.tsx`, `DynamicRoute.tsx` | Tương đương, client-side |
| **Identity Service** (username → user_id) | Query trực tiếp `profiles` table | `DynamicRoute.tsx`, `PostDetail.tsx`, `HandleProfile.tsx` | Đã có, chưa cache |
| **Content Service** (slug lookup) | Query trực tiếp `community_posts` table | `PostDetail.tsx`, `process-community-post` edge function | Đã có |
| **Redirect Service** (slug_history) | Client-side redirect | `PostDetail.tsx` (check slug_history → navigate replace) | Đã có (client 302, không phải server 301) |
| **SEO/Render Service** (SSR, OG, canonical) | Client-side injection | `seoHelpers.ts`, `HandleProfile.tsx`, `PostDetail.tsx` | Đã có (client-side, không SSR) |
| **Search/Index Service** (sitemap) | Edge function generate XML | `supabase/functions/sitemap/index.ts` | Đã có |

## 3. Flow request — So sánh

### Ví dụ: `GET /leminhtri/post/chuc_mung_nam_moi`

```
Microservice (Mục tiêu):                Monolith SPA (Hiện tại):

1. Gateway                              1. React Router /:username/post/:slug
   parse path → username, type, slug       → PostDetail component

2. Identity Service                     2. PostDetail.tsx: query profiles
   username → user_id (cached Redis)       WHERE handle ILIKE username
                                           (không cache, query mỗi lần)

3. Content Service                      3. PostDetail.tsx: query community_posts
   query by (user_id, type, slug)          WHERE user_id = X AND slug = Y

4. Redirect Service                     4. PostDetail.tsx: nếu không tìm thấy
   slug_history → 301 server-side          → query slug_history
                                           → navigate(newSlug, replace)
                                           (client redirect)

5. SEO/Render Service                   5. seoHelpers.ts: inject canonical,
   SSR HTML + OG + JSON-LD                 OG tags, JSON-LD (client-side JS)

6. Response: Full HTML                  6. React render PostCard component
```

## 4. Cache Strategy

| Cache layer | Hiện tại | Mục tiêu | Ghi chú |
|---|---|---|---|
| username → user_id | Không cache | Redis, TTL dài (24h+) | Có thể thêm React Query cache client-side trước |
| Public content HTML | Không cache (SPA render client) | CDN edge, stale-while-revalidate | Cần SSR/SSG để làm được |
| Sitemap | `Cache-Control: max-age=3600` | Giữ nguyên | Đã có |
| Static assets | Vite hash-based | Giữ nguyên | Đã có |

## 5. Kế hoạch Migration (Từng bước)

### Phase 1 — Client-side cache (Có thể làm ngay)
- Wrap identity lookup trong React Query với `staleTime: 5 * 60 * 1000`
- Giảm số query đến profiles table khi user navigate qua nhiều post cùng author

### Phase 2 — Tách Identity Service
- Tạo edge function `resolve-identity`: nhận handle, trả về user_id
- Thêm `Cache-Control: public, max-age=86400` header
- Client gọi edge function thay vì query trực tiếp

### Phase 3 — Tách Redirect Service
- Xử lý 301 tại CDN/edge level thay vì client-side
- Edge function check slug_history, trả 301 header nếu match

### Phase 4 — SSR Layer
- Dùng Cloudflare Workers hoặc framework SSR để render HTML server-side
- Ưu tiên cho social crawlers (Twitterbot, facebookexternalhit)
- Fallback về SPA cho user thường

### Phase 5 — Full Microservice
- Tách từng service thành independent deployment
- Thêm Redis cho cross-service cache
- API Gateway với load balancing

## 6. Quyết định kiến trúc

| Quyết định | Lý do |
|---|---|
| Giữ monolith SPA hiện tại | Đủ chức năng cho quy mô hiện tại, ít complexity |
| Không tách service ngay | Chi phí vận hành microservice cao hơn lợi ích tại quy mô nhỏ |
| Ưu tiên cache trước SSR | Cache giảm load database ngay lập tức, SSR cần thay đổi framework |
| Document-first approach | Team có reference architecture khi cần scale |

---

*Tài liệu này là reference architecture. Implement khi hệ thống cần scale beyond current capacity.*
