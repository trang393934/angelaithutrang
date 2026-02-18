
# Tạo Tab "Ví Phát Thưởng" trong Admin Dashboard

## Tổng quan dữ liệu đã xác minh

Qua phân tích database, xác định rõ 2 ví treasury và nguồn giao dịch tương ứng:

**Ví 1: `0x416336c3b7ACAe89F47EAD2707412f20DA159ac8`** — Ví Rút Thưởng (Camly Withdrawals)
- Nguồn dữ liệu: bảng `coin_withdrawals` (status = 'completed')
- Hoạt động: **27/01/2026** → **13/02/2026**
- Tổng: **166 giao dịch** hoàn thành, **42,117,639 Camly** đã phát ra
- Ngoài ra: 60 lệnh pending, 13 thất bại, 1 bị từ chối

**Ví 2: `0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D`** — Ví Lì Xì Tết (LiXi Claims)
- Nguồn dữ liệu: bảng `lixi_claims` (status = 'completed')
- Hoạt động: **12/02/2026** → **18/02/2026**
- Tổng: **136 giao dịch** hoàn thành, **148,501,000 Camly** đã phát ra
- Ngoài ra: 15 pending, 2 thất bại

## Kiến trúc giải pháp

Tạo **1 trang mới** `/admin/treasury` với đầy đủ báo cáo, và thêm link vào AdminNavToolbar.

### File cần tạo:
- `src/pages/AdminTreasury.tsx` — Trang báo cáo ví phát thưởng

### File cần sửa:
- `src/components/admin/AdminNavToolbar.tsx` — Thêm menu item "Ví Treasury"
- `src/App.tsx` — Thêm route `/admin/treasury`

## Thiết kế trang `AdminTreasury.tsx`

### Layout tổng thể:
```
Header (AdminNavToolbar)
│
├── Tổng quan 2 ví (Summary Cards)
│   ├── Ví 1: 0x4163... | Rút Thưởng Camly
│   └── Ví 2: 0x02D5... | Lì Xì Tết
│
└── Tabs chi tiết
    ├── 📊 Tổng hợp (combined view)
    ├── 💰 Ví Rút Thưởng (0x4163...)
    └── 🎁 Ví Lì Xì Tết (0x02D5...)
```

### Tab 1 — Tổng hợp:
- Biểu đồ timeline (recharts BarChart) hiển thị giao dịch theo ngày của cả 2 ví
- Bảng thống kê so sánh 2 ví (cạnh nhau)
- Tổng cộng toàn hệ thống

### Tab 2 — Ví Rút Thưởng (`0x416336...`):

**Summary section:**
```
┌─────────────────────────────────────────────────────┐
│ 🏦 Ví: 0x416336c3...DA159ac8 [BSCScan ↗]            │
│ Hoạt động: 27/01/2026 → 13/02/2026 (18 ngày)        │
│                                                      │
│ 166 giao dịch    42,117,639    60 pending            │
│ hoàn thành       Camly phát    chờ xử lý             │
└─────────────────────────────────────────────────────┘
```

**Biểu đồ theo ngày** (BarChart - recharts):
- X-axis: ngày (27/01 → 13/02)
- Y-axis: số Camly gửi đi
- Highlight ngày 28/01 (9.65M) và 02/02 (11.2M) là cao nhất

**Bảng lịch sử chi tiết** (có phân trang, tìm kiếm):
| Thời gian | Người nhận | Ví nhận | Số Camly | Tx Hash | Trạng thái |
|---|---|---|---|---|---|
| 13/02 16:10 | Thu Sang | 0x942c... | 200,000 | 0xe949...↗ | ✅ |
| 07/02 02:03 | joni | 0xcbb9... | 208,276 | 0xf5ef...↗ | ✅ |
| ... | | | | | |

### Tab 3 — Ví Lì Xì Tết (`0x02D557...`):

**Summary section:**
```
┌─────────────────────────────────────────────────────┐
│ 🧧 Ví: 0x02D5578...E6D9a0D [BSCScan ↗]              │
│ Hoạt động: 12/02/2026 → 18/02/2026 (7 ngày)         │
│                                                      │
│ 136 giao dịch    148,501,000   15 pending            │
│ hoàn thành       Camly phát    chờ claim             │
└─────────────────────────────────────────────────────┘
```

**Biểu đồ theo ngày** (BarChart):
- Peak ngày 15/02: 144.3M Camly (125 giao dịch Tết)

**Bảng lịch sử chi tiết** (có phân trang, tìm kiếm):
| Thời gian | Người nhận | Ví nhận | Camly | FUN | Tx Hash | Trạng thái |
|---|---|---|---|---|---|---|
| 18/02 16:12 | Hoàng Tỷ Đô | 0x... | 403,000 | 403 | 0xe50c...↗ | ✅ |
| 18/02 10:20 | Angel Huỳnh Thủy | 0x... | 73,000 | 73 | 0xabbd...↗ | ✅ |
| ... | | | | | | |

## Technical Implementation

### Data fetching trong `AdminTreasury.tsx`:

```typescript
const TREASURY_WALLET_WITHDRAWAL = "0x416336c3b7ACAe89F47EAD2707412f20DA159ac8";
const TREASURY_WALLET_LIXI = "0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D";

// Fetch withdrawal history
const { data: withdrawals } = await supabase
  .from("coin_withdrawals")
  .select(`
    id, wallet_address, amount, tx_hash, 
    created_at, processed_at, status,
    profiles:user_id (display_name, handle, avatar_url)
  `)
  .eq("status", "completed")
  .order("created_at", { ascending: false });

// Fetch lixi_claims history  
const { data: lixiClaims } = await supabase
  .from("lixi_claims")
  .select(`
    id, wallet_address, camly_amount, fun_amount, 
    tx_hash, claimed_at, status,
    profiles:user_id (display_name, handle, avatar_url)
  `)
  .eq("status", "completed")
  .order("claimed_at", { ascending: false });
```

### Computed stats:
```typescript
// Summary stats per wallet
const withdrawalStats = {
  totalTx: withdrawals.length,
  totalCamly: withdrawals.reduce((s, w) => s + w.amount, 0),
  firstDate: withdrawals.at(-1)?.created_at,
  lastDate: withdrawals.at(0)?.created_at,
  daysActive: diffInDays(firstDate, lastDate),
};

// Daily chart data
const dailyWithdrawals = groupByDate(withdrawals); // recharts compatible
```

### Thêm vào NavToolbar:
```typescript
// Thêm vào group "Tài chính"
{ to: "/admin/treasury", icon: Vault, label: "Ví Treasury" }
```

## Thứ tự thực thi

```text
Bước 1: Tạo AdminTreasury.tsx với đầy đủ logic fetch + UI
  ↓
Bước 2: Thêm route /admin/treasury vào App.tsx
  ↓
Bước 3: Thêm "Ví Treasury" vào AdminNavToolbar group "Tài chính"
```

## UX Details

- **Địa chỉ ví rút gọn**: `0x4163...9ac8` kèm nút copy + link BSCScan
- **Tx Hash**: rút gọn `0xe949...6322` kèm link BSCScan cho từng giao dịch
- **Số Camly**: format có dấu phẩy ngàn (42,117,639)
- **Bảng có phân trang**: 20 dòng/trang với nút Next/Prev
- **Tìm kiếm**: theo tên người nhận hoặc địa chỉ ví
- **Export**: nút Export Excel tương tự các trang admin khác
- **Loading state**: skeleton cards trong khi fetch data
