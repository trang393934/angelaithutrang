

## Plan: Xoa video nen — dua ve nen tu nhien Angel AI

### Pham vi thay doi

Xoa toan bo component video nen va nut chon video nen khoi tat ca cac trang va thiet bi.

### Cac file can sua (xoa import + xoa JSX)

| # | File | Thay doi |
|---|---|---|
| 1 | `src/pages/Index.tsx` | Xoa import `ValentineVideoBackground`, xoa `<ValentineVideoBackground />` |
| 2 | `src/pages/Community.tsx` | Xoa import `ValentineVideoBackground`, xoa `<ValentineVideoBackground />` |
| 3 | `src/pages/UserProfile.tsx` | Xoa import `ValentineVideoBackground`, xoa `<ValentineVideoBackground />` |
| 4 | `src/components/Header.tsx` | Xoa import `VideoThemeSelector`, xoa 2 cho `<VideoThemeSelector variant="header" />` (desktop + mobile) |

### Cac file xoa hoan toan

| # | File | Ly do |
|---|---|---|
| 5 | `src/components/ValentineVideoBackground.tsx` | Khong con dung |
| 6 | `src/components/VideoThemeSelector.tsx` | Khong con dung |

### Ket qua

- Video nen bi xoa hoan toan tren moi trang, moi thiet bi
- Nut chon video (bieu tuong Film) bi xoa khoi Header
- Nen trang tro ve nen tu nhien cua Angel AI (gradient/mau nen mac dinh)
- **0 file moi, 0 thay doi database**

