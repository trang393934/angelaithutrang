

## Tự động chuyển Camly Coin on-chain khi user nhấn CLAIM Lì xì

### Tổng quan
Khi user nhấn nút **CLAIM** trên popup Lì xì Tết, hệ thống sẽ **tự động chuyển Camly Coin on-chain** từ ví Treasury đến ví Web3 của user, cập nhật trạng thái `completed` kèm `tx_hash`, và ghi nhận giao dịch vào lịch sử.

### Luồng hoạt động

```text
User nhấn CLAIM
    │
    ▼
Insert lixi_claims (status: pending)
    │
    ▼
Gọi Edge Function "process-lixi-claim"
    │
    ├── Kiểm tra wallet_address (bắt buộc)
    ├── Chuyển CAMLY on-chain từ Treasury
    ├── Chờ xác nhận giao dịch
    │
    ├── Thành công:
    │   ├── Update lixi_claims: status=completed, tx_hash=...
    │   ├── Insert camly_coin_transactions (ghi lịch sử)
    │   └── Gửi notification cho user kèm tx_hash
    │
    └── Thất bại:
        ├── Update lixi_claims: status=failed, error_message=...
        └── Gửi notification lỗi cho admin
```

### Các thay đổi cụ thể

**1. Tạo Edge Function mới: `process-lixi-claim`**
- Tái sử dụng logic chuyển CAMLY on-chain từ `process-withdrawal` (dùng `TREASURY_PRIVATE_KEY`, ethers, BSC Mainnet)
- Nhận `claim_id` từ request body
- Xác thực user (claim phải thuộc user đang đăng nhập)
- Chuyển CAMLY on-chain, chờ receipt
- Nếu `receipt.status === 1`: cập nhật `lixi_claims` thành `completed` + `tx_hash`
- Nếu thất bại: cập nhật `status=failed` + `error_message`
- Ghi bản ghi vào `camly_coin_transactions` với `transaction_type = "lixi_claim"` để hiển thị trong lịch sử

**2. Cập nhật `useLiXiCelebration.ts`**
- Sau khi insert claim record, gọi Edge Function `process-lixi-claim` với `claim_id`
- Hiển thị trạng thái "Đang chuyển on-chain..." trong khi chờ
- Nếu thành công: toast kèm link BSCScan
- Nếu thất bại (VD: chưa có ví): thông báo lỗi rõ ràng
- Yêu cầu user phải có wallet_address trước khi claim

**3. Cập nhật hiển thị lịch sử giao dịch**
- Trong `TransactionHistorySection.tsx`: thêm nhận diện `transaction_type = "lixi_claim"` hiển thị với icon/label phù hợp (VD: "🧧 Lì xì Tết")
- Hiển thị `tx_hash` với link BSCScan

**4. Cập nhật `supabase/config.toml`**
- Thêm config cho function `process-lixi-claim` với `verify_jwt = false`

### Xử lý trường hợp đặc biệt
- **User chưa có ví Web3**: Hiện thông báo yêu cầu kết nối ví trước khi claim
- **Treasury hết CAMLY/BNB**: Trả lỗi rõ ràng, giữ claim ở `pending` để admin xử lý thủ công
- **Giao dịch bị revert**: Chỉ đánh dấu `completed` khi `receipt.status === 1`

### Chi tiết kỹ thuật

**Edge Function `process-lixi-claim/index.ts`:**
- Auth: xác thực JWT, kiểm tra `claim.user_id === authenticated user`
- Dùng `SUPABASE_SERVICE_ROLE_KEY` để update `lixi_claims` (bypass RLS)
- CAMLY contract: `0x0910320181889fefde0bb1ca63962b0a8882e413` trên BSC Mainnet
- CAMLY decimals: 3
- Secrets cần: `TREASURY_PRIVATE_KEY`, `BSC_RPC_URL`

**Ghi lịch sử `camly_coin_transactions`:**
```text
user_id, amount (camly_amount), transaction_type = "lixi_claim",
description = "Lì xì Tết 2026 - {fun_amount} FUN",
metadata = { tx_hash, claim_id, fun_amount, source: "tet_lixi" }
```

