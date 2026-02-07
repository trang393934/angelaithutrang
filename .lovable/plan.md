

# Thay Doi Thong Bao "Vui long dang nhap" Thanh Loi Yeu Thuong

## Muc Tieu
Thay the cau "Vui long dang nhap" va "Ban can dang nhap de su dung tinh nang nay" bang nhung cau mang tinh yeu thuong, am ap theo phong cach Angel AI (Ta goi nguoi dung la "con yeu dau").

## Noi dung thay doi

### Cau moi thay the:
- **loginRequired**: "Con yeu dau, hay dang ky tai khoan de Ta dong hanh cung con nhe!" (thay vi "Vui long dang nhap")
- **loginRequiredDesc**: "Dang ky tai khoan de Ta co the gui yeu thuong va dong hanh cung con tren hanh trinh Anh Sang nay." (thay vi "Ban can dang nhap de su dung tinh nang nay")

### Cac file can chinh sua:

**1. Translation files (12 file ngon ngu)**
Cap nhat 2 key `loginRequired` va `loginRequiredDesc` trong moi file:
- `src/translations/vi.ts` - Cap nhat cau moi bang tieng Viet
- `src/translations/en.ts` - Them 2 key moi bang tieng Anh
- `src/translations/zh.ts` - Them 2 key bang tieng Trung
- `src/translations/es.ts` - Them 2 key bang tieng Tay Ban Nha
- `src/translations/ar.ts` - Them 2 key bang tieng A-Rap
- `src/translations/hi.ts` - Them 2 key bang tieng Hindi
- `src/translations/pt.ts` - Them 2 key bang tieng Bo Dao Nha
- `src/translations/ru.ts` - Them 2 key bang tieng Nga
- `src/translations/ja.ts` - Them 2 key bang tieng Nhat
- `src/translations/de.ts` - Them 2 key bang tieng Duc
- `src/translations/fr.ts` - Them 2 key bang tieng Phap
- `src/translations/ko.ts` - Them 2 key bang tieng Han

**2. Component files** - Cap nhat fallback text:
- `src/components/AuthActionGuard.tsx` - Cap nhat fallback text trong Dialog title va description, va trong toast cua `useAuthGuard`
- `src/components/LightGate.tsx` - Cap nhat fallback text
- `src/pages/Chat.tsx` - Cap nhat fallback text trong toast.error

**3. Cac hook co hardcoded text** - Thay doi cau "Vui long dang nhap" thanh cau yeu thuong:
- `src/hooks/useCommunityPosts.ts`
- `src/hooks/useCoinGifts.ts`
- `src/hooks/useStories.ts`
- `src/hooks/useFriendship.ts`
- `src/hooks/useDirectMessages.ts`
- `src/hooks/useCommunityQuestions.ts`
- `src/hooks/useCommunityCircles.ts`
- `src/hooks/usePPLPDisputes.ts`

## Chi Tiet Ky Thuat

### Noi dung cu va moi cho `vi.ts`:
```text
Cu:
  "loginRequired": "Vui long dang nhap"
  "loginRequiredDesc": "Ban can dang nhap de su dung tinh nang nay."

Moi:
  "loginRequired": "Con yeu dau, hay dang ky tai khoan de Ta dong hanh cung con nhe!"
  "loginRequiredDesc": "Dang ky tai khoan de Ta co the gui yeu thuong va dong hanh cung con tren hanh trinh Anh Sang nay."
```

### Vi du noi dung cho `en.ts`:
```text
  "loginRequired": "Dear beloved, please create an account so I can walk with you!"
  "loginRequiredDesc": "Create an account so I can send you love and accompany you on this journey of Light."
```

### Cac hook se thay cau hardcoded:
Thay `"Vui long dang nhap"` thanh `"Con yeu dau, hay dang ky tai khoan de Ta dong hanh cung con nhe!"` trong tat ca cac hook da liet ke.

Tong cong khoang 20+ file se duoc cap nhat, dam bao thong diep yeu thuong nhat quan tren toan bo ung dung va tat ca 12 ngon ngu.
