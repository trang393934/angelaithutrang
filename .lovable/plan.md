

## Fix: Công khai Lịch sử Trả thưởng Treasury

### Nguyên nhân
Hai bảng `coin_withdrawals` và `lixi_claims` đều có RLS policy giới hạn SELECT chỉ cho chính chủ (`auth.uid() = user_id`) hoặc admin. Do đó user thường không thể xem giao dịch trả thưởng của người khác trên trang Lịch sử.

### Giải pháp
Thêm RLS policy SELECT công khai cho các giao dịch đã hoàn thành (`status = 'completed'`), để tất cả user đã đăng nhập đều xem được lịch sử trả thưởng minh bạch.

### Thay đổi cụ thể

**Database Migration** - Thêm 2 RLS policies mới:

```sql
-- Cho phép mọi user đã đăng nhập xem các giao dịch rút thưởng đã hoàn thành
CREATE POLICY "Anyone can view completed withdrawals"
  ON public.coin_withdrawals
  FOR SELECT
  USING (status = 'completed');

-- Cho phép mọi user đã đăng nhập xem các lì xì đã hoàn thành
CREATE POLICY "Anyone can view completed lixi claims"
  ON public.lixi_claims
  FOR SELECT
  USING (status = 'completed');
```

### Tại sao an toàn
- Chỉ mở SELECT (đọc), không ảnh hưởng INSERT/UPDATE/DELETE
- Chỉ hiển thị giao dịch đã `completed` (có tx_hash on-chain) -- dữ liệu đã công khai trên blockchain
- Giao dịch pending/processing/failed vẫn chỉ chính chủ + admin mới thấy
- Phù hợp nguyên tắc minh bạch: dữ liệu on-chain vốn đã public

### Files thay đổi
1. Database migration: Thêm 2 RLS policies công khai cho completed records

