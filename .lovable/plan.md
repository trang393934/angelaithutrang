
# Nâng cấp Trang Quản lý Ví - Hiển thị Cảnh báo & Từ chối Rút tiền

## Phân tích hiện trạng

### AdminWalletManagement.tsx (620 dòng)
Hiện tại chỉ có:
- Bảng danh sách ví đơn giản (tên, địa chỉ ví, số dư, trạng thái)
- Nút "Tạm dừng" / "Gỡ tạm dừng" cho từng user
- Không có: cảnh báo nghi ngờ, thông tin pending withdrawals, shared wallets, hay quyền từ chối rút tiền

### AdminFraudAlerts.tsx (619 dòng)
Trang riêng biệt đang hoạt động với:
- Bảng fraud_alerts với nút Ban/Bỏ qua
- Pattern Registry
- Không có: liên kết trực tiếp tới lệnh rút tiền đang pending

## Kế hoạch nâng cấp

### 1. Nâng cấp AdminWalletManagement.tsx

Thêm hệ thống **3 Tab**:

**Tab 1: "Tất cả Ví" (hiện tại)** - giữ nguyên bảng hiện có + thêm:
- Cột "Cảnh báo" hiển thị badge màu đỏ/cam nếu user có fraud_alert chưa xử lý
- Cột "Pending Rút" hiển thị số Camly đang pending, nút "Từ chối" màu đỏ ngay trong bảng
- Filter thêm: "Có cảnh báo" để lọc nhanh

**Tab 2: "🚨 Cần Kiểm tra"** - Dashboard tổng hợp nhóm nghi ngờ:
- **Section A - Ví dùng chung (Shared Wallets)**: Query `user_wallet_addresses` GROUP BY `wallet_address` HAVING COUNT > 1, hiển thị từng nhóm với nút "Ban cả nhóm"
- **Section B - Hoán đổi Ví (Wallet Rotation)**: Query `coin_withdrawals` GROUP BY `user_id` với COUNT(DISTINCT wallet_address) >= 2, hiển thị users đã dùng nhiều ví khác nhau
- **Section C - Tài khoản Đăng ký Đồng loạt**: Liên kết tới fraud_alerts loại `bulk_registration`

**Tab 3: "💰 Lệnh Rút Pending"** - Quản lý tập trung tất cả lệnh rút:
- Hiển thị toàn bộ `coin_withdrawals` với `status = 'pending'`
- Mỗi dòng hiển thị: tên user, ví rút, số Camly, ngày tạo, và **badge cảnh báo** nếu user có fraud_alert
- Nút "Từ chối" từng lệnh rút với popup xác nhận + nhập ghi chú admin
- Nút "Duyệt" để chuyển sang processing
- **Multi-select checkbox** + nút "Từ chối hàng loạt" ở đầu trang
- Thống kê: Tổng pending, Số có cảnh báo, Tổng Camly đang pending

### 2. Logic từ chối lệnh rút tiền

Thêm function `handleRejectWithdrawal(withdrawalId, adminNote)`:
```typescript
await supabase
  .from("coin_withdrawals")
  .update({
    status: "failed",
    admin_notes: adminNote,
    processed_at: new Date().toISOString(),
    processed_by: session.user.id,
  })
  .eq("id", withdrawalId)
  .eq("status", "pending");
```
Trigger `update_withdrawal_stats` sẽ tự động hoàn tiền về balance.

### 3. Badge cảnh báo trực tiếp trong bảng ví

Khi fetch wallets, sẽ join thêm:
- `fraud_alerts` → đếm số alerts chưa reviewed per user
- `coin_withdrawals` với status='pending' → tổng tiền đang pending per user

Hiển thị trong cột mới:
- 🔴 Badge đỏ nếu có fraud_alert critical chưa xử lý
- 🟠 Badge cam nếu có fraud_alert high/medium
- 💰 Số Camly pending với nút từ chối nhanh

### 4. Interface mới cần thêm

