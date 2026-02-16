
# Them he thong chon chu de video nen

## Tong quan
Them 4 video thien nhien moi va tao nut cho user chon video nen yeu thich. Chi hien thi 4 video moi de user chon, cac video cu (Valentine, Tet) van giu trong code nhung khong hien thi trong menu lua chon.

## Cac buoc thuc hien

### 1. Copy 4 video moi vao `public/videos/`
- `IMG_3973.mp4` -> `nature-1.mp4`
- `IMG_3975.mp4` -> `nature-2.mp4`
- `IMG_5200.mp4` -> `nature-3.mp4`
- `IMG_5202.mp4` -> `nature-4.mp4`

### 2. Tao component `VideoThemeSelector.tsx`
- Nut nho co dinh (icon Film) o goc duoi phai man hinh
- Khi click mo Popover hien thi 4 lua chon video thien nhien + 1 lua chon "Tat video"
- Luu lua chon vao `localStorage` key `video-theme`
- Dispatch custom event de `ValentineVideoBackground` cap nhat ngay

### 3. Cap nhat `ValentineVideoBackground.tsx`
- Doc `localStorage` key `video-theme` de xac dinh danh sach video
- Mac dinh: video nature (thay vi valentine)
- Lang nghe custom event `video-theme-change` de cap nhat khi user doi
- Neu theme = "none" -> return null (tat video)

Dinh nghia video theo theme:
```text
nature-1: nature-1.mp4, nature-2.mp4
nature-2: nature-3.mp4, nature-4.mp4
nature-3: nature-1.mp4, nature-3.mp4
nature-4: nature-2.mp4, nature-4.mp4
none: [] (tat video)
```

### 4. Tich hop vao Index.tsx va Community.tsx
- Them `<VideoThemeSelector />` vao ca 2 trang (noi co video nen)

## Chi tiet ky thuat

### VideoThemeSelector
- Su dung Radix Popover
- 5 lua chon: 4 video thien nhien (moi cai la 1 cap video trai-phai) + "Tat video"
- Hien thi ten + icon check cho lua chon dang active
- Khi chon -> luu localStorage -> dispatch event `video-theme-change`

### ValentineVideoBackground
- Them `useState` cho theme, doc tu localStorage
- Them `useEffect` lang nghe event `video-theme-change`
- Map theme sang danh sach video tuong ung
- Neu danh sach rong (none) -> return null
