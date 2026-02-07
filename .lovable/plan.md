
# Fix: Web3 Gift Transactions Not Saved to Database

## Root Cause

The database insert in `GiftCoinDialog.tsx` (line 263) fails **silently**. The Supabase JavaScript client does NOT throw errors -- it returns them in the response object `{ data, error }`. The current code wraps the call in `try/catch`, which only catches thrown exceptions. This means any database error (RLS, constraint violation, etc.) is completely invisible.

```text
Current (broken):
  try {
    await supabase.from("coin_gifts").insert({...});
    // error is NEVER checked!
  } catch (dbErr) {
    // This NEVER fires because Supabase doesn't throw
  }

Fixed:
  const { error } = await supabase.from("coin_gifts").insert({...});
  if (error) {
    console.error("DB error:", error);
    toast.error("...");
  }
```

## Changes

### File: `src/components/gifts/GiftCoinDialog.tsx`

1. **Fix the silent error** -- Destructure `{ error }` from the Supabase insert and handle it properly:
   - Log the full error for debugging
   - Show a toast warning to the user ("Transaction succeeded on-chain but failed to record in history")
   - Still show the TX hash in the success UI so the user can verify on BSCScan

2. **Add a retry mechanism** -- If the first insert fails, wait 2 seconds and retry once. The blockchain transaction already succeeded, so we should try harder to record it.

3. **Add TX hash display after success** -- After a successful Web3 transfer, show the TX hash with a BSCScan link directly in the dialog (before it auto-closes) so users have immediate confirmation even if the DB write fails.

### File: `src/hooks/useWeb3Transfer.ts`

4. **Verify `receipt.hash` format** -- Add a console log to confirm the transaction hash is being returned correctly from ethers v6. The `receipt.hash` should be a `0x...` prefixed hex string.

### File: `src/components/community/Web3TransactionHistory.tsx`

5. **No changes needed** -- The component's query logic is correct (filters by `tx_hash IS NOT NULL`). Once the DB insert is fixed, transactions will appear automatically via the existing Realtime subscription.

## Technical Details

- The `coin_gifts` table schema already supports `tx_hash` (text, nullable) and `gift_type` (text, default 'internal')
- RLS policy allows INSERT where `auth.uid() = sender_id` -- this should match since we set `sender_id: user!.id`
- The fix is primarily about proper error handling, not schema or policy changes
- No database migration needed
