
# Kế hoạch: Cập nhật Trang Admin Fraud Alerts — Danh sách Ban Nhóm Sybil

## Phân tích dữ liệu hiện tại

### Tổng hợp tài khoản CHƯA bị ban cần xử lý ngay

Qua tra cứu database, tìm được **14 tài khoản chưa bị ban** thuộc các nhóm sybil đã phân tích:

---

#### 🔴 NHÓM 7786 — Ví tổng 0x1BC4...446 (đã bị ban session trước)
| Tên | Email | Số dư | Lifetime Earned | Pending Mint | Pending Rút |
|-----|-------|-------|-----------------|-------------|------------|
| **Thanh Thùy** | anhnguyet7786@gmail.com | 1,550,641 | 2,317,354 | 72 | 250,000 |
| **Xuân Nguyễn** | xuannguyen77786@gmail.com | 1,858,930 | 2,308,716 | 40 | 0 |
| **Trần Nhung** | trannhung7786@gmail.com | 1,548,380 | 2,066,010 | 34 | 290,000 |

---

#### 🔴 NHÓM Ví Tổng le quang (0xAdF1...692748e24) — liên kết 12 tài khoản
Các tài khoản chuyển tiền về ví le quang **chưa bị ban**:
| Tên | Email | Số dư | Lifetime Earned | Pending Mint | Pending Rút |
|-----|-------|-------|-----------------|-------------|------------|
| **tinhthan** | tinhthan331@gmail.com | 1,233,300 | 2,132,659 | 54 | 1 lệnh |
| **Trần Nhung** | trannhung7786@gmail.com | 1,548,380 | 2,066,010 | 34 | 290,000 |
| **nguyen sinh 4** | nguyensinh6921@gmail.com | 1,666,100 | 1,895,938 | 42 | 1 lệnh |
| **le bong** | lebong3441@gmail.com | 927,100 | 1,753,486 | 46 | 1 lệnh |
| **Lê sang** | sangle12111@gmail.com | 101,296 | 898,917 | 75 | 1 lệnh |
| **Nguyễn Chính** | namleanh2211@gmail.com | 200 | 852,141 | 24 | 257,232 |
| **quynh anh** | quynhanh070820188@gmail.com | 170,771 | 409,169 | 43 | 0 |
| **trung binh** | trung1211121@gmail.com | 95,984 | 334,489 | 46 | 1 lệnh |

---

#### 🟡 NHÓM wanting2308 — 2 tài khoản (cùng ví!)
| Tên | Email | Số dư | Ghi chú |
|-----|-------|-------|---------|
| **Thu Nguyễn** | wanting23081962@gmail.com | 509,600 | Cùng địa chỉ ví với... |
| **Thu Nguyễn** | wanting23081861@gmail.com | 16,500 | ...tài khoản thứ 2 |
→ Cùng 1 ví `0x5c56eE4C...` = cùng 1 người

---

#### 🟡 NHÓM ngocna — liên kết ví tổng
| Tên | Email | Số dư | Pending Mint | Pending Rút |
|-----|-------|-------|-------------|------------|
| **Ngọc na** | ngocnamc466@gmail.com | 1,475,100 | 1,704,727 | 40 | 229,627 |

---

### Tổng cộng 14 tài khoản CHƯA bị ban cần ban:
- Tổng số dư: **~14.3M Camly**
- Tổng pending mint requests: **~549 requests**
- Tổng pending rút: **~8 lệnh rút**

---

## Hành động sẽ thực hiện

### Thêm section "Danh sách Ban Hàng Loạt" vào trang AdminFraudAlerts

Trang hiện tại (`src/pages/AdminFraudAlerts.tsx`) chỉ có tab "Cảnh báo" và "Pattern Registry". Sẽ thêm **Tab thứ 3: "🚫 Nhóm Sybil — Chờ Ban"** hiển thị:

1. **Danh sách nhóm có tổ chức** (hardcode + dynamic từ DB), phân theo nhóm màu
2. **Checkbox chọn từng tài khoản / chọn cả nhóm**
3. **Nút "Ban Tất Cả Đã Chọn"** gọi `bulk-suspend-users` Edge Function
4. **Trạng thái realtime**: đã ban hiển thị badge "✅ Đã ban", chưa ban hiển thị "🔴 Chờ xử lý"

### Kỹ thuật

**File cần sửa:** `src/pages/AdminFraudAlerts.tsx`

**Thêm tab thứ 3** với state:
```tsx
const [activeTab, setActiveTab] = useState<"alerts" | "patterns" | "sybil_groups">("alerts");
```

**Hardcode + Dynamic load danh sách 14 tài khoản** từ các nhóm đã phân tích vào một mảng `SYBIL_GROUPS`:
```tsx
const SYBIL_GROUPS = [
  {
    groupName: "Nhóm 7786 — Ví 0x1BC4...446",
    severity: "critical",
    userIds: [
      "efb81db9-52dd-4af6-a9d1-aff044bf37b7", // Thanh Thùy
      "37f87d2a-111f-4988-a74b-6f6ef6041d4c", // Xuân Nguyễn
      "5182148f-1999-43b5-83db-09560e25c688", // Trần Nhung
    ]
  },
  {
    groupName: "Nhóm Ví Tổng le quang — 0xAdF1...e24",
    severity: "critical", 
    userIds: [
      "c4d884f7-...", // tinhthan
      "71bdc8b3-...", // nguyen sinh 4
      "b5621395-...", // le bong
      // ...
    ]
  },
  // ...
]
```

**Fetch realtime status** (is_banned, balance, pending_mints) từ Supabase mỗi khi mở tab.

**Nút "Ban nhóm này"** và **"Ban tất cả chưa ban"** gọi `bulk-suspend-users` với danh sách userId đã chọn.

**Hiển thị kết quả sau khi ban**: toast thành công + cập nhật trạng thái badge.

---

## Tóm tắt kỹ thuật

| Hạng mục | Chi tiết |
|----------|---------|
| File sửa | `src/pages/AdminFraudAlerts.tsx` |
| Tính năng mới | Tab "🚫 Nhóm Sybil" với danh sách nhóm có tổ chức |
| Số tài khoản đưa vào danh sách | 14 tài khoản chưa ban + trạng thái realtime |
| Action | Checkbox chọn + Ban hàng loạt theo nhóm |
| Backend | Gọi `bulk-suspend-users` Edge Function (đã có sẵn) |
| DB thay đổi | Không cần migration mới |
