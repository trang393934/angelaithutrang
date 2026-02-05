
## Mục tiêu
Fix lỗi `require(false)` khi bấm **“Mint lên blockchain (tùy chọn)”** bằng cách đồng bộ **nonce** đúng theo **on-chain nonce** (thay vì nonce trong database), đồng thời cải thiện thông báo lỗi để lần sau thấy rõ “InvalidNonce / InvalidSigner / Expired…” thay vì `require(false)`.

---

## Chẩn đoán ngắn gọn (nguyên nhân gốc)
- Smart contract `FUNMoney.mintWithSignature()` kiểm tra:
  - `req.nonce == mintNonces[req.to]`
- Con đã kiểm tra **on-chain nonce = 0**.
- Nhưng backend function hiện đang gọi `get_next_nonce(actor_id)` (database) → trả về **1** cho lần đầu (vì hàm DB “insert 1 / increment rồi trả về”), dẫn đến:
  - `req.nonce = 1` nhưng `mintNonces[to] = 0` → revert **InvalidNonce**.
- Vì frontend ABI chưa khai báo custom errors nên Ethers thường hiện chung chung `require(false)`.

---

## Hướng sửa (tổng quan)
1. **Backend function `pplp-authorize-mint`**: lấy nonce trực tiếp từ blockchain bằng RPC (BSC Testnet), dùng nonce đó để sign EIP-712.
2. **Idempotency đúng**: nếu đã có `existingMint` nhưng nonce đã “cũ” so với chain → tự động “invalidate/expire” record cũ và ký lại với nonce mới.
3. **Frontend**:
   - Trước khi submit tx, đọc on-chain nonce và so với nonce trong signedRequest; nếu lệch thì yêu cầu “bấm mint lại” để lấy chữ ký mới.
   - Thêm **custom error signatures** vào ABI để hiển thị lỗi rõ ràng (InvalidNonce, PolicyVersionMismatch, RequestExpired…).

---

## Các bước triển khai chi tiết

### 1) Backend: dùng on-chain nonce thay cho `get_next_nonce`
**File**: `supabase/functions/pplp-authorize-mint/index.ts`

- Thêm RPC provider từ secret đã có: `BSC_RPC_URL`
- Tạo contract reader tối giản để đọc nonce:
  - ABI fragment: `function getNonce(address user) view returns (uint256)` (hoặc `mintNonces(address)` đều được)
  - Contract address lấy từ `PPLP_DOMAIN.verifyingContract` (đang là `0x1aa8...`)

**Logic nonce mới**:
- `onChainNonce = await contract.getNonce(wallet_address)`
- Khi tạo payload/signature: dùng `onChainNonce` (không dùng DB nonce nữa)

**Idempotency khi có existingMint**:
- Nếu `existingMint.status === 'signed'` và chưa hết hạn:
  - Nếu `BigInt(existingMint.nonce) === onChainNonce`: trả về existingMint (đã scale amount rồi)
  - Nếu khác: coi signature cũ là invalid
    - Update `pplp_mint_requests`: set `status='expired'`, `signature=null` (hoặc `status='invalidated'` nếu enum cho phép), rồi tiếp tục flow ký mới bằng `onChainNonce`.

**Ghi DB**:
- Upsert mint request với `nonce = onChainNonce` và `status='signed'`.

> Kết quả: chữ ký luôn khớp với nonce thực tế của contract, không còn lệch “DB 1 / chain 0”.

---

### 2) Backend: cập nhật helper để nhận nonce dạng bigint an toàn
**File**: `supabase/functions/_shared/pplp-eip712.ts`

Hiện `createMintPayload()` nhận `nonce: number` rồi `BigInt(params.nonce)`.
- Sửa để nhận `nonce: bigint | number | string` (ưu tiên bigint) nhằm tránh lỗi kiểu và tránh phụ thuộc Number.
- Bên trong normalize về `BigInt(nonce)`.

---

### 3) Backend: (khuyến nghị) thêm authentication + ownership check (tránh lỗ hổng ký hộ)
Hiện function đang dùng service role và **không kiểm tra user**, ai có `action_id` cũng có thể xin chữ ký mint về ví bất kỳ.
Sửa theo hướng:
- Tạo supabase client bằng anon/auth header từ request để gọi `supabase.auth.getUser()` (hoặc `getClaims()`), xác định user đang đăng nhập.
- Verify `action.actor_id === user.id`; nếu không → 403.
- (Tuỳ chọn) cho phép admin bypass.

