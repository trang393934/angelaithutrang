

# Hoàn thiện FUN Public Landing Profile

Trang `fun.rich/{handle}` (route `/@{handle}`) da hoat dong co ban. Sau day la cac diem can hoan thien de trang hien thi dung va day du theo spec.

---

## Hien trang

Trang da co:
- Header voi avatar, ten, handle, bio, tagline, badge
- Nut "Hoi Angel" (Ask Angel)
- Action buttons (Ket ban, Nhan tin, Tang qua) voi privacy controls
- Stats (8 chi so)
- Ban be preview
- Featured content section
- Bai viet gan day
- FUN Worlds tiles
- Join CTA cho nguoi chua dang nhap
- Event tracking + referral param

---

## Cac viec can lam

### 1. Them nut Copy/Share Link tren trang profile cong khai

Hien tai trang chi hien `fun.rich/{handle}` nhu text. Can them:
- Nut Copy Link de user de dang sao chep va chia se
- Nut Share (Web Share API tren mobile)

**File:** `src/components/public-profile/PublicProfileHeader.tsx`
- Them nut copy icon ben canh handle text
- Khi nhan: copy `https://angelaithutrang.lovable.app/@{handle}` vao clipboard

### 2. Cai thien link ban be: chuyen tu `/user/{userId}` sang `/@{handle}`

Hien tai khi click vao ban be, no dung `/user/{userId}`. Nen chuyen sang `/@{handle}` neu ban be co handle.

**File:** `src/components/public-profile/PublicProfileFriends.tsx`
- Fetch them truong `handle` trong danh sach ban be
- Dung `/@{handle}` thay vi `/user/{userId}` neu co handle

**File:** `src/hooks/usePublicProfile.ts`
- Them `handle` vao select khi fetch friend profiles

### 3. Them so "Active in X FUN Worlds" vao stats

Theo spec can hien thi "Modules active count" de tang social proof.

**File:** `src/components/public-profile/PublicProfileStats.tsx`
- Them 1 stat item hien thi so module dang active (dua tren `enabled_modules.length`)

**File:** `src/pages/HandleProfile.tsx`
- Truyen `enabledModulesCount` xuong `PublicProfileStats`

### 4. Auto-follow prompt sau khi signup tu profile link

Khi nguoi dung signup tu link profile, quay lai trang profile va hoi "Follow [Name] now?"

**File:** `src/pages/HandleProfile.tsx`
- Check neu user vua dang nhap va co `fun_referrer` trong localStorage
- Hien dialog "Follow [Name] now?" voi 1 click

### 5. Cai thien meta tags cho SEO/Social sharing

Hien tai SPA khong co dynamic OG tags. Can tao logic de khi share link tren Facebook/Zalo thi hien anh + ten nguoi.

**File:** `src/pages/HandleProfile.tsx`
- Dung `document.title` va meta tags dong khi profile load
- Set `og:title`, `og:description`, `og:image` qua JavaScript

### 6. Them "Thoi gian tham gia" vao header

Hien thi "Thanh vien tu thang X/YYYY" de tang trust.

**File:** `src/components/public-profile/PublicProfileHeader.tsx`
- Hien thi `created_at` duoi dang "Thanh vien tu 01/2026"

---

## Chi tiet ky thuat

### Files can tao moi
- Khong can tao file moi

### Files can sua
1. `src/components/public-profile/PublicProfileHeader.tsx` -- Them nut Copy Link + ngay tham gia
2. `src/components/public-profile/PublicProfileFriends.tsx` -- Link sang `/@handle`
3. `src/hooks/usePublicProfile.ts` -- Fetch handle cho ban be
4. `src/components/public-profile/PublicProfileStats.tsx` -- Them stat "FUN Worlds"
5. `src/pages/HandleProfile.tsx` -- Dynamic meta tags + auto-follow prompt + truyen modules count

### Database
- Khong can thay doi database