```typescript
interface WalletEntry {
  // ... existing fields ...
  fraud_alert_count: number;       // số alerts chưa reviewed
  max_alert_severity: string | null; // 'critical' | 'high' | 'medium'
  pending_withdrawal_amount: number;  // tổng Camly đang pending
  pending_withdrawal_ids: string[];   // IDs của lệnh rút pending
  withdrawal_wallet_count: number;   // số ví đã dùng để rút (detect rotation)
}

interface PendingWithdrawal {
  id: string;
  user_id: string;
  wallet_address: string;
  amount: number;
  created_at: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  fraud_alert_count: number;
  max_alert_severity: string | null;
}

interface SharedWalletGroup {
  wallet_address: string;
  user_count: number;
  users: { user_id: string; display_name: string; handle: string }[];
  total_pending: number;
}
```

## Technical Implementation Details

### Thay đổi file duy nhất: `src/pages/AdminWalletManagement.tsx`

**Thêm imports:** `Tabs, TabsContent, TabsList, TabsTrigger` từ `@/components/ui/tabs`, thêm icons `XCircle, DollarSign, Network`

**Thêm state:**
```typescript
const [activeTab, setActiveTab] = useState<"wallets" | "audit" | "withdrawals">("wallets");
const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
const [selectedWithdrawalIds, setSelectedWithdrawalIds] = useState<string[]>([]);
const [sharedWalletGroups, setSharedWalletGroups] = useState<SharedWalletGroup[]>([]);
const [rejectTarget, setRejectTarget] = useState<PendingWithdrawal | null>(null);
const [rejectNote, setRejectNote] = useState("");
const [rejecting, setRejecting] = useState(false);
const [fraudFilter, setFraudFilter] = useState<"all" | "flagged">("all");
```

**Thêm fetch functions:**
- `fetchPendingWithdrawals()` - lấy tất cả pending + join profiles + fraud_alerts
- `fetchSharedWallets()` - detect shared wallet clusters
- Sửa `fetchWallets()` để join thêm fraud_alerts count và pending_withdrawal_amount

**Thêm handlers:**
- `handleRejectWithdrawal(ids: string[], note: string)` - từ chối một hoặc nhiều lệnh
- `handleBulkReject()` - từ chối hàng loạt từ selectedWithdrawalIds

### Không cần migration DB

Tất cả data đã có sẵn trong các bảng hiện tại:
- `fraud_alerts` (đã tạo)
- `coin_withdrawals` (đã có, có cột `admin_notes`, `processed_at`, `processed_by`)
- `user_wallet_addresses` (đã có)

## Thứ tự thực thi

```text
Bước 1: Cập nhật interface WalletEntry + PendingWithdrawal + SharedWalletGroup
   ↓
Bước 2: Sửa fetchWallets() để join fraud_alerts + pending withdrawals
   ↓
Bước 3: Thêm fetchPendingWithdrawals() + fetchSharedWallets()
   ↓
Bước 4: Thêm Tabs layout (3 tabs)
   ↓
Bước 5: Tab 1 - thêm cột "Cảnh báo" + "Pending" + filter "Có cảnh báo"
   ↓
Bước 6: Tab 2 - Section Shared Wallets + Wallet Rotation
   ↓
Bước 7: Tab 3 - Bảng Pending Withdrawals với multi-select + từ chối
   ↓
Bước 8: Dialog từ chối lệnh rút (rejectTarget dialog)
```

## Kết quả sau khi hoàn thành

Admin khi vào `/admin/wallet-management` sẽ thấy:
- **Tab "Tất cả Ví"**: Mỗi user có flag đỏ/cam ngay cạnh tên nếu có cảnh báo, có số Camly pending
- **Tab "🚨 Cần Kiểm tra"**: Nhóm shared wallets nghi ngờ, danh sách wallet rotation — nhìn qua là biết ngay ai đáng ngờ
- **Tab "💰 Pending Rút"**: Tổng quan toàn bộ lệnh rút đang chờ, highlight đỏ những lệnh có fraud alert, chọn nhiều và từ chối 1 lần

Tất cả trong 1 file `AdminWalletManagement.tsx`, không cần trang mới.
