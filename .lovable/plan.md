
# Thay Doi Logic Link Avatar va Trang Ca Nhan Kieu Facebook

## Muc Tieu
Khi user bam avatar cua minh o goc phai thanh cong cu (ca Header chinh va CommunityHeader), se link toi trang ca nhan kieu Facebook (`/user/:userId`) thay vi trang "Ho So Ca Nhan" hien tai (`/profile`). Dong thoi, cac thong tin quan trong (Camly Coin, Light Points, lich su hoat dong, v.v.) se duoc hien thi ngay tren trang ca nhan phia duoi avatar, giong nhu Facebook.

---

## Cac Thay Doi Chinh

### 1. Cap nhat link Avatar trong Header va CommunityHeader

**File: `src/components/Header.tsx`**
- Dong 211: Thay `<Link to="/profile">` thanh `<Link to={`/user/${user.id}`}>` trong dropdown menu "Trang ca nhan"
- Dong 354: Thay `<Link to="/profile">` thanh `<Link to={`/user/${user.id}`}>` trong mobile profile card

**File: `src/components/community/CommunityHeader.tsx`**
- Dong 203: Thay `<Link to="/profile">` thanh `<Link to={`/user/${user.id}`}>` trong dropdown menu "Trang ca nhan"

### 2. Nang cap trang UserProfile voi thong tin ca nhan

**File: `src/pages/UserProfile.tsx`**

Them cac thong tin sau vao sidebar trai (phan "Gioi thieu"), giong Facebook:

**Khi xem trang cua chinh minh (`isOwnProfile = true`):**
- Hien thi Camly Coin balance (so du hien tai + tong tich luy)
- Hien thi Light Points / PoPL Score (Level + diem)
- Hien thi nut "Chinh sua thong tin" link den `/profile` (trang settings)
- Hien thi link "Lich Su Hoat Dong" link den `/activity-history`

**Khi xem trang nguoi khac:**
- Chi hien thi thong tin cong khai (bio, so bai viet, Camly Coin tich luy, ngay tham gia)
- Khong hien thi so du Camly Coin hien tai cua nguoi khac

### 3. Giu nguyen trang `/profile` lam trang cai dat

Trang `/profile` van ton tai va hoat dong nhu "Cai dat ho so" (edit avatar, bio, doi mat khau, wallet, v.v.) - chi la khong con la trang mac dinh khi bam avatar nua.

---

## Chi Tiet Ky Thuat

### Files cap nhat:

**`src/components/Header.tsx`** (2 cho):
- Dong 211: Thay `to="/profile"` thanh `to={`/user/${user.id}`}` (desktop dropdown)
- Dong 354-355: Thay `to="/profile"` thanh `to={`/user/${user.id}`}` (mobile profile card)

**`src/components/community/CommunityHeader.tsx`** (1 cho):
- Dong 203: Thay `to="/profile"` thanh `to={`/user/${user.id}`}` (dropdown menu)

**`src/pages/UserProfile.tsx`** (nang cap sidebar):
- Import them `useCamlyCoin` va `usePoPLScore` hooks
- Import them `camlyCoinLogo` va `LightPointsDisplay` component
- Them section "Thong tin ca nhan" vao Intro Card khi `isOwnProfile`:
  - Camly Coin balance card (logo + so du + tong tich luy)
  - PoPL Score / Light Points (level + diem)
  - Link "Lich su hoat dong" den `/activity-history`
  - Nut "Chinh sua ho so" link den `/profile` (settings)
- Giu nguyen tat ca chuc nang hien co cua trang UserProfile

### Logic hien thi thong tin tren UserProfile:

```text
+---------------------------+
|    Gioi thieu             |
|   (Bio cua user)          |
+---------------------------+
|  Camly Coin: 7,092        |  <-- chi hien khi isOwnProfile
|  Light Points: Level 2    |  <-- chi hien khi isOwnProfile
+---------------------------+
|  Bai viet: 15             |
|  Luot thich: 230          |
|  Tham gia: Thang 1 2025   |
|  Angel AI Community       |
+---------------------------+
|  Lich Su Hoat Dong  ->    |  <-- chi hien khi isOwnProfile
+---------------------------+
|  [ Chinh sua chi tiet ]   |  <-- chi hien khi isOwnProfile
+---------------------------+
```

### Luu y:
- Trang `/profile` van giu nguyen, chi la khong con la dich den mac dinh khi bam avatar
- Tat ca link "Chinh sua" tren UserProfile van tro ve `/profile` (trang settings)
- Thong tin nhay cam (so du vi, mat khau) chi hien tren `/profile`, khong hien tren UserProfile
- Khong can thay doi database hay backend
