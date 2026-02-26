# FUN Money Minting System - Complete Package

> Tài liệu đóng gói đầy đủ hệ thống đúc tiền FUN Money (BEP-20) trên BSC Testnet.
> Bao gồm: PPLP scoring, mint request, admin approval, on-chain lock, activate & claim.

---

## 📁 Cấu Trúc File

### Frontend - Pages
| File | Mô tả |
|------|--------|
| `src/pages/Mint.tsx` | Trang mint chính cho user — hiển thị balance, lifecycle, hướng dẫn 4 bước |
| `src/pages/AdminMintApproval.tsx` | Trang admin phê duyệt — batch approve, retry, export, chart |
| `src/pages/AdminMintStats.tsx` | Thống kê mint (nếu có) |

### Frontend - Components (`src/components/mint/`)
| File | Mô tả |
|------|--------|
| `FUNMoneyBalanceCard.tsx` | Card hiển thị số dư on-chain (balance, locked, activated) |
| `FUNMoneyMintCard.tsx` | Card từng Light Action — score, 5 pillars, nút Request Mint |
| `MintActionsList.tsx` | Danh sách tất cả actions + batch "Gửi tất cả yêu cầu mint" |
| `TokenLifecyclePanel.tsx` | Panel 3 giai đoạn: Locked → Activated → Flowing + nút Activate/Claim |
| `WalletMismatchAlert.tsx` | Cảnh báo khi ví kết nối khác ví nhận token |

### Frontend - Admin Components
| File | Mô tả |
|------|--------|
| `src/components/admin/MintExportButton.tsx` | Nút export dữ liệu mint |
| `src/components/admin/OnChainErrorBanner.tsx` | Banner hiển thị lỗi on-chain (attester, action, gas) |

### Frontend - Hooks
| File | Mô tả |
|------|--------|
| `src/hooks/useFUNMoneyContract.ts` | Hook chính — kết nối contract, activate, claim, requestPPLPLock |
| `src/hooks/useMintRequest.ts` | Tạo mint request (single + batch upsert 50/chunk) |
| `src/hooks/usePPLPActions.ts` | Fetch/submit PPLP actions, lọc unminted |
| `src/hooks/useFUNMoneyStats.ts` | Thống kê FUN (scored, minted, pending) từ DB |
| `src/hooks/useUnmintedCount.ts` | Đếm actions chưa gửi mint request |
| `src/hooks/useWalletMismatch.ts` | Phát hiện sai lệch ví (connected ≠ recipient) |
| `src/hooks/useWeb3Wallet.ts` | Kết nối ví Web3 (MetaMask, Trust, OKX), BSC Testnet |
| `src/hooks/usePoPLScore.ts` | PoPL score tracking |

### Frontend - Lib/Config
| File | Mô tả |
|------|--------|
| `src/lib/funMoneyABI.ts` | ABI contract FUNMoneyProductionV1_2_1 + EIP-712 types |
| `src/lib/walletProviders.ts` | Multi-wallet detection (MetaMask, Trust, OKX) |
| `src/contexts/Web3WalletContext.tsx` | Context provider cho wallet state |

### Backend - Edge Functions
| File | Mô tả |
|------|--------|
| `supabase/functions/pplp-submit-action/index.ts` | Submit Light Action + auto-score |
| `supabase/functions/pplp-score-action/index.ts` | Engine chấm điểm 5 trụ cột PPLP |
| `supabase/functions/pplp-authorize-mint/index.ts` | Sign EIP-712 + lockWithPPLP on-chain + cascade distribution |
| `supabase/functions/pplp-detect-fraud/index.ts` | Phát hiện gian lận (sybil, bot, spam) |
| `supabase/functions/pplp-batch-processor/index.ts` | Xử lý hàng loạt actions chưa score |

