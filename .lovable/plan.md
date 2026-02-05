
## What’s actually happening (root cause)
From the latest browser console logs, even **simple read-only calls** like `mintingEnabled()` and `isActionMinted()` are reverting with:

- `execution reverted (no data present; likely require(false)...)`

In our Solidity contract (`contracts/FUNMoney.sol`), those getters are auto-generated/public and **cannot revert**. So when they revert, it means:

1) The wallet provider is **not actually talking to the real BSC Testnet chain**, even if the UI thinks chainId is 97, **or**
2) The wallet is on a chain where `0x1aa8...` is **not the FUNMoney contract** (different code / fallback reverts), which is consistent with “require(false) with no data”.

Additionally, backend logs show `BSC_RPC_URL` calls returning `"0x"` (cannot decode result), which strongly suggests the backend RPC is also pointing to the wrong network (often mainnet), or is not reaching a proper BSC testnet node.

So the mint flow can never work reliably until:
- The frontend verifies the wallet is on the real BSC Testnet (not just “chainId says 97”), and
- The backend uses a correct BSC Testnet RPC.

---

## Goals of this fix
1) Stop showing the misleading “contract/ABI or wrong network” error by adding **real diagnostics**.
2) Make the app **self-correct** network issues:
   - Detect if wallet RPC/network is wrong.
   - Provide a one-click “Reset BSC Testnet network” action.
3) Ensure backend nonce-reading uses a **known-good BSC Testnet RPC** and fails loudly if not reachable.

---

## Step-by-step implementation plan

### A) Frontend: make network detection reliable (not just “chainId state”)
**Files**
- `src/hooks/useWeb3Wallet.ts`
- `src/hooks/useFUNMoneyContract.ts`
- `src/components/mint/FUNMoneyMintCard.tsx`
- (optional UI) `src/components/mint/FUNMoneyBalanceCard.tsx`

**Changes**
1) **Fix `useWeb3Wallet.connect()` to always re-read chainId after switching**
   - Current logic sets `chainId: 97` in state even if the underlying provider situation is inconsistent.
   - Update flow:
     - Read `eth_chainId`
     - If not 97: switch network
     - Read `eth_chainId` again and store the real value

2) **Add a “real BSC Testnet sanity check”**
   In `useFUNMoneyContract` (and/or wallet hook), add:
   - `provider.getBlockNumber()` and compare against an expected minimum threshold for BSC testnet (currently ~88M+ per BscScan).
   - If block number is far too low (e.g., < 10,000,000), show a clear error:
     - “Bạn đang dùng RPC/Network không phải BSC Testnet thật. Hãy reset network trong ví.”

3) **Contract code check before any contract reads**
   Before calling `mintingEnabled()`, `isActionMinted()`, etc:
   - `const code = await provider.getCode(contractAddress)`
   - If `code === "0x"` → show “Contract chưa được deploy trên network này”
   - If `code !== "0x"` but calls still revert → show “Network RPC đang trỏ sai chain hoặc contract address không khớp trên network hiện tại”

4) **Unify wallet usage to avoid double-hook drift**
   `FUNMoneyMintCard.tsx` currently uses `useWeb3Wallet()` and `useFUNMoneyContract()` at the same time (two separate states).
   - Refactor so `FUNMoneyMintCard` uses wallet state/actions returned from `useFUNMoneyContract` (e.g., `connect`, `isConnected`, `address`) and remove its direct `useWeb3Wallet` usage.
   - This reduces inconsistent state (one hook thinks connected, the other doesn’t / wrong chainId).

5) **Add a “Reset BSC Testnet” button in the mint UI when sanity check fails**
   - Add a button that runs a helper:
     - `wallet_addEthereumChain` with **multiple** known RPC URLs (not just one)
     - then `wallet_switchEthereumChain`
   - Even if MetaMask won’t always overwrite an existing network’s RPC, this gives the user a guided recovery path.

**User-visible result**
- Instead of a generic red error, the UI will explain exactly:
  - “Bạn đang ở sai chain” vs
  - “RPC của BSC Testnet trong ví đang sai” vs
  - “Contract không tồn tại trên chain hiện tại”.

---

### B) Backend: make on-chain nonce fetch deterministic (and stop silently falling back to nonce=0)
**File**
- `supabase/functions/pplp-authorize-mint/index.ts`

**Changes**
1) Replace “best effort” RPC usage with a **validated RPC selection**
   - Build a small list of BSC Testnet RPC endpoints inside the function (fallback list).
   - Try in order:
     - Create provider
     - `await provider.getNetwork()` must be chainId 97
     - `await provider.getCode(PPLP_DOMAIN.verifyingContract)` must be non-`0x`
     - Then call `getNonce()`
   - If all fail: return a **clear 503** with message:
     - “Backend cannot reach BSC Testnet RPC. Please try again later.”

2) Keep current idempotency, but ensure nonce mismatch invalidation still works
   - If existing mint request is signed but nonce differs from on-chain → expire and re-sign.

3) Apply best practice: replace `.single()` with `.maybeSingle()` for `pplp_mint_requests`
   - Prevents edge cases when no row exists from becoming an error path.

**Result**
- Backend always signs using a nonce from a confirmed BSC Testnet RPC.
- If backend cannot confirm chain 97 + correct contract bytecode, it won’t produce signatures that are “valid-looking but unusable”.

---

### C) End-to-end test plan (what we’ll verify after implementation)
1) Open `/mint`, connect wallet.
2) Verify “contract info” loads:
   - `name/symbol/balance/mintingEnabled` no longer throw `require(false)`.
3) Click “Mint lên blockchain (tùy chọn)”
   - Preflight checks pass
   - `staticCall` either succeeds or returns a decoded custom error (InvalidSigner, RequestExpired, etc.)
4) Confirm MetaMask tx → success.
5) `pplp_mint_requests` updates to `minted` with `tx_hash`.

---

## Why this plan should fix your exact screenshot
Your screenshot’s red error is the fallback for “missing revert data / require(false)”.
We now know the **same require(false happens for basic read calls** (mintingEnabled/isActionMinted), so the issue is upstream of EIP-712/nonces: it’s a network/provider mismatch.

This plan fixes that by:
- Detecting the mismatch deterministically,
- Guiding the wallet to a known-good RPC/network configuration,
- Preventing backend from using an RPC that returns empty results.

---

## Scope / tradeoffs
- This avoids deploying a new on-chain contract (not needed).
- Most work is improved network correctness + diagnostics; once reads work, your custom error decoding will also start working (because revert data will exist when the real contract is called).
