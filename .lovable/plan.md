
# PPLP Technical Spec v1.0 - Implementation Plan

## Overview

Plan triển khai hệ thống PPLP (Proof of Pure Love Protocol) với 6 mục tiêu kỹ thuật chính, tích hợp vào nền tảng Angel AI hiện có.

---

## Current State Analysis

### What Already Exists:
1. **PoPL Score System** (`usePoPLScore.ts`): Basic score tracking with badge levels
2. **Light Points** (`useLightPoints.ts`): Point accumulation with level tiers  
3. **Camly Coin** (`useCamlyCoin.ts`): Token balance and transactions
4. **Reward Edge Functions**: `analyze-reward-question`, `process-engagement-reward`, etc.
5. **Database Tables**: `user_light_totals`, `camly_coin_transactions`, `chat_questions`
6. **Engine Spec Documentation** (`pplpEngineSpec.ts`): Complete technical specification

### What Needs to Be Built:
- Light Action standardization framework
- Evidence collection with anti-fraud detection
- 5-pillar scoring engine (S/T/H/C/U)
- Multiplier-based mint decision system
- Reputation/Badge management
- Audit/Governance dashboard

---

## Implementation Phases

### Phase 1: Database Schema Extension

Create new tables following the Engine Spec:

```text
+------------------+     +------------------+     +------------------+
|  pplp_actions    |---->|  pplp_evidences  |     |  pplp_scores     |
+------------------+     +------------------+     +------------------+
| id (uuid)        |     | id (uuid)        |     | id (uuid)        |
| platform_id      |     | action_id (FK)   |     | action_id (FK)   |
| action_type      |     | evidence_type    |     | pillar_s (0-100) |
| actor_id         |     | uri              |     | pillar_t (0-100) |
| metadata (jsonb) |     | content_hash     |     | pillar_h (0-100) |
| impact (jsonb)   |     | created_at       |     | pillar_c (0-100) |
| integrity (jsonb)|     +------------------+     | pillar_u (0-100) |
| status           |                              | light_score      |
| evidence_hash    |     +------------------+     | multipliers      |
| policy_version   |     | pplp_policies    |     | reward_amount    |
| created_at       |     +------------------+     | decision         |
+------------------+     | version (PK)     |     +------------------+
                         | policy_json      |
+------------------+     | created_at       |     +------------------+
| pplp_fraud_signals|    +------------------+     | pplp_disputes    |
+------------------+                              +------------------+
| id (uuid)        |                              | id (uuid)        |
| actor_id         |                              | action_id (FK)   |
| signal_type      |                              | reason           |
| severity (1-5)   |                              | evidence (jsonb) |
| source           |                              | status           |
| details (jsonb)  |                              | resolution       |
+------------------+                              +------------------+
```

**Tables to create:**
1. `pplp_actions` - Light actions with canonical structure
2. `pplp_evidences` - Evidence bundles per action
3. `pplp_scores` - 5-pillar scoring results
4. `pplp_policies` - Versioned scoring policies
5. `pplp_fraud_signals` - Anti-fraud detection signals
6. `pplp_disputes` - Governance/audit disputes

---

### Phase 2: Edge Functions - Core Engine

#### 2.1 `pplp-submit-action/index.ts`
Submit and canonicalize Light Actions:
- Validate input structure
- Generate canonical hash
- Collect and hash evidence bundle
- Enqueue for scoring
- Return action ID

#### 2.2 `pplp-score-action/index.ts`
Score actions using 5-pillar rubric:
- Load current policy version
- Calculate S/T/H/C/U scores (0-100 each)
- Apply platform-specific thresholds
- Calculate multipliers (Q/I/K)
- Determine PASS/FAIL decision
- Store score record

#### 2.3 `pplp-detect-fraud/index.ts`
Anti-fraud detection:
- Sybil detection (device fingerprint, IP patterns)
- Bot behavior analysis
- Collusion detection (coordinated actions)
- Spam/wash detection
- Integration with Angel AI for advanced analysis

#### 2.4 `pplp-authorize-mint/index.ts`
Authorize FUN Money minting:
- Verify score PASSED thresholds
- Check fraud signals
- Calculate final reward amount
- Create mint authorization record
- (Future: EIP-712 signing for on-chain)

---

### Phase 3: Scoring Engine Logic

Implement the 5-pillar scoring rubric:

