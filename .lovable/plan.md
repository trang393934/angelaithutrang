

## BÀI 5 — DB Schema + Index chuan (Slug Governance)

### Phan tich hien trang vs spec

Spec BÀI 5 mo ta mot he thong **ly tuong** voi bang `contents` thong nhat cho post/video/live. Tuy nhien, he thong hien tai da co kien truc rieng hoat dong tot:

| Spec BÀI 5 | He thong hien tai | Trang thai |
|---|---|---|
| `users` table voi `username` | `profiles` table voi `handle` + `user_id` (UUID tu auth) | Da co, khac ten nhung cung chuc nang |
| `contents` table thong nhat (post/video/live) | `community_posts` table rieng cho posts | Da co cho posts |
| Unique index `(user_id, type, slug)` | Unique index `(user_id, slug)` WHERE slug IS NOT NULL | Da co, tuong duong (chi co 1 type) |
| `content_slug_history` | `slug_history` (vua tao o BÀI 4) | Da co |
| Index lookup `(user_id, type, created_at DESC)` | Chua co | Can them |
| Governance: doi title → doi slug → luu history | Chua implement (edit khong doi slug) | Can them |

### Ket luan

He thong **da co 80% co so ha tang** theo spec. Thay vi tao lai bang moi (pha vo data hien tai), chi can **bo sung phan con thieu**:

### Thay doi can thiet

#### 1. Them index lookup nhanh tren `community_posts`

Spec yeu cau index `(user_id, type, created_at DESC)`. Vi he thong chi co 1 type (post), index tuong duong:

```sql
CREATE INDEX ix_community_posts_user_created 
  ON community_posts(user_id, created_at DESC);
```

Giup query danh sach bai viet cua 1 user nhanh hon.

#### 2. Them unique constraint tren `slug_history`

Spec yeu cau `UNIQUE(content_id, old_slug)` de tranh trung lap. Hien tai `slug_history` chi co index lookup, chua co unique constraint:

```sql
CREATE UNIQUE INDEX uq_slug_history_content_oldslug 
  ON slug_history(content_id, old_slug);
```

#### 3. Implement slug governance trong edge function

Cap nhat `process-community-post/index.ts` (action `edit_post`):
- Khi user edit bai viet, generate slug moi tu title moi
- Neu slug moi khac slug cu:
  - INSERT slug cu vao `slug_history`
  - UPDATE `community_posts.slug` = slug moi
- Neu slug moi giong slug cu: khong lam gi them

#### 4. Lam cho `community_posts.slug` NOT NULL

Hien tai `slug` la nullable. Spec yeu cau slug bat buoc. Can migration:

```sql
-- Dat slug cho cac bai viet chua co slug
UPDATE community_posts SET slug = 'post_' || LEFT(id::text, 8) WHERE slug IS NULL;
-- Doi thanh NOT NULL
ALTER TABLE community_posts ALTER COLUMN slug SET NOT NULL;
```

Sau do bo `WHERE slug IS NOT NULL` khoi unique index va tao lai.

### Chi tiet ky thuat

**Files thay doi:**
- Migration SQL: them index, unique constraint, NOT NULL cho slug
- `supabase/functions/process-community-post/index.ts`: them slug governance logic trong edit_post action

**Khong thay doi:**
- Khong tao bang `contents` moi (giu `community_posts` hien tai)
- Khong thay doi `profiles` (da tuong duong `users` trong spec)
- Khong thay doi `slug_history` schema (da dung tu BÀI 4)
- Khong thay doi `PostDetail.tsx` (fallback redirect da implement o BÀI 4)

### Loi ich
- Query nhanh hon voi index `(user_id, created_at DESC)`
- Slug governance tu dong: edit title → slug cap nhat → link cu van redirect dung
- Data integrity: slug NOT NULL + unique constraint bao dam khong trung
- Khop voi tinh than spec BÀI 5 ma khong pha vo kien truc hien tai

