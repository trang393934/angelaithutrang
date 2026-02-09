

## Plan: Fix Celebration Receipt + Add Token Selector & Message Templates

### Problem Analysis

1. **Wrong coin label in celebration**: `TipCelebrationReceipt` hardcodes "Camly Coin" on line 258 and uses `camlyCoinLogo` everywhere, even when the user transferred FUN Money.
2. **No token type passed to receipt**: `handleCryptoSuccess` in `GiftCoinDialog` passes `tokenSymbol` in the message field but doesn't propagate it to the receipt component for display purposes.
3. **No dynamic token selector**: Currently the dialog uses fixed 3 tabs (Camly, CAMLY Web3, FUN Money) rather than reading actual wallet balances.
4. **No message input for Web3 transfers**: The `CryptoTransferTab` component has no message/note field, unlike the internal Camly tab.

---

### Changes Required

#### File 1: `src/components/gifts/TipCelebrationReceipt.tsx`

- Add `tokenType` field to `TipReceiptData` interface: `tokenType?: "camly" | "camly_web3" | "fun_money" | "internal"`
- Dynamically select coin logo based on `tokenType`:
  - `"internal"` or `"camly"` -> `camly-coin-logo.png` + label "Camly Coin"
  - `"camly_web3"` -> `camly-coin-logo.png` + label "CAMLY"
  - `"fun_money"` -> `fun-money-logo.png` + label "FUN Money"
- Update the falling coin animation to use the correct logo
- Update the amount display area (line 254-259) to show correct token name and logo
- Update the BscScan link to use correct explorer URL (mainnet vs testnet) based on `tokenType`
- Add message template suggestions in the display (pre-filled messages like "Chuc mung ban!", "Cam on ban!")

#### File 2: `src/components/gifts/GiftCoinDialog.tsx`

- Pass `tokenType` in `celebrationData` for all three flows:
  - Internal Camly: `tokenType: "internal"`
  - CAMLY Web3: `tokenType: "camly_web3"`
  - FUN Money: `tokenType: "fun_money"`
- Update `handleCryptoSuccess` to accept and forward `tokenType`

#### File 3: `src/components/gifts/CryptoTransferTab.tsx`

- Add a message input field with template suggestions:
  - Template messages: "Chuc mung ban!", "Cam on ban rat nhieu!", "Yeu thuong gui ban!", "Tang ban mon qua nho!", custom input
  - Quick-select chips + free text input
- Add a dropdown/select for other ERC-20 tokens found in the sender's wallet:
  - On wallet connect, scan for known token contracts (CAMLY, FUN, and a configurable list of popular BSC tokens)
  - Display token balances in a dropdown selector
  - When user selects a different token, update the transfer logic accordingly
- Pass the message through to the `onSuccess` callback so it reaches the celebration receipt

---

### Technical Details

#### Token Detection Logic (new utility)

When the wallet is connected, the system will attempt to read balances of known tokens using their contract addresses via `balanceOf()`. Tokens with balance > 0 will appear in a dropdown above the amount input. The list of known tokens includes:
- CAMLY (BSC Mainnet, 0x0910...)
- FUN Money (BSC Testnet, contract from funMoneyABI)
- BNB/tBNB (native balance via `provider.getBalance()`)

This will be implemented as a lightweight scan within the existing `CryptoTransferTab`, not a full token indexer.

#### Message Templates

Pre-defined message chips:
- "Chuc mung ban! 🎉"
- "Cam on ban rat nhieu! 💚"
- "Yeu thuong gui ban! 💕"
- "Tang ban mon qua nho! 🎁"
- "FUN cung nhau! 🌟"
- Custom text input

#### Updated TipReceiptData Interface

```typescript
interface TipReceiptData {
  // ...existing fields...
  tokenType?: "internal" | "camly_web3" | "fun_money";
  tokenSymbol?: string;
  explorerUrl?: string;
}
```

#### Celebration Receipt Dynamic Display

```text
Token: FUN Money -> logo: fun-money-logo.png, label: "FUN Money", explorer: testnet.bscscan.com
Token: CAMLY     -> logo: camly-coin-logo.png, label: "CAMLY", explorer: bscscan.com
Token: internal  -> logo: camly-coin-logo.png, label: "Camly Coin", explorer: none (no tx_hash)
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/gifts/TipCelebrationReceipt.tsx` | Add tokenType-aware logo/label/explorer, message display |
| `src/components/gifts/GiftCoinDialog.tsx` | Pass tokenType + explorerUrl in celebrationData |
| `src/components/gifts/CryptoTransferTab.tsx` | Add message input with templates, token dropdown, pass message to onSuccess |

### Expected Results

1. When sending FUN Money -> celebration shows FUN Money logo + "FUN Money" label + testnet.bscscan.com link
2. When sending CAMLY -> celebration shows CAMLY logo + "CAMLY" label + bscscan.com link
3. When sending internal Camly Coin -> celebration shows Camly Coin logo + "Camly Coin" label
4. Users can write/select a message before sending Web3 transfers
5. Users can see other available tokens in their wallet and select them

