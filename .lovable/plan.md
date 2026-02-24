

## BÀI 7 — SEO Canonical, Meta Tags, JSON-LD, Sitemap, Robots

### Hien trang

| Spec BÀI 7 | Trang thai | Can lam |
|---|---|---|
| Canonical `<link>` | Chua co | Them vao HandleProfile + PostDetail |
| Meta tags OG + Twitter | Co 1 phan (HandleProfile co OG, PostDetail chi co title) | Bo sung day du cho PostDetail |
| JSON-LD structured data | Chua co | Them Person cho profile, Article cho post |
| Sitemap | Chua co | Tao edge function generate sitemap |
| Robots.txt | Co nhung qua don gian (Allow tat ca) | Cap nhat chan /admin/, /auth/, /api/ |
| 301 slug redirect | Da co (BÀI 4-5) | Da xong |

### Ke hoach

#### 1. Tao utility `src/lib/seoHelpers.ts`

Tap trung logic SEO vao 1 file:
- `setCanonical(url)`: tao/cap nhat `<link rel="canonical">`
- `setMetaTags(config)`: cap nhat OG + Twitter meta tags
- `injectJsonLd(data)`: inject `<script type="application/ld+json">` vao head
- `cleanupSeo()`: xoa canonical + JSON-LD khi roi trang (cho React cleanup)

#### 2. Cap nhat `HandleProfile.tsx` — Profile SEO

- Them canonical: `<link rel="canonical" href="https://{domain}/{handle}" />`
- Them JSON-LD type `Person`:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Display Name",
  "url": "https://{domain}/{handle}",
  "image": "avatar_url",
  "description": "bio"
}
```
- Bo sung twitter:card neu chua co

#### 3. Cap nhat `PostDetail.tsx` — Post SEO

- Them canonical: `<link rel="canonical" href="https://{domain}/{username}/post/{slug}" />`
- Them day du meta tags: og:title, og:description, og:image, og:url, og:type=article, twitter:card
- Them JSON-LD type `Article`:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "post content preview",
  "author": { "@type": "Person", "name": "display_name" },
  "datePublished": "created_at",
  "url": "canonical_url",
  "image": "first image if any"
}
```

#### 4. Cap nhat `robots.txt`

```
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /auth
Disallow: /profile
Disallow: /settings/
Disallow: /api/
Disallow: /messages
Disallow: /notifications
Disallow: /onboarding
Disallow: /mint
Disallow: /coordinator-gate

Sitemap: https://{domain}/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /
```

#### 5. Tao edge function `sitemap` 

Tao `supabase/functions/sitemap/index.ts`:
- Truy van `profiles` (co handle) va `community_posts` (status = published)
- Generate XML sitemap voi cac URL:
  - `/{handle}` cho moi profile co handle
  - `/{handle}/post/{slug}` cho moi bai viet published
- Tra ve `Content-Type: application/xml`
- Gioi han 50,000 URL moi sitemap (theo chuan Google)

#### 6. Cap nhat `Index.tsx` — Homepage canonical

Them canonical cho trang chu: `<link rel="canonical" href="https://{domain}/" />`

### Chi tiet ky thuat

**Files tao moi:**
- `src/lib/seoHelpers.ts`: utility functions cho canonical, meta, JSON-LD
- `supabase/functions/sitemap/index.ts`: edge function generate sitemap XML

**Files thay doi:**
- `src/pages/HandleProfile.tsx`: them canonical + JSON-LD Person + cleanup
- `src/pages/PostDetail.tsx`: them canonical + full meta tags + JSON-LD Article + cleanup
- `public/robots.txt`: them Disallow cho route noi bo + Sitemap URL
- `src/pages/Index.tsx`: them canonical homepage

**Khong thay doi:**
- Khong can migration SQL
- Khong thay doi routing hay DynamicRoute
- Khong thay doi slug_history hay slug governance (da xong BÀI 4-6)

### Ghi chu ve gioi han SPA

Day la Single Page App (SPA), nen:
- Canonical va meta tags duoc set bang JavaScript (client-side) — hoat dong voi Googlebot (render JS) va social crawlers (Twitterbot/Facebook doc tu index.html hoac headless render)
- JSON-LD inject client-side — Google ho tro day du
- Sitemap generate tu edge function — khong phu thuoc client
- Neu can server-side rendering (SSR) cho social preview tot hon, can chuyen sang framework khac (ngoai pham vi bai nay)

