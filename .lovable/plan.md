
## Them button "Coordinator Gate" vao Header va form them Coordinator moi

### 1. Them button "Coordinator Gate" vao Header (trang chu)

**Vi tri**: Ben trai o tim kiem (GlobalSearch), chi hien thi cho user da dang nhap va co quyen coordinator hoac admin.

**File**: `src/components/Header.tsx`
- Import `useCoordinatorRole` hook
- Them button voi style noi bat: gradient tim/xanh, icon `Shield`, text "Coordinator Gate"
- Dat truoc `<GlobalSearch>` trong phan desktop (dong 158-164)
- Them vao mobile menu grid

**Style button**:
- Gradient noi bat (purple-indigo) de phan biet voi cac nut khac
- Icon Shield + text "Coordinator"
- Rounded-full, shadow, hover animation
- Chi hien khi `hasAccess === true`

### 2. Them form "Add Coordinator" trong trang Coordinator Gate

**File**: `src/pages/CoordinatorGate.tsx`
- Them mot section "Add Coordinator" trong header hoac main area
- Form gom: input email + button "Add"
- Chi cho phep admin hoac coordinator hien tai them nguoi moi

**Logic**:
- Nhap email -> tim user trong bang `profiles` theo email (hoac `auth.users` qua edge function)
- Neu tim thay user -> insert vao bang `user_roles` voi role = 'coordinator'
- Hien thong bao thanh cong/that bai bang sonner toast

**File moi**: `supabase/functions/add-coordinator/index.ts`
- Edge function de xu ly viec them coordinator an toan
- Kiem tra nguoi goi co quyen admin/coordinator
- Tim user theo email trong auth.users
- Insert vao user_roles

### Chi tiet ky thuat

**Header.tsx** thay doi:
- Import them: `useCoordinatorRole`, `Shield` (da co)
- Them button truoc div chua GlobalSearch (desktop)
- Them vao mobile menu

**CoordinatorGate.tsx** thay doi:
- Them state cho email input
- Them UI card "Add Coordinator" voi input + button
- Goi edge function `add-coordinator`

**Edge function `add-coordinator`**:
- Nhan `{ email: string }` trong body
- Verify caller co role admin/coordinator
- Tim user_id tu email qua supabase admin client
- Insert vao `user_roles(user_id, role: 'coordinator')`
- Tra ve ket qua

**Bang `user_roles`**: da co san voi cac column `id, user_id, role, created_at` - khong can tao them bang moi.