### Backend - Shared Modules
| File | Mô tả |
|------|--------|
| `supabase/functions/_shared/pplp-types.ts` | Types: LightAction, 40+ action types, 14 platforms, BASE_REWARDS |
| `supabase/functions/_shared/pplp-helper.ts` | Helper: submitPPLPAction, Policy v1.0.1 base rewards |
| `supabase/functions/_shared/pplp-crypto.ts` | Crypto: SHA-256 hash, canonical JSON, evidence anchoring |
| `supabase/functions/_shared/pplp-eip712.ts` | EIP-712 domain & types cho PPLP signatures |

### Smart Contract
| File | Mô tả |
|------|--------|
| `contracts/FUNMoney.sol` | Solidity contract FUNMoneyProductionV1_2_1 |
| `contracts/hardhat.config.js` | Hardhat config cho BSC Testnet |
| `contracts/scripts/deploy.js` | Script deploy contract |

---

## 🔄 Quy Trình Minting (7 Giai Đoạn)

```
1. User Action (chat, post, journal...)
       ↓
2. pplp-submit-action → Insert pplp_actions (status: pending)
       ↓ (auto-trigger)
3. pplp-score-action → Calculate 5 pillars + Light Score
       ↓ (if score >= 60)
4. User clicks "Request Mint" → Insert pplp_mint_requests (status: pending)
       ↓
5. Admin reviews → Clicks "Approve & Sign"
       ↓
6. pplp-authorize-mint → EIP-712 sign + lockWithPPLP on-chain (status: minted)
       ↓
7. User Activate → Claim → FUN flows to wallet ✨
```

---

## 🗄️ Database Tables

### Core Tables

```sql
-- 1. PPLP Actions (Light Actions)
CREATE TABLE pplp_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_type_enum TEXT,
  actor_id UUID NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  impact JSONB DEFAULT '{}',
  integrity JSONB DEFAULT '{}',
  evidence_hash TEXT,
  canonical_hash TEXT,
  policy_version TEXT,
  policy_snapshot JSONB,
  status TEXT DEFAULT 'pending', -- pending | scored | minted | rejected
  scored_at TIMESTAMPTZ,
  minted_at TIMESTAMPTZ,
  mint_request_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PPLP Scores (5 Pillar Scoring)
CREATE TABLE pplp_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES pplp_actions(id) UNIQUE,
  pillar_s NUMERIC NOT NULL,
  pillar_t NUMERIC NOT NULL,
  pillar_h NUMERIC NOT NULL,
  pillar_c NUMERIC NOT NULL,
  pillar_u NUMERIC NOT NULL,
  light_score NUMERIC NOT NULL,
  base_reward INTEGER,
  multiplier_q NUMERIC,
  multiplier_i NUMERIC,
  multiplier_k NUMERIC,
  final_reward INTEGER NOT NULL,
  decision TEXT NOT NULL, -- pass | fail
  decision_reason TEXT,
  fail_reasons TEXT[],
  scored_by TEXT,
  policy_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PPLP Mint Requests
CREATE TABLE pplp_mint_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES pplp_actions(id) UNIQUE,
  actor_id UUID NOT NULL,
  recipient_address TEXT NOT NULL,
  amount INTEGER NOT NULL,
  action_hash TEXT,
  evidence_hash TEXT,
  policy_version INTEGER DEFAULT 1,
  nonce TEXT DEFAULT '0',
  signature TEXT,
  signer_address TEXT,
  status TEXT DEFAULT 'pending', -- pending | signed | minted | rejected | expired
  tx_hash TEXT,
  minted_at TIMESTAMPTZ,
  on_chain_error TEXT,
  valid_after TIMESTAMPTZ,
  valid_before TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PPLP Evidences
CREATE TABLE pplp_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES pplp_actions(id),
  evidence_type TEXT NOT NULL,
  evidence_type_enum TEXT,
  uri TEXT,
  content_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Cascading Distribution Logs
CREATE TABLE fun_distribution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  mint_request_id UUID REFERENCES pplp_mint_requests(id),
  total_reward INTEGER NOT NULL,
  user_amount INTEGER NOT NULL,
  user_percentage NUMERIC NOT NULL,
  genesis_amount INTEGER DEFAULT 0,
  genesis_percentage NUMERIC DEFAULT 0,
  platform_amount INTEGER DEFAULT 0,
  platform_percentage NUMERIC DEFAULT 0,
  partners_amount INTEGER DEFAULT 0,
  partners_percentage NUMERIC DEFAULT 0,
  fund_processing_status TEXT DEFAULT 'pending',
  fund_processed_at TIMESTAMPTZ,
  fund_tx_hashes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Pool Config (4-Tier Cascade)
CREATE TABLE fun_pool_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_name TEXT NOT NULL,
  pool_label TEXT NOT NULL,
  retention_rate NUMERIC DEFAULT 0,
  tier_order INTEGER,
  wallet_address TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Supporting Tables (Anti-Fraud & Caps)

```sql
-- User Caps (Diminishing Returns)
CREATE TABLE pplp_user_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  epoch_date DATE NOT NULL,
  epoch_type TEXT DEFAULT 'daily',
  total_minted BIGINT DEFAULT 0,
  action_counts JSONB DEFAULT '{}',
  last_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, epoch_date, epoch_type)
);

