

## Thêm số liệu Lì xì và bộ lọc Claim vào tab Snapshot

### Tổng quan
Bổ sung 3 thẻ thống kê mới về tình hình Lì xì on-chain vào phần Stats Cards của tab Snapshot 07/02/2026, đồng thời thêm bộ lọc (filter) cho cột Claim trong bảng dữ liệu.

### Thay đổi cụ thể

**File: `src/pages/AdminTetReward.tsx`**

**1. Thêm 3 thẻ thống kê Lì xì (dưới 4 thẻ hiện tại)**

Tính toán từ `lixiClaims` (đã có sẵn từ hook `useLixiClaims`):

| Thẻ | Icon | Giá trị | Mô tả |
|---|---|---|---|
| Tổng user đã Lì xì | CheckCircle2 (xanh lá) | Đếm claims có status = "completed" | User đã nhận on-chain thành công |
| Tổng Camly đã Lì xì | Gift (vàng cam) | Tổng camly_amount của claims completed | Tổng coin đã chuyển on-chain |
| Lì xì chưa thành công | XCircle (đỏ) | Đếm claims có status = "failed" hoặc "pending" | Cần xử lý lại |

Ba thẻ này sẽ nằm trong 1 hàng riêng (grid 3 cột) ngay dưới 4 thẻ thống kê hiện tại, với tiêu đề nhỏ "Thống kê Lì xì on-chain".

**2. Thêm bộ lọc cột Claim**

Thêm 1 dropdown/select filter cho cột Claim ngay cạnh ô tìm kiếm, cho phép lọc theo:
- Tất cả (mặc định)
- Đã claim thành công (completed)
- Claim thất bại (failed)
- Đang chờ (pending)
- Chưa claim

Logic: lọc `filteredRows` dựa trên trạng thái claim của từng user (tra cứu qua `nameToUserIdMap` + `lixiClaims`).

### Chi tiết kỹ thuật

- Thêm state `claimFilter` kiểu `"all" | "completed" | "failed" | "pending" | "unclaimed"`
- Tính `lixiStats` bằng `useMemo` từ mảng `lixiClaims`
- Cập nhật `filteredRows` useMemo để thêm logic lọc theo `claimFilter`
- Sử dụng component `Select` từ `@/components/ui/select` cho dropdown lọc
- Chỉ sửa 1 file: `src/pages/AdminTetReward.tsx`
