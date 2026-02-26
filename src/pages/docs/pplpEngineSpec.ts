import { 
  Server, Database, Shield, Code, Settings, 
  FileCode, Layers, Users, AlertTriangle, BookOpen,
  Cpu, GitBranch, Workflow, Key, CheckCircle
} from "lucide-react";

export const engineSpecSections = [
  {
    id: "tech-baseline",
    icon: Server,
    title: "0. TECH BASELINE",
    subtitle: "Recommended Stack",
    content: [
      "🛠️ Công nghệ khuyến nghị để triển khai nhanh & chắc chắn:"
    ],
    techStack: [
      { name: "API", value: "Node.js (NestJS/Express) hoặc Go (Gin)" },
      { name: "DB", value: "PostgreSQL" },
      { name: "Queue", value: "Redis + BullMQ (hoặc SQS)" },
      { name: "Storage evidence", value: "IPFS/Arweave (production), S3 (MVP)" },
      { name: "Signature", value: "EIP-712 (ethers v6)" },
      { name: "Observability", value: "OpenTelemetry + Grafana/Datadog" }
    ]
  },
  {
    id: "domain-model",
    icon: Layers,
    title: "1. DOMAIN MODEL",
    subtitle: "Core Entities",
    content: [
      "📐 1.1. Entities chính trong hệ thống PPLP:"
    ],
    entities: [
      { name: "User", description: "Địa chỉ ví + hồ sơ FUN Profile (DID optional)" },
      { name: "Platform", description: "1 trong các FUN platforms" },
      { name: "Action", description: "Hành động tạo giá trị (canonical)" },
      { name: "Evidence", description: "Bằng chứng (URI + hash + type)" },
      { name: "Score", description: "Điểm 5 trụ cột + multipliers + kết quả pass/fail" },
      { name: "MintAuthorization", description: "Request đã được ký EIP-712" },
      { name: "FraudSignal", description: "Tín hiệu bot/sybil/collusion/spam" },
      { name: "Policy", description: "Versioned scoring rules" },
      { name: "Dispute", description: "Khiếu nại/điều tra (FUN Legal)" }
    ]
  },
  {
    id: "api-endpoints",
    icon: GitBranch,
    title: "2. API ENDPOINTS v1.0",
    subtitle: "REST API Specification",
    content: [
      "🌐 Danh sách các API endpoints chính:"
    ],
    apiEndpoints: [
      {
        category: "Auth / Identity",
        endpoints: [
          { method: "POST", path: "/v1/auth/nonce", description: "Lấy nonce để ký" },
          { method: "POST", path: "/v1/auth/verify", description: "Xác thực SIWE (Sign-In with Ethereum)" }
        ]
      },
      {
        category: "Submit Action",
        endpoints: [
          { method: "POST", path: "/v1/actions", description: "Tạo action + evidence + enqueue scoring" },
          { method: "GET", path: "/v1/actions/:actionId", description: "Lấy thông tin action" },
          { method: "POST", path: "/v1/actions/:actionId/evaluate", description: "Chạy scoring ngay (internal/admin)" }
        ]
      },
      {
        category: "Mint Authorization",
        endpoints: [
          { method: "POST", path: "/v1/mint/authorize", description: "Tạo MintRequest + ký EIP-712" },
          { method: "POST", path: "/v1/mint/confirm", description: "Callback nhận event on-chain" }
        ]
      },
      {
        category: "Policy",
        endpoints: [
          { method: "GET", path: "/v1/policies/current", description: "Lấy policy hiện tại" },
          { method: "GET", path: "/v1/policies/:version", description: "Lấy policy theo version" },
          { method: "POST", path: "/v1/policies", description: "Upload policy JSON mới (admin)" }
        ]
      },
      {
        category: "Fraud / Signals",
        endpoints: [
          { method: "POST", path: "/v1/fraud/signals", description: "Gửi tín hiệu nghi ngờ" },
          { method: "GET", path: "/v1/fraud/users/:address", description: "Lịch sử tín hiệu + risk score" }
        ]
      },
      {
        category: "Disputes",
        endpoints: [
          { method: "POST", path: "/v1/disputes", description: "Tạo dispute mới" },
          { method: "GET", path: "/v1/disputes/:id", description: "Lấy thông tin dispute" },
          { method: "POST", path: "/v1/disputes/:id/resolve", description: "Giải quyết dispute (admin/arb)" }
        ]
      }
    ]
  },
  {
    id: "db-schema",
    icon: Database,
    title: "3. DB SCHEMA (PostgreSQL)",
    subtitle: "Database Tables",
    content: [
      "🗄️ Các bảng chính trong database:",
      "",
      "Gợi ý: dùng uuid cho id, bytea/text cho hash, jsonb cho metadata."
    ],
    dbTables: [
      {
        name: "users",
        columns: [
          "id uuid PK",
          "address varchar(42) UNIQUE NOT NULL",
          "did text NULL",
          "tier int NOT NULL DEFAULT 0",
          "created_at timestamptz"
        ]
      },
      {
        name: "platforms",
        columns: [
          "id text PK (FUN_PROFILE, FUN_ACADEMY…)",
          "name text",
          "is_enabled bool"
        ]
      },
      {
        name: "actions",
        columns: [
          "id uuid PK",
          "platform_id text FK platforms(id)",
          "action_type text",
          "actor_address varchar(42)",
          "timestamp timestamptz",
          "metadata jsonb",
          "impact jsonb",
          "integrity jsonb",
          "status text (RECEIVED, PENDING, SCORED, REJECTED, MINT_AUTHORIZED, MINTED)",
          "canonical_hash text (keccak256 of canonical json)",
          "evidence_hash text (keccak256 evidence bundle)",
          "policy_version int",
          "created_at timestamptz"
        ]
      },
      {
        name: "evidences",
        columns: [
          "id uuid PK",
          "action_id uuid FK actions(id)",
          "type text",
          "uri text",
          "content_hash text NULL",
          "created_at timestamptz"
        ]
      },
      {
        name: "scores",
        columns: [
          "id uuid PK",
          "action_id uuid UNIQUE FK actions(id)",
          "pillar_s int, pillar_t int, pillar_h int, pillar_c int, pillar_u int",
          "light_score numeric(5,2)",
          "base_reward numeric(38,0)",
          "mult_q, mult_i, mult_k numeric(6,3)",
          "reward_amount numeric(38,0)",
          "decision text (PASS/FAIL)",
          "reason_codes text[]",
          "computed_at timestamptz"
        ]
      },
      {
        name: "mint_authorizations",
        columns: [
          "id uuid PK",
          "action_id uuid UNIQUE FK actions(id)",
          "to_address varchar(42)",
          "amount numeric(38,0)",
          "action_id_bytes32 text",
          "evidence_hash text",
          "policy_version int",
          "valid_after/valid_before bigint",
          "nonce numeric(38,0)",
          "signature text",
          "signer_address varchar(42)",
          "status text (SIGNED, SUBMITTED, CONFIRMED, EXPIRED, REVOKED)",
          "tx_hash text NULL",
          "created_at timestamptz"
        ]
      },
      {
        name: "fraud_signals",
        columns: [
          "id uuid PK",
          "actor_address varchar(42)",
          "action_id uuid NULL",
          "signal_type text (SYBIL, BOT, COLLUSION, SPAM, WASH)",
          "severity int (1-5)",
          "details jsonb",
          "source text (ANGEL_AI, PLATFORM, COMMUNITY)",
          "created_at timestamptz"
        ]
      },
      {
        name: "policies",
        columns: [
          "version int PK",
          "policy_hash text",
          "policy_json jsonb",
          "created_at timestamptz"
        ]
      },
      {
        name: "disputes",
        columns: [
          "id uuid PK",
          "action_id uuid",
          "actor_address varchar(42)",
          "reason text",
          "evidence jsonb",
          "status text (OPEN, REVIEW, RESOLVED, REJECTED)",
          "resolution jsonb NULL",
          "created_at timestamptz"
        ]
      }
    ]
  },
  {
    id: "scoring-engine",
    icon: Cpu,
    title: "4. SCORING ENGINE — RUBRIC",
    subtitle: "How Scoring Works",
    content: [
      "📊 4.1. Quy tắc chung (áp dụng mọi platform)"
    ],
    scoringRubric: {
      pillars: [
        { code: "S", name: "Service to Life", range: "0=không lợi ích → 100=lợi ích rõ ràng cho nhiều người" },
        { code: "T", name: "Truth/Transparency", range: "0=không chứng cứ → 100=chứng cứ đầy đủ/đối chiếu được" },
        { code: "H", name: "Healing/Compassion", range: "0=không tạo nâng đỡ → 100=chữa lành/giảm khổ rõ" },
        { code: "C", name: "Contribution durability", range: "0=thoáng qua → 100=tạo tài sản/giá trị dài hạn" },
        { code: "U", name: "Unity alignment", range: "0=gây chia rẽ → 100=tăng kết nối/hợp tác/cùng thắng" }
      ],
      multipliers: [
        { code: "Q", name: "Quality", range: "1.0–3.0", description: "Nội dung/hành động chất lượng cao" },
        { code: "I", name: "Impact", range: "1.0–5.0", description: "Tác động đo được lớn" },
        { code: "K", name: "Integrity", range: "0.0–1.0", description: "Rủi ro gian lận thấp" }
      ],
      defaultThresholds: [
        { metric: "T (Transparency)", value: "≥ 70" },
        { metric: "K (Integrity)", value: "≥ 0.60" },
        { metric: "LightScore", value: "≥ 60" }
      ]
    }
  },
  {
    id: "platform-rubrics",
    icon: BookOpen,
    title: "5. RUBRIC THEO PLATFORM",
    subtitle: "Platform-Specific Scoring",
    content: [
      "📋 Mỗi platform: (A) Actions chính, (B) BaseReward gợi ý, (C) Threshold & multipliers"
    ],
    platformRubrics: [
      {
        id: "angel",
        name: "Angel AI",
        subtitle: "AI Ánh Sáng Platform",
        actions: ["AI_REVIEW_HELPFUL", "FRAUD_REPORT_VALID", "MODEL_IMPROVEMENT", "MODERATION_HELP"],
        rewardLogic: "BaseReward thấp–trung bình, Q cao khi report đúng",
        thresholds: ["T ≥ 80 (vì liên quan \"sự thật\")", "K ≥ 0.75"],
        multiplierNotes: ["Q tăng mạnh khi community confirms \"helpful/accurate\"", "I tăng khi giảm spam/fraud measurable"]
      },
      {
        id: "profile",
        name: "FUN Profile",
        subtitle: "Web3 Social Network",
        actions: ["CONTENT_CREATE", "CONTENT_REVIEW", "MENTOR_HELP", "COMMUNITY_BUILD"],
        rewardLogic: "Create: 50–200, Mentor: 100–500",
        thresholds: ["T ≥ 70", "U ≥ 65", "K ≥ 0.70 (Anti-spam strict)"],
        multiplierNotes: ["Q dựa vào watch/reads + saves + review quality", "I dựa vào số người học/được giúp"]
      },
      {
        id: "play",
        name: "FUN Play",
        subtitle: "Web3 Video Platform",
        actions: ["VIDEO_PUBLISH", "VIDEO_EDU_SERIES", "VIEW_QUALITY_SESSION"],
        rewardLogic: "Creator: 100–1000, Viewer: 1–10 (rất nhỏ) + anti-farm",
        thresholds: ["Creator: LightScore ≥ 65, T ≥ 70", "Viewer: K ≥ 0.85 (chặn farm view)"],
        multiplierNotes: ["Q = retention + reports low + transcript quality", "I = course conversions, community outcomes"]
      },
      {
        id: "planet",
        name: "FUN Planet",
        subtitle: "Game for Kids",
        actions: ["KID_QUEST_COMPLETE", "PARENT_VERIFY", "TEACHER_BADGE"],
        rewardLogic: "Thưởng cho hành vi tốt, học thật",
        thresholds: ["T dựa vào parent/teacher attest (≥80)", "U/H trọng số cao"],
        multiplierNotes: ["family/device graph", "cap chặt cho anti-fraud"]
      },
      {
        id: "charity",
        name: "FUN Charity",
        subtitle: "Pure-Love Charity Network",
        actions: ["DONATE", "VOLUNTEER", "CAMPAIGN_DELIVERY_PROOF", "IMPACT_REPORT"],
        rewardLogic: "BaseReward 300+ cho donate thật",
        thresholds: ["T ≥ 85 (bắt buộc)", "S ≥ 75", "K ≥ 0.80"],
        multiplierNotes: ["I dựa vào verified delivery + partner attestation", "Q dựa vào chứng từ/hồ sơ minh bạch"]
      },
      {
        id: "farm",
        name: "FUN Farm",
        subtitle: "Farm to Table",
        actions: ["FARM_DELIVERY", "QUALITY_CERT", "WASTE_REDUCTION", "FAIR_TRADE_ORDER"],
        rewardLogic: "Thưởng theo chất lượng + giảm lãng phí",
        thresholds: ["T ≥ 80 (traceability)", "C ≥ 70 (bền vững)"],
        multiplierNotes: ["I = kg delivered, waste reduced, beneficiaries", "Q = rating verified buyers"]
      },
      {
        id: "academy",
        name: "FUN Academy",
        subtitle: "Learn & Earn",
        actions: ["LEARN_COMPLETE", "QUIZ_PASS", "PROJECT_SUBMIT", "PEER_REVIEW", "MENTOR_HELP"],
        rewardLogic: "LEARN_COMPLETE: 200, PROJECT_SUBMIT: 500",
        thresholds: ["LEARN: T ≥ 70, LightScore ≥ 60", "PROJECT: C ≥ 70, T ≥ 75"],
        multiplierNotes: ["Q = rubric chấm bài + peer review quality", "I = learner helps others / produces reusable assets"]
      },
      {
        id: "legal",
        name: "FUN Legal",
        subtitle: "Apply Cosmic Laws",
        actions: ["GOV_PROPOSAL", "POLICY_REVIEW", "DISPUTE_RESOLVE", "LEGAL_TEMPLATE_CREATE"],
        rewardLogic: "Thưởng cho xây luật, giải quyết tranh chấp",
        thresholds: ["T ≥ 85 (độ chuẩn)", "U ≥ 70 (công tâm & hợp nhất)"],
        multiplierNotes: ["Q = arbitration outcome quality", "I = số tranh chấp giải quyết"]
      },
      {
        id: "earth",
        name: "FUN Earth",
        subtitle: "Environmental & Re-greening",
        actions: ["TREE_PLANT", "CLEANUP_EVENT", "PARTNER_VERIFIED_REPORT"],
        rewardLogic: "Thưởng theo proof thật",
        thresholds: ["T ≥ 80 (proof)", "S/H/U trọng số cao"],
        multiplierNotes: ["I = verified hectares, kg waste, survival rate cây", "Q = evidence quality + partner confirmation"]
      },
      {
        id: "trading",
        name: "FUN Trading",
        subtitle: "Trading Platform",
        actions: ["RISK_LESSON_COMPLETE", "PAPER_TRADE_DISCIPLINE", "JOURNAL_SUBMIT"],
        rewardLogic: "Thưởng cho kỷ luật/học/nhật ký, KHÔNG thưởng cho đánh bạc",
        thresholds: ["C ≥ 70 (thói quen bền)", "T ≥ 70"],
        multiplierNotes: ["Q = consistency streak, risk controls", "I = mentoring others về kỷ luật"]
      },
      {
        id: "invest",
        name: "FUN Invest",
        subtitle: "Investment Platform",
        actions: ["DUE_DILIGENCE_REPORT", "MENTOR_STARTUP", "IMPACT_KPI_REVIEW"],
        rewardLogic: "Thưởng cho impact, không cho \"lướt\"",
        thresholds: ["T ≥ 85", "C ≥ 75"],
        multiplierNotes: ["I = startup outcomes, jobs created", "Q = peer-reviewed diligence quality"]
      },
      {
        id: "funlife",
        name: "FUNLife / Cosmic Game",
        subtitle: "Game of Life",
        actions: ["DAILY_RITUAL", "UNITY_MISSION_COMPLETE", "SERVICE_QUEST"],
        rewardLogic: "Thưởng cho thực hành + phụng sự",
        thresholds: ["K ≥ 0.7", "U/H cao"],
        multiplierNotes: ["Q = consistency streak + community witness", "I = service quest beneficiaries"]
      },
      {
        id: "market",
        name: "FUN Market",
        subtitle: "Marketplace",
        actions: ["FAIR_TRADE_ORDER", "SELLER_VERIFIED_DELIVERY", "REVIEW_HELPFUL"],
        rewardLogic: "Thưởng cho giao dịch công bằng",
        thresholds: ["T ≥ 80 (đơn hàng/ship proof)", "K ≥ 0.75"],
        multiplierNotes: ["Q = low dispute rate + helpful reviews", "I = supports small businesses"]
      },
      {
        id: "wallet",
        name: "FUN Wallet",
        subtitle: "Our Own Bank",
        actions: ["RECEIVE_REWARD", "DONATE_FROM_WALLET", "PAYMENT_FOR_SERVICE"],
        rewardLogic: "Không thưởng \"farm tx\", chỉ cho hành vi có ngữ nghĩa",
        thresholds: ["K ≥ 0.85"],
        multiplierNotes: ["I = donation impact / service transactions"]
      },
      {
        id: "funmoney",
        name: "FUN Money",
        subtitle: "Father's Light Money",
        actions: ["Token minting governed by PPLP"],
        rewardLogic: "Caps, epoch, tier gating",
        thresholds: ["Theo PPLP Engine rules"],
        multiplierNotes: ["Dynamic mint engine"]
      },
      {
        id: "camly",
        name: "Camly Coin",
        subtitle: "Soul Currency",
        actions: ["Staking, governance, access tiers"],
        rewardLogic: "Không nhất thiết mint theo PPLP",
        thresholds: ["Dùng như token nền tảng"],
        multiplierNotes: ["Liquidity, utilities, incentives"]
      }
    ]
  },
  {
    id: "policy-json",
    icon: FileCode,
    title: "6. POLICY JSON FORMAT",
    subtitle: "Versioned Policy Schema",
    content: [
      "📄 Format mẫu cho policy versioned:"
    ],
    policyExample: {
      version: 12,
      global: {
        minTruth: 70,
        minIntegrity: 60,
        minLightScore: 60,
        weights: { S: 0.25, T: 0.20, H: 0.20, C: 0.20, U: 0.15 }
      },
      platformExample: {
        name: "FUN_ACADEMY",
        actions: {
          LEARN_COMPLETE: {
            baseReward: 200,
            thresholds: { T: 70, LightScore: 60, K: 60 },
            multipliers: { Q: [0.8, 2.0], I: [0.8, 1.5], K: [0.6, 1.0] }
          },
          PROJECT_SUBMIT: {
            baseReward: 500,
            thresholds: { T: 75, C: 70, LightScore: 65, K: 65 },
            multipliers: { Q: [1.0, 3.0], I: [1.0, 2.5], K: [0.65, 1.0] }
          }
        }
      }
    }
  },
  {
    id: "eip712-signing",
    icon: Key,
    title: "7. EIP-712 SIGNING SCRIPT",
    subtitle: "Node.js/TypeScript Implementation",
    content: [
      "🔐 7.1. Yêu cầu",
      "",
      "• Node 18+",
      "• ethers v6",
      "• Private key signer (PPLP signer) lưu trong vault/ENV (production dùng KMS/HSM)",
      "",
      "🔧 7.2. EIP-712 Domain & Types"
    ],
    eip712: {
      domain: {
        name: "FUN Money",
        version: "1.2.1",
        chainId: "97 (BSC Testnet) / 56 (BSC Mainnet)",
        verifyingContract: "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2"
      },
      types: {
        PureLoveProof: [
          { name: "user", type: "address" },
          { name: "actionHash", type: "bytes32" },
          { name: "amount", type: "uint256" },
          { name: "evidenceHash", type: "bytes32" },
          { name: "nonce", type: "uint256" }
        ]
      },
      notes: [
        "FUN Money dùng 18 decimals, amount phải là reward × 10^18",
        "actionHash = keccak256(toUtf8Bytes(actionName))",
        "Attester (Treasury) ký PureLoveProof, contract verify via ecrecover",
        "EIP-712 domain PHẢI khớp: name='FUN Money', version='1.2.1'"
      ]
    }
  },
  {
    id: "production-checklist",
    icon: CheckCircle,
    title: "8. PRODUCTION CHECKLIST",
    subtitle: "Deployment Readiness",
    content: [
      "✅ Checklist để triển khai thực tế:"
    ],
    checklist: [
      "Policy versioning bắt buộc + audit logs",
      "Event indexer xác nhận minted (txHash, block)",
      "Rate limit + fraud signals pipeline",
      "Dispute workflow (FUN Legal) để \"sửa sai\" minh bạch",
      "Signer tách khỏi app server (KMS/HSM)",
      "OpenAPI (Swagger) spec đầy đủ",
      "DB migrations (SQL) versioned",
      "Scoring worker pseudo-code (queue → evaluate → authorize → confirm)",
      "Template policy cho TẤT CẢ action types"
    ]
  }
];

