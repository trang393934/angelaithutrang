

# Plan: Fix and Improve Transaction History Display

## Current Status

After thorough investigation, the transaction history page is technically loading data correctly (612 transactions from 4 tables). However, there are several issues that could cause "missing" or "not updating" behavior:

## Issues Found

### Issue 1: Wallet addresses not loading for non-logged-in users
The `user_wallet_addresses` table requires authentication (`auth.uid() IS NOT NULL`) for SELECT. When users are not logged in, wallet addresses return empty, which may make the page look incomplete.

**Fix**: The page should still work without wallets. No change needed unless we want public wallet visibility.

### Issue 2: No automated BSCScan sync (Cron Job missing)
The `sync-bscscan-gifts` function only runs:
- Manually when admin clicks the sync button
- Once per day when an admin visits the Activity History page (auto-sync via localStorage)

New on-chain transactions are NOT being synced automatically in the background.

**Fix**: Set up a `pg_cron` job to call `sync-bscscan-gifts` daily at 2:00 AM UTC.

### Issue 3: `record-gift` edge function has UUID type error
Logs show: `"invalid input syntax for type uuid"` when trying to insert a tx_hash as a UUID field. This means some Web3 gift records are failing to save.

**Fix**: Investigate and fix the `record-gift` function to handle tx_hash correctly (it should be stored as TEXT, not UUID).

### Issue 4: FUN Money contract not in BSCScan sync
The `sync-bscscan-gifts` function only scans CAMLY and USDT contracts. FUN Money transactions from blockchain are not being synced.

**Fix**: Add the FUN Money contract address to `TOKEN_CONTRACTS` in `sync-bscscan-gifts`.

## Implementation Steps

### Step 1: Fix `record-gift` edge function
- Review and fix the UUID type mismatch error
- Ensure `tx_hash` is stored as TEXT, not attempted as UUID

### Step 2: Add FUN Money contract to BSCScan sync
- Update `supabase/functions/sync-bscscan-gifts/index.ts`
- Add FUN Money contract: `{ address: "<FUN_CONTRACT>", giftType: "web3_FUN" }`

### Step 3: Set up automated daily Cron Job
- Enable `pg_cron` and `pg_net` extensions (if not already)
- Create a cron schedule to call `sync-bscscan-gifts` every day at 2:00 AM UTC
- This ensures new blockchain transactions are always synced without admin intervention

### Step 4: Verify frontend display
- Confirm all 4 data sources render correctly
- Ensure realtime subscriptions are working for live updates
- Test with both authenticated and unauthenticated users

## Technical Details

### Cron Job SQL (to be run via SQL editor)

```text
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily sync at 2:00 AM UTC
SELECT cron.schedule(
  'sync-bscscan-daily',
  '0 2 * * *',
  $$ SELECT net.http_post(
    url := 'https://ssjoetiitctqzapymtzl.supabase.co/functions/v1/sync-bscscan-gifts',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);
```

### record-gift fix
The error `invalid input syntax for type uuid: "0x8ffa..."` indicates the function is trying to insert a blockchain tx_hash (hex string) into a UUID column. Need to review the `record-gift` function and fix the column mapping.

### sync-bscscan-gifts update
Add to `TOKEN_CONTRACTS`:
```text
FUN: {
  address: "<FUN_Money_contract_address>",
  giftType: "web3_FUN"
}
```

## Expected Outcome
- All historical and new transactions display correctly
- Blockchain transactions sync automatically every day
- No more UUID errors when recording Web3 gifts
- FUN Money on-chain transfers are captured alongside CAMLY and USDT