-- Action Caps Config
CREATE TABLE pplp_action_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  platform_id TEXT DEFAULT 'ALL',
  base_reward INTEGER DEFAULT 100,
  max_per_user_daily INTEGER,
  max_per_user_weekly INTEGER,
  max_global_daily INTEGER,
  cooldown_seconds INTEGER DEFAULT 0,
  diminishing_threshold INTEGER DEFAULT 5,
  diminishing_factor NUMERIC DEFAULT 0.8,
  min_quality_score NUMERIC DEFAULT 0.5,
  thresholds JSONB DEFAULT '{}',
  multiplier_ranges JSONB DEFAULT '{"Q":[0.5,3],"I":[0.5,5],"K":[0,1]}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Tiers (Reputation)
CREATE TABLE pplp_user_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier INTEGER DEFAULT 0,
  trust_score NUMERIC DEFAULT 50,
  cap_multiplier NUMERIC DEFAULT 1.0,
  total_actions_scored INTEGER DEFAULT 0,
  passed_actions INTEGER DEFAULT 0,
  failed_actions INTEGER DEFAULT 0,
  fraud_flags INTEGER DEFAULT 0,
  last_device_hash TEXT,
  known_device_hashes TEXT[] DEFAULT '{}',
  last_tier_change TIMESTAMPTZ,
  tier_change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fraud Signals
CREATE TABLE pplp_fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  signal_type TEXT NOT NULL, -- SYBIL | BOT | SPAM | COLLUSION
  severity INTEGER DEFAULT 1,
  details JSONB DEFAULT '{}',
  source TEXT DEFAULT 'SYSTEM',
  is_resolved BOOLEAN DEFAULT false,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Device Registry
CREATE TABLE pplp_device_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_hash TEXT NOT NULL,
  user_id UUID NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_seen TIMESTAMPTZ DEFAULT now(),
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  UNIQUE(device_hash, user_id)
);

-- Policies
CREATE TABLE pplp_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  policy_hash TEXT,
  thresholds JSONB,
  caps JSONB,
  formulas JSONB,
  action_configs JSONB,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Nonces (for EIP-712 replay protection)
CREATE TABLE pplp_user_nonces (
  user_id UUID PRIMARY KEY,
  current_nonce BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Epoch Caps (Global daily limits)
CREATE TABLE pplp_epoch_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epoch_date DATE NOT NULL,
  epoch_type TEXT DEFAULT 'daily',
  total_minted BIGINT DEFAULT 0,
  action_counts JSONB DEFAULT '{}',
  unique_users INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(epoch_date, epoch_type)
);

