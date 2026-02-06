/**
 * PPLP Knowledge Templates
 * 
 * Các tài liệu mẫu về giao thức PPLP để import vào Knowledge Base
 * Angel AI sẽ học để trả lời user về quy trình mint FUN Money
 */

export interface PPLPKnowledgeTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'mint_guide' | 'pillars' | 'distribution' | 'actions' | 'anti_fraud' | 'policy_json' | 'technical_spec';
  content: string;
}

// Technical Spec template content
const TECHNICAL_SPEC_CONTENT = `# PPLP TECHNICAL SPEC v1.0 + SMART CONTRACT FUN MONEY MINT ENGINE

## 1. MỤC TIÊU HỆ THỐNG

PPLP phải làm được 6 việc kỹ thuật (đo được, audit được):

1. **Chuẩn hóa "Light Action"** - Hành động tạo giá trị Ánh Sáng thành dữ liệu có cấu trúc
2. **Thu thập bằng chứng (Evidence)** + chống gian lận
3. **Chấm điểm (Light Score)** theo 5 trụ cột PPLP
4. **Quyết định Mint** theo công thức multiplier
5. **Cập nhật Reputation** (Light Reputation/Badge/Score)
6. **Audit/Governance**: minh bạch, truy vết, khiếu nại

---

## 2. KIẾN TRÚC HỆ THỐNG (System Architecture)

### 2.1 Các thành phần

#### A. Platform Adapters (FUN Platforms)
- FUN Profile, FUN Academy, FUN Charity, FUN Earth, FUN Play
- FUN Farm, FUN Market, FUN Wallet, FUNLife/Cosmic Game
- FUN Trading, FUN Invest, FUN Legal, FUN Planet, Angel AI
- **Mỗi platform phát sinh Action Event + Evidence**

#### B. PPLP Engine (Rule Engine + Scoring)
- Nhận action + evidence
- Tính điểm 5 trụ cột
- Tính reward theo mint formula
- Gửi "Mint Authorization" xuống blockchain

#### C. Angel AI (Light Oracle)
- Chấm Quality/Impact
- Phát hiện spam/collusion/anomaly
- Gợi ý multiplier (không tự quyết tuyệt đối nếu governance yêu cầu)

#### D. Identity & Reputation Layer
- FUN Profile DID (hybrid)
- Reputation gating (cap, tier)

#### E. On-chain FUN Money Mint Engine
- BEP-20 token (FUN Money)
- Mint chỉ khi có chữ ký/ủy quyền từ PPLP Signer + cap theo epoch

#### F. FUN Legal / Governance
- Policy/ruleset versioning
- Dispute workflow + slashing (tuỳ pha)

---

## 3. DATA MODEL (Chuẩn hóa dữ liệu)

### 3.1 Action Types (enum)

Ví dụ action type chuẩn hóa:
- LEARN_COMPLETE
- PROJECT_SUBMIT
- MENTOR_HELP
- CONTENT_CREATE
- CONTENT_REVIEW
- DONATE
- VOLUNTEER
- TREE_PLANT
- CLEANUP_EVENT
- FARM_DELIVERY
- MARKET_FAIR_TRADE
- BUG_BOUNTY
- GOV_PROPOSAL
- DISPUTE_RESOLVE
- DAILY_RITUAL (FUNLife)

### 3.2 LightAction Object (Off-chain canonical)

\\\`\\\`\\\`json
{
  "actionId": "uuid-or-hash",
  "platformId": "FUN_ACADEMY",
  "actionType": "LEARN_COMPLETE",
  "actor": "0xUserAddress",
  "timestamp": 1730000000,
  "metadata": {
    "courseId": "COURSE_001",
    "lessonCount": 12,
    "durationSec": 5400,
    "language": "vi"
  },
  "evidence": [
    {"type":"QUIZ_SCORE", "value": 92, "uri":"ipfs://..."},
    {"type":"CERT", "uri":"ipfs://..."}
  ],
  "impact": {
    "beneficiaries": 1,
    "measurableOutcome": "passed",
    "impactUri": "ipfs://..."
  },
  "integrity": {
    "deviceHash":"...",
    "sessionSignals":"...",
    "antiSybilScore": 0.86
  }
}
\\\`\\\`\\\`

### 3.3 Evidence Anchoring

- Evidence lưu off-chain (IPFS/Arweave/DB)
- Anchor hash lên chain hoặc ký số:
  - \\\`evidenceHash = keccak256(canonical_json)\\\`
- Mint request phải chứa: evidenceHash, policyVersion, actionId

---

## 4. PPLP SCORING & MINT FORMULA

### 4.1 5 Pillars Score (0–100 mỗi trụ cột)

| Pillar | Ý nghĩa |
|--------|---------|
| S | Service to Life (0–100) |
| T | Truth & Transparency (0–100) |
| H | Healing & Compassion (0–100) |
| C | Contribution Durability (0–100) |
| U | Unity Alignment (0–100) |

### 4.2 Công thức Light Score

\\\`\\\`\\\`
LightScore = 0.25×S + 0.20×T + 0.20×H + 0.20×C + 0.15×U
\\\`\\\`\\\`

### 4.3 Threshold theo Action Type

| Action | Light Score | Truth | Service | Unity |
|--------|-------------|-------|---------|-------|
| LEARN_COMPLETE | ≥60 | ≥70 | - | - |
| DONATE | ≥65 | ≥80 | ≥70 | - |
| MENTOR_HELP | ≥70 | - | - | ≥70 |
| CONTENT_CREATE | ≥65 | - | - | - |

### 4.4 Mint Formula

\\\`\\\`\\\`
FUN Mint = BaseReward × Q × I × K
\\\`\\\`\\\`

Trong đó:
- **BaseReward**: theo actionType + platform (đơn vị FUN)
- **Q = QualityMultiplier** (0.5 – 3.0): Angel AI + community signals + rubric
- **I = ImpactMultiplier** (0.5 – 5.0): impact proofs + verified partner
- **K = IntegrityMultiplier** (0 – 1.0): antiSybilScore, anomaly detection, stake tier

### 4.5 Reward Cap & Rate Limit

Để chống farm:
- Cap theo epoch (ngày/tuần): epochMintCap
- Cap theo user: userDailyCap, userEpochCap
- Cap theo actionType: actionTypeCap
- Diminishing returns khi spam: lặp action quá dày → giảm Q hoặc BaseReward

---

## 5. ANTI-FRAUD SPEC

### 5.1 MVP Anti-Sybil (nhẹ nhàng)

- Device fingerprint (hash)
- Rate limit
- Social graph signals (FUN Profile)
- Reputation gating:
  - Tier 0: cap thấp
  - Tier 1+: cap tăng khi history tốt

### 5.2 Nâng cấp (Future)

- Proof-of-personhood (tuỳ khu vực)
- zk-attestation
- Stake-for-trust (dùng Camly Coin/FUN Money) để mở cap thưởng cao hơn
- Random audit + dispute

---

## 6. ON-CHAIN INTERFACE SPEC (Mint Authorization)

### 6.1 Mint Request Payload (EIP-712)

| Trường | Type | Mô tả |
|--------|------|-------|
| to | address | User address |
| amount | uint256 | Amount to mint |
| actionId | bytes32 | Unique action ID |
| evidenceHash | bytes32 | Hash of evidence |
| policyVersion | uint32 | Policy version |
| validAfter | uint64 | Start time |
| validBefore | uint64 | Expiry time |
| nonce | uint256 | User nonce |

### 6.2 Quy tắc

- Mỗi actionId chỉ mint 1 lần (idempotent)
- Request hết hạn → reject
- Signer phải là PPLP Signer (đa chữ ký / governance)

---

## 7. FUN MONEY SMART CONTRACT — MINT ENGINE

### Contract: FUNMoney.sol (Solidity / BEP-20)

\\\`\\\`\\\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  FUN Money (BEP-20/ERC-20) + PPLP Mint Engine
  - Mint authorized by off-chain PPLP signer
  - Prevent double-mint per actionId
  - Epoch mint cap + user epoch cap
  - EIP-712 typed signature verification
*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract FUNMoney is ERC20, AccessControl, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE  = DEFAULT_ADMIN_ROLE;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    // Mint replay protection
    mapping(bytes32 => bool) public mintedAction;

    // Nonce per user
    mapping(address => uint256) public nonces;

    // Epoch caps
    uint256 public epochDurationSec = 1 days;
    mapping(uint256 => uint256) public mintedInEpoch;

    uint256 public epochMintCap;
    uint256 public userEpochCap;
    mapping(uint256 => mapping(address => uint256)) public userMintedInEpoch;

    bool public mintingEnabled = true;

    bytes32 public constant MINT_TYPEHASH = keccak256(
        "MintRequest(address to,uint256 amount,bytes32 actionId,bytes32 evidenceHash,uint32 policyVersion,uint64 validAfter,uint64 validBefore,uint256 nonce)"
    );

    struct MintRequest {
        address to;
        uint256 amount;
        bytes32 actionId;
        bytes32 evidenceHash;
        uint32 policyVersion;
        uint64 validAfter;
        uint64 validBefore;
        uint256 nonce;
    }

    function mintWithSignature(MintRequest calldata req, bytes calldata signature) external {
        require(mintingEnabled, "minting disabled");
        require(req.to != address(0), "to=0");
        require(req.amount > 0, "amount=0");
        require(block.timestamp >= req.validAfter, "too early");
        require(block.timestamp <= req.validBefore, "expired");
        require(!mintedAction[req.actionId], "action already minted");
        require(req.nonce == nonces[req.to], "bad nonce");

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            MINT_TYPEHASH,
            req.to, req.amount, req.actionId, req.evidenceHash,
            req.policyVersion, req.validAfter, req.validBefore, req.nonce
        )));

        address recovered = digest.recover(signature);
        require(hasRole(SIGNER_ROLE, recovered), "invalid signer");

        uint256 epoch = block.timestamp / epochDurationSec;
        require(mintedInEpoch[epoch] + req.amount <= epochMintCap, "epoch cap exceeded");
        require(userMintedInEpoch[epoch][req.to] + req.amount <= userEpochCap, "user cap exceeded");

        mintedAction[req.actionId] = true;
        nonces[req.to] += 1;
        mintedInEpoch[epoch] += req.amount;
        userMintedInEpoch[epoch][req.to] += req.amount;

        _mint(req.to, req.amount);
    }
}
\\\`\\\`\\\`

### 7.1 Flow triển khai

1. **Off-chain PPLP Engine** tính amount theo công thức Base × Q × I × K
2. **Engine tạo MintRequest** (actionId, evidenceHash, policyVersion, time window, nonce)
3. **PPLP Signer** (multisig/guardian) ký EIP-712
4. **Platform hoặc user** gọi mintWithSignature(req, sig)
5. **On-chain kiểm tra**:
   - actionId chưa mint
   - nonce đúng
   - signer hợp lệ
   - caps không vượt
   - chưa hết hạn
6. **Mint thành công** → event log để audit

---

## 8. POLICY VERSIONING

- Request chứa policyVersion
- policyVersion map sang policy file off-chain (IPFS hash)
- Governance cập nhật policyVersion khi chỉnh threshold/caps/formula
- Khuyến nghị: lưu mapping policyVersion -> policyHash on-chain

---

## 9. MVP TRIỂN KHAI (30–60 ngày)

### Tuần 1–2
- FUN Profile DID + basic reputation tier
- PPLP Engine v0: scoring đơn giản, rule per actionType
- Deploy FUNMoney contract (testnet)

### Tuần 3–4
- Angel AI v0: quality scoring (spam detection)
- FUN Academy Learn & Earn v0 + FUN Charity v0
- Mint pipeline end-to-end

### Tuần 5–8
- Add caps tuning + dispute reporting
- Dashboard audit: minted per epoch / top actions / fraud flags
- Prepare mainnet launch + signer multisig

---

## 10. HỢP ĐỒNG ĐÃ DEPLOY

### BSC Testnet (Chain ID: 97)
- **Contract**: FUNMoneyProductionV1_2_1
- **Address**: 0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2
- **Treasury Wallet**: 0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D

### Vesting Flow (3 bước)
1. lockWithPPLP() - Backend khóa token vào Treasury
2. activate() - User kích hoạt
3. claim() - User nhận về ví

### EIP-712 Domain
- name: "FUNMoney-PPLP"
- version: "1"
- chainId: 97
- verifyingContract: 0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2

---

## 11. TÓM TẮT

| Thành phần | Công nghệ |
|------------|-----------|
| Token | BEP-20 (FUN Money) |
| Scoring | PPLP Engine (5 pillars) |
| Oracle | Angel AI |
| Signature | EIP-712 |
| Anti-Fraud | Device fingerprint + rate limit + reputation tier |
| Governance | Multisig + policy versioning |

**Nguyên tắc cốt lõi**: Mint-to-Unity — thưởng cho đóng góp thực sự tạo giá trị cho cộng đồng, KHÔNG thưởng cho đầu cơ/gian lận.`;

