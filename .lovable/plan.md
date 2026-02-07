

## Redesign thanh toolbar Admin Dashboard

### Vấn đề hiện tại

Thanh công cụ hiện tại chứa **12 liên kết admin** xếp ngang hàng với style giống nhau, khiến rất khó phân biệt chức năng. Tất cả đều dùng cùng kiểu `rounded-full text-sm text-foreground-muted` và bị ẩn trên mobile (`hidden sm:flex`).

### Thiết kế mới

Tách thanh toolbar thành **2 phần rõ ràng**:

1. **Header chính** (dòng 1): Logo + tiêu đề "Admin Dashboard" + nút Đăng xuất
2. **Thanh điều hướng** (dòng 2): Các liên kết admin được **nhóm theo chức năng** với viền phân cách, và có scroll ngang trên mobile

**Nhóm chức năng:**

| Nhom | Cac muc | Mau sac |
|------|---------|---------|
| Nguoi dung | Thong ke, Early Adopters | Xam/Tim |
| Tai chinh | Rut coin, Quy, FUN Money, Tip Reports | Vang/Amber |
| Noi dung | Kien thuc, Y tuong, Bounty | Xanh duong |
| Lich su | Lich su chat, AI Usage, Lich su anh | Xanh la |

### Chi tiet ky thuat

**File can sua:** `src/pages/AdminDashboard.tsx`

**Thay doi cu the:**

- Tach header thanh 2 phan: phan tren giu logo + tieu de + logout, phan duoi chua toolbar dieu huong
- Thanh dieu huong moi se:
  - Dung `overflow-x-auto` de scroll ngang tren mobile (thay vi `hidden sm:flex`)
  - Nhom cac link thanh cac cum, ngan cach bang duong ke doc (`border-r`)
  - Moi nhom co icon va label ro rang
  - Trang hien tai duoc highlight (active state)
  - Hien thi tren moi kich thuoc man hinh
- Them `Tip Reports` link (hien dang thieu trong toolbar)
- Background cua toolbar su dung `bg-primary-pale/50` de tach biet voi header

### Khong co thay doi database

Chi sua giao dien, khong can migration hay thay doi schema.

