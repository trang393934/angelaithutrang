
# Cap Nhat FUN MONEY v1.2.1 FINAL Vao Toan Bo He Thong Angel AI

## Tong Quan

Cap nhat ma nguon hop dong thong minh va **tat ca cac file lien quan** de dong bo voi ban FUN MONEY Production v1.2.1 (FINAL) da deploy tren BSC Testnet. Bao gom cap nhat EIP-712 domain, PPLP typehash, deploy script, ABI, va backend edge function.

## Cac Thay Doi Quan Trong Giua v1.0 (cu) va v1.2.1 (moi)

| Thanh phan | Phien ban cu (trong repo) | v1.2.1 FINAL |
|---|---|---|
| Contract class | `FUNMoney` (OpenZeppelin) | `FUNMoneyProductionV1_2_1` (standalone) |
| Flow mint | `mintWithSignature()` (1 buoc) | `lockWithPPLP()` -> `activate()` -> `claim()` (3 buoc) |
| EIP-712 Domain name | `"FUNMoney-PPLP"` | `"FUN Money"` |
| EIP-712 Version | `"1"` | `"1.2.1"` |
| Typehash | `MintRequest(address to, ...)` | `PureLoveProof(address user, bytes32 actionHash, ...)` |
| Quyen | AccessControl (ADMIN/SIGNER/GOVERNOR/PAUSER) | guardianGov + Attester system |
| Constructor | `(name, symbol, epochMintCap, userEpochCap, admin)` | `(gov, community, attesters[], threshold)` |

## Chi Tiet Cac File Can Thay Doi

### 1. `contracts/FUNMoney.sol` - Thay toan bo bang v1.2.1 FINAL
- Xoa toan bo code cu (OpenZeppelin-based)
- Thay bang code Solidity v1.2.1 FINAL ma nguoi dung cung cap
- Bao gom: Context, ERC20 standalone, EIP712 standalone, FUNMoneyProductionV1_2_1

### 2. `contracts/scripts/deploy.js` - Cap nhat deploy script
- Constructor moi: `(gov, community, attesters[], threshold)` thay vi `(name, symbol, epochMintCap, userEpochCap, admin)`
- Cap nhat contract factory name: `FUNMoneyProductionV1_2_1`
- Them buoc govRegisterAction cho cac action types

### 3. `contracts/README.md` - Cap nhat tai lieu
- Mo ta flow moi: Lock -> Activate -> Claim
- Constructor params moi
- EIP-712 domain moi: `("FUN Money", "1.2.1")`
- Typehash moi: `PureLoveProof`
- Roles moi: guardianGov, Attester system

### 4. `src/lib/funMoneyABI.ts` - Cap nhat EIP-712 Domain (CRITICAL)
- EIP-712 Domain: `name: "FUN Money"`, `version: "1.2.1"` (thay vi `"FUNMoney-PPLP"` / `"1"`)
- PPLP_LOCK_TYPES: Doi type name `PPLPLock` -> `PureLoveProof`, field `action` -> `actionHash`
- ABI da dung san, khong can doi

### 5. `supabase/functions/pplp-authorize-mint/index.ts` - Cap nhat backend signing (CRITICAL)
- PPLP_DOMAIN: `name: "FUN Money"`, `version: "1.2.1"`
- PPLP_LOCK_TYPES: `PureLoveProof` voi field `actionHash` thay vi `PPLPLock` voi field `action`
- Cap nhat message object khi signing: `actionHash` thay vi `action`

### 6. `supabase/functions/_shared/pplp-eip712.ts` - Cap nhat shared types
- PPLP_DOMAIN: `name: "FUN Money"`, `version: "1.2.1"`
- Giu lai cac legacy types de backward compatibility

### 7. `src/data/pplpKnowledgeTemplates.ts` - Cap nhat tai lieu knowledge
- Cap nhat EIP-712 Domain references: `"FUN Money"` / `"1.2.1"`
- Cap nhat TYPES tu `MintRequest` sang `PureLoveProof`
- Cap nhat code examples

### 8. `src/pages/docs/pplpEngineSpec.ts` - Cap nhat Engine Spec docs
- EIP-712 domain: `"FUN Money"` / `"1.2.1"`
- Types: `PureLoveProof`

## Chi Tiet Ky Thuat

### EIP-712 Domain Moi (Ap Dung Toan He Thong)

```text
{
  name: "FUN Money",
  version: "1.2.1",
  chainId: 97,
  verifyingContract: "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2"
}
```

### PPLP Typehash Moi

```text
PureLoveProof(
  address user,
  bytes32 actionHash,
  uint256 amount,
  bytes32 evidenceHash,
  uint256 nonce
)
```

### EIP-712 Types Object Moi (JavaScript/TypeScript)

```text
const PPLP_TYPES = {
  PureLoveProof: [
    { name: "user", type: "address" },
    { name: "actionHash", type: "bytes32" },
    { name: "amount", type: "uint256" },
    { name: "evidenceHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
  ]
};
```

### Message Object Khi Signing

```text
const message = {
  user: walletAddress,
  actionHash: keccak256(toUtf8Bytes(actionName)),
  amount: amountWei,
  evidenceHash: evidenceHash,
  nonce: onChainNonce,
};
```

## Tong Hop File Thay Doi

| File | Muc Do | Noi Dung |
|------|--------|----------|
| `contracts/FUNMoney.sol` | Thay toan bo | Code Solidity v1.2.1 FINAL |
| `contracts/scripts/deploy.js` | Thay toan bo | Constructor moi, setup attesters |
| `contracts/README.md` | Thay toan bo | Tai lieu v1.2.1 |
| `src/lib/funMoneyABI.ts` | Cap nhat domain + types | EIP-712 domain va PPLP types |
| `supabase/functions/pplp-authorize-mint/index.ts` | Cap nhat domain + types + signing | EIP-712 domain, types, message |
| `supabase/functions/_shared/pplp-eip712.ts` | Cap nhat domain | EIP-712 domain |
| `src/data/pplpKnowledgeTemplates.ts` | Cap nhat references | Domain + types trong docs |
| `src/pages/docs/pplpEngineSpec.ts` | Cap nhat references | Domain + types trong docs |

## Luu Y Quan Trong

- Contract address **KHONG DOI**: `0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2`
- Frontend hooks (`useFUNMoneyContract.ts`) va UI components **KHONG CAN DOI** vi chung da tuong thich voi flow Lock/Activate/Claim
- ABI trong `funMoneyABI.ts` da dung, chi can cap nhat EIP-712 domain va types
- Edge function `pplp-authorize-mint` se duoc deploy lai tu dong sau khi cap nhat
