

# Plan: API Key Management System for Angel AI

## Overview
Build a complete API Key management system allowing users to create personal API keys to access Angel AI from external applications, with usage tracking, rate limiting, and key management.

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    API Key Management System                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐    ┌───────────────────────────────────┐ │
│  │   User Settings   │    │      External Application         │ │
│  │     (Profile)     │    │                                   │ │
│  │                   │    │  fetch('angel-chat', {            │ │
│  │  [Create API Key] │    │    headers: {                     │ │
│  │                   │    │      'x-api-key': 'ak_xxx...'     │ │
│  │  ┌─────────────┐  │    │    }                              │ │
│  │  │ ak_abc...   │  │    │  })                               │ │
│  │  │ Created: ... │  │    │                                   │ │
│  │  │ [Copy][Del] │  │    └───────────┬───────────────────────┘ │
│  │  └─────────────┘  │                │                         │
│  │                   │                ▼                         │
│  │  ┌─────────────┐  │    ┌───────────────────────────────────┐ │
│  │  │ ak_xyz...   │  │    │     Edge Function (angel-chat)    │ │
│  │  │ Last: 2h ago│  │───▶│                                   │ │
│  │  │ [Copy][Del] │  │    │  1. Validate API Key              │ │
│  │  └─────────────┘  │    │  2. Check Rate Limit              │ │
│  │                   │    │  3. Process Request               │ │
│  └───────────────────┘    │  4. Track Usage                   │ │
│                           │  5. Return Response               │ │
│                           └───────────────────────────────────┘ │
│                                       │                         │
│                                       ▼                         │
│                           ┌───────────────────────────────────┐ │
│                           │         Database Tables           │ │
│                           │                                   │ │
│                           │  • user_api_keys                  │ │
│                           │  • api_key_usage                  │ │
│                           └───────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema

### Table 1: `user_api_keys`
Stores API keys for each user.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner of the key |
| key_hash | text | SHA-256 hash of API key (never store plain key) |
| key_prefix | text | First 8 chars for display (e.g., "ak_abc123") |
| name | text | User-friendly label |
| created_at | timestamp | Creation date |
| last_used_at | timestamp | Last API call time |
| expires_at | timestamp | Expiration date (optional) |
| is_active | boolean | Enable/disable without deleting |
| daily_limit | integer | Max requests per day (default: 100) |
| total_requests | bigint | Lifetime request count |

### Table 2: `api_key_usage`
Tracks daily usage per key for rate limiting.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| api_key_id | uuid | Reference to user_api_keys |
| usage_date | date | Date of usage |
| request_count | integer | Number of requests that day |
| tokens_used | bigint | Total AI tokens consumed |

### RLS Policies
- Users can only view/manage their own API keys
- API key hashes are never exposed to client
- Usage data is read-only for users

---

## Phase 2: API Key Generation & Validation

### Key Format
```text
ak_[user_id_prefix]_[random_32_chars]
Example: ak_abc12_x9Kj2mNp4qRs6tUv8wYz0aBC3dEf
```

### Security Flow
```text
1. User clicks "Create API Key"
       │
       ▼
2. Frontend calls Edge Function: create-api-key
       │
       ▼
3. Edge Function generates secure random key
       │
       ▼
4. Hash key with SHA-256, store hash in DB
       │
       ▼
5. Return PLAIN key to user ONCE (never stored)
       │
       ▼
6. User copies key - cannot be retrieved again
```

---

## Phase 3: Edge Functions

### 3.1 `create-api-key` (New)
- Authenticates user via JWT
- Generates cryptographically secure API key
- Stores hashed key in database
- Returns plain key (one-time display)
- Limits: Max 5 active keys per user

### 3.2 `validate-api-key` (New)
- Internal helper function
- Takes API key, returns user_id if valid
- Updates last_used_at timestamp
- Checks rate limits

### 3.3 `angel-chat` (Update)
Add API key authentication as alternative to JWT:

```typescript
// Current: JWT only
const token = authHeader.replace('Bearer ', '');
const { data } = await supabase.auth.getClaims(token);

// New: Support both JWT and API Key
const apiKey = req.headers.get('x-api-key');
if (apiKey) {
  // Validate API key, get user_id
  const userId = await validateApiKey(apiKey);
  // Continue with userId
} else {
  // Existing JWT flow
}
```

---

## Phase 4: User Interface

### Location: Profile Page → New "API Keys" Section