Điều này không trực tiếp chữa `require(false)` nhưng là bảo vệ cực quan trọng vì function này ký mint.

---

### 4) Frontend: kiểm tra nonce trước khi submit để tránh revert
**File**: `src/hooks/useFUNMoneyContract.ts`

Trong `mintWithSignature()`:
- Gọi `const currentNonce = await contract.getNonce(signedRequest.to)`
- Nếu `BigInt(currentNonce) !== signedRequest.nonce`:
  - Hiện toast: “Nonce đã thay đổi, vui lòng bấm Mint lại để lấy chữ ký mới.”
  - Dừng (không submit tx).

---

### 5) Frontend: thêm custom errors vào ABI để hết “require(false)”
**File**: `src/lib/funMoneyABI.ts`

Bổ sung các khai báo error để Ethers decode được:
- `error InvalidNonce(uint256 expected, uint256 provided)`
- `error InvalidSigner(address recovered)`
- `error PolicyVersionMismatch(uint32 expected, uint32 provided)`
- `error RequestExpired(uint64 validBefore, uint256 currentTime)`
- `error RequestTooEarly(uint64 validAfter, uint256 currentTime)`
- `error AmountBelowMinimum(uint256 amount, uint256 minimum)`
- `error AmountAboveMaximum(uint256 amount, uint256 maximum)`
- `error ActionAlreadyMinted(bytes32 actionId)`
- `error EpochCapExceeded(uint256 requested, uint256 remaining)`
- `error UserEpochCapExceeded(uint256 requested, uint256 remaining)`
- `error MintingDisabled()`
- …

Sau đó trong catch block, ưu tiên đọc:
- `error.shortMessage`
- `error.reason`
- hoặc parse `error.data` khi có.

---

## Kiểm thử (end-to-end)
1. Vào `/mint`, chọn action đang lỗi (trong DB thấy action gần nhất là `dc9d1e22-...`).
2. Bấm “Mint lên blockchain”:
   - Backend sẽ trả về signed request với `nonce` đúng bằng `contract.getNonce(to)` (đang 0).
   - MetaMask mở, confirm → tx thành công.
3. Sau khi tx success:
   - `pplp_mint_requests.tx_hash` được update.
   - UI hiển thị “Đã mint on-chain” và hiện link BSCScan.
4. Test retry:
   - Nếu bấm lại, frontend sẽ check `isActionMinted(bytes32)` và báo “Action đã mint” (không gửi tx).
5. Test lệch nonce:
   - Mint thành công xong (nonce on-chain tăng lên 1), nếu cố dùng signature cũ (nonce 0) → frontend phải chặn trước khi submit.

---

## Rủi ro & lưu ý
- RPC call (BSC_RPC_URL) có thể chậm/timeout: cần timeout + retry nhẹ ở backend.
- Nếu user đổi ví, nonce khác hoàn toàn: backend phải dùng nonce theo `wallet_address` hiện tại (đã đúng với thiết kế mới).
- Nếu action đã “minted off-chain” từ lâu, vẫn OK; on-chain mint là optional.

---

## Deliverables (những thứ sẽ được sửa)
- `supabase/functions/pplp-authorize-mint/index.ts`
  - Lấy on-chain nonce, ký theo nonce on-chain, invalidate existing signature nếu lệch nonce.
  - (Khuyến nghị) thêm auth + ownership check.
- `supabase/functions/_shared/pplp-eip712.ts`
  - `createMintPayload` nhận nonce dạng bigint an toàn.
- `src/hooks/useFUNMoneyContract.ts`
  - Preflight check nonce on-chain trước khi submit.
  - Cải thiện error parsing.
- `src/lib/funMoneyABI.ts`
  - Thêm custom errors để hiển thị lỗi rõ ràng.

---

## Tiêu chí hoàn thành
- Bấm “Mint lên blockchain” không còn `require(false)`.
- Nếu có lỗi thì hiển thị đúng nguyên nhân (InvalidNonce/InvalidSigner/Expired…).
- On-chain mint thành công ít nhất 1 action, ghi nhận `tx_hash` vào backend.