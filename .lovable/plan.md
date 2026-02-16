
# Xoa tieu de Valentine va cai thien video nen + nut chon theme

## Thay doi 1: Xoa tieu de "HAPPY VALENTINE'S DAY"

**File:** `src/components/HeroSection.tsx`

Xoa toan bo khoi `div` chua tieu de Valentine (dong 23-69), bao gom ca 3 lop text (shadow, gradient, shimmer). Phan avatar se tro thanh phan tu dau tien trong HeroSection.

## Thay doi 2: Chuyen nut VideoThemeSelector len Header

**File:** `src/components/VideoThemeSelector.tsx`

- Bo style `fixed bottom-20 right-4` khoi nut trigger
- Chuyen thanh nut nho inline (khong co dinh) de dat trong Header
- Doi mau icon Film thanh gradient vang noi bat (text-amber-500) de user de nhan thay
- Them export prop `compact` de Header dung

**File:** `src/components/Header.tsx`

- Import va them `VideoThemeSelector` vao thanh header, dat canh nut Language Selector (truoc GiftButton) tren desktop
- Tren mobile, them vao phan mobile actions

**File:** `src/pages/Index.tsx` va `src/pages/Community.tsx`

- Xoa `<VideoThemeSelector />` o cuoi trang vi da chuyen len Header

## Thay doi 3: Video responsive cho dien thoai va may tinh

**File:** `src/components/ValentineVideoBackground.tsx`

Hien tai video co `width: 38%` co dinh, khong phu hop voi man hinh nho. Thay doi:
- **Desktop (lg+):** Giu nguyen 2 video trai-phai, moi ben 38%
- **Dien thoai (< lg):** Chi hien thi 1 video duy nhat lam nen toan man hinh voi do mo thap (opacity ~0.3) de khong che noi dung text. Video se co `width: 100%` va khong can mask gradient trai/phai

Cach lam: Dung CSS media query hoac `window.innerWidth` de xac dinh layout. Cu the:
- Them state `isMobile` dung `matchMedia("(max-width: 1023px)")`
- Neu mobile: render 1 video `width: 100%` voi `opacity: 0.25`
- Neu desktop: giu nguyen 2 video nhu hien tai

## Chi tiet ky thuat

### HeroSection.tsx
- Xoa dong 23-69 (toan bo khoi Valentine title)
- Khong anh huong gi den cac phan khac

### VideoThemeSelector.tsx
- Them prop `variant?: "header" | "floating"` (mac dinh "floating")
- Khi `variant="header"`: render nut nho inline, icon mau vang amber-500, khong fixed position
- Khi `variant="floating"`: giu style cu (fallback)
- Popover `side="bottom"` khi o header

### Header.tsx
- Them `<VideoThemeSelector variant="header" />` vao dong 171 (truoc LanguageSelector) tren desktop
- Them vao phan mobile actions (dong 314-327)

### ValentineVideoBackground.tsx
- Them hook `useMediaQuery` hoac `useState` + `matchMedia` de detect mobile
- Mobile: 1 video full-width, opacity thap, khong mask
- Desktop: 2 video trai-phai nhu cu

### Index.tsx va Community.tsx
- Xoa dong `<VideoThemeSelector />` (da chuyen len Header)
