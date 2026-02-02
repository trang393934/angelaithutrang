
# Kế hoạch: Tính năng Trả thưởng hàng loạt cho Admin

## Mục tiêu
Cho phép admin chọn nhiều yêu cầu rút tiền (withdrawals), ý tưởng (ideas), hoặc bài nộp bounty (submissions) cùng lúc và duyệt/trả thưởng hàng loạt thay vì từng cái một.

## Phạm vi triển khai

### 1. Trang Admin Withdrawals (`/admin/withdrawals`)
- Thêm checkbox cho mỗi yêu cầu rút tiền đang ở trạng thái "pending" hoặc "processing"
- Thêm checkbox "Chọn tất cả" ở header của bảng
- Thêm thanh công cụ batch actions hiển thị khi có items được chọn
- Cho phép duyệt hàng loạt (gọi API tuần tự hoặc song song)
- Hiển thị tiến trình xử lý và kết quả

### 2. Trang Admin Ideas (`/admin/ideas`)
- Thêm checkbox cho mỗi ý tưởng đang ở trạng thái "pending"
- Cho phép duyệt hàng loạt với số tiền thưởng mặc định (1,000 coin)
- Gửi thông báo cho từng user được duyệt

### 3. Trang Admin Bounty (`/admin/bounty`)
- Thêm checkbox cho mỗi bài nộp đang ở trạng thái "pending"
- Cho phép duyệt hàng loạt với số tiền thưởng theo task

---

## Chi tiết kỹ thuật

### A. Cập nhật `AdminWithdrawals.tsx`

**State mới:**
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isBatchProcessing, setIsBatchProcessing] = useState(false);
const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
```

**UI Components mới:**
1. **Batch Action Bar** - Thanh công cụ cố định xuất hiện khi có items được chọn
   - Hiển thị số lượng đã chọn
   - Nút "Duyệt tất cả" (màu xanh)
   - Nút "Từ chối tất cả" (màu đỏ)
   - Nút "Bỏ chọn tất cả"

2. **Checkbox Column** - Cột checkbox đầu tiên trong bảng
   - Header: Checkbox "Chọn tất cả pending/processing"
   - Row: Checkbox cho từng withdrawal có thể duyệt

3. **Batch Approve Dialog**
   - Xác nhận trước khi duyệt hàng loạt
   - Hiển thị tổng số tiền sẽ chuyển
   - Cảnh báo về blockchain transactions
   - Progress bar trong khi xử lý

4. **Batch Reject Dialog**
   - Nhập lý do từ chối chung
   - Áp dụng cho tất cả items đã chọn

**Logic xử lý:**
```typescript
const handleBatchApprove = async () => {
  const selectedWithdrawals = withdrawals.filter(w => 
    selectedIds.has(w.id) && 
    (w.status === 'pending' || w.status === 'processing')
  );
  
  setBatchProgress({ current: 0, total: selectedWithdrawals.length, success: 0, failed: 0 });
  setIsBatchProcessing(true);
  
  for (const withdrawal of selectedWithdrawals) {
    try {
      await supabase.functions.invoke('process-withdrawal', {
        body: { withdrawal_id: withdrawal.id }
      });
      setBatchProgress(prev => ({ ...prev, current: prev.current + 1, success: prev.success + 1 }));
    } catch (error) {
      setBatchProgress(prev => ({ ...prev, current: prev.current + 1, failed: prev.failed + 1 }));
    }
  }
  
  // Refresh data and show summary
};
```

### B. Cập nhật `AdminIdeas.tsx`

**Tương tự AdminWithdrawals:**
- Thêm selection state
- Thêm Batch Action Bar
- Dialog duyệt hàng loạt với input cho reward amount (mặc định 1,000)

**Logic batch approve cho Ideas:**
- Cập nhật status = 'approved' cho tất cả
- Insert transactions vào `camly_coin_transactions`
- Cập nhật `camly_coin_balances`
- Gửi `healing_messages` thông báo

### C. Cập nhật `AdminBounty.tsx`

**Tương tự AdminIdeas:**
- Selection cho submissions pending
- Batch approve với reward theo task_reward của từng submission
- Cập nhật task completions count

---

## Giao diện người dùng

### Batch Action Bar (Fixed Bottom)
```
┌─────────────────────────────────────────────────────────────────┐
│ ☑ Đã chọn: 5 yêu cầu   │ [Duyệt tất cả] [Từ chối tất cả] [✕]  │
│ Tổng: 1,500,000 CAMLY  │                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Batch Progress Dialog
```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Đang xử lý hàng loạt                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [████████████░░░░░░░░] 3/5 hoàn thành                     │
│                                                             │
│  ✓ Thành công: 3                                           │
│  ✕ Thất bại: 0                                             │
│                                                             │
│  Đang xử lý: wallet 0x1234...abcd                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Các bước triển khai

1. **Cập nhật `AdminWithdrawals.tsx`**
   - Thêm state quản lý selection
   - Thêm Checkbox component trong Table
   - Tạo BatchActionBar component
   - Tạo BatchApproveDialog và BatchRejectDialog
   - Implement logic xử lý batch

2. **Cập nhật `AdminIdeas.tsx`**
   - Copy pattern từ Withdrawals
   - Điều chỉnh logic reward cho Ideas

3. **Cập nhật `AdminBounty.tsx`**
   - Copy pattern từ Ideas
   - Điều chỉnh logic reward theo task_reward

4. **Component dùng chung (optional)**
   - Có thể extract BatchActionBar thành component riêng

---

## Lưu ý bảo mật
- Giữ nguyên xác thực admin qua `is_admin()` RPC
- Edge function `process-withdrawal` đã có kiểm tra admin role
- Batch operations vẫn gọi API từng cái để đảm bảo an toàn

## Ước tính thời gian
- AdminWithdrawals: Phức tạp nhất (blockchain transactions) - 40%
- AdminIdeas: Trung bình - 30%
- AdminBounty: Trung bình - 30%
