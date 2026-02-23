
## Hoan thien giao dien mobile cho Coordinator Gate

### Van de hien tai
- Nut "Create New Project" bi tran vien phai tren mobile do header dung `flex justify-between` voi nut qua lon (`size="lg"`)
- Header chua responsive cho man hinh nho

### Cac thay doi

**1. File: `src/pages/CoordinatorGate.tsx`**

- **Header (dong 90-103)**: Chuyen layout header thanh responsive
  - Mobile: xep doc (flex-col), title tren, buttons duoi
  - Desktop: giu nguyen flex-row
  - Giam padding mobile: `px-4 py-3 sm:px-6 sm:py-4`
  - Main content: `px-4 sm:px-6`

- **Nut Home va Create**: Wrap trong `flex-wrap gap-2` de tu dong xuong dong tren mobile

**2. File: `src/components/coordinator/ProjectCreateDialog.tsx`**

- Thay `size="lg"` thanh `size="default"` hoac `size="sm"` tren mobile
- Them class responsive: `text-sm sm:text-base` de nut khong qua lon tren mobile

### Chi tiet ky thuat

**CoordinatorGate.tsx - Header section** (dong 90-103):
```
- flex items-center justify-between
+ flex flex-col sm:flex-row sm:items-center gap-3
```
- Phan buttons: them `w-full sm:w-auto flex-shrink-0`
- Padding: `px-4 sm:px-6`

**ProjectCreateDialog.tsx** (dong 50-51):
- Thay `size="lg"` bang `size="default"`
- Them `w-full sm:w-auto` de nut full-width tren mobile

**ProjectCard.tsx** - khong can thay doi lon, grid `grid-cols-1` da responsive

### Ket qua
- Header khong bi tran tren mobile
- Nut Create hien thi gon gang, khong bi cat
- Layout tong the tuong thich voi tat ca kich thuoc man hinh
