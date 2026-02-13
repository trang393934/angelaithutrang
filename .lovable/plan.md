

## Chia trang Profile thành Tab với Sub-routes

### Tong quan
Trang `/profile` se duoc chia thanh 4 tab voi cac route phu rieng biet, su dung React Router nested routes thay vi query params.

### Cau truc Route

```text
/profile          --> redirect to /profile/info
/profile/info     --> Tab Ho so
/profile/assets   --> Tab Tai san
/profile/angel    --> Tab Angel AI
/profile/settings --> Tab Cai dat
```

### Phan chia noi dung Tab

**Tab 1: `/profile/info` - Ho so**
- Cover Photo card
- Avatar & Username card
- Profile Info (ten, bio)
- Username / Handle selector
- Soul Tags
- Social Links Editor

**Tab 2: `/profile/assets` - Tai san**
- Activity History link
- Transaction History section
- Camly Coin & Light Points
- Coin Withdrawal
- Wallet Address card

**Tab 3: `/profile/angel` - Angel AI**
- Response Style (phong cach tra loi)
- Daily Gratitude & Journal
- Healing Messages Panel

**Tab 4: `/profile/settings` - Cai dat**
- Account Info (email, ngay tham gia, doi mat khau)
- Public Profile Settings
- PoPL Score Card
- API Keys
- Light Law Agreement
- Sign Out button

### Chi tiet ky thuat

**File 1: `src/App.tsx`**
- Thay route `/profile` thanh `/profile/*` de ho tro nested routes
- Them 4 route con: `/profile/info`, `/profile/assets`, `/profile/angel`, `/profile/settings`

**File 2: `src/pages/Profile.tsx`**
- Import `useParams`, `useNavigate`, `Navigate` tu react-router-dom
- Import `Tabs, TabsList, TabsTrigger, TabsContent` tu `@/components/ui/tabs`
- Trich xuat tab hien tai tu URL path (vd: `/profile/assets` -> `assets`)
- Neu truy cap `/profile` khong co sub-path -> redirect sang `/profile/info`
- Su dung `Tabs` component voi `value` dong bo voi URL
- Khi click tab -> navigate den route tuong ung (vd: `/profile/angel`)
- TabsList se co style `sticky top-16 z-10 bg-background/95 backdrop-blur` de luon hien thi
- Moi TabsContent boc nhom cac section tuong ung
- Logic setup mode (onboarding profile moi) van giu nguyen o ngoai tabs
- Cac dialog (change password, lightbox, cover editor) van giu o ngoai tabs

### Uu diem
- URL co the chia se/bookmark truc tiep den tab cu the
- Back/Forward cua trinh duyet hoat dong dung
- Giam cuon trang toi thieu 75%
- Moi tab chi hien thi 4-6 section thay vi 20+
- Khong thay doi logic hay chuc nang hien tai

### Files thay doi
1. `src/App.tsx` - Them nested routes cho `/profile/*`
2. `src/pages/Profile.tsx` - Them Tabs layout dong bo voi URL sub-routes

