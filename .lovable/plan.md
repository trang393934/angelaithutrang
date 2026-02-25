

## Ke hoach: Fix giao dien Tang Thuong

### Van de 1: Dropdown Token Selector bi chong cheo
**Nguyen nhan:** Dropdown dang dung `absolute z-50` nhung nam trong Dialog co `overflow-y-auto` → dropdown bi cat boi overflow cua Dialog container.

**Giai phap:** Them `overflow-visible` cho container dropdown khi dang mo, va tang z-index len `z-[100]` de dam bao hien thi tren tat ca.

**File:** `src/components/gifts/TokenSelector.tsx`
- Container div bao ngoai dropdown can co `relative` + khi dropdown mo thi khong bi cat boi overflow
- Dropdown menu: tang z-index `z-[100]`, them `backdrop-blur` va `shadow-xl` de sang trong hon
- Cac item trong dropdown: tang padding, them separator giua cac item de phan biet ro rang

### Van de 2: Input so luong bi thay doi khi lan chuot (scroll)
**Nguyen nhan:** Input `type="number"` mac dinh cua trinh duyet cho phep cuon chuot de tang/giam gia tri. Day la hanh vi mac dinh cua HTML input number.

**Giai phap:** Them su kien `onWheel` de chan hanh vi cuon, va them CSS an spinner (mui ten tang/giam) tren tat ca trinh duyet.

**File can sua:**
1. `src/components/gifts/GiftCoinDialog.tsx` (dong 601-606) — them `onWheel` handler
2. `src/components/gifts/CryptoTransferTab.tsx` (dong 627-630) — them `onWheel` handler
3. `src/components/gifts/DonateProjectDialog.tsx` — them `onWheel` handler cho 3 input number
4. `src/index.css` — them CSS an spinner cho input number trong gift dialog

### Chi tiet ky thuat

**TokenSelector dropdown fix:**
- Them class `relative` cho parent wrapper
- Dropdown panel: doi tu `absolute z-50` thanh `absolute z-[100]`
- Them `bg-card border-2 border-amber-300 shadow-2xl backdrop-blur-sm` de dropdown ro rang, khong trong suot
- Them `divide-y divide-amber-100` de phan tach cac item
- Tang padding item, them hover effect ro hon

**Number input scroll fix:**
- Them `onWheel={(e) => (e.target as HTMLInputElement).blur()}` tren moi input `type="number"`
- Them CSS global:
```css
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] { -moz-appearance: textfield; }
```

### Tom tat

| # | File | Thay doi |
|---|---|---|
| 1 | `TokenSelector.tsx` | Fix dropdown z-index, them background/shadow sang trong, phan tach item |
| 2 | `GiftCoinDialog.tsx` | Them `onWheel` chan scroll tren input number |
| 3 | `CryptoTransferTab.tsx` | Them `onWheel` chan scroll tren input number |
| 4 | `DonateProjectDialog.tsx` | Them `onWheel` chan scroll tren 3 input number |
| 5 | `src/index.css` | An spinner (mui ten) cua input number |

- **5 file sua**
- **0 file moi**
- **0 thay doi database**

