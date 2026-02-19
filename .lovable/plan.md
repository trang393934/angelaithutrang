
# Kế hoạch: Ban tài khoản + Tạm dừng toàn bộ Mint FUN Money

## Phân tích tình hình hiện tại

### Các tài khoản liên quan đến 3 ví

| Ví | Tài khoản | Trạng thái hiện tại | Mint pending |
|----|-----------|---------------------|-------------|
| `0x0CFc...9B` | **sac** (56acfeaf) | BAN rồi (18/02/2026) | 24 requests |
| `0x1BC4...46` | **lan anh** (dc2838ee) | CHƯA bị ban | 59 requests |
| `0x75be...78` | Không tìm thấy trong hệ thống | N/A | 0 |

### Trạng thái toàn hệ thống mint
- **6.581 pending** (chưa ký) từ 156 users
- **117 signed** (đã ký EIP-712, chưa đúc on-chain)
- **2.450 minted** (đã đúc thành công)

---

## Hành động sẽ thực hiện

### 1. Ban vĩnh viễn tài khoản "lan anh" (dc2838ee)
- Gọi Edge Function `bulk-suspend-users` với userId của lan anh
- Tự động: tạo suspension permanent, cập nhật energy_status → rejected, gửi healing message, từ chối withdrawal pending (1 lệnh rút 287.976 Camly đang chờ)
- Tài khoản "sac" đã bị ban rồi → bỏ qua, không cần xử lý lại

### 2. Reject toàn bộ mint requests của 2 tài khoản này
- Cập nhật `pplp_mint_requests` SET status = 'rejected' WHERE actor_id IN (sac, lan anh) AND status IN ('pending', 'signed')
- Tổng: 24 (sac) + 59 (lan anh) = **83 requests bị reject**

### 3. Tạm dừng toàn bộ hệ thống mint FUN Money
- Thêm cột `mint_paused` vào bảng `fun_pool_config` hoặc tạo bảng `system_settings` mới
- Thêm cờ `mint_paused: true` vào database
- Frontend `/admin/mint-approval`: hiển thị banner "HỆ THỐNG MINT TẠM DỪNG" và vô hiệu hóa nút Sign/Mint
- Frontend `/mint` (user): hiển thị thông báo tạm dừng thay vì form gửi yêu cầu

---

## Kế hoạch kỹ thuật

### Bước 1: Database - Thêm bảng system_settings
```sql
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Thêm cờ tạm dừng mint
INSERT INTO public.system_settings (key, value, description)
VALUES ('mint_system', '{"paused": true, "paused_reason": "Tạm dừng để kiểm tra an ninh hệ thống"}', 'Cài đặt hệ thống mint FUN Money');

-- RLS: chỉ admin đọc/ghi
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON public.system_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Read for system" ON public.system_settings FOR SELECT TO authenticated USING (true);
```

### Bước 2: Ban tài khoản + Reject mint requests
- Gọi `bulk-suspend-users` Edge Function để ban "lan anh"
- SQL để reject mint requests của cả 2 tài khoản:
```sql
UPDATE pplp_mint_requests 
SET status = 'rejected', updated_at = now()
WHERE actor_id IN ('56acfeaf-...', 'dc2838ee-...')
  AND status IN ('pending', 'signed');
```

### Bước 3: Cập nhật Admin Mint Approval page
- File: `src/pages/AdminMintApproval.tsx`
- Thêm hook đọc `system_settings.mint_system`
- Hiển thị banner cảnh báo đỏ "🚨 HỆ THỐNG MINT ĐANG TẠM DỪNG" ở đầu trang
- Vô hiệu hóa tất cả nút "Ký & Mint", "Batch Sign", "Retry All"
- Thêm nút toggle cho admin để bật/tắt tạm dừng

### Bước 4: Cập nhật User Mint page
- File: `src/pages/Mint.tsx`
- Đọc `system_settings.mint_system` khi load trang
- Nếu `paused = true`: hiển thị thông báo "Hệ thống đúc FUN Money đang tạm dừng để bảo trì. Vui lòng quay lại sau." thay vì cho phép gửi yêu cầu

---

## Tóm tắt tác động

| Hành động | Số lượng bị ảnh hưởng |
|-----------|----------------------|
| Tài khoản bị ban | 1 (lan anh - đã có sac bị ban) |
| Withdrawal bị từ chối | 1 lệnh (287.976 Camly hoàn về số dư) |
| Mint requests bị reject | 83 requests (24 sac + 59 lan anh) |
| Toàn hệ thống mint bị dừng | 6.581 requests pending của 156 users |
| Admin không thể ký mới | 117 signed requests bị block |
