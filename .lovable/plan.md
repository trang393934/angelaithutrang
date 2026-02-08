

# Fix: Allow Users to Create Mint Requests

## Problem
The "Request Mint FUN" button fails with error "Khong the tao yeu cau mint" because the `pplp_mint_requests` table is missing an INSERT RLS policy for authenticated users. Currently only `service_role` (backend functions) can insert records.

## Root Cause
The table has only 2 RLS policies:
- `Service role manages mint requests` (ALL for service_role)
- `Users can view own mint requests` (SELECT for own records)

Missing: INSERT policy for users to create their own mint requests.

## Solution
Add an RLS policy that allows authenticated users to INSERT mint requests where `actor_id` matches their user ID. This is safe because the `useMintRequest` hook already validates the action ownership and score before attempting the insert.

## Technical Details

### 1. Database Migration
Add a new RLS policy on `pplp_mint_requests`:

```text
Policy: "Users can create own mint requests"
Command: INSERT
Check: auth.uid() = actor_id
```

This ensures users can only create mint requests for their own actions (actor_id must match their auth user ID).

### 2. Optional: Add UPDATE policy for users
Allow users to update their OWN pending mint requests (e.g., to change wallet address before admin approval):

```text
Policy: "Users can update own pending mint requests"
Command: UPDATE
Using: auth.uid() = actor_id AND status = 'pending'
Check: auth.uid() = actor_id AND status = 'pending'
```

This restricts updates to only pending requests -- once an admin has signed or minted, users cannot modify the record.

### 3. No code changes needed
The existing `useMintRequest.ts` hook already correctly sets `actor_id: user.id` and validates the action before inserting. The only missing piece is the database-level permission.

### Files affected
- Database migration only (no code file changes)

