
# Plan: Manual Web3 Donation Option with TX Hash Verification

## Overview
Add a "Manual Transfer" option to the Crypto donation tab allowing users to:
1. Copy Treasury wallet address to paste in any external wallet
2. After transfer, enter donation amount and transaction hash
3. System records the donation and updates Honor Board in real-time

## Current Flow Analysis
- `DonateProjectDialog.tsx` has two tabs: "Camly Coin" (internal) and "Chuyển Crypto" (Web3 connected)
- The Crypto tab currently requires wallet connection via MetaMask
- `project_donations` table stores: `id`, `donor_id`, `amount`, `message`, `created_at`
- `DonationHonorBoard` subscribes to real-time changes on `project_donations` table

## Proposed Solution

### 1. Database Migration
Add new columns to `project_donations` table:
- `donation_type` (text): "internal" | "crypto_connected" | "crypto_manual"
- `tx_hash` (text, nullable): Blockchain transaction hash for crypto donations
- `status` (text): "confirmed" | "pending_verification" - for admin verification of manual donations

### 2. UI Changes in DonateProjectDialog.tsx

**Enhance the Crypto Tab with 3 sub-modes:**
- **Mode A: Connected Wallet** (existing) - When wallet is connected, show current flow
- **Mode B: Manual Transfer** (new) - When wallet not connected, show:
  - Treasury address with prominent COPY button
  - After copy: Show amount input + TX hash input form
  - Confirm button to submit manual donation

**Flow:**
```
[User opens Crypto tab]
    |
    ├── If wallet connected → Show existing connected wallet flow
    |
    └── If wallet NOT connected → Show 2 options:
            1. "Connect Wallet" button (existing)
            2. "Manual Transfer" section with:
               - Treasury address + Copy button
               - After copy clicked: Show form with:
                   - Amount input
                   - TX Hash input (optional but recommended)
                   - Confirm button
```

### 3. Edge Function Updates

**Create `process-manual-donation/index.ts`:**
- Records manual crypto donations to `project_donations` with `donation_type = 'crypto_manual'`
- Updates `project_fund` balance
- Updates user's PoPL score
- Triggers real-time update on Honor Board
- Stores TX hash for admin verification (optional)

### 4. Translation Keys (12 languages)
Add new keys:
- `crypto.manualTransfer` - "Transfer Manually"
- `crypto.manualTransferDesc` - "Copy address and transfer from any wallet"
- `crypto.copyAddress` - "Copy Address"  
- `crypto.addressCopied` - "Address copied!"
- `crypto.afterTransfer` - "After transferring, confirm your donation:"
- `crypto.txHash` - "Transaction Hash"
- `crypto.txHashOptional` - "Optional - helps verify your donation"
- `crypto.confirmManualDonate` - "Confirm Manual Donation"
- `crypto.manualDonateSuccess` - "Thank you! Your donation has been recorded."

### 5. Honor Board Real-time Update
The existing real-time subscription in `useCoinGifts.ts` already listens to `project_donations` changes, so the Honor Board will auto-update when a manual donation is inserted.

---

## Technical Implementation Details

### File Changes

1. **Database Migration** (1 file)
   - Add `donation_type`, `tx_hash`, `status` columns to `project_donations`

2. **Edge Function** (1 new file)
   - `supabase/functions/process-manual-donation/index.ts`

3. **Component Updates** (1 file)
   - `src/components/gifts/DonateProjectDialog.tsx`
   - Add manual transfer UI with copy functionality
   - Add form for amount + tx_hash after copy

4. **Translation Files** (12 files)
   - `src/translations/en.ts`
   - `src/translations/vi.ts`
   - (and 10 other language files)

5. **Config Update** (1 file)
   - `supabase/config.toml` - Register new edge function

### UI/UX Flow Diagram
```text
┌─────────────────────────────────────────┐
│           Crypto Tab                    │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  Treasury Address                   │ │
│ │  0x02D557...0D  [📋 Copy]          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Option 1: Connect Wallet            │ │
│ │  [🔗 Kết nối ví]                   │ │
│ │                                     │ │
│ │ ───────── OR ─────────              │ │
│ │                                     │ │
│ │ Option 2: Manual Transfer           │ │
│ │  (After copying address above)      │ │
│ │                                     │ │
│ │  Amount: [________] CAMLY           │ │
│ │  TX Hash: [________________]        │ │
│ │           (optional)                │ │
│ │                                     │ │
│ │  [❤️ Xác nhận donate]              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Security Considerations
- Manual donations are recorded with `status: 'pending_verification'` initially
- Admin can verify TX hash on BSCScan if provided
- PoPL score still updates to reward user for their contribution intent
- No balance deduction from internal system (this is external crypto only)
