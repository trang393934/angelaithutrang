
# Plan: Manual Web3 Donation Option with TX Hash Verification

## ✅ COMPLETED

### Overview
Added a "Manual Transfer" option to the Crypto donation tab allowing users to:
1. Copy Treasury wallet address to paste in any external wallet
2. After transfer, enter donation amount and transaction hash
3. System records the donation and updates Honor Board in real-time

### Implementation Summary

#### 1. Database Migration ✅
Added new columns to `project_donations` table:
- `donation_type` (text): "internal" | "crypto_connected" | "crypto_manual"
- `tx_hash` (text, nullable): Blockchain transaction hash for crypto donations
- `status` (text): "confirmed" | "pending_verification"

#### 2. Edge Function ✅
Created `supabase/functions/process-manual-donation/index.ts`:
- Records manual crypto donations with `donation_type = 'crypto_manual'`
- Updates `project_fund` balance via RPC
- Updates user's PoPL score
- Sends thank-you healing message
- Triggers real-time Honor Board update

#### 3. UI Changes ✅
Updated `DonateProjectDialog.tsx`:
- Treasury address always visible with Copy button
- Connected wallet flow (existing)
- Manual transfer section with amount + TX hash form
- Heart animation on success

#### 4. Translations ✅
Added crypto manual transfer keys to all 12 language files:
- en, vi, de, fr, es, pt, ru, ko, ja, zh, ar, hi

#### 5. Config Update ✅
Registered `process-manual-donation` in `supabase/config.toml`

### User Flow
1. User opens Donate dialog → Crypto tab
2. Sees Treasury address with Copy button
3. If wallet connected: Use direct transfer flow
4. If not connected: Copy address → Transfer externally → Enter amount + TX hash → Confirm
5. Donation recorded, Honor Board updates in real-time

### Security
- Manual donations recorded with `status: 'pending_verification'` when TX hash provided
- Admin can verify on BSCScan
- PoPL score rewards participation intent
