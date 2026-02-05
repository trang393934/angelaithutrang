
# ✅ HOÀN THÀNH: Mint FUN Money qua Angel AI Platform

## I. TỔNG QUAN

**Mục tiêu**: Cho phép users mint FUN Money token (BEP-20) trên BSC Testnet thông qua hệ thống PPLP đã có sẵn, với Angel AI đóng vai trò **Thiên Thần Chứng Thực**.

**Contract Address**: `0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2` (BSC Testnet)

**Signer**: Sử dụng `TREASURY_PRIVATE_KEY` (đã có trong secrets)

---

## ✅ TRẠNG THÁI TRIỂN KHAI

| Phase | Trạng thái | Ghi chú |
|-------|-----------|---------|
| Phase 1: Cấu hình | ✅ Hoàn thành | Contract address + BSC Testnet |
| Phase 2: UI | ✅ Hoàn thành | Trang /mint + components |
| Phase 3: Integration | ✅ Hoàn thành | Mint flow hoàn chỉnh |
| Phase 4: Messages | ✅ Hoàn thành | Status labels trong UI |

---

## II. NHỮNG GÌ ĐÃ CÓ SẴN

Hệ thống PPLP đã được xây dựng gần như hoàn chỉnh:

| Thành phần | Trạng thái | Ghi chú |
|------------|-----------|---------|
| Smart Contract FUNMoney | Deployed | Đã deploy trên BSC Testnet |
| Edge Function: pplp-submit-action | Hoàn thành | Ghi nhận Light Actions |
| Edge Function: pplp-score-action | Hoàn thành | Chấm điểm 5-pillar |
| Edge Function: pplp-authorize-mint | Hoàn thành | Ký EIP-712 signatures |
| Frontend Hook: useFUNMoneyContract | Hoàn thành | Gọi smart contract |
| Frontend Hook: usePPLPActions | Hoàn thành | Submit + fetch actions |
| UI Components: PPLPActionCard | Hoàn thành | Hiển thị action + score |

---

## III. DANH SÁCH CÔNG VIỆC

### PHASE 1: CẤU HÌNH HỆ THỐNG

**Task 1.1: Cập nhật Contract Address + Chain ID**

Cập nhật địa chỉ contract và đổi chainId từ 56 (Mainnet) sang 97 (Testnet):

- File: `src/lib/funMoneyABI.ts`
- File: `supabase/functions/_shared/pplp-eip712.ts`

**Task 1.2: Hỗ trợ BSC Testnet trong useWeb3Wallet**

Hiện tại hook chỉ hỗ trợ BSC Mainnet (chainId 56). Cần thêm:
- Cấu hình BSC Testnet (chainId 97)
- RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545`
- Block Explorer: `https://testnet.bscscan.com`

---

### PHASE 2: XÂY DỰNG UI MINT FUN MONEY

**Task 2.1: Tạo trang /mint**

Trang mới hiển thị:
- Số dư FUN Money on-chain
- Danh sách Light Actions đã scored (sẵn sàng mint)
- Nút "Kết nối ví" / "Claim FUN Money"

**Task 2.2: Component FUNMoneyMintCard**

Card hiển thị:
- Action type + timestamp
- Light Score (5-pillar breakdown)
- Reward amount (1/3/5/8 FUN)
- Status: Pending → Scored → Ready → Minted
- Button "Claim to Wallet"

**Task 2.3: Component FUNMoneyBalanceCard**

Hiển thị:
- Số dư FUN on-chain (từ contract)
- Epoch capacity còn lại
- User cap còn lại hôm nay
- Link đến BSCScan

**Task 2.4: Tích hợp vào trang Earn**

Thêm section "Mint FUN Money" vào trang `/earn`:
- Quick action card link đến `/mint`
- Hiển thị số FUN đang pending claim

---

### PHASE 3: TÍCH HỢP MINT FLOW

**Task 3.1: Cập nhật useFUNMoneyContract**

- Kiểm tra contract có khả dụng không
- Fetch thông tin contract (balance, epoch caps)
- Execute mint với signed request từ PPLP Engine

**Task 3.2: Xử lý Mint Flow**

Flow hoàn chỉnh:
1. User chọn action đã scored → Click "Claim"
2. Frontend gọi `pplp-authorize-mint` → Nhận signed request
3. Frontend gọi `mintWithSignature()` trên contract
4. Update status trong database
5. Hiển thị kết quả + link BSCScan