-- Audits (Random audit selection)
CREATE TABLE pplp_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES pplp_actions(id),
  actor_id UUID NOT NULL,
  audit_type TEXT DEFAULT 'RANDOM',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Database Functions

```sql
-- Check caps & apply diminishing returns
CREATE FUNCTION check_user_cap_and_update(_user_id UUID, _action_type TEXT, _reward_amount BIGINT)
RETURNS JSONB;

-- Update user reputation tier
CREATE FUNCTION update_user_tier(_user_id UUID)
RETURNS pplp_user_tiers;

-- Get next nonce for EIP-712
CREATE FUNCTION get_next_nonce(_user_id UUID)
RETURNS BIGINT;

-- Register device fingerprint
CREATE FUNCTION register_device_fingerprint(_user_id UUID, _device_hash TEXT)
RETURNS JSONB;

-- Get user PPLP stats
CREATE FUNCTION get_user_pplp_stats(_user_id UUID)
RETURNS TABLE(...);

-- Expire old mint requests
CREATE FUNCTION expire_old_mint_requests()
RETURNS INTEGER;

-- Schedule random audits
CREATE FUNCTION schedule_random_audit()
RETURNS INTEGER;
```

---

## ⚙️ Smart Contract Details

### Contract: FUNMoneyProductionV1_2_1
- **Address (BSC Testnet):** `0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2`
- **Chain ID:** 97
- **Standard:** BEP-20 (ERC-20 compatible)

### Key Functions
```solidity
// Mint + Lock (requires attester signatures)
function lockWithPPLP(address user, string action, uint256 amount, bytes32 evidenceHash, bytes[] sigs)

// User transitions
function activate(uint256 amount)  // Locked → Activated
function claim(uint256 amount)     // Activated → Spendable

// Read state
function alloc(address) view returns (uint256 locked, uint256 activated)
function nonces(address) view returns (uint256)
function isAttester(address) view returns (bool)
function actions(bytes32) view returns (bool allowed, uint32 version, bool deprecated)

// Governance (guardianGov only)
function govRegisterAction(string name, uint32 version)
function govSetAttester(address attester, bool allowed)
function govSetAttesterThreshold(uint256 newThreshold)
```

### EIP-712 Domain
```javascript
{
  name: "FUN Money",
  version: "1.2.1",
  chainId: 97,
  verifyingContract: "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2"
}
```

### PureLoveProof Struct (for attester signing)
```
PureLoveProof(
  address user,
  bytes32 actionHash,
  uint256 amount,
  bytes32 evidenceHash,
  uint256 nonce
)
```

---

## 🧮 Scoring Engine (5 Pillars)

### Pillar Weights
| Pillar | Weight | Description |
|--------|--------|-------------|
| S (Service) | 25% | Phụng sự — beneficiaries, positive outcome |
| T (Truth) | 20% | Chân thật — evidence, verification |
| H (Healing) | 20% | Chữa lành — sentiment, healing effect |
| C (Contribution) | 20% | Đóng góp — content length, educational |
| U (Unity) | 15% | Hợp nhất — promotes unity, collaboration |

### Formula
```
Light Score = S×0.25 + T×0.20 + H×0.20 + C×0.20 + U×0.15
Final Reward = BaseReward × Q × I × K
```

Where:
- **Q** (Quality): 0.5 – 3.0
- **I** (Impact): 0.5 – 5.0
- **K** (Integrity): 0.0 – 1.0
- **Light Score >= 50** required to pass (global minimum)

### Enrichment (Auto-applied)
```javascript
// Metadata enrichment ensures Light Score ~81
{
  has_evidence: true,
  verified: true,
  sentiment_score: 0.75,
  is_educational: true/false,
}

// Impact enrichment
{
  beneficiaries: 1,
  outcome: 'positive',
  promotes_unity: true,
  healing_effect: true,
}

// Integrity enrichment
{
  source_verified: true,
  anti_sybil_score: 0.85,
}
```

