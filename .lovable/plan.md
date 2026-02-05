
# HƯỚNG DẪN: Kích hoạt On-Chain Minting cho FUN Money

## I. PHÂN TÍCH HIỆN TRẠNG

### Những gì ĐÃ CÓ:
| Thành phần | Trạng thái | Chi tiết |
|------------|------------|----------|
| Smart Contract | Deployed | `0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2` trên BSC Testnet |
| TREASURY_PRIVATE_KEY | Configured | Đã có trong Supabase secrets |
| pplp-authorize-mint | Ready | Sẵn sàng ký EIP-712 signature |
| useFUNMoneyContract | Ready | Hook React để gọi contract |
| UI Mint on-chain | Ready | Nút "Mint lên blockchain" đã có |

### Những gì CẦN LÀM:
| Bước | Yêu cầu | Mức độ quan trọng |
|------|---------|-------------------|
| 1 | Grant SIGNER_ROLE cho Treasury wallet trên smart contract | BẮT BUỘC |
| 2 | Sửa EIP-712 Domain Name mismatch | BẮT BUỘC |
| 3 | User kết nối ví MetaMask (BSC Testnet) | Khi mint |
| 4 | User nhấn "Mint lên blockchain" | Khi mint |

---

## II. VẤN ĐỀ #1: SIGNER_ROLE CHƯA ĐƯỢC GRANT

### Phát hiện:
- Smart contract yêu cầu signature từ địa chỉ có `SIGNER_ROLE`
- Trong `deploy.js`, việc grant signer phụ thuộc vào `TREASURY_ADDRESS` env variable
- Có thể Treasury wallet **chưa được grant** `SIGNER_ROLE` khi deploy

### Giải pháp:
Con cần gọi lệnh trên BSCScan (Write Contract) hoặc chạy script:

```javascript
// Trong MetaMask, kết nối ví Admin (deployer)
// Vào BSCScan > Write Contract > grantSigner

grantSigner("0xADDRESS_CỦA_TREASURY_WALLET")
```

### Cách lấy Treasury Address:
Chạy lệnh này với private key trong `TREASURY_PRIVATE_KEY`:

```javascript
const { ethers } = require('ethers');
const wallet = new ethers.Wallet("PRIVATE_KEY_CỦA_BẠN");
console.log(wallet.address); // Đây là Treasury Address
```

---

## III. VẤN ĐỀ #2: EIP-712 DOMAIN NAME MISMATCH

### Phát hiện:
| File | Domain Name | Version |
|------|-------------|---------|
| Smart Contract | `FUNMoney-PPLP` | `1` |
| pplp-eip712.ts | `PPLP Mint Authorization` | `1` |

**Signature sẽ bị REJECT** vì domain name không khớp!

### Giải pháp:
Sửa file `supabase/functions/_shared/pplp-eip712.ts`:

```typescript
export const PPLP_DOMAIN = {
  name: 'FUNMoney-PPLP',  // Phải giống smart contract
  version: '1',
  chainId: 97,
  verifyingContract: '0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2',
};
```

---

## IV. HÀNH ĐỘNG CỤ THỂ

### Bước 1: Grant SIGNER_ROLE (Con thực hiện)

1. Mở BSCScan Contract: https://testnet.bscscan.com/address/0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2#writeContract
2. Connect Wallet (ví Admin đã deploy contract)
3. Tìm function `grantSigner`
4. Nhập địa chỉ Treasury wallet
5. Write → Confirm transaction

### Bước 2: Sửa EIP-712 Domain (Cha thực hiện)

Sửa `PPLP_DOMAIN.name` từ `'PPLP Mint Authorization'` thành `'FUNMoney-PPLP'`

### Bước 3: Test On-Chain Mint

1. Vào trang `/mint`
2. Kết nối MetaMask (BSC Testnet)
3. Với action đã minted off-chain, nhấn "Mint lên blockchain"
4. Confirm transaction trong MetaMask
5. Đợi tx confirm → Link BSCScan hoạt động

---

## V. FLOW SAU KHI SỬA

```text
User có action "Đã nhận FUN (off-chain)"
       ↓
User kết nối MetaMask (BSC Testnet)
       ↓
User nhấn "Mint lên blockchain (tùy chọn)"
       ↓
Frontend gọi pplp-authorize-mint
       ↓
Backend ký EIP-712 với TREASURY_PRIVATE_KEY
Domain: "FUNMoney-PPLP" (khớp với contract)
       ↓
Frontend gọi contract.mintWithSignature()
       ↓
Contract verify signature → SIGNER_ROLE ✓
       ↓
Token được mint thật → tx hash lưu DB
       ↓
UI hiển thị "Đã mint on-chain" + Link BSCScan ✓
```

---

## VI. THÔNG TIN CON CẦN CUNG CẤP

Để Cha hoàn thành setup, con cho Cha biết:

1. **Địa chỉ ví Admin** (ví đã deploy contract): `0x...?`
2. **Địa chỉ Treasury wallet** (từ TREASURY_PRIVATE_KEY): `0x...?`

   Nếu con không biết Treasury address, có thể lấy bằng cách chạy:
   ```bash
   node -e "console.log(require('ethers').Wallet('PRIVATE_KEY').address)"
   ```

---

## VII. TÓM TẮT

| Việc cần làm | Ai thực hiện | Thời gian |
|--------------|--------------|-----------|
| Lấy Treasury Address từ private key | Con | 1 phút |
| Grant SIGNER_ROLE trên BSCScan | Con | 2 phút |
| Sửa EIP-712 Domain Name | Cha | 2 phút |
| Test mint on-chain | Con | 2 phút |

**Tổng cộng: ~7 phút** để kích hoạt on-chain minting!
