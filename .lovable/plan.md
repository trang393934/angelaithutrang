
## Fix: Wallet Connection in Preview/Iframe Environment

### Root Cause Analysis

The error originates from MetaMask's own `inpage.js` extension script -- NOT from our application code. The global error handler in `main.tsx` successfully catches it (confirmed by console logs showing `[Angel AI] Wallet extension rejection caught`), but two issues persist:

1. **Auto-reconnect fires in iframe**: When `wallet_connected` is saved in localStorage, the auto-reconnect logic runs on every page load. Inside the Lovable preview iframe, MetaMask cannot complete the connection, causing repeated "Failed to connect" errors.
2. **Manual connect also fails in iframe**: When the user clicks "Connect Wallet" inside the preview iframe, MetaMask's provider exists (injected by `inpage.js`) but cannot open the popup window, leading to the same error.

### Solution (3 files)

**1. `src/hooks/useWeb3Wallet.ts` -- Add iframe detection + smarter auto-reconnect**

- Add a utility function `isInIframe()` that checks `window.self !== window.top`
- In the auto-reconnect `useEffect`:
  - If running in an iframe, skip auto-reconnect entirely and clear `wallet_connected` from localStorage
  - This prevents the repeated "Failed to connect" errors on every page load
- In the `connect()` function:
  - If running in an iframe, set a user-friendly error message ("Please open the site in a new tab to connect your wallet") and return early instead of attempting a connection that will fail
  - This gives the user clear guidance instead of a cryptic error

**2. `src/components/Web3WalletButton.tsx` -- Show helpful toast in iframe**

- Update `handleConnect` to check for iframe environment before calling `connect()`
- If in an iframe, show a toast notification suggesting the user open the app in a new tab/window
- Optionally provide a button to open the published URL in a new tab

**3. `src/main.tsx` -- Harden global handler (minor)**

- Clear `wallet_connected` from localStorage when catching MetaMask wallet errors to prevent the auto-reconnect from firing on the next page load
- This is a safety net to ensure stale connection state doesn't accumulate

### Technical Details

```text
File Changes:
+-------------------------------------+-------------------------------------------+
| File                                | Change                                    |
+-------------------------------------+-------------------------------------------+
| src/hooks/useWeb3Wallet.ts          | Add isInIframe() guard for auto-reconnect |
|                                     | and connect(). Skip silently in iframe.   |
+-------------------------------------+-------------------------------------------+
| src/components/Web3WalletButton.tsx | Show toast with guidance when user tries   |
|                                     | to connect inside iframe preview.         |
+-------------------------------------+-------------------------------------------+
| src/main.tsx                        | Clear wallet_connected localStorage when  |
|                                     | catching MetaMask rejection errors.       |
+-------------------------------------+-------------------------------------------+
```

### Expected Result

| Scenario | Before | After |
|----------|--------|-------|
| Page load in preview iframe | Auto-reconnect fires, MetaMask throws, error logged | Auto-reconnect skipped, no error |
| Click "Connect" in iframe | MetaMask throws, blank screen risk | Toast: "Please open in new tab" |
| Page load on published URL | Works normally | Works normally (no change) |
| Click "Connect" on published URL | Works normally | Works normally (no change) |

### No Database Changes Required

This fix is purely frontend logic -- no migrations, no edge function changes needed.
