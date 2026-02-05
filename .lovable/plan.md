

# KẾ HOẠCH: Sửa BSCScan Link và Kích hoạt On-Chain Minting

## I. VẤN ĐỀ

### Hiện trạng:
- Contract **đã deploy** tại: `0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2`
- Hệ thống đang mint **OFF-CHAIN** (chỉ cộng Camly Coins trong database)
- UI hiển thị link BSCScan nhưng **không có tx hash thật** → báo lỗi

### Nguyên nhân:
| Thành phần | Trạng thái | Vấn đề |
|------------|------------|--------|
| Smart Contract | Đã deploy ✅ | Không có vấn đề |
| `pplp-authorize-mint` | Ký EIP-712 signature | Thiếu `TREASURY_PRIVATE_KEY` để ký? |
| `useFUNMoneyContract` | Sẵn sàng gọi contract | User cần kết nối ví và nhấn "Claim" |
| `FUNMoneyMintCard` | Hiển thị link khi có `minted_at` | **BUG**: Link không có tx hash thật |

## II. GIẢI PHÁP

### Bước 1: Sửa UI - Ẩn link BSCScan khi không có tx hash thật

**File:** `src/components/mint/FUNMoneyMintCard.tsx`

**Thay đổi:**
- Chỉ hiển thị link BSCScan khi có `txHash` thật (không phải null/undefined)
- Thêm kiểm tra `tx_hash` từ database (nếu có)
- Nếu chưa có on-chain tx, hiển thị nút "Claim on-chain" để user mint lên blockchain

```typescript
// Trước:
{(txHash || action.minted_at) && (
  <Button onClick={() => window.open(`.../${txHash}`, "_blank")}>

// Sau:
{txHash && txHash !== 'null' && (
  <Button onClick={() => window.open(`.../${txHash}`, "_blank")}>
```

### Bước 2: Thêm trạng thái "Minted Off-chain" 

Phân biệt rõ:
- `minted_offchain`: Đã cộng Camly Coins, chưa on-chain
- `minted_onchain`: Có tx hash thật từ blockchain

**Thay đổi UI:**
- Actions đã minted off-chain: Hiển thị "Đã nhận FUN" + nút "Mint on-chain (tùy chọn)"
- Actions đã mint on-chain: Hiển thị "Đã mint" + link BSCScan

### Bước 3: Kiểm tra Treasury Key

Cần đảm bảo `TREASURY_PRIVATE_KEY` được cấu hình đúng trong Supabase secrets để ký EIP-712 signature cho on-chain minting.

## III. CHI TIẾT THAY ĐỔI

### File 1: `src/components/mint/FUNMoneyMintCard.tsx`

```typescript
// Cập nhật interface để bao gồm tx_hash
interface PPLPAction {
  id: string;
  action_type: string;
  platform_id: string;
  status: string;
  created_at: string;
  minted_at?: string;
  tx_hash?: string;  // Thêm field tx_hash
  pplp_scores?: Array<{...}>;
}

// Cập nhật STATUS_CONFIG để phân biệt
const STATUS_CONFIG: Record<string, {...}> = {
  // ... existing
  minted: { label: "Đã nhận FUN", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
};

// Sửa logic hiển thị BSCScan link
const actualTxHash = txHash || action.tx_hash;
const hasOnChainTx = actualTxHash && actualTxHash !== 'null' && actualTxHash.startsWith('0x');

// Trong render:
{isMinted ? (
  <div className="space-y-2">
    <Button variant="outline" className="w-full" disabled>
      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
      {hasOnChainTx ? "Đã mint on-chain" : "Đã nhận FUN (off-chain)"}
    </Button>
    
    {hasOnChainTx ? (
      // Hiển thị link BSCScan
      <Button variant="ghost" size="sm" className="w-full text-xs"
        onClick={() => window.open(`https://testnet.bscscan.com/tx/${actualTxHash}`, "_blank")}>
        <ExternalLink className="mr-1 h-3 w-3" />
        Xem trên BSCScan
      </Button>
    ) : (
      // Hiển thị nút mint on-chain (tùy chọn)
      <Button variant="ghost" size="sm" className="w-full text-xs text-amber-600"
        onClick={handleMint}>
        <Coins className="mr-1 h-3 w-3" />
        Mint lên blockchain (tùy chọn)
      </Button>
    )}
  </div>
) : ...}
```

### File 2: `src/hooks/usePPLPActions.ts` (nếu cần)

Đảm bảo query bao gồm `tx_hash` từ `pplp_mint_requests` table nếu có.

## IV. FLOW SAU KHI SỬA

```text
1. User thực hiện action (hỏi AI, đăng bài...)
2. PPLP Engine chấm điểm → PASS
3. ✅ OFF-CHAIN: Camly Coins được cộng ngay lập tức
4. UI hiển thị: "Đã nhận FUN (off-chain)" - KHÔNG có link BSCScan
5. (TÙY CHỌN) User kết nối ví → Nhấn "Mint lên blockchain"
6. ✅ ON-CHAIN: Transaction được submit → có tx hash thật
7. UI hiển thị: "Đã mint on-chain" + Link BSCScan hoạt động
```

## V. KẾT QUẢ MONG ĐỢI

| Trạng thái | UI hiển thị | BSCScan Link |
|------------|-------------|--------------|
| Minted off-chain | "Đã nhận FUN" + nút Mint on-chain | Ẩn |
| Minted on-chain | "Đã mint on-chain" | Hiển thị ✅ |

## VI. THỜI GIAN THỰC HIỆN

| Bước | Thời gian |
|------|-----------|
| Sửa FUNMoneyMintCard.tsx | 3 phút |
| Kiểm tra usePPLPActions | 2 phút |
| Deploy & Test | 2 phút |
| **Tổng** | ~7 phút |

