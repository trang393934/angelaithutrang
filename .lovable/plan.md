
# Tạo trang Admin: Danh sách Ví & Tạm dừng tài khoản

## Phân tích hiện trạng

- Database có **268 ví** trong bảng `user_wallet_addresses`
- Bảng `user_suspensions` đã tồn tại với các cột: `id`, `user_id`, `suspension_type`, `reason`, `healing_message`, `suspended_at`, `suspended_until`, `lifted_at`, `lifted_by`, `created_by`, `created_at`
- Edge function `suspend-user` đã được deploy sẵn với đầy đủ logic
- `AdminNavToolbar` là component điều hướng cần thêm mục mới
- `App.tsx` cần thêm route `/admin/wallet-management`

## Các thay đổi cần thực hiện

### 1. Tạo trang mới: `src/pages/AdminWalletManagement.tsx`

Trang này hiển thị toàn bộ danh sách ví với đầy đủ thông tin người dùng và nút tạm dừng.

**Cấu trúc trang:**

```text
┌─────────────────────────────────────────────────────────────┐
│  [←] Angel AI  |  Quản lý Ví  |  268 ví đã đăng ký        │
├─────────────────────────────────────────────────────────────┤
│  AdminNavToolbar                                             │
├─────────────────────────────────────────────────────────────┤
│  STATS ROW:                                                  │
│  [Tổng ví: 268] [Đang hoạt động: N] [Bị tạm dừng: N]       │
├─────────────────────────────────────────────────────────────┤
│  FILTERS:                                                    │
│  [🔍 Tìm tên / ví / handle] [Trạng thái: All/Active/Paused] │
├─────────────────────────────────────────────────────────────┤
│  TABLE:                                                      │
│  Avatar | Tên | Handle | Địa chỉ ví | Số dư Camly | Đã rút │
│         | Thưởng TT | Trạng thái | Hành động               │
└─────────────────────────────────────────────────────────────┘
```

**Dữ liệu query** - JOIN các bảng:
```sql
SELECT 
  uwa.wallet_address, uwa.user_id,
  p.display_name, p.avatar_url, p.handle,
  ccb.balance, ccb.lifetime_earned,
  -- Tổng đã rút
  COALESCE(SUM(cw.amount) FILTER (WHERE cw.status = 'completed'), 0) as total_withdrawn,
  -- Trạng thái tạm dừng
  us.suspension_type, us.suspended_until, us.reason
FROM user_wallet_addresses uwa
LEFT JOIN profiles p ON p.user_id = uwa.user_id
LEFT JOIN camly_coin_balances ccb ON ccb.user_id = uwa.user_id
LEFT JOIN coin_withdrawals cw ON cw.user_id = uwa.user_id
LEFT JOIN user_suspensions us ON us.user_id = uwa.user_id AND us.lifted_at IS NULL
GROUP BY uwa.wallet_address, uwa.user_id, p.display_name, p.avatar_url, p.handle,
  ccb.balance, ccb.lifetime_earned, us.suspension_type, us.suspended_until, us.reason
```

**Cột trong bảng:**
| Cột | Nội dung |
|-----|---------|
| Người dùng | Avatar 32px + Tên + @handle |
| Địa chỉ ví | Font mono, copy button, link BSCScan |
| Số dư Camly | Formatted number |
| Tổng thưởng | Lifetime earned |
| Đã rút | Tổng withdrawal completed |
| Trạng thái | Badge: Hoạt động (xanh) / Tạm dừng (đỏ) / Đã khóa vĩnh viễn (đen) |
| Hành động | Nút tạm dừng hoặc gỡ tạm dừng |

**Dialog tạm dừng** - Khi click nút "Tạm dừng":
```text
┌────────────────────────────────────────┐
│  ⚠️ Tạm dừng tài khoản                │
│  Người dùng: [Avatar] Tên người dùng   │
│                                        │
│  Loại tạm dừng:                        │
│  ○ Tạm thời  ● Vĩnh viễn              │
│                                        │
│  [Nếu tạm thời] Số ngày: [___]         │
│                                        │
│  Lý do: [________________________]     │
│         [________________________]     │
│                                        │
│  Thông điệp chữa lành (tùy chọn):      │
│  [________________________]             │
│                                        │
│  [Hủy]           [Xác nhận tạm dừng]  │
└────────────────────────────────────────┘
```

**Dialog gỡ tạm dừng** - Khi click nút "Gỡ tạm dừng":
- Dialog xác nhận đơn giản: "Bạn có chắc muốn khôi phục tài khoản này không?"
- Gọi Supabase update `user_suspensions` set `lifted_at = now()`

### 2. Sửa `src/components/admin/AdminNavToolbar.tsx`

Thêm mục "Quản lý Ví" vào nhóm "Người dùng":

```typescript
// Trong nhóm "Người dùng":
{ to: "/admin/wallet-management", icon: Wallet, label: "Quản lý Ví" },
```

### 3. Sửa `src/App.tsx`

Thêm route và import:
```typescript
import AdminWalletManagement from "./pages/AdminWalletManagement";
// ...
<Route path="/admin/wallet-management" element={<AdminWalletManagement />} />
```

## Chi tiết kỹ thuật

### Logic tạm dừng tài khoản

Trang sẽ gọi edge function `suspend-user` đã có sẵn:
```typescript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suspend-user`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${session.access_token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ targetUserId, suspensionType, reason, durationDays, healingMessage })
});
```

### Logic gỡ tạm dừng

Gọi trực tiếp Supabase (update bảng `user_suspensions`):
```typescript
await supabase.from("user_suspensions")
  .update({ lifted_at: new Date().toISOString(), lifted_by: adminUser.id })
  .eq("user_id", targetUserId)
  .is("lifted_at", null);
```

### Filter & Search

- Search: tìm theo tên, handle, địa chỉ ví
- Filter trạng thái: Tất cả / Đang hoạt động / Đang tạm dừng
- Pagination: 25 ví / trang
- Copy button cho địa chỉ ví đầy đủ
- Link BSCScan mở tab mới

### Badges trạng thái

| Trạng thái | Màu | Nội dung |
|-----------|-----|---------|
| Không có suspension | Xanh lá | "Hoạt động" |
| `temporary` | Vàng cam | "Tạm dừng N ngày" |
| `permanent` | Đỏ đậm | "Khóa vĩnh viễn" |

## Files cần thay đổi

1. **Tạo mới**: `src/pages/AdminWalletManagement.tsx` (~350 dòng)
2. **Sửa**: `src/components/admin/AdminNavToolbar.tsx` (thêm 1 dòng nav item)
3. **Sửa**: `src/App.tsx` (thêm 1 import + 1 route)