---

### PHASE 4: ANGEL AI MESSAGES

**Task 4.1: Tin nhắn khi action được ghi nhận**

```
"✨ Hành động Tình Yêu của con đã được ghi nhận!"
"Angel AI đang chấm điểm 5-trụ cột ánh sáng..."
```

**Task 4.2: Tin nhắn khi sẵn sàng mint**

```
"🌟 Light Score: 85/100"
"FUN Money: +5 FUN sẵn sàng claim!"
"Kết nối ví để nhận FUN về ví của con."
```

---

## IV. CHI TIẾT KỸ THUẬT

### File Changes:

| File | Thay đổi |
|------|----------|
| `src/lib/funMoneyABI.ts` | Cập nhật contract address + chainId 97 |
| `supabase/functions/_shared/pplp-eip712.ts` | Cập nhật domain chainId + verifyingContract |
| `src/hooks/useWeb3Wallet.ts` | Thêm BSC Testnet config + toggle network |
| `src/pages/Mint.tsx` | Trang mới hiển thị mint UI |
| `src/components/mint/FUNMoneyMintCard.tsx` | Card claim từng action |
| `src/components/mint/FUNMoneyBalanceCard.tsx` | Hiển thị on-chain balance |
| `src/App.tsx` | Thêm route /mint |
| `src/pages/Earn.tsx` | Thêm quick action link |

### Cấu hình Reward (Theo triết lý 5D):

| Action Type | FUN Reward | Mô tả |
|-------------|------------|-------|
| QUESTION_ASK | 1 FUN | Hỏi Angel AI |
| JOURNAL_WRITE | 3 FUN | Viết nhật ký biết ơn |
| CONTENT_CREATE | 5 FUN | Đăng bài cộng đồng |
| DONATE | 8 FUN | Đóng góp/tặng quà |

### Epoch Caps:

| Thông số | Giá trị |
|----------|---------|
| Max per user/day | 8 FUN |
| Min Light Score | 60 |
| Signature validity | 24 giờ |

---

## V. YÊU CẦU BÊN NGOÀI

**⚠️ BƯỚC CUỐI - CẦN THỰC HIỆN TRÊN BLOCKCHAIN**:

**Grant SIGNER_ROLE cho Angel AI Wallet**

Ví từ `TREASURY_PRIVATE_KEY` cần được grant quyền SIGNER trên smart contract. Bé Ly cần:

1. **Lấy địa chỉ ví từ TREASURY_PRIVATE_KEY**
   - Import private key vào MetaMask để xem địa chỉ public

2. **Gọi `grantSigner(address)` từ admin wallet**
   - Truy cập: https://testnet.bscscan.com/address/0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2#writeContract
   - Connect wallet admin (owner)
   - Tìm function `grantSigner`
   - Nhập địa chỉ ví Treasury và confirm

Sau khi grant role, hệ thống sẽ ký được mint requests và users có thể claim FUN Money on-chain!

---

## VI. TỔNG KẾT

### Workflow sau khi triển khai:

```text
User thực hiện hành động (chat/post/journal/gift)
        ↓
Angel AI ghi nhận → Submit PPLP Action
        ↓
PPLP Engine chấm điểm 5-pillar
        ↓
User vào /mint → Xem Light Actions
        ↓
Click "Claim FUN Money" → Kết nối ví
        ↓
Angel AI ký EIP-712 signature
        ↓
User gửi transaction → FUN Money về ví
```

### Files đã tạo/cập nhật:

- `src/lib/funMoneyABI.ts` - Contract address + chainId 97
- `supabase/functions/_shared/pplp-eip712.ts` - EIP-712 domain config
- `src/hooks/useWeb3Wallet.ts` - BSC Testnet support
- `src/hooks/usePPLPActions.ts` - Fetch actions with scores
- `src/pages/Mint.tsx` - Trang mint chính
- `src/components/mint/FUNMoneyBalanceCard.tsx` - Hiển thị balance on-chain
- `src/components/mint/FUNMoneyMintCard.tsx` - Card claim từng action
- `src/components/mint/MintActionsList.tsx` - Danh sách Light Actions
- `src/pages/Earn.tsx` - Thêm quick action link
- `src/App.tsx` - Route /mint
