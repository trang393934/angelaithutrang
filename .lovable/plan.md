

## Fix Clean URL cho Bai viet: `/{handle}/post/{slug}`

### Van de hien tai

Sau khi kiem tra code, phat hien **2 loi chinh** khien URL bai viet chua hoat dong:

#### Loi 1: Hook `useCommunityPosts` khong fetch `slug` va `handle`

File `src/hooks/useCommunityPosts.ts`:
- **Dong 116**: Query profiles chi lay `user_id, display_name, avatar_url` — **thieu `handle`**
- **Dong 141-154**: Khi merge data, khong gan `user_handle` vao post object
- Interface `CommunityPost` (dong 6-22) khong co truong `slug` va `user_handle`

Hau qua: Moi post trong feed khong co `slug` va `handle`, nen khong the tao Clean URL.

#### Loi 2: `PostCard` khong co link den trang chi tiet bai viet

File `src/components/community/PostCard.tsx`:
- Noi dung bai viet (dong 538) chi hien text, **khong duoc boc trong `<Link>`** den `/{handle}/post/{slug}`
- Ngay gio (dong 372) cung khong link den post detail
- Tuy `getProfilePath` duoc import (dong 4), nhung `getPostPath` thi **khong duoc import** va **khong duoc su dung** o dau ca

### Ke hoach sua

#### File 1: `src/hooks/useCommunityPosts.ts`

1. **Cap nhat interface `CommunityPost`** (dong 6-22): Them 2 truong `slug` va `user_handle`
2. **Cap nhat query profiles** (dong 116): Them `handle` vao select: `"user_id, display_name, avatar_url, handle"`
3. **Cap nhat merge data** (dong 141-154): Gan them `user_handle: profile?.handle || null` vao enrichedPosts

#### File 2: `src/components/community/PostCard.tsx`

1. **Import `getPostPath`** tu `@/lib/profileUrl` (dong 4)
2. **Boc ngay gio** (dong 372-374) trong `<Link to={getPostPath(post.id, post.slug, post.user_handle)}>` — click vao thoi gian se di den trang chi tiet (giong Facebook/X)
3. Noi dung bai viet giu nguyen khong boc link (de tranh xung dot voi `LinkifiedContent` ben trong)

### Chi tiet ky thuat

- `getPostPath(postId, slug, handle)` da co san trong `src/lib/profileUrl.ts`: tra ve `/{handle}/post/{slug}` neu co du handle + slug, fallback ve `/post/{postId}`
- Posts trong DB da co truong `slug` (do edge function `process-community-post` tao tu dong khi dang bai)
- Route `/:username/post/:slug` da co san trong `App.tsx` (dong 137), tro den `PostDetail`

### Tom tat

| Thay doi | File | Muc dich |
|---|---|---|
| Them `slug`, `user_handle` vao interface | `useCommunityPosts.ts` | De TypeScript nhan biet 2 truong moi |
| Fetch `handle` tu profiles | `useCommunityPosts.ts` | De co du lieu tao Clean URL |
| Gan `user_handle` vao post | `useCommunityPosts.ts` | Truyen xuong PostCard |
| Import `getPostPath` | `PostCard.tsx` | Su dung ham tao URL |
| Boc timestamp trong `<Link>` | `PostCard.tsx` | Click vao thoi gian → di den `/{handle}/post/{slug}` |

