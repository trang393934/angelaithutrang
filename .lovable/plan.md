

## Cap nhat domain `angelaithutrang.lovable.app` → `angel.fun.rich`

### Van de

Co 7 file con chua hardcode domain cu `angelaithutrang.lovable.app`. Can thay the tat ca bang `angel.fun.rich` (domain chinh thuc duy nhat).

### Danh sach thay doi

| # | File | Dong | Noi dung cu | Noi dung moi |
|---|---|---|---|---|
| 1 | `public/robots.txt` | 15 | `Sitemap: https://angelaithutrang.lovable.app/sitemap.xml` | `Sitemap: https://angel.fun.rich/sitemap.xml` |
| 2 | `supabase/functions/sitemap/index.ts` | 9 | `const SITE_URL = "https://angelaithutrang.lovable.app"` | `const SITE_URL = "https://angel.fun.rich"` |
| 3 | `src/components/ShareDialog.tsx` | 106 | `const baseUrl = "https://angelaithutrang.lovable.app"` | `const baseUrl = "https://angel.fun.rich"` |
| 4 | `src/components/Web3WalletButton.tsx` | 120 | `window.open("https://angelaithutrang.lovable.app", ...)` | `window.open("https://angel.fun.rich", ...)` |
| 5 | `src/components/gifts/CryptoTransferTab.tsx` | 357 | `window.open("https://angelaithutrang.lovable.app", ...)` | `window.open("https://angel.fun.rich", ...)` |
| 6 | `src/pages/Auth.tsx` | 294 | `const LOVABLE_ORIGIN = "https://angelaithutrang.lovable.app"` | `const LOVABLE_ORIGIN = "https://angelaithutrang.lovable.app"` (**GIU NGUYEN** — day la origin dung cho cross-domain OAuth flow, phai giu domain lovable.app de Google OAuth redirect hoat dong) |
| 7 | `src/pages/docs/Platform.tsx` | 558 | `https://angelaithutrang.lovable.app` | `https://angel.fun.rich` |

### Luu y quan trong ve Auth.tsx

File `Auth.tsx` dong 294 (`LOVABLE_ORIGIN`) **KHONG DUOC THAY DOI**. Day la bien dung cho cross-domain OAuth flow:
- Google OAuth redirect_uri phai tro ve `angelaithutrang.lovable.app` (domain dang ky voi Google)
- Sau khi OAuth thanh cong, code se tu dong redirect nguoi dung ve `angel.fun.rich` thong qua `oauth_return_origin` trong localStorage
- Neu doi bien nay, OAuth se ngung hoat dong

### Tom tat

- **6 file thay doi**: robots.txt, sitemap edge function, ShareDialog, Web3WalletButton, CryptoTransferTab, Platform.tsx
- **1 file giu nguyen**: Auth.tsx (LOVABLE_ORIGIN phai la domain lovable.app cho OAuth)
- **0 file moi**
- **0 thay doi database**

