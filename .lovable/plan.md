

# Fix Web3 Gift: CAMLY Balance & Profile Wallet Lookup

## Problems Found

### 1. CAMLY Balance Always Shows 0
The wallet system connects to BSC Testnet (chain ID 97), but the CAMLY token contract lives on BSC Mainnet (chain ID 56). When the balance is fetched, it queries a non-existent contract on testnet, resulting in 0.

### 2. Cannot Find Recipient Wallet from Profile
The "Tu ho so" (From Profile) option in the crypto gift tab shows a search box but has no logic to look up the recipient's wallet address from the `user_wallet_addresses` database table (which already has data from many users).

---

## Solution

### Step 1: Fix CAMLY balance reading in `useWeb3Transfer.ts`
- Use a dedicated BSC **Mainnet** RPC provider (not the wallet's testnet provider) to read the CAMLY token balance
- This avoids the network mismatch: the wallet stays on testnet for FUN Money, while CAMLY balance is read from mainnet via a separate read-only provider
- For actual transfers, prompt the user to switch their wallet to BSC Mainnet temporarily

### Step 2: Add profile wallet lookup in `GiftCoinDialog.tsx`
- When user selects "Tu ho so" mode, enable user search (reuse existing search logic)
- When a user is selected, query the `user_wallet_addresses` table for their `wallet_address`
- If found: auto-fill the wallet address field and show the selected user info
- If not found: show a friendly message that the recipient hasn't registered a wallet yet

---

## Technical Details

### File: `src/hooks/useWeb3Transfer.ts`
- Add a BSC Mainnet RPC URL constant (`https://bsc-dataseed.binance.org/`)
- Modify `fetchCamlyBalance` to create a `JsonRpcProvider` pointing to mainnet instead of using the wallet's `BrowserProvider`
- Update `transferCamly` to check current chain and prompt switching to mainnet (chain ID 56) before executing the transfer
- Add `switchToMainnet` helper that calls `wallet_switchEthereumChain` with `0x38`

### File: `src/components/gifts/GiftCoinDialog.tsx`
- Add state for profile-based crypto recipient (`cryptoSelectedUser`)
- When `cryptoRecipient === "profile"`:
  - Show user search results (reuse `searchUsers` function)
  - On user selection, query `user_wallet_addresses` to get their BSC wallet
  - Auto-fill `walletAddress` state with the result
  - Show selected user avatar + name + wallet address
  - If no wallet found, display: "Nguoi nay chua dang ky vi Web3"
- Add a "Change" button to re-search

### No database changes needed
The `user_wallet_addresses` table already exists with the correct schema and data.

