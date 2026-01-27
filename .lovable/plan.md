

# Kế Hoạch: Hệ Thống Rút Camly Coin Tự Động

## Tổng Quan Hiện Trạng

Hệ thống hiện tại đã có:
- User tạo yêu cầu rút với giới hạn 200,000 - 500,000 CAMLY/ngày
- Admin duyệt/từ chối yêu cầu thủ công tại `/admin/withdrawals`
- Sau khi duyệt, admin phải nhập Transaction Hash (giao dịch blockchain thực hiện bên ngoài)

## Đề Xuất Nâng Cấp: Tự Động Chuyển Token

### Luồng Hoạt Động Mới

```text
+------------------+     +------------------+     +-------------------+
|  User tạo lệnh   | --> | Admin phê duyệt  | --> | Edge Function     |
|  rút (pending)   |     | (processing)     |     | gọi blockchain    |
+------------------+     +------------------+     +-------------------+
                                                           |
                                                           v
                                             +----------------------------+
                                             | Camly Coin được chuyển     |
                                             | tự động về ví user         |
                                             | + Cập nhật tx_hash         |
                                             | + Status = completed       |
                                             +----------------------------+
```

### Các Thành Phần Cần Triển Khai

#### 1. Edge Function: `process-withdrawal`
Chức năng: Thực hiện giao dịch blockchain tự động

- Nhận withdrawal_id từ admin khi phê duyệt
- Sử dụng Private Key của ví Treasury để ký giao dịch
- Gọi contract Camly Coin để transfer token
- Cập nhật tx_hash và status vào database

#### 2. Database Updates
- Thêm cột `retry_count` để theo dõi số lần thử lại
- Thêm cột `error_message` để lưu lỗi nếu có

#### 3. Admin Dashboard Updates
- Thay đổi nút "Duyệt" để gọi Edge Function thay vì chỉ cập nhật status
- Hiển thị trạng thái xử lý realtime
- Thêm nút "Thử lại" cho các giao dịch thất bại

---

## Chi Tiết Kỹ Thuật

### Yêu Cầu Bảo Mật Quan Trọng

**TREASURY_PRIVATE_KEY**: Cần lưu trữ Private Key của ví chứa Camly Coin dự trữ. Đây là thông tin cực kỳ nhạy cảm!

Các biện pháp bảo mật:
- Private key được lưu trong Supabase Secrets (mã hóa)
- Edge Function có JWT verification
- Chỉ admin mới có quyền gọi function
- Rate limiting để tránh lạm dụng

### Cấu Trúc Edge Function

```typescript
// supabase/functions/process-withdrawal/index.ts

// 1. Xác thực JWT - chỉ admin
// 2. Kiểm tra withdrawal tồn tại và status = 'processing'
// 3. Khởi tạo ethers với TREASURY_PRIVATE_KEY
// 4. Gọi CAMLY contract.transfer(user_wallet, amount)
// 5. Chờ transaction confirmed
// 6. Cập nhật database với tx_hash
```

### Contract Camly Coin
- Address: `0x0910320181889fefde0bb1ca63962b0a8882e413`
- Network: BSC (BNB Smart Chain)
- Function: `transfer(address to, uint256 amount)`

### Quy Trình Chi Tiết

| Bước | Người thực hiện | Hành động | Kết quả |
|------|-----------------|-----------|---------|
| 1 | User | Tạo lệnh rút 200K-500K | Status = pending |
| 2 | Admin | Click "Phê duyệt" | Status = processing |
| 3 | System | Edge Function gọi blockchain | Chờ confirmation |
| 4 | Blockchain | Xác nhận giao dịch | tx_hash được tạo |
| 5 | System | Cập nhật database | Status = completed |

### Xử Lý Lỗi

- **Gas không đủ**: Thông báo admin nạp thêm BNB vào ví Treasury
- **Timeout**: Retry tự động tối đa 3 lần
- **Invalid address**: Từ chối và hoàn tiền về user
- **Balance không đủ**: Thông báo admin bổ sung CAMLY

---

## Cấu Hình Cần Thiết

### 1. Secrets Cần Thêm
- `TREASURY_PRIVATE_KEY`: Private key của ví chứa CAMLY (admin cung cấp)
- `BSC_RPC_URL`: URL của BSC RPC node (có thể dùng public: https://bsc-dataseed.binance.org/)

### 2. Migration Database

```sql
ALTER TABLE public.coin_withdrawals 
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message text;
```

### 3. Files Cần Tạo/Sửa

| File | Hành động |
|------|-----------|
| `supabase/functions/process-withdrawal/index.ts` | Tạo mới |
| `supabase/config.toml` | Thêm function config |
| `src/pages/AdminWithdrawals.tsx` | Cập nhật để gọi Edge Function |

---

## Lưu Ý Quan Trọng

### An Toàn Tài Chính
- Ví Treasury nên có đủ CAMLY và một ít BNB cho gas
- Khuyến nghị: Set multisig hoặc limit hàng ngày trên ví Treasury
- Monitor balance ví Treasury thường xuyên

### Giới Hạn Đã Có
- Tối thiểu: 200,000 CAMLY/lệnh
- Tối đa: 500,000 CAMLY/người/ngày
- Chỉ 1 lệnh pending tại một thời điểm

### Ước Tính Gas Fee
- BSC gas fee rất thấp: ~$0.05-0.10/transaction
- Mỗi transfer CAMLY tốn ~50,000-100,000 gas

---

## Tóm Tắt

Để triển khai hệ thống rút tự động, cần:

1. **Admin cung cấp Private Key** của ví Treasury chứa CAMLY
2. **Tạo Edge Function** `process-withdrawal` để thực hiện transfer
3. **Cập nhật Admin Dashboard** để gọi function khi phê duyệt
4. **Thêm cột database** để tracking retry và error

Khi admin click "Phê duyệt", hệ thống sẽ tự động chuyển CAMLY về ví user và cập nhật transaction hash - không cần thao tác thủ công trên blockchain nữa.