// API Request/Response Examples
export const apiExamples = {
  submitAction: {
    request: {
      platformId: "FUN_ACADEMY",
      actionType: "LEARN_COMPLETE",
      actor: "0xUser",
      timestamp: 1730000000,
      metadata: { courseId: "COURSE_001", durationSec: 5400, quizScore: 92 },
      evidence: [{ type: "QUIZ_SCORE", uri: "ipfs://..." }],
      impact: { beneficiaries: 1, outcome: "passed" },
      integrity: { deviceHash: "...", antiSybilScore: 0.86 }
    },
    response: { actionId: "uuid", status: "RECEIVED" }
  },
  evaluateAction: {
    response: {
      actionId: "...",
      policyVersion: 12,
      pillars: { S: 78, T: 90, H: 70, C: 65, U: 80 },
      lightScore: 76.7,
      multipliers: { Q: 1.4, I: 1.2, K: 0.92 },
      baseReward: 200,
      rewardAmount: 309,
      decision: "PASS"
    }
  },
  mintAuthorize: {
    response: {
      mintRequest: {
        to: "0xUser",
        amount: "309",
        actionId: "0xActionIdBytes32",
        evidenceHash: "0x...",
        policyVersion: 12,
        validAfter: 1730000000,
        validBefore: 1730000600,
        nonce: "5"
      },
      signature: "0x..."
    }
  }
};