```
LightScore Formula:
LightScore = (S * 0.25) + (T * 0.20) + (H * 0.20) + (C * 0.20) + (U * 0.15)

Final Reward:
RewardAmount = BaseReward * Q * I * K

Where:
- S = Service to Life (0-100)
- T = Truth/Transparency (0-100)  
- H = Healing/Compassion (0-100)
- C = Contribution durability (0-100)
- U = Unity alignment (0-100)
- Q = Quality multiplier (1.0-3.0)
- I = Impact multiplier (1.0-5.0)
- K = Integrity multiplier (0.0-1.0)
```

**Platform-specific thresholds from Engine Spec:**
- Angel AI: T >= 80, K >= 0.75
- FUN Profile: T >= 70, U >= 65, K >= 0.70
- FUN Charity: T >= 85, S >= 75, K >= 0.80
- FUN Academy: T >= 70, LightScore >= 60
- (All 16 platforms defined in pplpEngineSpec.ts)

---

### Phase 4: Frontend Components

#### 4.1 Enhanced PoPL Score Card
Update `PoPLScoreCard.tsx` to show:
- 5-pillar breakdown (S/T/H/C/U)
- Visual radar chart
- Recent actions history
- Badge progression

#### 4.2 Light Action History Page
New page `/activity/light-actions`:
- List of all submitted actions
- Status (PENDING/SCORED/MINTED)
- Score breakdown per action
- Evidence links

#### 4.3 Admin PPLP Dashboard
New admin page `/admin/pplp`:
- Policy version management
- Fraud signal monitoring
- Dispute resolution interface
- Scoring analytics

---

### Phase 5: Integration with Existing Systems

#### 5.1 Connect Current Reward Flow
Update existing edge functions to submit PPLP actions:
- `analyze-reward-question` -> Submit QUESTION_ASK action
- `process-engagement-reward` -> Submit ENGAGEMENT_LIKE action
- `process-share-reward` -> Submit CONTENT_SHARE action
- `analyze-reward-journal` -> Submit JOURNAL_WRITE action

#### 5.2 Reputation Sync
- Sync `pplp_scores` -> `user_light_totals.popl_score`
- Update badge levels based on aggregate scores
- Trigger healing messages on milestones

---

## Technical Details

### Database Migrations Required:
1. Create `pplp_actions` table with RLS policies
2. Create `pplp_evidences` table with FK to actions
3. Create `pplp_scores` table with scoring columns
4. Create `pplp_policies` table with versioning
5. Create `pplp_fraud_signals` table
6. Create `pplp_disputes` table
7. Create RPC functions for scoring calculations
8. Add indexes for performance

### Edge Functions to Create:
1. `pplp-submit-action` - Action submission
2. `pplp-score-action` - Scoring engine
3. `pplp-detect-fraud` - Fraud detection
4. `pplp-authorize-mint` - Mint authorization
5. `pplp-get-policy` - Policy retrieval
6. `pplp-manage-dispute` - Dispute management

### React Hooks to Create:
1. `usePPLPActions` - Submit and track actions
2. `usePPLPScore` - Enhanced scoring with 5 pillars
3. `usePPLPPolicy` - Current policy retrieval
4. `usePPLPDisputes` - Dispute management (admin)

### UI Components:
1. `PPLPScoreRadar` - Radar chart for 5 pillars
2. `PPLPActionCard` - Action display with status
3. `PPLPPolicyViewer` - Policy version display
4. `PPLPFraudAlerts` - Admin fraud monitoring

---

## Implementation Order

1. **Database Schema** (Phase 1) - Foundation
2. **pplp-submit-action** - Accept Light Actions
3. **pplp-score-action** - Core scoring engine
4. **pplp-detect-fraud** - Anti-fraud layer
5. **Frontend Score Display** - Show 5-pillar scores
6. **Integration** - Connect existing reward flows
7. **Admin Dashboard** - Governance tools
8. **pplp-authorize-mint** - Mint authorization

---

## Security Considerations

- All scoring logic in Edge Functions (server-side)
- RLS policies on all PPLP tables
- Admin-only access to policy management
- Fraud signals visible only to admins
- Evidence hashing for integrity verification
- Rate limiting on action submission

---

## Estimated Scope

- **Database**: 6 new tables + migrations
- **Edge Functions**: 6 new functions
- **React Hooks**: 4 new hooks
- **UI Components**: 5-8 new components
- **Admin Pages**: 1-2 new pages
- **Integration**: Update 4-5 existing edge functions
