

# Cập nhật domain FUN Profile Link: `fun.rich/` -> `angel.fun.rich/`

Thay đổi tất cả hiển thị domain từ `fun.rich/` sang `angel.fun.rich/` trong 6 file.

---

## Danh sách thay đổi

### 1. `src/components/profile/HandleSelector.tsx`
- Toast message: `angel.fun.rich/{handle}`
- Ví dụ signup: `angel.fun.rich/camly_duong`
- Input prefix: `angel.fun.rich/`
- Suggestion badges: `angel.fun.rich/{suggestion}`
- Link hiện tại: `angel.fun.rich/{currentHandle}`

### 2. `src/components/public-profile/PublicProfileHeader.tsx`
- Handle display: `angel.fun.rich/{handle}`
- Copy link URL (nếu có)

### 3. `src/pages/HandleProfile.tsx`
- Not found page: `angel.fun.rich/{handle}`

### 4. `src/pages/UserProfile.tsx`
- Handle display: `angel.fun.rich/{handle}`

### 5. `src/pages/Profile.tsx`
- Card description ví dụ: `angel.fun.rich/camly_duong`

### 6. `src/pages/Knowledge.tsx`
- Link `fun-profile` share URL (giữ nguyên các platform khác vì chúng là domain riêng)

---

## Lưu ý
- Chỉ thay đổi text hiển thị và URL liên quan đến profile link của dự án Angel AI
- Các domain platform khác (farm.fun.rich, academy.fun.rich...) giữ nguyên
- Không thay đổi database hay logic

