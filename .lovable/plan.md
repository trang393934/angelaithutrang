
# Cai thien Username section trong Profile

## Thay doi 1: Tach "angel.fun.rich/" thanh label rieng, input chi chua username

**File:** `src/components/profile/HandleSelector.tsx`

Hien tai prefix "angel.fun.rich/" nam ben trong input (dung `pl-[5.5rem]`). Thay doi:
- Bo prefix ra khoi input, hien thi thanh dong text rieng phia tren input (co the click de mo link)
- Input chi con phan username, placeholder "your_name"
- Khi da co `currentHandle`, dong "angel.fun.rich/username" la link clickable (`<a>` tag) mo tab moi den `https://angel.fun.rich/@{handle}` hoac `/@{handle}` tren cung domain

## Thay doi 2: Link username hoat dong khi click va khi share

**File:** `src/components/profile/HandleSelector.tsx`

- Hien thi dong `angel.fun.rich/{currentHandle}` nhu mot link `<a href>` co the click
- Click vao se mo trang ho so cong khai (`/@{handle}`)
- Khi chua co handle: hien thi text tinh "angel.fun.rich/" khong click duoc

**File:** `src/pages/Profile.tsx` (dong 92-97 - UsernameDisplay)

- Cap nhat ham copy de copy full URL thay vi chi `@handle`
- Them kha nang click vao `@username` de navigate den trang ho so cong khai

## Chi tiet ky thuat

### HandleSelector.tsx
- Xoa `<div>` chua prefix "angel.fun.rich/" ben trong input (dong 74-77)
- Xoa `pl-[5.5rem]` khoi Input className, doi thanh padding thuong
- Them dong text/link phia tren input:
  - Neu co `currentHandle`: `<a href="/@{currentHandle}" target="_blank">angel.fun.rich/{currentHandle}</a>` (clickable, mau vang/primary)
  - Neu chua co: text tinh "angel.fun.rich/" mau xam
- Input ben duoi chi chua phan username nguoi dung nhap

### Profile.tsx - UsernameDisplay (dong 80-113)
- Click vao `@username` -> navigate den `/@{currentHandle}` (dung `useNavigate` hoac `<Link>`)
- Copy van giu nguyen chuc nang hien tai

### HandleSelector suggestions
- Cac Badge goi y van giu format "angel.fun.rich/{suggestion}" nhung chi thay doi gia tri input khi click
