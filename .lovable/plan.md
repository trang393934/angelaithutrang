

# Cap nhat he thong nhac nen - Them lua chon nhac cho nguoi dung

## Tong quan

Thay the nut nhac Valentine co dinh (goc duoi phai) bang nut lua chon nhac nen tren Header, dat canh nut lua chon video nen. Nguoi dung se co nhieu bai nhac de chon. Dong thoi phong to 2 icon (nhac + video).

## Cac thay doi

### 1. Copy 2 file nhac moi vao du an

- `public/audio/tet-vui-ve-1.mp3` (tu file upload TET_VUI_VE_1.mp3)
- `public/audio/tet-vui-ve-2.mp3` (tu file upload TET_VUI_VE_2.mp3)

### 2. Viet lai `ValentineMusicPlayer.tsx` thanh `MusicThemeSelector`

Thay vi player co dinh o goc man hinh, chuyen thanh component kieu Popover giong `VideoThemeSelector`:

- Danh sach nhac:
  - "Valentine" (valentine-bg.mp3) 
  - "Tet Vui Ve 1" (tet-vui-ve-1.mp3)
  - "Tet Vui Ve 2" (tet-vui-ve-2.mp3)
  - "Tat nhac" (none)
- Luu lua chon vao localStorage
- Hien thi icon Music tren Header (giong Film icon cua video)
- Co Volume slider trong Popover
- Ho tro `variant="header"` giong VideoThemeSelector

### 3. Phong to icon tren Header

**File:** `src/components/Header.tsx`

- Doi icon VideoThemeSelector tu `w-3.5 h-3.5 lg:w-4 lg:h-4` thanh `w-5 h-5 lg:w-5 lg:h-5`
- Icon MusicThemeSelector cung `w-5 h-5 lg:w-5 lg:h-5`
- Dat 2 nut canh nhau: `<MusicThemeSelector variant="header" />` ngay ben canh `<VideoThemeSelector variant="header" />`

**File:** `src/components/VideoThemeSelector.tsx`

- Tang kich thuoc icon Film trong variant header tu `w-3.5 h-3.5 lg:w-4 lg:h-4` thanh `w-5 h-5 lg:w-5 lg:h-5`

### 4. Cap nhat App.tsx

- Bo `<ValentineMusicPlayer />` ra khoi layout chinh (vi da chuyen vao Header)

## Chi tiet ky thuat

### MusicThemeSelector (file moi: `src/components/MusicThemeSelector.tsx`)

```text
Cau truc tuong tu VideoThemeSelector:
- Popover voi trigger la nut Music icon
- Noi dung: danh sach nhac + volume slider
- Luu selectedTrack vao localStorage ("bg-music-track")
- Luu volume vao localStorage ("bg-music-volume") 
- Luu trang thai play vao localStorage ("bg-music-playing")
- Su dung Audio API de phat nhac loop
- Khi doi bai: pause -> doi src -> play
- Khi chon "Tat nhac": pause audio
```

### Header.tsx - Vi tri 2 nut

Dong 168-170 (desktop): Them MusicThemeSelector ngay truoc hoac sau VideoThemeSelector
Dong 319-320 (mobile): Them MusicThemeSelector ngay truoc hoac sau VideoThemeSelector

### Giu nguyen logic autoplay

- Khi user mo trang, neu localStorage ghi "playing=true", tu dong phat nhac sau khi user tuong tac (click/touch) de vuot qua browser autoplay policy
