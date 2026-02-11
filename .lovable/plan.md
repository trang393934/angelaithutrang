

## Kế hoạch khắc phục: Đồng bộ dữ liệu Token Lifecycle Panel

### Vấn đề
Tokens được mint (lock) thành công on-chain nhưng user không thấy số dư trong mục Activate & Claim vì:
1. Contract chưa sẵn sàng khi panel gọi `fetchContractInfo`
2. Không có cơ chế tự động refresh sau mint
3. Một số giao dịch on-chain bị revert nhưng DB vẫn ghi "minted"

### Thay đổi kỹ thuật

#### 1. Sửa race condition trong TokenLifecyclePanel
**File**: `src/components/mint/TokenLifecyclePanel.tsx`
- Thêm dependency `contractInfo` vào logic hiển thị để khi contract init xong, panel tự fetch lại
- Thêm auto-fetch với retry (tối đa 3 lần, cách nhau 2 giây) khi contract mới được init nhưng `contractInfo` vẫn null

#### 2. Thêm auto-refresh sau khi contract init
**File**: `src/hooks/useFUNMoneyContract.ts`
- Sau khi `setContract()` thành công, tự động gọi `fetchContractInfo()` ngay lập tức
- Thêm polling interval (mỗi 30 giây) khi user ở trang /mint để tự cập nhật số dư

#### 3. Kiểm tra reverted transactions trong DB
**File**: `supabase/functions/pplp-authorize-mint/index.ts`
- Sau khi `tx.wait()` fail hoặc receipt status = 0, cập nhật `pplp_mint_requests.status` thành "failed" thay vì giữ "minted"
- Thêm kiểm tra `receipt.status === 1` trước khi đánh dấu thành công

#### 4. Thêm thông báo hướng dẫn rõ ràng hơn cho user
**File**: `src/components/mint/TokenLifecyclePanel.tsx`
- Khi connected nhưng `contractInfo` chưa load xong, hiển thị skeleton loading thay vì 0/0/0
- Thêm thông báo "Đang tải dữ liệu on-chain..." trong lúc chờ
- Cải thiện nút Refresh để user biết cần ấn nếu dữ liệu chưa cập nhật

#### 5. Dọn dẹp dữ liệu: Đối chiếu DB với on-chain
- Tạo truy vấn SQL để tìm các bản ghi `pplp_mint_requests` có `status = 'minted'` nhưng tx_hash tương ứng thực tế bị revert on-chain (từ file CSV), để đánh dấu lại thành "failed"

### Trình tự thực hiện
1. Sửa race condition và thêm loading state (TokenLifecyclePanel)
2. Thêm auto-refresh trong useFUNMoneyContract
3. Bảo vệ edge function khỏi ghi nhận sai trạng thái cho giao dịch revert
4. Đối chiếu và dọn dẹp dữ liệu hiện tại

