
## Thiet ke lai Cau truc URL — FUN.RICH Clean URLs

### Tong quan

Chuyen doi toan bo he thong URL tu dang cu (`/user/:userId`, `/@:handle`) sang dang moi sach, than thien SEO theo dac ta FUN.RICH: `/{username}`, `/{username}/post/{slug}`, `/{username}/video/{slug}`, `/{username}/live/{slug}`.

### Thach thuc chinh

**Xung dot route**: Cac route hien tai nhu `/chat`, `/about`, `/auth`, `/community`... se bi xung dot voi `/:username`. Can mot he thong phan biet route he thong va route user.

### Giai phap

#### Buoc 1: Tao utility tao slug tu tieng Viet

Tao file `src/lib/slugify.ts`:
- Bo dau tieng Viet (a, e, i, o, u + cac bien the)
- Chuyen lowercase
- Thay khoang trang bang `_`
- Xoa ky tu dac biet
- Cat toi da 60 ky tu (khong cat giua tu)
- Xu ly fallback khi title rong hoac toan ky tu khong hop le

#### Buoc 2: Them cot `slug` vao bang `community_posts`

Migration SQL:
- Them cot `slug` (text, nullable, unique per user)
- Tao unique constraint `(user_id, slug)` de dam bao moi user khong co slug trung
- Tao function `generate_post_slug()` tu dong tao slug khi insert
- Backfill slug cho cac bai viet cu (dung `post_1`, `post_2`... vi khong co title)

#### Buoc 3: Cap nhat `getProfilePath` va tao `getPostPath`

Cap nhat `src/lib/profileUrl.ts`:
```
// Profile: /{handle} hoac /user/{userId} (fallback)
getProfilePath(userId, handle) => handle ? `/${handle}` : `/user/${userId}`

// Post: /{handle}/post/{slug} hoac /post/{postId} (fallback)
getPostPath(postId, slug, handle) => handle && slug ? `/${handle}/post/${slug}` : `/post/${postId}`
```

#### Buoc 4: Cap nhat Router trong App.tsx

```text
Routes moi:
  /:username              → UserProfile (voi logic kiem tra reserved routes)
  /:username/post/:slug   → PostDetail (trang moi)
  /:username/video/:slug  → VideoDetail (tuong lai)
  /:username/live/:slug   → LiveDetail (tuong lai)

Giu lai de tuong thich nguoc:
  /user/:userId           → UserProfile (redirect sang /:handle neu co)
  /@:handle               → Redirect sang /:handle
```

De tranh xung dot, dung component `DynamicRoute` tai route `/:username` kiem tra:
- Neu username trung voi reserved paths (`chat`, `about`, `auth`, `admin`...) → render NotFound
- Neu khop voi handle trong DB → render UserProfile
- Neu khong tim thay → render 404

#### Buoc 5: Tao trang PostDetail

Tao `src/pages/PostDetail.tsx`:
- Nhan params `username` va `slug`
- Query `community_posts` join `profiles` theo handle + slug
- Hien thi bai viet day du voi comments, likes, share
- Meta tags cho SEO/OG sharing

#### Buoc 6: Cap nhat handle validation

Cap nhat `src/hooks/useHandle.ts`:
- Giam MAX_LENGTH tu 30 xuong 20 (theo dac ta)
- Them danh sach reserved words bao gom tat ca route he thong: `chat`, `about`, `auth`, `admin`, `community`, `earn`, `profile`, `onboarding`, `swap`, `knowledge`, `mint`, `messages`, `notifications`, `docs`, `bounty`, `ideas`, `vision`, `receipt`, `coordinator-gate`, `content-writer`, `activity-history`, `community-questions`, `user`, `post`, `video`, `live`

#### Buoc 7: Cap nhat toan bo link trong ung dung

Cap nhat tat ca 31+ files dang dung `/user/${userId}` hoac `/user/${handle}`:
- `src/components/community/PostCard.tsx`
- `src/components/community/SuggestedFriendsCard.tsx`
- `src/components/community/DonationHonorBoard.tsx`
- `src/components/community/GiftHonorBoard.tsx`
- `src/components/community/CommunityHeader.tsx`
- `src/pages/UserProfile.tsx`
- `src/pages/HandleProfile.tsx`
- `src/pages/AdminWalletManagement.tsx`
- `src/pages/AdminTetReward.tsx`
- `src/pages/AdminImageHistory.tsx`
- Va cac file khac...

Tat ca deu chuyen sang dung `getProfilePath()` tu `src/lib/profileUrl.ts`.

#### Buoc 8: Slug generation trong edge function

Cap nhat `supabase/functions/process-community-post/index.ts`:
- Khi `create_post`: tu dong tao slug tu noi dung (50 ky tu dau cua content)
- Kiem tra trung lap slug cua cung user, them hau to `_2`, `_3`
- Luu slug vao DB

---

### Chi tiet ky thuat

**Files moi:**
- `src/lib/slugify.ts` — Ham bo dau tieng Viet + tao slug
- `src/pages/PostDetail.tsx` — Trang xem bai viet theo slug
- Migration SQL — Them cot slug, unique constraint, backfill

**Files chinh sua:**
- `src/App.tsx` — Them routes moi `/:username`, `/:username/post/:slug`
- `src/lib/profileUrl.ts` — Cap nhat `getProfilePath`, them `getPostPath`
- `src/hooks/useHandle.ts` — Giam MAX_LENGTH, them reserved words
- `src/pages/NotFound.tsx` — Cap nhat logic xu ly dynamic routes
- `src/pages/UserProfile.tsx` — Ho tro nhan param `username` thay vi `userId`
- `src/pages/HandleProfile.tsx` — Redirect tu `/@handle` sang `/:handle`
- `supabase/functions/process-community-post/index.ts` — Them slug generation
- 20+ files component cap nhat link format

**Danh sach reserved routes** (khong cho phep lam username):
`chat`, `about`, `auth`, `admin`, `community`, `earn`, `profile`, `onboarding`, `swap`, `knowledge`, `mint`, `messages`, `notifications`, `docs`, `bounty`, `ideas`, `vision`, `receipt`, `coordinator-gate`, `content-writer`, `activity-history`, `community-questions`, `user`, `post`, `video`, `live`

### Thu tu trien khai
1. **Buoc 1** — Tao `slugify.ts` (khong anh huong gi hien tai)
2. **Buoc 2** — Migration them cot slug + backfill
3. **Buoc 6** — Cap nhat handle validation (them reserved words)
4. **Buoc 3** — Cap nhat `profileUrl.ts`
5. **Buoc 4 + 5** — Them routes moi + PostDetail page
6. **Buoc 7** — Cap nhat link toan bo ung dung
7. **Buoc 8** — Cap nhat edge function tao slug
