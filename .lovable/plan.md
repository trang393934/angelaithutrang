

## BÀI 6 — Full URL Governance System

### Phan tich hien trang

He thong da implement phan lon spec qua BÀI 3-5. Kiem tra tung nguyen tac:

| Nguyen tac BÀI 6 | Trang thai hien tai | Can lam |
|---|---|---|
| Username bat bien (khuyen nghi) | Handle doi tu do, khong cooldown | Them cooldown 30 ngay |
| Slug doi theo title, giu link cu | Da co (BÀI 4-5: slug_history + redirect) | Da xong |
| Unique slug theo user + type | Da co unique index `(user_id, slug)` | Da xong |
| Chong spam slug (rate limit doi title) | Chua co | Them rate limit |
| Audit log | slug_history ghi lai thay doi slug, handle_audit_log ghi doi handle | Da co |
| Hau to trung: _2, _3... gioi han 50, roi random suffix | Hien tai loop vo han (khong gioi han) | Them gioi han + random fallback |

### Thay doi can thiet

#### 1. Gioi han collision counter (slug + random fallback)

Cap nhat `makeUniqueSlug` trong `src/lib/slugify.ts` va logic tuong ung trong edge function:
- Thu _2, _3... den _50
- Neu van trung: them random suffix 4 ky tu (vd: `_x7k2`)
- Gioi han tong so lan thu la 55 (50 so + 5 random)

#### 2. Handle cooldown 30 ngay

Cap nhat `src/hooks/useHandle.ts`:
- Khoi phuc logic cooldown 30 ngay (hien tai `canChangeHandle` luon tra ve `true`)
- Tinh `daysUntilChange` tu `handle_updated_at`
- Cho phep doi lan dau (khi chua co handle) ma khong bi cooldown

#### 3. Rate limit doi title/slug trong edge function

Cap nhat `process-community-post/index.ts` (edit_post action):
- Gioi han: toi da 3 lan edit/ngay cho moi bai viet
- Query `slug_history` dem so lan doi slug cua post trong ngay
- Neu vuot gioi han: van cho edit content nhung khong doi slug

### Chi tiet ky thuat

**Files thay doi:**

1. **`src/lib/slugify.ts`** — Cap nhat `makeUniqueSlug`:
   - Them tham so `maxAttempts = 50`
   - Sau 50 lan: generate random 4-char suffix
   - Tong cong thu toi da 55 lan

2. **`src/hooks/useHandle.ts`** — Khoi phuc cooldown:
   - `canChangeHandle()`: kiem tra `handle_updated_at` + 30 ngay < now
   - `daysUntilChange()`: tra ve so ngay con lai
   - Lan dau set handle (currentHandle = null): khong ap dung cooldown

3. **`supabase/functions/process-community-post/index.ts`** — Them 2 thay doi:
   - Slug collision: gioi han 50 lan thu + random fallback (dong bo voi client)
   - Edit rate limit: dem so lan doi slug trong ngay, gioi han 3 lan

**Khong thay doi:**
- Khong can migration SQL (da du bang va index tu BÀI 4-5)
- Khong thay doi `PostDetail.tsx` (redirect da hoat dong)
- Khong thay doi `DynamicRoute.tsx`

### Loi ich
- Chong spam: rate limit edit + handle cooldown bao ve SEO
- Chong collision loop vo han: gioi han 50 + random fallback
- Identity stable: handle khong doi lien tuc, giu on dinh profile URL
- Phu hop tinh than Web3 Social "identity stable" theo spec