```text
┌────────────────────────────────────────────────────────────┐
│  🔑 API Keys                                               │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│  Access Angel AI from external applications                │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📌 My Website Bot                                   │  │
│  │  ak_abc123...  •  Created: 2026-02-01               │  │
│  │  Last used: 2 hours ago  •  Today: 45/100 requests   │  │
│  │                                                      │  │
│  │  [📋 Copy Key ID]  [🗑️ Delete]  [⏸️ Disable]        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📌 Mobile App                                       │  │
│  │  ak_xyz789...  •  Created: 2026-01-15               │  │
│  │  Last used: 5 days ago  •  Today: 0/100 requests     │  │
│  │                                                      │  │
│  │  [📋 Copy Key ID]  [🗑️ Delete]  [⏸️ Disable]        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [+ Create New API Key]                                    │
│                                                            │
│  ℹ️ API keys allow external apps to use Angel AI.          │
│     Keep your keys secure - never share them publicly.     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Create Key Modal
```text
┌────────────────────────────────────────────────────────────┐
│  🔑 Create New API Key                                     │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│  Name (for your reference):                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  My Website Chatbot                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Daily Request Limit:                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  100  ▼                                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [Cancel]                              [Create API Key]    │
└────────────────────────────────────────────────────────────┘
```

### Key Created Success Modal
```text
┌────────────────────────────────────────────────────────────┐
│  ✅ API Key Created Successfully!                          │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│  ⚠️ IMPORTANT: Copy this key now!                          │
│     You won't be able to see it again.                     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ak_abc12_x9Kj2mNp4qRs6tUv8wYz0aBC3dEf5gHi6jK      │  │
│  │                                        [📋 Copy]    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Usage Example:                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  fetch('https://...angel-chat', {                   │  │
│  │    method: 'POST',                                   │  │
│  │    headers: {                                        │  │
│  │      'x-api-key': 'YOUR_API_KEY',                   │  │
│  │      'Content-Type': 'application/json'              │  │
│  │    },                                                │  │
│  │    body: JSON.stringify({ message: 'Hello' })        │  │
│  │  })                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│                                [I've Copied My Key - Done] │
└────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Translation Keys (12 Languages)

New keys to add:
- `apiKeys.title` - "API Keys"
- `apiKeys.description` - "Access Angel AI from external applications"
- `apiKeys.createNew` - "Create New API Key"
- `apiKeys.name` - "Key Name"
- `apiKeys.namePlaceholder` - "My Website Chatbot"
- `apiKeys.dailyLimit` - "Daily Request Limit"
- `apiKeys.created` - "Created"
- `apiKeys.lastUsed` - "Last used"
- `apiKeys.never` - "Never"
- `apiKeys.todayUsage` - "Today: {used}/{limit} requests"
- `apiKeys.copy` - "Copy"
- `apiKeys.delete` - "Delete"
- `apiKeys.disable` - "Disable"
- `apiKeys.enable` - "Enable"
- `apiKeys.createSuccess` - "API Key Created Successfully!"
- `apiKeys.copyWarning` - "Copy this key now! You won't be able to see it again."
- `apiKeys.copied` - "Key copied!"
- `apiKeys.deleteConfirm` - "Are you sure you want to delete this API key?"
- `apiKeys.maxKeysReached` - "Maximum 5 API keys allowed"
- `apiKeys.securityNote` - "Keep your keys secure - never share them publicly."

---

## Phase 6: Security Measures

### Rate Limiting
- Default: 100 requests/day per key
- Configurable per key (50, 100, 200, 500)
- Shared with user's normal usage limits

### Key Security
- Keys are hashed (SHA-256) before storage
- Plain keys shown only once at creation
- Keys can be disabled without deletion
- Automatic expiration option (30, 60, 90 days)

### Abuse Prevention
- Max 5 active keys per user
- Keys inherit user's suspension status
- Admin can view/revoke keys
- Logging for audit trail

---

## Implementation Files

### New Files (6)
1. `supabase/migrations/xxx_create_api_keys_tables.sql`
2. `supabase/functions/create-api-key/index.ts`
3. `supabase/functions/delete-api-key/index.ts`
4. `src/components/profile/ApiKeysSection.tsx`
5. `src/components/profile/CreateApiKeyDialog.tsx`
6. `src/hooks/useApiKeys.ts`

### Modified Files (14)
1. `supabase/config.toml` - Register new functions
2. `supabase/functions/angel-chat/index.ts` - Add API key auth
3. `src/pages/Profile.tsx` - Add API Keys section
4. Translation files (12 files) - Add new keys

---

## Technical Notes

### API Key Authentication in Edge Functions

```typescript
// Utility function to validate API key
async function validateApiKey(apiKey: string, supabase: any): Promise<string | null> {
  // Hash the provided key
  const keyHash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(apiKey)
  );
  const hashHex = Array.from(new Uint8Array(keyHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Look up in database
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, user_id, daily_limit, is_active')
    .eq('key_hash', hashHex)
    .eq('is_active', true)
    .single();
  
  if (error || !data) return null;
  
  // Check rate limit
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('api_key_usage')
    .select('request_count')
    .eq('api_key_id', data.id)
    .eq('usage_date', today)
    .single();
  
  if (usage && usage.request_count >= data.daily_limit) {
    return null; // Rate limit exceeded
  }
  
  // Update usage
  await supabase.rpc('increment_api_key_usage', { 
    _api_key_id: data.id 
  });
  
  return data.user_id;
}
```

### Secure Key Generation

```typescript
function generateApiKey(userId: string): string {
  const prefix = userId.substring(0, 5);
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  const randomPart = Array.from(randomBytes)
    .map(b => b.toString(36))
    .join('')
    .substring(0, 32);
  return `ak_${prefix}_${randomPart}`;
}
```

---

## Summary

This API Key system enables:
1. Users to create up to 5 personal API keys
2. External applications to access Angel AI
3. Usage tracking and rate limiting per key
4. Secure key storage (hashed, not plain text)
5. Full management UI in Profile page
6. Multi-language support (12 languages)

