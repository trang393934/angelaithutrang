

# KẾ HOẠCH: Sửa lỗi On-Chain Minting cho actions đã Minted Off-Chain

## I. NGUYÊN NHÂN LỖI

| Vấn đề | Chi tiết |
|--------|----------|
| File lỗi | `supabase/functions/pplp-authorize-mint/index.ts` |
| Dòng lỗi | Dòng 115-123 |
| Nguyên nhân | Edge function chỉ cho phép `status === 'scored'`, nhưng khi user click "Mint lên blockchain (tùy chọn)", action đã ở trạng thái `minted` |
| Lỗi trả về | `400: Action must be scored before mint authorization` |

## II. LOGIC HIỆN TẠI (KHÔNG ĐÚNG)

```text
User click "Mint lên blockchain" cho action đã minted off-chain
    ↓
Frontend gọi pplp-authorize-mint
    ↓
Edge function kiểm tra: action.status !== 'scored'?
    ↓
⚠️ FAIL: status = 'minted' → Trả về lỗi 400
    ↓
Frontend hiển thị toast lỗi (trước khi MetaMask mở)
```

## III. GIẢI PHÁP

### Thay đổi 1: Cho phép re-mint on-chain nếu action đã minted off-chain

Cập nhật logic kiểm tra status để:
1. Cho phép `scored` (chưa mint gì cả)
2. Cho phép `minted` NẾU chưa có on-chain tx_hash

```text
File: supabase/functions/pplp-authorize-mint/index.ts

// TRƯỚC (Dòng 115-123):
if (action.status !== 'scored') {
  return Error("Action must be scored...");
}

// SAU:
if (action.status !== 'scored' && action.status !== 'minted') {
  return Error("Action must be scored or minted...");
}

// THÊM: Kiểm tra nếu đã có on-chain tx → từ chối
const existingOnChainMint = await supabase
  .from('pplp_mint_requests')
  .select('tx_hash')
  .eq('action_id', action_id)
  .not('tx_hash', 'is', null)
  .single();

if (existingOnChainMint.data?.tx_hash) {
  return Error("Action already minted on-chain", tx_hash);
}
```

### Thay đổi 2: Không mint off-chain lần nữa nếu đã minted

Khi action đã có status `minted`, bỏ qua bước `add_camly_coins` vì user đã nhận coin rồi:

```typescript
// Chỉ mint off-chain nếu chưa minted
if (action.status === 'scored') {
  const { data: newBalance } = await supabase.rpc('add_camly_coins', {...});
}
// Nếu status = 'minted' → skip (đã có coins)
```

### Thay đổi 3: Không update status nếu đã là minted

```typescript
// Chỉ update status nếu chưa phải minted
if (action.status === 'scored') {
  await supabase.from('pplp_actions').update({ status: 'minted', ... });
}
```

## IV. FLOW SAU KHI SỬA

```text
User click "Mint lên blockchain" cho action "minted off-chain"
    ↓
Frontend gọi pplp-authorize-mint
    ↓
Edge function kiểm tra: status = 'minted'? ✓ OK (nếu chưa có tx_hash)
    ↓
Kiểm tra: đã có on-chain tx_hash? → Nếu có → trả về tx_hash cũ
    ↓
Kiểm tra: đã có signed request còn valid? → Nếu có → trả về signature cũ
    ↓
Tạo mới signed request (hoặc dùng cũ nếu còn valid)
    ↓
✓ Trả về signed mint request
    ↓
Frontend gọi contract.mintWithSignature()
    ↓
MetaMask mở → User confirm
    ↓
Blockchain mint → txHash lưu vào DB
    ↓
UI hiển thị "Đã mint on-chain" + Link BSCScan ✓
```

## V. CHI TIẾT KỸ THUẬT

### File cần sửa

```text
supabase/functions/pplp-authorize-mint/index.ts
```

### Các thay đổi cụ thể

| Dòng | Thay đổi |
|------|----------|
| 115-123 | Mở rộng điều kiện status để chấp nhận cả `minted` |
| ~55-95 | Thêm kiểm tra existingMint có tx_hash hay chưa |
| ~260-295 | Chỉ gọi `add_camly_coins` nếu status còn là `scored` |
| ~300-308 | Chỉ update action status nếu status còn là `scored` |

## VI. KIỂM TRA THÊM

Con đã grant SIGNER_ROLE cho Treasury wallet chưa? Cha cần xác nhận điều này để đảm bảo on-chain mint sẽ hoạt động sau khi sửa code.

Nếu chưa, con cần:
1. Vào BSCScan: https://testnet.bscscan.com/address/0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2#writeContract
2. Connect ví Admin (ví đã deploy contract)
3. Gọi function `grantSigner` với địa chỉ Treasury wallet

## VII. TÓM TẮT

| Bước | Ai thực hiện | Mô tả |
|------|--------------|-------|
| 1 | Cha | Sửa logic `pplp-authorize-mint` để chấp nhận status `minted` |
| 2 | Con (nếu chưa) | Grant SIGNER_ROLE cho Treasury wallet |
| 3 | Con | Test lại nút "Mint lên blockchain" |

