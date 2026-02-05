
## Tóm tắt lỗi hiện tại (đã xác định được nguyên nhân)
Edge Function `pplp-authorize-mint` trả `503` với `"All RPC endpoints failed validation"` vì bước “validate RPC + lấy nonce on-chain” đang **chỉ gọi `getNonce(address)`**, và call này đang **revert `require(false)` trên tất cả RPC testnet**.

Log cho thấy:
- RPC mainnet (từ secret `BSC_RPC_URL` đang trỏ `https://bsc-dataseed.binance.org/`) bị loại vì `chainId = 56` (đúng).
- Các RPC testnet `chainId = 97` đều qua được bước `getCode(...)` (có bytecode), nhưng **`getNonce(address)` revert “no data present; require(false)”**.

Vì trong `contracts/FUNMoney.sol`, `getNonce()` là `view` và không thể revert, nên kết luận hợp lý nhất là:
- Contract đang deployed tại `0x1aa8...` trên BSC Testnet **không có hàm `getNonce(address)`** (phiên bản cũ/ch khác), và khi gọi selector `getNonce` thì fallback của contract revert `require(false)`.
- Nhưng contract có khả năng vẫn có `public mapping mintNonces(address)`, nên **đọc nonce đúng phải fallback qua `mintNonces(address)`**.

=> Giải pháp: làm hệ thống tương thích cả 2 biến thể contract:
- Ưu tiên `getNonce(address)`
- Nếu revert/missing revert data thì fallback `mintNonces(address)`

Đồng thời frontend cũng cần đổi cách đọc nonce + check minted để tránh lỗi tương tự ở UI.

---

## Mục tiêu của lần fix này
1) Edge Function không còn 503, lấy được nonce on-chain ổn định.
2) Frontend đọc nonce/minted trạng thái an toàn (không còn “require(false)” do gọi nhầm function selector).
3) Khi vẫn lỗi, trả về thông tin chẩn đoán rõ ràng “RPC ok nhưng contract thiếu method nào”.

---

## Phần A — Sửa backend function `pplp-authorize-mint` (nguyên nhân 503)
### A1) Làm nonce fetch tương thích 2 phiên bản contract
**File:** `supabase/functions/pplp-authorize-mint/index.ts`

**Thay đổi:**
- Trong `getValidatedBscProvider(...)`, thay vì ABI chỉ có `getNonce`, dùng ABI gồm cả:
  - `function getNonce(address user) view returns (uint256)`
  - `function mintNonces(address user) view returns (uint256)`
- Logic:
  1. Try `getNonce(walletAddress)`
  2. Nếu fail với dạng lỗi `CALL_EXCEPTION`/`missing revert data`/`require(false)`:
     - Try `mintNonces(walletAddress)`
  3. Nếu `mintNonces` cũng fail => coi endpoint đó invalid và `continue`.

**Logging thêm để debug:**
- Log nonce method đã dùng: `getNonce` hay `mintNonces`.
- Lưu “failure reason” theo từng RPC (chainId mismatch, code missing, nonce method fail…).

### A2) Trả 503 kèm chẩn đoán rõ hơn (để lần sau không đoán mò)
- Khi tất cả RPC fail, response 503 sẽ include danh sách rút gọn:
  - RPC URL
  - reason cuối cùng (ví dụ: `wrong chainId`, `no code`, `nonce methods reverted`, `timeout`)
Điều này giúp phân biệt:
- “RPC chết thật” vs “RPC sống nhưng contract interface mismatch”.

### A3) Dọn RPC list
- Loại endpoint đang 521 (omniatech) ra khỏi list (vì hiện tại chắc chắn fail).
- Thêm 1–2 endpoint public đáng tin (ví dụ Ankr / BlockPI) để tăng tỉ lệ thành công.

Lưu ý: `BSC_RPC_URL` hiện đang trỏ mainnet (chainId 56) nên sẽ luôn fail validation; backend vẫn hoạt động vì sẽ bỏ qua và dùng fallback list. Tuy nhiên để tối ưu tốc độ, ta sẽ:
- Nếu custom RPC chainId != 97 -> skip ngay (đã có), và giảm timeout một chút để không kéo dài request.

---

## Phần B — Sửa frontend hook `useFUNMoneyContract` để không gọi “function không tồn tại”
### B1) Tạo helper đọc nonce “an toàn”
**File:** `src/hooks/useFUNMoneyContract.ts`

**Thay đổi:**
- Thêm hàm helper:
  - `readUserNonce(address)`:
    - try `contract.getNonce(address)`
    - if fails -> try `contract.mintNonces(address)`
    - nếu cả hai fail -> throw error “Contract không hỗ trợ getNonce/mintNonces”
- Thay tất cả chỗ đang gọi:
  - `contract.getNonce(address)` (trong `fetchContractInfo`)
  - `contract.getNonce(signedRequest.to)` (trong preflight nonce check trước khi mint)
  bằng `readUserNonce(...)`

### B2) Tạo helper check minted “an toàn”
- Tương tự:
  - `readActionMinted(actionId)`:
    - try `contract.isActionMinted(actionId)`
    - if fails -> try `contract.mintedAction(actionId)`
- Thay trong:
  - `isActionMinted(...)`
  - và các chỗ preflight.

### B3) Nâng verifyContract: không chỉ check code, mà check được “nonce read”
Hiện `verifyContract` chỉ check:
- blockNumber
- getCode != 0x

Cập nhật:
- Sau khi code tồn tại, thử gọi `readUserNonce(address)` (hoặc 1 address hợp lệ) để xác thực “interface đúng”.
- Nếu không đọc được nonce bằng cả 2 cách:
  - Show diagnostics rõ: “Contract tại địa chỉ này không phải FUNMoney PPLP hoặc là bản không tương thích”.

---

## Phần C — Test end-to-end (bắt buộc)
### C1) Test backend function trực tiếp
- Dùng tool call Edge Function (authenticated) với 1 `action_id` đang `minted/scored` trong DB (đã thấy có).
- Dùng 1 `wallet_address` hợp lệ.
Kỳ vọng:
- Không còn 503
- Response trả `success: true` và có `mint_request.nonce`

### C2) Test UI
1) Vào trang Mint
2) Connect ví (BSC Testnet 97)
3) Đảm bảo “contract info” load được (không bị revert do `getNonce`)
4) Click “Mint lên blockchain”
5) Nếu tx fail: phải thấy custom error decode rõ (InvalidSigner, InvalidNonce, …), không còn “require(false) mơ hồ”.

---

## Phạm vi thay đổi (danh sách file sẽ đụng)
- `supabase/functions/pplp-authorize-mint/index.ts`
- `src/hooks/useFUNMoneyContract.ts`
- (Không bắt buộc, chỉ khi cần UI phụ): `src/components/mint/FUNMoneyMintCard.tsx`

---

## Vì sao cách này fix đúng lỗi của con
Lỗi 503 hiện tại không phải “RPC không tới được testnet”, mà là “RPC tới được nhưng bước validate bắt buộc gọi `getNonce()` — trong khi contract đang deployed không có hàm đó”.
Cho phép fallback `mintNonces()` sẽ:
- làm validate pass,
- backend lấy được nonce đúng,
- và flow mint tiếp tục chạy.

