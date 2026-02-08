

# Hien thi chi tiet loi on-chain tren Mint Request Card

## Van de hien tai

Khi admin bam "Approve & Sign", backend co the ky thanh cong (EIP-712 signature) nhung giao dich on-chain (`lockWithPPLP`) that bai. Hien tai:
- Backend bat loi on-chain nhung **khong luu lai** ly do cu the
- Backend van tra ve `success: true` voi `on_chain_success: false` nhung frontend khong hien thi chi tiet
- 63 yeu cau bi ket o trang thai "signed" ma admin khong biet tai sao

## Giai phap

### 1. Them cot `on_chain_error` vao bang `pplp_mint_requests`
- Them cot `on_chain_error` (text, nullable) de luu ly do that bai cu the
- Vi du gia tri: `"ATTESTER_NOT_REGISTERED"`, `"ACTION_NOT_REGISTERED"`, `"INSUFFICIENT_GAS"`, `"RPC_FAILURE"`

### 2. Cap nhat Edge Function `pplp-authorize-mint`
- Phan loai loi on-chain thanh cac loai cu the:
  - `ATTESTER_NOT_REGISTERED`: Signer chua duoc dang ky lam Attester
  - `ACTION_NOT_REGISTERED`: Action type chua duoc dang ky tren contract
  - `INSUFFICIENT_GAS`: Khong du tBNB de tra gas
  - `CONTRACT_REVERT`: Hop dong tu choi giao dich
  - `RPC_FAILURE`: Khong ket noi duoc BSC Testnet
- Luu ma loi vao `on_chain_error` khi upsert mint request
- Tra ve `on_chain_error` va `on_chain_error_details` trong response JSON

### 3. Cap nhat Frontend `AdminMintApproval.tsx`

#### 3a. Them `on_chain_error` vao MintRequestRow interface
```text
on_chain_error: string | null
```

#### 3b. Them bang on-chain diagnostics panel tren moi card
Hien thi khi `status === "signed"` va `on_chain_error` co gia tri:

- Mau do + icon canh bao cho moi loai loi
- Thong tin cu the:
  - ATTESTER: "Signer [address] chua duoc dang ky Attester. guardianGov can goi govSetAttester()"
  - ACTION: "Action [name] chua dang ky on-chain. guardianGov can goi govRegisterAction()"
  - GAS: "Vi Treasury thieu tBNB. Can nap them gas."
  - CONTRACT_REVERT: Hien thi chi tiet revert reason
  - RPC: "Tat ca RPC BSC Testnet deu that bai"
- Nut "Copy lenh fix" de admin copy lenh Solidity can thuc hien

#### 3c. Cap nhat handler `handleApproveAndSign`
- Doc `on_chain_error` tu response va hien thi toast chi tiet thay vi toast chung chung
- Phan biet giua "ky thanh cong nhung on-chain that bai" va "ky thanh cong, on-chain thanh cong"

#### 3d. Them summary banner
- Hien thi tong quan loi: "X yeu cau bi loi Attester, Y yeu cau bi loi Action..."
- Giup admin nhanh chong biet van de chinh can xu ly

## Chi tiet ky thuat

### Database Migration
```text
ALTER TABLE pplp_mint_requests ADD COLUMN on_chain_error text DEFAULT NULL;
```

### Error Classification trong Edge Function
Tai block try-catch line 436-440, thay vi bat loi im lang:
1. Parse error message de phan loai
2. Luu vao `on_chain_error` truoc khi upsert
3. Them `on_chain_error` va `on_chain_error_details` vao response JSON

### Error Display Component
Tao component `OnChainErrorBanner` hien thi trong `MintRequestCard`:
- Icon + mau sac theo loai loi (do cho critical, vang cho warning)
- Mo ta van de bang tieng Viet
- Huong dan cu the cach fix (voi dia chi contract, ham can goi)
- Nut copy lenh fix

### Files can thay doi
1. `supabase/migrations/[timestamp].sql` - Them cot `on_chain_error`
2. `supabase/functions/pplp-authorize-mint/index.ts` - Phan loai va luu loi
3. `src/pages/AdminMintApproval.tsx` - Hien thi chi tiet loi tren moi card

