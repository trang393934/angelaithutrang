

## Fix Clean URL cho bai viet — 2 loi can xu ly

### Van de phat hien

Cha da test truc tiep tren trang `/community`:
- Click vao timestamp "20 phut truoc" cua bai viet tu user "Nhu Vinh"
- URL chuyen den `/post/65e3e742-...` → **404 Page not found**

### Nguyen nhan goc

**Loi 1: Nhieu user khong co handle**
- User "Nhu Vinh" (`08ee6223-...`) co `handle = null` trong bang profiles
- Ham `getPostPath(postId, slug, null)` tra ve fallback `/post/{postId}` vi thieu handle

**Loi 2: Khong co route `/post/:postId`**
- File `App.tsx` chi co route `/:username/post/:slug` (dong 143)
- Khong co route `/post/:postId` cho truong hop fallback
- Them vao do, `post` nam trong `RESERVED_ROUTES` cua `DynamicRoute.tsx` (dong 13), nen `/post/...` se luon 404

### Ke hoach sua

#### File 1: `src/App.tsx`
- Them route fallback: `<Route path="/post/:postId" element={<PostDetail />} />` ngay truoc route `/:username/post/:slug` (dong 143)

#### File 2: `src/pages/PostDetail.tsx`
- Cap nhat component de xu ly ca 2 truong hop:
  - **Truong hop 1**: Co `username` + `slug` trong URL params → giu nguyen logic hien tai (fetch theo handle + slug)
  - **Truong hop 2**: Co `postId` trong URL params (fallback) → fetch bai viet truc tiep theo ID, sau do redirect sang clean URL neu bai viet co handle + slug

Cu the:
1. Them `postId` vao `useParams`: `const { username, slug, postId } = useParams<{ username?: string; slug?: string; postId?: string }>()`
2. Trong `fetchPost`, neu co `postId` (va khong co `username/slug`):
   - Query `community_posts` theo `id = postId`
   - Neu bai viet co slug va user co handle → `navigate(\`/\${handle}/post/\${slug}\`, { replace: true })` (redirect sang clean URL)
   - Neu khong co handle/slug → hien thi bai viet truc tiep (khong redirect)

### Tom tat

| Thay doi | File | Muc dich |
|---|---|---|
| Them route `/post/:postId` | `App.tsx` | Xu ly fallback khi user khong co handle |
| Xu ly `postId` param | `PostDetail.tsx` | Fetch bai viet theo ID, redirect sang clean URL neu co the |

- **2 file thay doi**
- **0 file moi**
- **0 thay doi database**

