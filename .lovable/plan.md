

# Thêm mục Admin vào Dropdown Menu người dùng (chỉ Admin thấy)

Thêm một mục "Admin Dashboard" (hoặc nhóm các mục admin) vào dropdown menu avatar ở Header, chỉ hiển thị khi người dùng có quyền admin. Áp dụng cho cả desktop dropdown và mobile menu.

---

## Thay đổi

### 1. `src/components/Header.tsx`

**Desktop dropdown** (dòng 209-258):
- Import `isAdmin` từ `useAuth()` (hiện chỉ dùng `user, signOut, isLoading`)
- Import thêm icon `Shield` từ lucide-react
- Thêm block admin trước DropdownMenuSeparator + Đăng xuất:
  - Nếu `isAdmin === true`: hiển thị thêm separator + link "Admin Dashboard" (`/admin/dashboard`) với icon Shield
  - Có thể thêm các sub-link nhanh: "Rút coin", "FUN Money", "Thống kê"

**Mobile menu** (dòng 296-456):
- Tương tự, thêm một card/section "Quản trị" trước nút Đăng xuất
- Chỉ render khi `isAdmin === true`
- Hiển thị link đến `/admin/dashboard` với style nổi bật (gradient tím hoặc đỏ)

### Chi tiết kỹ thuật

- Lấy `isAdmin` từ `useAuth()` đã có sẵn, không cần query thêm
- Không cần thay đổi database
- Không cần tạo file mới
- Chỉ sửa 1 file: `src/components/Header.tsx`

### Giao diện dự kiến (Desktop dropdown)

```text
+----------------------------+
| ANGEL ÁNH NGUYỆT          |
| daothianhnguyet.pt@gmail.. |
+----------------------------+
| 👤 Xem hồ sơ              |
| 💬 Tin nhắn           7   |
| 🪙 Tích Lũy Ánh Sáng 7.700|
+----------------------------+
| 🛡️ Admin Dashboard        |
+----------------------------+
| [→ Đăng xuất              |
+----------------------------+
```

Mục "Admin Dashboard" chỉ hiển thị cho admin, không hiển thị cho user thường.