---

## 💰 4-Tier Cascading Distribution

```
Total Reward (e.g., 100 FUN)
  ├── Tier 1: Genesis Community Fund keeps 1% → 1 FUN
  ├── Tier 2: FUN Platform keeps 0.99% of remainder → ~0.98 FUN
  ├── Tier 3: FUN Partners keeps 0.98% of remainder → ~0.96 FUN
  └── Tier 4: User receives ~97.03% → ~97.06 FUN
```

Config stored in `fun_pool_config` table. Only user portion goes on-chain via `lockWithPPLP`.

---

## 🔑 Required Secrets

| Secret | Usage |
|--------|-------|
| `TREASURY_PRIVATE_KEY` | Sign EIP-712 messages + send lockWithPPLP transactions |
| `SUPABASE_URL` | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for edge functions |
| `SUPABASE_ANON_KEY` | Client-side auth |
| `BSC_RPC_URL` | (Optional) Custom BSC RPC endpoint |

---

## 📦 NPM Dependencies

```json
{
  "ethers": "^6.16.0",        // Web3 interactions
  "date-fns": "^3.6.0",       // Date formatting
  "recharts": "^2.15.4",      // Charts in admin
  "sonner": "^1.7.4",         // Toast notifications
  "framer-motion": "^12.27.0" // Animations
}
```

---

## 🔐 Anti-Fraud System

### Checks (in `pplp-detect-fraud`)
1. **Sybil Detection** — Device/IP fingerprint collisions across users
2. **Bot Detection** — >20 actions/hr or uniform timing <1min intervals
3. **Spam Detection** — Content length too short / hash duplicates
4. **Collusion Detection** — Concentrated interactions between account pairs

### Risk Score Thresholds
- **risk_score > 50** → Auto-mint blocked
- **severity >= 4** → Mint authorization blocked
- **Tier 0-4** with cap multipliers 1x–3x

---

## 🔧 Wallet Integration

### Supported Wallets
- MetaMask (desktop + mobile deep link)
- Trust Wallet
- OKX Wallet
- Any EIP-1193 compatible browser wallet

### Key Features
- Auto-reconnect on page load (with retry every 5s)
- BSC Testnet auto-switch
- Iframe detection (blocks wallet in preview)
- Multi-account change listener
- Wallet mismatch detection (connected ≠ mint recipient)
- `wallet_requestPermissions` for in-app account switching

### BSC Testnet Config
```javascript
{
  chainId: "0x61",     // 97
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: [
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-2-s1.binance.org:8545",
    "https://data-seed-prebsc-1-s2.binance.org:8545",
  ],
  blockExplorerUrls: ["https://testnet.bscscan.com"]
}
```

---

## 🛡️ Resilience Mechanisms

### Edge Function (`pplp-authorize-mint`)
1. **RPC Fallback** — Tries 5 BSC Testnet RPCs sequentially with timeout
2. **Chain Validation** — Verifies chainId=97, blockNumber>10M, contract code exists
3. **Early DB Insert** — Saves mint request BEFORE on-chain tx (prevents data loss on timeout)
4. **Idempotency** — Checks existing mint status before processing
5. **Error Classification** — ATTESTER_NOT_REGISTERED, ACTION_NOT_REGISTERED, INSUFFICIENT_GAS, RPC_FAILURE, CONTRACT_REVERT
6. **Receipt Verification** — Checks `receipt.status === 1` before marking minted

### Frontend (`TokenLifecyclePanel`)
1. **Skeleton Loading** — Shows skeleton during initial load
2. **Retry Logic** — 3 attempts with 2s delay when contract is initializing
3. **30s Polling** — Auto-refresh on-chain balances
4. **DB Fallback** — Shows database stats when contract unavailable
5. **Network Switch Button** — Direct BSC Testnet switch from panel
6. **Wallet Mismatch** — Read-only provider to show target wallet's allocation

