

## Cap Nhat Mo Hinh Truy Cap FUN.RICH — 3 Tang

### Tong Quan

Phan lon cac trang da duoc mo cho khach tu lan cap nhat truoc. Lan nay tap trung vao:

1. **Cap nhat noi dung popup** `SignupPromptDialog` va `AuthActionGuard` voi format moi (bullet points, song ngu VN/EN)
2. **Cap nhat i18n** them cac key moi cho popup song ngu
3. **Dam bao trang Messages** hien thi dung cho khach (cho xem giao dien nhung yeu cau dang nhap khi tuong tac)
4. **Kiem tra cac trang UserProfile, Community** — thay toast error bang popup khi khach like/comment/share

### Chi Tiet Ky Thuat

#### 1. Cap nhat `SignupPromptDialog.tsx`

Thay doi noi dung popup thanh format bullet points song ngu:

```text
VN: VUI LONG DANG KY DE
  - DUOC CHOI 🌼
  - DUOC HOC 📚
  - DUOC VOC 📲
  - DUOC LI XI 🧧

EN: PLEASE REGISTER FOR
  - USE & EARN 💰
  - LEARN & EARN 💵
  - GIVE & GAIN 🏅
  - REVIEW & REWARD 🏆
```

Su dung `useLanguage()` de hien thi dung ngon ngu. Them cac translation key moi.

#### 2. Cap nhat `AuthActionGuard.tsx`

Dong bo noi dung popup voi `SignupPromptDialog` — dung cung format bullet points song ngu.

#### 3. Them translation keys

Them vao `vi.ts` va `en.ts` (va 10 file ngon ngu con lai):

```text
"signup.promptTitle": "VUI LONG DANG KY DE" / "PLEASE REGISTER FOR"
"signup.play": "DUOC CHOI 🌼" / "USE & EARN 💰"
"signup.learn": "DUOC HOC 📚" / "LEARN & EARN 💵"
"signup.explore": "DUOC VOC 📲" / "GIVE & GAIN 🏅"
"signup.reward": "DUOC LI XI 🧧" / "REVIEW & REWARD 🏆"
```

#### 4. Cap nhat `UserProfile.tsx` va `Community.tsx`

Thay cac `toast.error("Vui long dang nhap...")` bang hien thi `SignupPromptDialog` khi khach co gang like, comment, share. Them state `showSignupPrompt` va import `SignupPromptDialog`.

#### 5. Cap nhat `Messages.tsx` cho khach

Hien tai trang Messages khong co guard cho khach. Them logic: neu `!user`, hien giao dien "Tin nhan" voi thong bao nhe "Dang nhap de bat dau nhan tin" va nut dang nhap, thay vi de trang trong hoac loi.

### Danh Sach Files Can Sua

| # | File | Mo ta |
|---|---|---|
| 1 | `src/components/SignupPromptDialog.tsx` | Cap nhat noi dung bullet points song ngu |
| 2 | `src/components/AuthActionGuard.tsx` | Dong bo noi dung popup moi |
| 3 | `src/translations/vi.ts` | Them signup prompt keys |
| 4 | `src/translations/en.ts` | Them signup prompt keys |
| 5 | `src/pages/UserProfile.tsx` | Thay toast bang SignupPromptDialog |
| 6 | `src/pages/Community.tsx` | Thay toast bang SignupPromptDialog |
| 7 | `src/pages/Messages.tsx` | Them guest-friendly UI |

### Luu Y

- Cac trang Admin giu nguyen bao mat — khong thay doi
- Khong thay doi RLS hay database
- Logic 5 luot chat da duoc cai dat truoc do — giu nguyen
- Cac trang Earn, Vision, Mint, Ideas, Bounty da mo — giu nguyen

