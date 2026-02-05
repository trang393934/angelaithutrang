
# KẾ HOẠCH SỬA LỖI `require(false)` - ON-CHAIN MINTING

## I. NGUYÊN NHÂN GỐC ĐÃ XÁC ĐỊNH

Dựa trên database và code analysis:

### Vấn đề 1: Amount KHÔNG scale khi trả về existing mint (CRITICAL)

| Vị trí lỗi | Dòng 87 trong `pplp-authorize-mint/index.ts` |
|------------|---------------------------------------------|
| Code hiện tại | `amount: existingMint.amount.toString()` |
| Database lưu | `amount = 146` (FUN nguyên) |
| API trả về | `"146"` |
| Smart Contract cần | `"146000000000000000000"` (× 10^18) |

Khi tạo **mint mới** (dòng 259), amount được scale × 10^18 đúng rồi. Nhưng khi **trả về existing mint request** (dòng 87), code lấy trực tiếp từ database mà KHÔNG scale.

### Vấn đề 2: Nonce mismatch giữa Database và On-chain

| Database | On-chain |
|----------|----------|
| `pplp_user_nonces.current_nonce = 1` | `mintNonces[user] = 0` |

Smart contract check: `if (req.nonce != mintNonces[req.to]) revert InvalidNonce(...)`

Nguyên nhân: Database đã tăng nonce lên khi tạo mint request, nhưng vì chưa bao giờ mint thành công on-chain nên on-chain nonce vẫn = 0.

---

## II. GIẢI PHÁP

### Fix 1: Scale amount × 10^18 khi trả về existing mint

```typescript
// File: supabase/functions/pplp-authorize-mint/index.ts
// Dòng 79-100: Block "Return existing signed request"

// TRƯỚC (dòng 87):
amount: existingMint.amount.toString(),

// SAU:
// Scale amount to 18 decimals (stored as raw FUN in database)
amount: (BigInt(existingMint.amount) * BigInt(10 ** 18)).toString(),
```

### Fix 2: Đồng bộ nonce với on-chain (Không tạo signature mới nếu nonce khác)

**Phương án**: Khi trả về existing mint mà nonce không match on-chain, **TẠO SIGNATURE MỚI** với nonce = 0 (on-chain value).

Nhưng vì user đã xác nhận on-chain nonce = 0, và database lưu nonce = 1, nên existing signatures đều KHÔNG HỢP LỆ.

**Fix**: Nếu detect existing mint có nonce không match on-chain → **skip** returning existing, thay vào đó **tạo mới** với nonce đúng.

Hoặc đơn giản hơn: **Reset database nonce về 0** để đồng bộ với on-chain:

```sql
UPDATE pplp_user_nonces SET current_nonce = 0 WHERE current_nonce > 0;
```

Sau đó xóa các mint requests cũ có signature sai:

```sql
UPDATE pplp_mint_requests SET status = 'invalidated' WHERE status = 'signed' AND tx_hash IS NULL;
```

### Fix 3: Code defensive để tránh tái phát

Trong `pplp-authorize-mint/index.ts`, thêm validation nonce khi trả về existing mint:

```typescript
// Khi trả về existing mint, check nonce validity
if (existingMint.status === 'signed' && new Date(existingMint.valid_before) > new Date()) {
  // TODO: Ideally check on-chain nonce, but for now just return
  // If mint fails with InvalidNonce, user can retry and we'll create new signature
  
  // QUAN TRỌNG: Scale amount khi trả về!
  return new Response(JSON.stringify({
    success: true,
    mint_request: {
      ...
      amount: (BigInt(existingMint.amount) * BigInt(10 ** 18)).toString(),
      ...
    }
  }));
}
```

---

## III. CHI TIẾT THAY ĐỔI

### File: `supabase/functions/pplp-authorize-mint/index.ts`

| Dòng | Thay đổi |
|------|----------|
| 87 | `amount: (BigInt(existingMint.amount) * BigInt(10 ** 18)).toString()` |
| 80-100 | Thêm comment giải thích về nonce validation |

### Database: Reset nonce (SQL Migration)

```sql
-- Reset nonces to sync with on-chain state
UPDATE pplp_user_nonces SET current_nonce = 0 WHERE current_nonce > 0;

-- Invalidate old signed requests (signatures are now invalid due to nonce mismatch)
UPDATE pplp_mint_requests 
SET status = 'expired', 
    signature = NULL 
WHERE status = 'signed' 
  AND tx_hash IS NULL;
```

---

## IV. FLOW SAU KHI SỬA

```text
User click "Mint lên blockchain"
    ↓
Frontend gọi pplp-authorize-mint
    ↓
Backend check existing mint? 
    ├── Có nhưng đã expired/invalidated → Tạo mới
    └── Có và còn valid → Scale amount × 10^18, trả về
    ↓
Backend tạo mới với nonce = 0 (reset từ DB)
    ↓
Trả về: {amount: "146000000000000000000", nonce: "0", ...}
    ↓
Frontend gọi contract.mintWithSignature()
    ↓
Smart Contract check: nonce == mintNonces[user]? (0 == 0 ✓)
    ↓
MetaMask mở → User confirm → Mint thành công ✓
```

---

## V. TÓM TẮT CÔNG VIỆC

| Bước | Mô tả | Độ ưu tiên |
|------|-------|------------|
| 1 | Sửa dòng 87 - scale amount × 10^18 | **CRITICAL** |
| 2 | Chạy SQL reset nonce về 0 | **CRITICAL** |
| 3 | Chạy SQL invalidate old signatures | **HIGH** |
| 4 | Redeploy edge function | **REQUIRED** |
| 5 | Test mint với action mới | **VERIFY** |