### Admin (`AdminMintApproval`)
1. **Paginated Fetch** — While loop with 1000/page to load ALL records
2. **Chunked Profile Lookup** — 200 IDs/batch for user info
3. **409 Handling** — Catches "already minted" errors, extracts tx_hash from error body
4. **Batch Operations** — Select all + approve/reject with progress bar
5. **Progressive Loading** — Show 50 at a time with "Load more" button

---

## 📋 Migration Guide (Copy to New Project)

### Step 1: Database
Run all SQL from the "Database Tables" section above.

### Step 2: Secrets
Configure these in your backend:
- `TREASURY_PRIVATE_KEY` — Generate new wallet, fund with tBNB
- `BSC_RPC_URL` — Optional custom RPC

### Step 3: Smart Contract
1. Deploy `FUNMoney.sol` to BSC Testnet using Hardhat
2. Update `CONTRACT_ADDRESS` in:
   - `src/lib/funMoneyABI.ts` (FUN_MONEY_ADDRESSES)
   - `supabase/functions/pplp-authorize-mint/index.ts`
3. Register attester: `govSetAttester(treasuryAddress, true)`
4. Register actions: `govRegisterAction("QUESTION_ASK", 1)`, etc.

### Step 4: Backend Functions
Copy all files from `supabase/functions/`:
- `pplp-submit-action/`
- `pplp-score-action/`
- `pplp-authorize-mint/`
- `pplp-detect-fraud/`
- `pplp-batch-processor/`
- `_shared/pplp-*.ts`

### Step 5: Frontend
Copy these directories/files:
```
src/components/mint/          # All 5 components
src/hooks/useFUNMoneyContract.ts
src/hooks/useMintRequest.ts
src/hooks/usePPLPActions.ts
src/hooks/useFUNMoneyStats.ts
src/hooks/useUnmintedCount.ts
src/hooks/useWalletMismatch.ts
src/hooks/useWeb3Wallet.ts
src/lib/funMoneyABI.ts
src/lib/walletProviders.ts
src/contexts/Web3WalletContext.tsx
src/pages/Mint.tsx
src/pages/AdminMintApproval.tsx
```

### Step 6: Policy Setup
Insert initial policy record:
```sql
INSERT INTO pplp_policies (version, is_active, thresholds, caps)
VALUES ('v1.0.2', true, '{"LightScore": 60, "T": 70}', '{"daily_global": 5000000}');
```

Insert pool config:
```sql
INSERT INTO fun_pool_config (pool_name, pool_label, retention_rate, tier_order, is_active)
VALUES
  ('genesis_community', 'Genesis Community Fund', 0.01, 1, true),
  ('fun_platform', 'FUN Platform', 0.0099, 2, true),
  ('fun_partners', 'FUN Partners', 0.0098, 3, true);
```

---

## 🎯 Base Rewards (Policy v1.0.1)

| Action Type | Base FUN | Platform |
|-------------|----------|----------|
| QUESTION_ASK | 50 | Angel AI |
| POST_CREATE | 70 | FUN Profile |
| CONTENT_CREATE | 70 | FUN Profile |
| COMMENT_CREATE | 40 | FUN Profile |
| SHARE_CONTENT | 40 | FUN Profile |
| HELP_COMMUNITY | 120 | FUN Profile |
| MENTOR_HELP | 150 | FUN Profile |
| IDEA_SUBMIT | 150 | FUN Profile |
| JOURNAL_WRITE | 20 | FUNLife |
| GRATITUDE_PRACTICE | 20 | FUNLife |
| DONATE_SUPPORT | 120 | FUN Charity |
| FEEDBACK_GIVE | 60 | Angel AI |
| VISION_CREATE | 1000 | Angel AI |

---

*Document generated: 2026-02-11*
*System version: PPLP v1.0.2 | Contract v1.2.1 | Policy v1.0.1*
