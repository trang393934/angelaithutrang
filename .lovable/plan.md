
# Tao bang thong ke Tet co dinh cho chuong trinh Li xi

## Muc tieu

Tao mot trang admin rieng biet tai `/admin/tet-reward` hien thi bang thong ke FUN Money **co dinh** (snapshot ngay 07/02/2026) tu file Excel da tai len. Bang nay doc lap voi `/admin/mint-stats` (du lieu dong tu database) va duoc su dung de thuc hien chuong trinh thuong Li xi Tet voi cong thuc **1 FUN = 1.000 Camly Coin**.

## Du lieu tu file Excel

File Excel chua **205 nguoi dung** voi cac cot:
- #, User, Hoi dap, Dang bai, Biet on, Tao noi dung, Nhat ky, Hoc tap, Tong FUN, Pass, Fail, Avg Light Score, Mint Status

Trong do:
- 166 users co FUN > 0 (du dieu kien nhan thuong)
- 39 users co FUN = 0 (chi co Fail, chua du dieu kien)

## Giao dien tham khao

Dua theo hinh mau da gui (giong bang hien tai o /admin/mint-stats) nhung them cot "Camly" (FUN x 1.000) va bo cac cot khong can thiet (checkbox chon, Mint status). Thiet ke Gold 11 phu hop voi chuong trinh Tet.

## Chi tiet ky thuat

### Buoc 1: Tao file du lieu tinh (`src/data/tetRewardData.ts`)

Chuyen toan bo 205 dong du lieu tu file Excel thanh mot mang TypeScript const. Moi dong gom:

```typescript
interface TetRewardUser {
  rank: number;
  name: string;
  question: number;   // Hoi dap
  post: number;       // Dang bai
  gratitude: number;  // Biet on
  content: number;    // Tao noi dung
  journal: number;    // Nhat ky
  learn: number;      // Hoc tap
  totalFun: number;   // Tong FUN
  pass: number;
  fail: number;
  avgLightScore: number;
  mintStatus: string;
}
```

### Buoc 2: Tao trang admin (`src/pages/AdminTetReward.tsx`)

Trang admin moi tai `/admin/tet-reward` voi cac thanh phan:

**Header**: 
- Logo Angel AI + tieu de "Thuong Tet 2026 - FUN Money Snapshot"
- Ngay snapshot: 07/02/2026
- Nut "Xuat Excel", "Lam moi"

**Thong ke tong quan** (4 card):
- Tong FUN Money (toan bo)
- Tong Camly Coin se thuong (FUN x 1.000)
- So nguoi du dieu kien (FUN > 0)
- Avg Light Score trung binh

**Bang du lieu chinh**:
- Cac cot giong hinh mau: #, User, Hoi, Bai, On, N.dung, N.ky, Hoc, Tong, Camly, P/F, LS
- Co icon emoji cho header giong bang hien tai
- Co tinh nang tim kiem va sap xep
- Hien thi so lieu dinh dang tieng Viet (dau cham phan cach)
- Cot Camly hien mau vang gold (FUN x 1.000)

**Tinh nang chon va chuyen thuong**:
- Checkbox chon user (giong bang hien tai)
- Thanh hanh dong khi co user duoc chon: hien tong FUN, tong Camly, nut "Chuyen thuong Li xi"
- Goi edge function `distribute-fun-camly-reward` de xu ly
- Hien popup chuc mung `LiXiCelebrationDialog` sau khi thanh cong

**Banner chuong trinh**:
- Gradient Gold 11 
- Noi dung: "Li xi Tet 26.000.000.000 VND"
- Cong thuc: 1 FUN = 1.000 Camly Coin
- Han: 08/02/2026

### Buoc 3: Dang ky route trong `src/App.tsx`

Them route moi:
```typescript
import AdminTetReward from "./pages/AdminTetReward";
// ...
<Route path="/admin/tet-reward" element={<AdminTetReward />} />
```

### Buoc 4: Them link vao `AdminNavToolbar.tsx`

Them muc moi trong nhom "Tai chinh":
```typescript
{ to: "/admin/tet-reward", icon: Gift, label: "Thuong Tet" },
```

Dung icon `Gift` mau do/vang de phan biet voi cac muc khac.

## Tom tat tac dong

| STT | File | Hanh dong | Mo ta |
|-----|------|-----------|-------|
| 1 | `src/data/tetRewardData.ts` | Tao moi | Du lieu 205 users tu Excel (snapshot co dinh) |
| 2 | `src/pages/AdminTetReward.tsx` | Tao moi | Trang admin voi bang thong ke + tinh nang chuyen thuong |
| 3 | `src/App.tsx` | Chinh sua | Them route `/admin/tet-reward` |
| 4 | `src/components/admin/AdminNavToolbar.tsx` | Chinh sua | Them link "Thuong Tet" vao nhom Tai chinh |

**Tong cong**: 2 file moi, 2 file chinh sua. Khong can thay doi database hay Edge Functions (tai su dung `distribute-fun-camly-reward` da co).

## Diem khac biet voi /admin/mint-stats

| Tieu chi | /admin/mint-stats | /admin/tet-reward |
|----------|-------------------|-------------------|
| Nguon du lieu | Database (realtime) | File tinh (snapshot 07/02/2026) |
| So luong users | Thay doi theo thoi gian | Co dinh 205 users |
| Muc dich | Giam sat PPLP | Thuc hien chuong trinh Li xi |
| Bo loc thoi gian | Co (7d, 30d, 90d, All) | Khong (du lieu co dinh) |
| Cap nhat | Tu dong (realtime) | Khong cap nhat |
