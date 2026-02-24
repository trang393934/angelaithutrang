

## Trien khai BÀI 4 — Slug History + 301 Redirect

### Hien trang

He thong hien tai **da dung** theo spec BÀI 4:
- Lookup rule: Step 1 tim `user_id` theo `handle`, Step 2 tim post theo `(user_id, slug)` -- dung chuan
- `community_posts.id` (UUID) la primary key, `slug` chi la friendly locator -- dung chuan
- Routes: `/:username` va `/:username/post/:slug` -- dung chuan

### Thieu gi?

**Chua co `slug_history`** -- khi user edit bai viet, slug KHONG doi (edit chi cap nhat content/images). Nhung spec yeu cau: neu slug thay doi trong tuong lai, can luu slug cu va redirect 301 sang slug moi.

### Ke hoach

#### 1. Tao bang `slug_history`

```sql
CREATE TABLE public.slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL DEFAULT 'post',
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  content_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_slug_history_lookup 
  ON public.slug_history (user_id, content_type, old_slug);
```

RLS: cho phep SELECT public (ai cung doc duoc de redirect), INSERT chi cho authenticated user (hoac chi system).

#### 2. Cap nhat edge function `process-community-post` (edit_post action)

Khi edit bai viet, neu content thay doi thi **khong doi slug** (giu on dinh link). Tuy nhien, them logic: neu trong tuong lai co tinh nang "doi slug", se:
- Luu slug cu vao `slug_history`
- Cap nhat slug moi vao `community_posts`

Hien tai chi can chuan bi san co so ha tang (bang + index), chua can thay doi flow edit.

#### 3. Cap nhat `PostDetail.tsx` — Fallback lookup slug cu

Khi tim post theo `(user_id, slug)` khong thay, them buoc fallback:
- Query `slug_history` voi `(user_id, 'post', old_slug)` 
- Neu tim thay → lay `new_slug` → `navigate("/{username}/post/{new_slug}", { replace: true })` (tuong duong 301 redirect trong SPA)

Logic moi trong `PostDetail.tsx`:

```text
1. Tim post theo (user_id, slug) 
2. Neu khong thay → tim slug_history theo (user_id, 'post', old_slug)
3. Neu tim thay history → redirect sang new_slug (replace: true)
4. Neu khong tim thay gi → hien 404
```

### Chi tiet ky thuat

**Files thay doi:**
- Migration SQL: tao bang `slug_history` + index + RLS
- `src/pages/PostDetail.tsx`: them fallback lookup slug_history truoc khi hien 404

**Khong thay doi:**
- `DynamicRoute.tsx`: khong can thay doi (profile khong co slug)
- `process-community-post/index.ts`: chua can thay doi vi hien tai edit khong doi slug. Se bo sung khi co tinh nang "rename slug"

### Loi ich
- San sang cho tinh nang doi slug trong tuong lai
- Bao toan SEO: link cu van hoat dong, redirect sang link moi
- Khong break bat ky link nao da chia se
