
# KẾ HOẠCH SỬA LỖI ON-CHAIN MINTING

## I. VẤN ĐỀ ĐÃ XÁC ĐỊNH

### Vấn đề 1: Địa chỉ ví sai (CRITICAL)
| Thực tế | Mong muốn |
|---------|-----------|
| `0x1234567890123456789012345678901234567890` | Địa chỉ ví MetaMask thật của user |

**Nguyên nhân**: Khi user **chưa kết nối ví** hoặc **ví mất kết nối**, biến `address` trong `useFUNMoneyContract` bị null, nhưng code vẫn gọi edge function.

### Vấn đề 2: Amount chưa scale 18 decimals
| Server trả về | Smart Contract cần |
|---------------|-------------------|
| `148` (số nguyên) | `148000000000000000000` (148 × 10^18 wei) |

**Nguyên nhân**: Edge function trả về `final_reward` từ database (số nguyên FUN) mà không nhân với 10^18.

### Vấn đề 3: EIP-712 Type Mismatch
| Field | Edge Function Type | Smart Contract Type |
|-------|-------------------|---------------------|
| validAfter | `uint256` | `uint64` |
| validBefore | `uint256` | `uint64` |

**Nguyên nhân**: `pplp-eip712.ts` định nghĩa sai type.

## II. GIẢI PHÁP

### Fix 1: Sửa `useFUNMoneyContract.ts` - Kiểm tra ví trước khi mint

```typescript
// TRƯỚC:
const requestMintAuthorization = useCallback(async (actionId: string) => {
  if (!address) {
    toast.error("Vui lòng kết nối ví trước");
    return null;
  }
  // ...gọi edge function với address
}, [address]);

// SAU: Thêm validation chặt chẽ hơn
const requestMintAuthorization = useCallback(async (actionId: string) => {
  // Validate address format
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    toast.error("Vui lòng kết nối ví MetaMask trước");
    return null;
  }
  
  // Prevent test addresses
  if (address.startsWith("0x1234567890")) {
    toast.error("Địa chỉ ví không hợp lệ");
    return null;
  }
  // ...
}, [address]);
```

### Fix 2: Sửa `pplp-authorize-mint/index.ts` - Scale amount 18 decimals

```typescript
// TRƯỚC:
amount: BigInt(params.amount),

// SAU:
// Scale to 18 decimals (FUN Money has 18 decimals like ETH)
const scaledAmount = BigInt(params.amount) * BigInt(10 ** 18);
```

### Fix 3: Sửa `pplp-eip712.ts` - Sửa EIP-712 types

```typescript
// TRƯỚC:
export const MINT_REQUEST_TYPES = {
  MintRequest: [
    // ...
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    // ...
  ],
};

// SAU:
export const MINT_REQUEST_TYPES = {
  MintRequest: [
    // ...
    { name: 'validAfter', type: 'uint64' },
    { name: 'validBefore', type: 'uint64' },
    // ...
  ],
};
```

### Fix 4: Sửa `FUNMoneyMintCard.tsx` - Đảm bảo kết nối ví trước

```typescript
// TRƯỚC:
const handleMint = async () => {
  if (!isConnected) {
    connect();
    return;
  }
  // ...gọi executeMint ngay
};

// SAU:
const handleMint = async () => {
  if (!isConnected) {
    await connect();
    return; // Dừng lại, chờ user click lại sau khi kết nối
  }
  
  // Double-check address sau khi connect
  if (!address || address.startsWith("0x1234567890")) {
    toast.error("Ví chưa kết nối đúng. Vui lòng thử lại.");
    return;
  }
  // ...
};
```

## III. FILES CẦN SỬA

| File | Thay đổi |
|------|----------|
| `supabase/functions/_shared/pplp-eip712.ts` | Sửa type `uint256` → `uint64` cho validAfter/validBefore |
| `supabase/functions/pplp-authorize-mint/index.ts` | Scale amount × 10^18 |
| `src/hooks/useFUNMoneyContract.ts` | Validate address format, reject test addresses |
| `src/components/mint/FUNMoneyMintCard.tsx` | Kiểm tra address sau khi connect |

## IV. FLOW SAU KHI SỬA

```text
User click "Mint lên blockchain"
    ↓
Frontend kiểm tra: isConnected && address hợp lệ?
    ↓
Nếu chưa → Hiện "Kết nối ví" → User connect MetaMask
    ↓
Nếu đã kết nối → Validate address format (không phải 0x123...)
    ↓
Frontend gọi pplp-authorize-mint với wallet_address thật
    ↓
Backend scale amount × 10^18, ký EIP-712 (uint64 types)
    ↓
Frontend gọi contract.mintWithSignature()
    ↓
MetaMask mở → User confirm → Mint thành công ✓
```

## V. TÓM TẮT

| Bước | Mô tả | Độ ưu tiên |
|------|-------|------------|
| 1 | Sửa EIP-712 types (uint64) | CRITICAL |
| 2 | Scale amount × 10^18 | CRITICAL |
| 3 | Validate address trong frontend | HIGH |
| 4 | Kiểm tra kết nối ví trong UI | HIGH |
| 5 | Redeploy edge function | REQUIRED |