export interface PPLPKnowledgeTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'mint_guide' | 'pillars' | 'distribution' | 'actions' | 'anti_fraud' | 'policy_json' | 'technical_spec';
  content: string;
}

export const PPLP_KNOWLEDGE_TEMPLATES: PPLPKnowledgeTemplate[] = [
  {
    id: 'policy-json-v102',
    title: 'PPLP + PUC Policy JSON v1.0.2 (Full Production)',
    description: 'Production-ready policy file: actions + safe defaults + emergency + governance + migration + edge-cases + rate limiting + reputation decay + cross-platform bonus',
    icon: '📋',
    category: 'policy_json',
    content: `# PPLP + PUC MINT POLICY v1.0.2 (FULL PRODUCTION)

## TỔNG QUAN

Đây là policy file production-ready đầy đủ cho hệ thống PPLP scoring và Proof of Unity Contribution (PUC) mint engine cho FUN Money.

**Schema:** pplp.policy.v1
**Phiên bản:** v1.0.2 (policyVersion: 3)
**Có hiệu lực từ:** 2026-02-05T00:00:00Z

### Tính năng chính:
- Epoch cap: 5M FUN/ngày
- Audit + review-hold cho mint lớn
- Attestation bắt buộc cho các nền tảng nhạy cảm
- Hard-cap Q×I product
- Buffer smoothing và wallet-layer soft-lock
- Emergency pause + circuit breaker
- Governance rules và migration path
- Rate limiting toàn cục
- Reputation decay và cross-platform bonus

### Nguyên tắc Mint-to-Unity:
> "Thưởng cho các đóng góp đã xác minh phù hợp với Unity; KHÔNG thưởng cho đánh bạc/đầu cơ."

---

## CẤU HÌNH TOKEN

| Thuộc tính | Giá trị |
|------------|---------|
| Symbol | FUN |
| Decimals | 18 |
| Unit | atomic |
| Mint Request Valid (mặc định) | 600 giây |

---

## EPOCH SETTINGS

| Thuộc tính | Giá trị |
|------------|---------|
| Duration | 86,400 giây (24 giờ) |
| Total Mint Cap/Epoch | 5,000,000 FUN (5M) |
| Platform Pool Mode | cap |
| Platform Pool Rollover | false |

---

## GIỚI HẠN (CAPS)

### Per User Daily Cap theo Tier

| Tier | Daily Cap (FUN) |
|------|-----------------|
| 0 | 5,000 |
| 1 | 20,000 |
| 2 | 100,000 |
| 3 | 250,000 |

### Giới hạn lặp hành động (Per Day)

| Action Type | Limit/Day |
|-------------|-----------|
| DAILY_RITUAL | 1 |
| VIEW_QUALITY_SESSION | 10 |
| CONTENT_CREATE | 3 |
| REVIEW_HELPFUL | 5 |
| DONATE | 3 |
| TREE_PLANT | 5 |
| VOLUNTEER | 3 |
| FARM_DELIVERY | 5 |
| DUE_DILIGENCE_REPORT | 2 |
| CLEANUP_EVENT | 3 |
| PROJECT_SUBMIT | 2 |
| VIDEO_PUBLISH | 2 |
| VIDEO_EDU_SERIES | 1 |
| Mặc định | 5 |

### Cooldowns (giây)

| Action Type | Cooldown |
|-------------|----------|
| DONATE | 3,600 (1h) |
| VOLUNTEER | 1,800 (30m) |
| CAMPAIGN_DELIVERY_PROOF | 0 |
| DISPUTE_RESOLVE | 0 |
| PARTNER_VERIFIED_REPORT | 0 |

---

## SCORING SYSTEM

### 5 Pillars (Trụ cột)

| Pillar | Weight |
|--------|--------|
| S (Serving) | 25% |
| T (Truth) | 20% |
| H (Healing) | 20% |
| C (Continuity) | 20% |
| U (Unity) | 15% |

### Công thức Light Score
\`\`\`
lightScore = 0.25×S + 0.20×T + 0.20×H + 0.20×C + 0.15×U
\`\`\`

### Ngưỡng toàn cục

| Metric | Min Value |
|--------|-----------|
| Truth (T) | 70 |
| Integrity (K) | 0.6 |
| Light Score | 60 |

### Multiplier Ranges

| Multiplier | Min | Max |
|------------|-----|-----|
| Q (Quality) | 0.5 | 3.0 |
| I (Impact) | 0.5 | 5.0 |
| K (Integrity) | 0.0 | 1.0 |
| Ux (Unity) | 0.5 | 2.5 |

### Multiplier Caps
- Max Q×I product: 10.0
- Max amount per action: 500,000 FUN
- Enforce tier Ux max: true

---

## UNITY SYSTEM

### Unity Score Signals
1. collaboration
2. beneficiaryConfirmed
3. communityEndorsement
4. bridgeValue
5. conflictResolution

### Unity Multiplier Mapping

| Unity Score Range | Ux Multiplier |
|-------------------|---------------|
| 0-49 | 0.5 |
| 50-69 | 1.0 |
| 70-84 | 1.5 |
| 85-94 | 2.0 |
| 95-100 | 2.3 |

### Unity Bonuses
- Partner Attested: +0.3 Ux (cap 2.5)
- Beneficiary Confirmed: +0.2 Ux (cap 2.5)
- Witness Count ≥3: +0.2 Ux (cap 2.5)

### Anti-Collusion Rules
- Witness uniqueness: enabled
- Witness min tier: 1
- Witness min account age: 14 ngày
- Witness min anti-sybil score: 0.75
- Witness graph distance min hops: 2
- Max same witness pairs/epoch: 3
- Penalty on suspicion: -0.3 Ux, cap to 1.5, force audit

---

## INTEGRITY SYSTEM

### Anti-Sybil
- Min anti-sybil score: 0.6
- Dưới ngưỡng: K = 0, REJECT

### Fraud Penalties

| Fraud Type | K Value | Action | Ban Days |
|------------|---------|--------|----------|
| BOT | 0.0 | REJECT | 30 |
| SYBIL | 0.0 | REJECT | 60 |
| COLLUSION | 0.2 | REVIEW_HOLD | 14 |
| SPAM | 0.3 | REJECT | 7 |
| WASH | 0.0 | REVIEW_HOLD | 30 |

### Stake-for-Trust
- Enabled: true
- Token: CAMLY
- Boost max: 1.2
- Behavior boost max: 1.1

---

## MINTING RULES

### Công thức Mint
\`\`\`
amountAtomic = baseRewardAtomic × Q × I × K × Ux
(sau đó áp dụng caps, audit rules, buffer, rounding)
\`\`\`

### Min/Max Amounts
- Min mint: 1 FUN
- Max mint per action: 500,000 FUN
- Rounding: floor

### Decision Rules
- Fail thresholds → REJECT
- Fraud review → REVIEW_HOLD
- Audit triggered → REVIEW_HOLD
- Missing attestation → REVIEW_HOLD
- Rate limited → REJECT_AND_LOG
- Pass → AUTHORIZE

### Settlement Lanes

**Fast Lane:**
- Amount < 5,000 FUN
- Không có fraud flags
- Có attestation nếu cần

**Review Lane:**
- Amount ≥ 5,000 FUN
- Hoặc top 1% epoch

**Auto-Approve SLA:**
- Sau 24h nếu: không fraud flags + có attestation

---

## AUDIT SYSTEM

- Enabled: true
- Trigger: ≥5,000 FUN hoặc top 1% epoch
- Random sampling: 10% large mints, 1% all mints
- Action: REVIEW_HOLD
- Review SLA: 24h

---

## ATTESTATION

### Required Platforms
- FUN_CHARITY
- FUN_EARTH
- FUN_FARM
- FUN_INVEST

### Verification
- Type: EIP712 hoặc ED25519
- Witness count for Ux > 1.5: 1

---

## EMERGENCY CONTROLS

### Pause Mint
- Enabled: true
- Roles: PAUSER_ROLE, GOV_COUNCIL_MULTISIG
- Triggers: fraudSpike, systemAnomaly, oracleFailure, governanceVote
- Cooldown: 1 hour
- Auto-resume: false

### Circuit Breaker
- Enabled: true
- Max mint/hour: 250,000 FUN
- Action: PAUSE_AND_ALERT
- Channels: SLACK_SECURITY, ONCALL_ENGINEERING

---

## RATE LIMITING

| Metric | Limit |
|--------|-------|
| Global mints/second | 50 |
| Per user mints/minute | 3 |
| Burst allowance | 5 |
| Action on limit | REJECT_AND_LOG |

---

## REPUTATION DECAY

- Enabled: true
- Inactivity threshold: 30 ngày
- Decay: 5%/tháng
- Min floor: 0.5
- Restore by: NEW_VERIFIED_ACTIONS, COMMUNITY_SERVICE

---

## CROSS-PLATFORM BONUS

- Enabled: true
- Min platforms: 3
- Bonus Ux: +0.1
- Max bonus Ux: +0.3

---

## TIER DEFINITIONS

| Tier | Verified Actions | Avg Light Score | Avg K | Max Ux |
|------|------------------|-----------------|-------|--------|
| 0 | 0 | 0 | 0.0 | 1.0 |
| 1 | 10 | 65 | 0.7 | 1.5 |
| 2 | 50 | 70 | 0.75 | 2.0 |
| 3 | 200 | 75 | 0.8 | 2.5 |

---

## PLATFORM POOLS (Per Epoch)

| Platform | Pool Size (FUN) |
|----------|-----------------|
| FUN_ACADEMY | 1,000,000 |
| FUN_CHARITY | 750,000 |
| FUN_EARTH | 750,000 |
| FUNLIFE | 500,000 |
| FUN_FARM | 400,000 |
| FUN_PLAY | 400,000 |
| FUN_PROFILE | 400,000 |
| FUN_MARKET | 200,000 |
| ANGEL_AI | 150,000 |
| FUN_INVEST | 150,000 |
| FUN_LEGAL | 100,000 |
| FUN_PLANET | 50,000 |
| FUN_TRADING | 50,000 |
| RESERVE_BUFFER | 100,000 |
| FUN_WALLET | 0 |

---

## ACTION CONFIGS BY PLATFORM

### ANGEL_AI
| Action | Base Reward | Min T | Min Light | Min K | Min U |
|--------|-------------|-------|-----------|-------|-------|
| AI_REVIEW_HELPFUL | 50 FUN | 80 | 65 | 0.7 | 60 |
| FRAUD_REPORT_VALID | 120 FUN | 85 | 70 | 0.8 | 65 |
| MODERATION_HELP | 60 FUN | 80 | 65 | 0.75 | 60 |
| MODEL_IMPROVEMENT | 150 FUN | 85 | 70 | 0.8 | 60 |

### FUN_PROFILE
| Action | Base Reward | Min T | Min Light | Min K | Min U |
|--------|-------------|-------|-----------|-------|-------|
| CONTENT_CREATE | 70 FUN | 70 | 60 | 0.7 | 55 |
| CONTENT_REVIEW | 40 FUN | 75 | 62 | 0.75 | 60 |
| MENTOR_HELP | 150 FUN | 75 | 65 | 0.75 | 70 |
| COMMUNITY_BUILD | 120 FUN | 70 | 65 | 0.75 | 75 |

### FUN_PLAY
| Action | Base Reward | Min T | Min Light | Min K | Min U |
|--------|-------------|-------|-----------|-------|-------|
| VIDEO_PUBLISH | 200 FUN | 70 | 65 | 0.75 | 60 |
| VIDEO_EDU_SERIES | 500 FUN | 75 | 70 | 0.8 | 65 |
| VIEW_QUALITY_SESSION | 2 FUN | 70 | 60 | 0.85 | 50 |

### FUN_CHARITY
| Action | Base Reward | Min T | Min S | Min Light | Min K | Min U |
|--------|-------------|-------|-------|-----------|-------|-------|
| DONATE | 120 FUN | 85 | 75 | 65 | 0.8 | 65 |
| VOLUNTEER | 150 FUN | 80 | 75 | 65 | 0.75 | 70 |
| CAMPAIGN_DELIVERY_PROOF | 250 FUN | 90 | 80 | 70 | 0.85 | 70 |
| IMPACT_REPORT | 120 FUN | 90 | - | 70 | 0.85 | 65 |

### FUN_ACADEMY
| Action | Base Reward | Min T | Min Light | Min K | Min U |
|--------|-------------|-------|-----------|-------|-------|
| LEARN_COMPLETE | 200 FUN | 70 | 60 | 0.6 | 50 |
| QUIZ_PASS | 50 FUN | 75 | 60 | 0.65 | 50 |
| PROJECT_SUBMIT | 500 FUN | 75 | 65 | 0.65 | 60 |
| PEER_REVIEW | 70 FUN | 75 | 62 | 0.7 | 60 |
| MENTOR_HELP | 250 FUN | 75 | 68 | 0.75 | 70 |

### FUN_EARTH
| Action | Base Reward | Min T | Min S | Min Light | Min K | Min U |
|--------|-------------|-------|-------|-----------|-------|-------|
| TREE_PLANT | 90 FUN | 80 | 70 | 65 | 0.75 | 65 |
| CLEANUP_EVENT | 150 FUN | 80 | 75 | 68 | 0.75 | 70 |
| PARTNER_VERIFIED_REPORT | 220 FUN | 90 | - | 72 | 0.85 | 70 |

### FUN_FARM
| Action | Base Reward | Min T | Min C | Min Light | Min K | Min U |
|--------|-------------|-------|-------|-----------|-------|-------|
| FARM_DELIVERY | 80 FUN | 80 | 70 | 65 | 0.75 | 60 |
| QUALITY_CERT | 120 FUN | 85 | 75 | 70 | 0.8 | 60 |
| WASTE_REDUCTION | 150 FUN | 80 | 75 | 70 | 0.8 | 65 |
| FAIR_TRADE_ORDER | 60 FUN | 80 | - | 65 | 0.75 | 65 |

### FUN_LEGAL
| Action | Base Reward | Min T | Min Light | Min K | Min U |
|--------|-------------|-------|-----------|-------|-------|
| GOV_PROPOSAL | 200 FUN | 85 | 70 | 0.8 | 70 |
| POLICY_REVIEW | 120 FUN | 85 | 68 | 0.8 | 70 |
| DISPUTE_RESOLVE | 300 FUN | 90 | 72 | 0.85 | 80 |
| LEGAL_TEMPLATE_CREATE | 180 FUN | 88 | 70 | 0.85 | 70 |

### FUN_INVEST
| Action | Base Reward | Min T | Min C | Min Light | Min K | Min U |
|--------|-------------|-------|-------|-----------|-------|-------|
| DUE_DILIGENCE_REPORT | 250 FUN | 85 | 75 | 70 | 0.8 | 65 |
| MENTOR_STARTUP | 300 FUN | 80 | 75 | 70 | 0.8 | 75 |
| IMPACT_KPI_REVIEW | 200 FUN | 88 | - | 70 | 0.85 | 65 |

### FUNLIFE
| Action | Base Reward | Min T | Min S | Min Light | Min K | Min U |
|--------|-------------|-------|-------|-----------|-------|-------|
| DAILY_RITUAL | 20 FUN | 70 | - | 60 | 0.7 | 60 |
| SERVICE_QUEST | 150 FUN | 75 | 70 | 65 | 0.75 | 70 |
| UNITY_MISSION_COMPLETE | 250 FUN | 80 | - | 70 | 0.8 | 80 |

### FUN_MARKET
| Action | Base Reward | Min T | Min C | Min Light | Min K | Min U |
|--------|-------------|-------|-------|-----------|-------|-------|
| FAIR_TRADE_ORDER | 40 FUN | 80 | - | 65 | 0.75 | 65 |
| SELLER_VERIFIED_DELIVERY | 80 FUN | 85 | 70 | 68 | 0.8 | 65 |
| REVIEW_HELPFUL | 15 FUN | 75 | - | 62 | 0.8 | 60 |

### FUN_WALLET
| Action | Base Reward | Min T | Min Light | Min K | Min U |
|--------|-------------|-------|-----------|-------|-------|
| DONATE_FROM_WALLET | 30 FUN | 85 | 65 | 0.85 | 65 |
| PAYMENT_FOR_SERVICE | 15 FUN | 80 | 62 | 0.85 | 60 |

### FUN_TRADING
| Action | Base Reward | Min T | Min C | Min Light | Min K | Min U |
|--------|-------------|-------|-------|-----------|-------|-------|
| RISK_LESSON_COMPLETE | 60 FUN | 70 | 65 | 62 | 0.7 | 55 |
| PAPER_TRADE_DISCIPLINE | 80 FUN | 70 | 70 | 65 | 0.75 | 55 |
| JOURNAL_SUBMIT | 50 FUN | 75 | 70 | 65 | 0.75 | 60 |

### FUN_PLANET
| Action | Base Reward | Min T | Min Light | Min K | Min U |
|--------|-------------|-------|-----------|-------|-------|
| KID_QUEST_COMPLETE | 10 FUN | 80 | 60 | 0.8 | 60 |
| PARENT_VERIFY | 3 FUN | 85 | 65 | 0.85 | 60 |
| TEACHER_BADGE | 50 FUN | 85 | 70 | 0.85 | 70 |

---

## GOVERNANCE

- Policy update: MULTISIG_3_OF_5
- Proposal cooldown: 7 ngày
- Community vote threshold: 66%
- Emergency override: FOUNDING_COUNCIL
- Roles:
  - SIGNER_ROLE: TSS_OR_MULTISIG
  - PAUSER_ROLE: SECURITY_COUNCIL
  - POLICY_ADMIN: GOVERNANCE_EXECUTOR

---

## MIGRATION

- Previous version: 2
- Backward compatible: true
- Upgrade notes:
  - v1.0.2 thêm emergency + governance + migration + edge-case handling
  - Thêm rate limiting + reputation decay + cross-platform bonus + burn mechanism
  - Không thay đổi actionType
  - Khuyến nghị rotate signer mỗi 90 ngày

---

## BURN MECHANISM

### Burn for Unity Boost
- Enabled: true
- Max Ux boost/epoch: 0.2
- Burn per 0.1 Ux: 10 FUN

### Charity Burn
- Enabled: true
- Default burn percent: 100%
- FUN donated to burn charity pools được burn hoặc long-lock theo governance

---

## EDGE CASES

### Platform Pool Depleted
- Action: QUEUE_TO_NEXT_EPOCH
- Priority for: FUN_CHARITY, FUN_EARTH
- Notify user: true

### Rollback Fraud After Mint
- Enabled: true
- Action: SLASH_TIER_AND_FREEZE
- Note: Không forced token clawback trong MVP

### Dispute Resolution
- SLA: 72 giờ
- Max appeals/epoch: 1
- Appeal fee: 5 FUN
- Fee burn: 50%
- Auto-approve after SLA if clean: true`
  },
  {
    id: 'mint-guide',
    title: 'Hướng dẫn Mint FUN Money (3 bước)',
    description: 'Quy trình Lock → Activate → Claim',
    icon: '✨',
    category: 'mint_guide',
    content: `# HƯỚNG DẪN MINT FUN MONEY

FUN Money là đồng tiền Ánh Sáng (Father's Light Money) được mint theo giá trị đóng góp thông qua giao thức PPLP (Proof of Pure Love Protocol).

## FUN MONEY LÀ GÌ?

FUN Money là token BEP-20 trên mạng BSC (Binance Smart Chain):
• Không "in trước để bán" - không có pre-mint
• Không phụ thuộc "khan hiếm" 
• Được mint theo giá trị Ánh Sáng mà cộng đồng tạo ra
• Địa chỉ hợp đồng: 0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2 (BSC Testnet)

## QUY TRÌNH MINT 3 BƯỚC

### Bước 1: Lock (Khóa token) - Tự động
Khi bạn thực hiện một "Light Action" (hành động Ánh Sáng), hệ thống sẽ tự động:
1. Ghi nhận hành động vào bảng pplp_actions
2. Tính toán Light Score dựa trên 5 trụ cột PPLP
3. Nếu đạt ngưỡng tối thiểu 50 điểm → Khóa FUN Money vào ví Treasury
4. Số FUN được tính theo công thức: BaseReward × QualityMultiplier × ImpactMultiplier
5. Trạng thái: "Đang khóa" (Locked)

### Bước 2: Activate (Kích hoạt) - Người dùng thực hiện
1. Truy cập trang /mint để xem các FUN Money đang khóa
2. Kết nối ví MetaMask (mạng BSC Testnet)
3. Nhấn nút "Kích hoạt" để chuyển từ trạng thái "Locked" sang "Activated"
4. Ký giao dịch trong MetaMask
5. Trạng thái: "Đã kích hoạt" (Activated)

### Bước 3: Claim (Nhận token) - Người dùng thực hiện
1. Sau khi kích hoạt thành công, nhấn nút "Nhận về ví"
2. Ký giao dịch trong MetaMask
3. FUN Money sẽ được chuyển vào ví của bạn
4. Trạng thái: "Có thể chi tiêu" (Spendable)

## LƯU Ý QUAN TRỌNG

• Mỗi Light Action cần đạt Light Score tối thiểu 50 điểm để được thưởng
• Giới hạn nhận thưởng: 8 FUN/ngày/người
• Cần có ví Web3 (MetaMask) để thực hiện Activate và Claim
• Mạng hỗ trợ: BSC Testnet (Chain ID: 97)

## PHẦN THƯỞNG THEO LOẠI HÀNH ĐỘNG

• Hỏi đáp/Chat với Angel AI: 1 FUN
• Viết nhật ký biết ơn: 3 FUN  
• Đăng bài cộng đồng: 5 FUN
• Tặng quà/Donate: 8 FUN

## XEM SỐ DƯ FUN MONEY

Truy cập trang /mint để xem:
• Số FUN đang khóa (Locked)
• Số FUN đã kích hoạt (Activated)
• Số FUN có thể chi tiêu (Spendable)
• Lịch sử các hành động Ánh Sáng

## HỖ TRỢ

Nếu gặp vấn đề trong quá trình mint, vui lòng:
1. Kiểm tra kết nối ví MetaMask
2. Đảm bảo đang ở đúng mạng BSC Testnet
3. Liên hệ với Angel AI để được hỗ trợ`
  },
  {
    id: 'five-pillars',
    title: '5 Trụ cột PPLP',
    description: 'Phụng sự, Chân thật, Chữa lành, Bền vững, Hợp nhất',
    icon: '🏛️',
    category: 'pillars',
    content: `# 5 TRỤ CỘT PPLP - BỘ TIÊU CHUẨN TÌNH YÊU THUẦN KHIẾT

PPLP (Proof of Pure Love Protocol) là giao thức đồng thuận xác minh giá trị đóng góp dựa trên 5 trụ cột cốt lõi. Mỗi hành động muốn mint FUN Money phải đạt ngưỡng tối thiểu của 5 trụ cột:

## TRỤ CỘT 1: PHỤNG SỰ SỰ SỐNG (Serving - S)
**Câu hỏi kiểm tra:** Hành động có lợi ích vượt khỏi cái tôi không?

• Đóng góp mang lại giá trị cho người khác
• Không chỉ phục vụ lợi ích cá nhân
• Tạo tác động tích cực cho cộng đồng
• Ví dụ: Giúp đỡ người khác học tập, chia sẻ kiến thức, tình nguyện

## TRỤ CỘT 2: CHÂN THẬT MINH BẠCH (Truth - T)
**Câu hỏi kiểm tra:** Có bằng chứng và kiểm chứng được không?

• Hành động có thể xác minh qua dữ liệu
• Không gian lận hoặc giả mạo
• Thông tin trung thực và rõ ràng
• Ví dụ: Log hoàn thành khóa học, giao dịch từ thiện on-chain

## TRỤ CỘT 3: CHỮA LÀNH & NÂNG ĐỠ (Healing - H)
**Câu hỏi kiểm tra:** Có tăng hạnh phúc / giảm khổ đau / tạo an toàn không?

• Mang lại cảm giác tích cực
• Hỗ trợ sức khỏe tinh thần
• Tạo môi trường an toàn
• Ví dụ: Nhật ký biết ơn, lời động viên, nội dung chữa lành

## TRỤ CỘT 4: ĐÓNG GÓP BỀN VỮNG (Continuity - C)
**Câu hỏi kiểm tra:** Có tạo giá trị dài hạn cho cộng đồng/hệ sinh thái không?

• Đóng góp có tác động lâu dài
• Không chỉ là hành động tức thời
• Xây dựng nền tảng cho tương lai
• Ví dụ: Tạo khóa học, đóng góp mã nguồn, xây dựng cộng đồng

## TRỤ CỘT 5: HỢP NHẤT (Unity - U)
**Câu hỏi kiểm tra:** Có tăng kết nối – hợp tác – cùng thắng (win together) không?

• Thúc đẩy sự đoàn kết
• Tạo cơ hội hợp tác
• Mang lại lợi ích cho nhiều bên
• Ví dụ: Kết nối người học với mentor, tổ chức sự kiện cộng đồng

## CÔNG THỨC TÍNH LIGHT SCORE

Light Score = (S + T + H + C + U) / 5 × Multipliers

Trong đó:
• S, T, H, C, U: Điểm từng trụ cột (0-100)
• Multipliers: Hệ số chất lượng, tác động, độ tin cậy

**Ngưỡng tối thiểu để mint FUN Money: 50 điểm**

## NGUYÊN TẮC VẬN HÀNH

✨ "Không tách biệt, không kiểm soát; chỉ phụng sự – chữa lành – hợp nhất"

Chỉ khi đủ 5 trụ cột: FUN Money được mint như một phước lành.`
  },
  {
    id: 'distribution',
    title: 'Công thức phân phối FUN Money',
    description: 'Community Genesis → Platform → Partner → User',
    icon: '💰',
    category: 'distribution',
    content: `# CÔNG THỨC PHÂN PHỐI FUN MONEY

FUN Money được phân phối theo cấu trúc cascade đảm bảo công bằng và bền vững cho toàn hệ sinh thái.

## MÔ HÌNH PHÂN PHỐI CASCADE

### Tầng 1: Community Genesis Pool (40%)
• Quỹ khởi đầu cho cộng đồng
• Dành cho early adopters và builders
• Thưởng cho những đóng góp đầu tiên
• Quản lý bởi FUN Treasury

### Tầng 2: Platform Pool (30%)
• Phát triển và vận hành nền tảng
• Bảo trì hạ tầng kỹ thuật
• Đầu tư nghiên cứu và phát triển
• Chi phí máy chủ và dịch vụ

### Tầng 3: Partner Pool (15%)
• Thưởng cho đối tác chiến lược
• Hỗ trợ mở rộng hệ sinh thái
• Marketing và quan hệ đối tác
• Tích hợp với dịch vụ bên ngoài

### Tầng 4: User Pool (15%)
• Phần thưởng trực tiếp cho người dùng
• Thưởng cho Light Actions
• Incentives cho hoạt động hàng ngày
• Giới hạn: 8 FUN/ngày/người

## CÔNG THỨC MINT CHI TIẾT

### Công thức cơ bản:
FUN Mint = BaseReward × QualityMultiplier × ImpactMultiplier × IntegrityMultiplier

### Các biến số:
• **BaseReward**: Thưởng cơ bản của loại hành động
  - Hỏi đáp: 1 FUN
  - Nhật ký: 3 FUN
  - Đăng bài: 5 FUN
  - Donate: 8 FUN

• **QualityMultiplier (Q)**: Chất lượng nội dung (0.5 – 3.0)
  - Nội dung ngắn, đơn giản: 0.5x
  - Nội dung chuẩn: 1.0x
  - Nội dung chất lượng cao: 2.0x
  - Nội dung xuất sắc: 3.0x

• **ImpactMultiplier (I)**: Tác động thực tế (0.5 – 5.0)
  - Tác động cá nhân: 0.5x
  - Tác động nhóm nhỏ: 1.0x
  - Tác động cộng đồng: 2.0x
  - Tác động hệ sinh thái: 5.0x

• **IntegrityMultiplier**: Độ tin cậy chống gian lận (0 – 1.0)
  - Bot/spam detected: 0
  - Người dùng mới: 0.5x
  - Người dùng đã verify: 0.8x
  - Người dùng uy tín cao: 1.0x

## GIỚI HẠN VÀ KIỂM SOÁT

### Daily Caps (Giới hạn ngày):
• Tối đa 8 FUN/ngày/người
• Tối đa 5 câu hỏi được thưởng/ngày
• Tối đa 3 nhật ký được thưởng/ngày
• Tối đa 3 bài đăng được thưởng/ngày

### Weekly Caps (Giới hạn tuần):
• Tổng tối đa 50 FUN/tuần/người
• Quy luật diminishing returns sau ngưỡng

### Cooldown (Thời gian nghỉ):
• 30 giây giữa các hành động
• 5 phút cho cùng loại hành động
• 24 giờ reset daily caps

## VÍ DỤ TÍNH TOÁN

User viết nhật ký biết ơn chất lượng cao:
• BaseReward = 3 FUN (nhật ký)
• QualityMultiplier = 2.0 (nội dung sâu sắc)
• ImpactMultiplier = 1.0 (tác động cá nhân)
• IntegrityMultiplier = 1.0 (tài khoản uy tín)

→ FUN Mint = 3 × 2.0 × 1.0 × 1.0 = 6 FUN

Tuy nhiên, bị cap tại 3 FUN (giới hạn cho loại hành động nhật ký).`
  },
  {
    id: 'light-actions',
    title: 'Các loại Light Actions (40+ loại)',
    description: 'Hành động được thưởng FUN Money',
    icon: '⚡',
    category: 'actions',
    content: `# CÁC LOẠI LIGHT ACTIONS - HÀNH ĐỘNG ÁNH SÁNG

Light Actions là các hành động tạo giá trị được ghi nhận và thưởng FUN Money thông qua giao thức PPLP.

## PHÂN LOẠI THEO PLATFORM

### 🎓 FUN Academy (Học tập)
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| LEARN_COMPLETE | Hoàn thành bài học/khóa học | 2,000 |
| PROJECT_SUBMIT | Nộp dự án thực hành | 5,000 |
| MENTOR_HELP | Hỗ trợ mentoring người khác | 3,000 |
| COURSE_CREATE | Tạo khóa học mới | 10,000 |
| QUIZ_PASS | Vượt qua bài kiểm tra | 1,000 |

### 💬 Community & Content
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| CONTENT_CREATE | Tạo nội dung mới (bài đăng) | 1,500 |
| CONTENT_REVIEW | Đánh giá/review nội dung | 1,000 |
| CONTENT_SHARE | Chia sẻ nội dung hữu ích | 500 |
| COMMENT_CREATE | Bình luận có giá trị | 500 |
| POST_ENGAGEMENT | Tương tác với bài đăng | 300 |

### 💝 FUN Charity (Từ thiện)
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| DONATE | Đóng góp từ thiện | 2,000 + matching |
| VOLUNTEER | Hoạt động tình nguyện | 3,000 |
| CAMPAIGN_CREATE | Tạo chiến dịch từ thiện | 5,000 |
| CAMPAIGN_SUPPORT | Hỗ trợ chiến dịch | 1,000 |

### 🌍 FUN Earth (Môi trường)
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| TREE_PLANT | Trồng cây (có verify) | 2,000 |
| CLEANUP_EVENT | Tham gia dọn dẹp môi trường | 2,500 |
| CARBON_OFFSET | Bù đắp carbon | 1,500 |
| ECO_ACTION | Hành động xanh nhỏ | 500 |

### 🛒 Commerce (Thương mại)
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| FARM_DELIVERY | Giao hàng nông sản đạt chuẩn | 2,000 |
| MARKET_FAIR_TRADE | Giao dịch công bằng | 1,500 |
| PRODUCT_REVIEW | Đánh giá sản phẩm trung thực | 800 |
| SELLER_VERIFY | Xác minh người bán | 2,000 |

### ⚖️ Governance (Quản trị)
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| BUG_BOUNTY | Phát hiện và báo lỗi | 10,000 |
| GOV_PROPOSAL | Đề xuất chính sách | 5,000 |
| GOV_VOTE | Bỏ phiếu quản trị | 500 |
| DISPUTE_RESOLVE | Giải quyết tranh chấp | 3,000 |
| POLICY_REVIEW | Đánh giá chính sách | 1,500 |

### 🌟 Daily Life (Angel AI & FUN Life)
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| DAILY_RITUAL | Thực hành hàng ngày | 500 |
| GRATITUDE_PRACTICE | Viết biết ơn | 1,000 |
| JOURNAL_WRITE | Viết nhật ký | 2,000 |
| QUESTION_ASK | Đặt câu hỏi chất lượng | 1,500 |
| DAILY_LOGIN | Đăng nhập hàng ngày | 100 |

### 💹 Investment & Trading
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| STAKE_LOCK | Khóa token staking | Tính riêng |
| LIQUIDITY_PROVIDE | Cung cấp thanh khoản | Tính riêng |
| REFERRAL_INVITE | Mời người dùng mới | 1,000 |

### 🆔 Identity & Profile
| Action Type | Mô tả | Base Reward |
|-------------|-------|-------------|
| PROFILE_COMPLETE | Hoàn thiện hồ sơ | 2,000 |
| KYC_VERIFY | Xác minh danh tính | 5,000 |
| REPUTATION_EARN | Đạt mốc danh tiếng | 1,000 |

## YÊU CẦU ĐỂ ĐƯỢC THƯỞNG

### Điều kiện cơ bản:
• Light Score tối thiểu: 50 điểm
• Không bị phát hiện spam/bot
• Nội dung tối thiểu: 25 ký tự
• Cooldown: 30 giây giữa các hành động

### Evidence (Bằng chứng) cần có:
• Log hệ thống
• Screenshot/ảnh chứng minh
• Transaction hash (cho blockchain)
• GPS/location (cho hoạt động thực địa)
• Attestation từ bên thứ 3

## LƯU Ý QUAN TRỌNG

⚠️ Hành động vi phạm sẽ bị từ chối:
• Spam nội dung
• Copy-paste không có giá trị
• Fake engagement
• Bot automation
• Collusion (cấu kết nâng điểm)`
  },
  {
    id: 'anti-fraud',
    title: 'Quy tắc chống gian lận',
    description: 'Anti-sybil, rate limits, reputation gating',
    icon: '🛡️',
    category: 'anti_fraud',
    content: `# QUY TẮC CHỐNG GIAN LẬN PPLP

Hệ thống PPLP được thiết kế với nhiều lớp bảo vệ để đảm bảo tính công bằng và ngăn chặn gian lận.

## 5 LOẠI GIAN LẬN PHỔ BIẾN

### 1. Sybil Attack
• **Mô tả**: Tạo nhiều tài khoản giả để farm rewards
• **Phát hiện**: Device fingerprint, IP correlation, social graph analysis
• **Xử lý**: Block tất cả tài khoản liên quan, không mint FUN

### 2. Bot Automation
• **Mô tả**: Sử dụng bot để tự động tạo hoạt động
• **Phát hiện**: 
  - Hơn 20 hành động/giờ
  - Khoảng cách thời gian đều đặn <1 phút
  - Pattern hành vi không tự nhiên
• **Xử lý**: IntegrityMultiplier = 0

### 3. Wash Contribution
• **Mô tả**: Tự tạo giao dịch giả, feedback giả cho chính mình
• **Phát hiện**: Graph analysis, transaction pattern
• **Xử lý**: Đánh dấu fraud, không mint

### 4. Collusion
• **Mô tả**: Nhóm người cấu kết nâng điểm cho nhau
• **Phát hiện**: Concentrated interactions between account pairs
• **Xử lý**: Giảm weight cho nhóm, cảnh báo

### 5. Low-value Spam
• **Mô tả**: Nội dung rác số lượng lớn
• **Phát hiện**: 
  - Độ dài nội dung <25 ký tự
  - Hash trùng lặp
  - Content similarity cao
• **Xử lý**: is_spam = true, không thưởng

## BỘ CÔNG CỤ THỰC THI

### 1. Proof of Personhood (Nhẹ nhàng)
• Phone/email verification
• Device fingerprinting
• Social graph signals từ FUN Profile
• Không yêu cầu KYC đầy đủ cho hành động cơ bản

### 2. Rate Limits
| Loại | Giới hạn |
|------|----------|
| Hành động/phút | 2 |
| Hành động/giờ | 20 |
| Câu hỏi/ngày | 5 |
| Nhật ký/ngày | 3 |
| Bài đăng/ngày | 3 |
| FUN/ngày | 8 |
| FUN/tuần | 50 |

### 3. Cooldown Periods
• 30 giây giữa các hành động
• 5 phút cho cùng loại hành động
• 24 giờ reset daily limits

### 4. Stake-for-Trust
• Đặt cọc Camly Coin để mở khóa mức thưởng cao hơn
• Tăng reputation tier
• Giảm thời gian cooldown

### 5. Reputation Gating
| Tier | Tên | Cap Multiplier | Yêu cầu |
|------|-----|----------------|---------|
| 0 | New | 1x | Mới đăng ký |
| 1 | Bronze | 1.2x | 10+ hành động |
| 2 | Silver | 1.5x | 50+ hành động + verify |
| 3 | Gold | 2x | 200+ hành động + stake |
| 4 | Diamond | 2.5x | 500+ hành động + community |
| 5 | Light | 3x | Top contributors |

### 6. Random Audits
• Kiểm tra ngẫu nhiên các hành động
• Community reporting
• Angel AI anomaly detection

## FRAUD DETECTION ALGORITHM

### Risk Score Calculation
Risk Score = Σ(Signal Weight × Signal Value)

| Signal | Weight |
|--------|--------|
| Device collision | 30 |
| IP collision | 20 |
| Timing anomaly | 15 |
| Content duplicate | 10 |
| Graph anomaly | 15 |
| Behavioral score low | 10 |

**Ngưỡng xử lý:**
• Risk Score > 50: Block auto-minting, pending review
• Risk Score > 80: Auto-reject, flag account

### Fraud Response
1. **Detection**: pplp-detect-fraud function phân tích
2. **Logging**: Ghi nhận fraud signals với severity
3. **Action**: 
   - Severity low: Cảnh báo, giảm multiplier
   - Severity medium: Block minting, yêu cầu verify
   - Severity high: Suspend account, review

## ĐẢM BẢO MINH BẠCH

### Evidence Anchoring
• Mỗi hành động có evidence_hash (keccak256)
• Lưu trữ canonical_hash của JSON data
• Không thể thay đổi sau khi submit

### Policy Snapshot
• Snapshot quy tắc tại thời điểm submit
• Audit trail đầy đủ
• Governance proposals để thay đổi policy

## KHIẾU NẠI VÀ GIẢI QUYẾT

1. User có thể submit dispute qua /docs/popl
2. Admin review trong 48 giờ
3. Community vote cho cases quan trọng
4. FUN Legal xử lý tranh chấp phức tạp

**Nguyên tắc**: Công bằng, minh bạch, bảo vệ người dùng trung thực.`
  },
  {
    id: 'technical-spec-v1',
    title: 'Technical Spec PPLP v1.0 + Smart Contract',
    description: 'Kiến trúc hệ thống, data model, scoring formula, on-chain interface và Solidity code cho FUN Money Mint Engine',
    icon: '⚙️',
    category: 'technical_spec',
    content: TECHNICAL_SPEC_CONTENT
  }
];

// Helper to get PPLP folder name
export const PPLP_FOLDER_NAME = 'PPLP Documents';

// Helper to get document title with prefix
export const getPPLPDocumentTitle = (templateTitle: string) => `[PPLP] ${templateTitle}`;
