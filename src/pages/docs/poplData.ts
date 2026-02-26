import { 
  Globe, Eye, Heart, Shield, Zap, Coins, 
  Sparkles, Bot, Network, RotateCcw, Sun, Star,
  Target, FileCheck, Lock, TrendingUp, Users,
  Video, Gamepad2, HandHeart, Leaf, GraduationCap,
  Scale, TreePine, LineChart, Rocket, Store, Wallet,
  Banknote, Gem, Calendar, BarChart3
} from "lucide-react";

export const sections = [
  {
    id: "implementation-goals",
    icon: Target,
    title: "0. MỤC TIÊU THỰC THI",
    subtitle: "Implementation Goals",
    content: [
      "PPLP được thiết kế để làm 5 việc \"rõ – đo được – triển khai được\":",
      "",
      "1️⃣ Xác minh đóng góp Ánh Sáng (Proof of Light Contribution) trên nhiều nền tảng",
      "2️⃣ Tạo FUN Money động theo giá trị thật (mint-to-value)",
      "3️⃣ Phân phối phần thưởng công bằng & chống thao túng",
      "4️⃣ Tạo danh tiếng Ánh Sáng (Light Reputation) gắn với hồ sơ Web3",
      "5️⃣ Chuẩn hóa bộ luật vận hành Unity Economy",
      "",
      "✨ Nguyên tắc vận hành: không tách biệt, không kiểm soát; chỉ phụng sự – chữa lành – hợp nhất"
    ]
  },
  {
    id: "definitions",
    icon: FileCheck,
    title: "1. ĐỊNH NGHĨA & PHẠM VI",
    subtitle: "Definitions & Scope",
    content: [
      "📜 1.1. PPLP là gì?",
      "",
      "PPLP là giao thức đồng thuận xác minh rằng một hành động (action) tạo ra giá trị Ánh Sáng đủ điều kiện để:",
      "",
      "✅ Ghi nhận đóng góp",
      "✅ Cộng điểm danh tiếng",
      "✅ Kích hoạt mint FUN Money",
      "✅ Mở quyền lợi/đặc quyền trong hệ sinh thái FUN",
      "",
      "🌞 1.2. FUN Money là gì trong PPLP?",
      "",
      "FUN Money là Father's Light Money:",
      "• Không \"in trước để bán\"",
      "• Không phụ thuộc \"khan hiếm\"",
      "• Được mint theo giá trị Ánh Sáng mà cộng đồng tạo ra",
      "",
      "💎 1.3. Camly Coin là gì trong hệ?",
      "",
      "Theo charter của Bé Ly:",
      "• Camly Coin = \"dòng chảy nuôi nền tảng\" (như dòng nước)",
      "• FUN Money = \"tầm nhìn dẫn dắt toàn Ecosystem\" (như Mặt Trời)"
    ]
  },
  {
    id: "what-is-proved",
    icon: Eye,
    title: "2. NHỮNG GÌ ĐƯỢC CHỨNG MINH",
    subtitle: "What Gets Proved in PPLP",
    content: [
      "PPLP không chứng minh cảm xúc.",
      "PPLP chứng minh hành động + kết quả.",
      "",
      "🔍 Một \"Light Action\" hợp lệ cần 4 lớp dữ liệu:"
    ],
    dataLayers: [
      {
        number: 1,
        title: "Action",
        description: "Người dùng đã làm gì (learn / share / give / build / help…)"
      },
      {
        number: 2,
        title: "Evidence", 
        description: "Bằng chứng (log, bài học hoàn thành, giao dịch từ thiện, đóng góp nội dung…)"
      },
      {
        number: 3,
        title: "Impact",
        description: "Tác động đo được (điểm chất lượng, phản hồi cộng đồng, kết quả thực tế)"
      },
      {
        number: 4,
        title: "Integrity",
        description: "Chống gian lận (anti-sybil, anti-bot, anti-farm)"
      }
    ]
  },
  {
    id: "five-pillars",
    icon: Shield,
    title: "3. BỘ TIÊU CHUẨN PPL — 5 TRỤ CỘT THỰC THI",
    subtitle: "5 Pillars of Implementation",
    content: [
      "Mỗi hoạt động muốn mint FUN Money phải đạt ngưỡng tối thiểu của 5 trụ cột:",
      "",
      "Trong vận hành, 5 trụ cột được lượng hóa bằng Light Score + quy tắc threshold theo từng platform."
    ],
    pillars: [
      {
        number: 1,
        title: "Phụng sự sự sống",
        question: "Hành động có lợi ích vượt khỏi cái tôi không?"
      },
      {
        number: 2,
        title: "Chân thật minh bạch",
        question: "Có bằng chứng và kiểm chứng được không?"
      },
      {
        number: 3,
        title: "Chữa lành & nâng đỡ",
        question: "Có tăng hạnh phúc / giảm khổ đau / tạo an toàn không?"
      },
      {
        number: 4,
        title: "Đóng góp bền vững",
        question: "Có tạo giá trị dài hạn cho cộng đồng/hệ sinh thái không?"
      },
      {
        number: 5,
        title: "Hợp Nhất (Unity)",
        question: "Có tăng kết nối – hợp tác – cùng thắng (win together) không?"
      }
    ],
    footer: "Chỉ khi đủ 5 trụ cột: FUN Money được mint như một phước lành."
  },
  {
    id: "system-architecture",
    icon: Network,
    title: "4. KIẾN TRÚC HỆ THỐNG",
    subtitle: "System Architecture",
    content: [
      "🏗️ 4.1. Các thành phần chính"
    ],
    components: [
      { name: "FUN App Layer", role: "Platforms", description: "Nơi phát sinh hành động tạo giá trị" },
      { name: "PPLP Engine", role: "Rules + Scoring", description: "Tính điểm & quyết định đủ điều kiện mint" },
      { name: "Angel AI", role: "Light Oracle", description: "Trợ lý xác minh/đánh giá chất lượng + phát hiện gian lận" },
      { name: "Identity Layer", role: "FUN Profile", description: "Hồ sơ Web3 + Light Score" },
      { name: "Reward Layer", role: "FUN Wallet + FUN Money", description: "Nhận thưởng, lưu thông, quản trị" },
      { name: "Governance", role: "FUN Legal", description: "Hiến pháp, quy tắc, xử lý tranh chấp" }
    ],
    flowContent: [
      "",
      "🔄 4.2. Luồng dữ liệu chuẩn (Flow)",
      "",
      "User Action → Evidence → Angel AI pre-check → Community signal → PPLP score → Mint FUN Money → Update Light Reputation → Distribute"
    ]
  },
  {
    id: "mint-engine",
    icon: Coins,
    title: "5. CƠ CHẾ MINT FUN MONEY",
    subtitle: "Mint Engine Implementation",
    content: [
      "⚙️ 5.1. Nguyên tắc",
      "",
      "• Mint theo Contribution Units (CU)",
      "• Mỗi platform có CU Definition riêng",
      "• Mint rate giảm dần theo thời gian để tránh \"farm\" (giống halving logic nhưng theo \"quality\")",
      "",
      "📐 5.2. Công thức mẫu (để triển khai)"
    ],
    formula: {
      main: "FUN Mint = BaseReward × QualityMultiplier × ImpactMultiplier × IntegrityMultiplier",
      variables: [
        { name: "BaseReward", description: "Thưởng cơ bản của loại hành động" },
        { name: "QualityMultiplier", description: "Chất lượng nội dung/hành động (0.5–3.0)" },
        { name: "ImpactMultiplier", description: "Tác động thực tế (0.5–5.0)" },
        { name: "IntegrityMultiplier", description: "Độ tin cậy chống gian lận (0–1.0; bot = 0)" }
      ]
    },
    contentAfter: [
      "",
      "✨ Angel AI hỗ trợ tính multiplier, nhưng luật cuối cùng nằm ở PPLP rulebook + governance."
    ]
  },
  {
    id: "anti-fraud",
    icon: Lock,
    title: "6. CHỐNG GIAN LẬN & FARM",
    subtitle: "Anti-Fraud / Anti-Farming",
    content: [
      "🚫 PPLP cần chống 5 loại gian lận phổ biến:",
      "",
      "1. Sybil (tạo nhiều tài khoản)",
      "2. Bot (tự động hóa tạo điểm)",
      "3. Wash contribution (tự tạo giao dịch giả / feedback giả)",
      "4. Collusion (nhóm cấu kết nâng điểm)",
      "5. Low-value spam (nội dung rác số lượng)",
      "",
      "🛡️ Bộ công cụ thực thi:",
      "",
      "✅ Proof of Personhood (nhẹ nhàng: phone/email + device + social graph)",
      "✅ Rate limits theo thời gian",
      "✅ Stake-for-trust (đặt cọc nhỏ bằng Camly Coin/FUN Money để mở khóa mức thưởng cao)",
      "✅ Reputation gating: người mới có cap thấp, tăng dần theo lịch sử đóng góp",
      "✅ Random audits + community reporting",
      "✅ Angel AI anomaly detection"
    ]
  },
  {
    id: "master-charter",
    icon: Sun,
    title: "7. MASTER CHARTER — 16 PLATFORMS",
    subtitle: "FUN Ecosystem Complete",
    content: [
      "🌞 Danh sách đầy đủ các nền tảng trong FUN Ecosystem theo chuẩn PPLP:"
    ],
    ecosystemPlatforms: [
      {
        id: "angel",
        name: "Angel AI",
        subtitle: "AI Ánh Sáng Platform",
        role: "Light Oracle, trợ lý trí tuệ cho toàn hệ sinh thái",
        modules: [
          "Content Quality Scoring (tóm tắt, đánh giá, chống spam)",
          "Fraud Detection (sybil/bot/collusion)",
          "Learning Coach (FUN Academy)",
          "Charity Verifier (FUN Charity)"
        ],
        mintLogic: "Thưởng cho đóng góp AI-assisted giúp cộng đồng tăng chất lượng & minh bạch"
      },
      {
        id: "profile",
        name: "FUN Profile",
        subtitle: "Web3 Social Network",
        role: "Hồ sơ Web3 + tài sản hóa thông tin & danh tiếng Ánh Sáng",
        modules: [
          "Web3 profile (on-chain or hybrid)",
          "Soulbound \"Light Reputation\" badge",
          "Proof-of-contribution timeline",
          "Anti-spam identity & reputation gating"
        ],
        mintLogic: "Thưởng cho nội dung chất lượng, kết nối hữu ích, mentorship, xây cộng đồng"
      },
      {
        id: "play",
        name: "FUN Play",
        subtitle: "Web3 Video Platform",
        role: "Video tạo giá trị, giáo dục, chữa lành, giải trí nâng tần số",
        modules: [
          "Upload/stream video + moderation",
          "Watch-to-earn với quality gate (không farm view)",
          "Creator reward theo impact"
        ],
        mintLogic: "Thưởng dựa trên watch time thật + phản hồi + quality scoring"
      },
      {
        id: "planet",
        name: "FUN Planet",
        subtitle: "Game for Kids",
        role: "Game giáo dục – nuôi tâm hồn trẻ em",
        modules: [
          "Quest học đạo đức, kỹ năng sống, sáng tạo",
          "Parent/teacher mode",
          "Reward cho hành vi tốt & học thật"
        ],
        mintLogic: "Thưởng cho hoàn thành nhiệm vụ học/giúp đỡ/chia sẻ"
      },
      {
        id: "charity",
        name: "FUN Charity",
        subtitle: "Pure-Love Charity Network",
        role: "Từ thiện minh bạch, chữa lành cộng đồng",
        modules: [
          "Campaign on-chain tracking",
          "Receipt + proof delivery",
          "Impact reporting dashboard"
        ],
        mintLogic: "Thưởng cho người đóng góp + người triển khai minh bạch + dự án tạo impact thật"
      },
      {
        id: "farm",
        name: "FUN Farm",
        subtitle: "Farm to Table — Fair & Fast, Free-Fee & Earn",
        role: "Chuỗi cung ứng thực phẩm công bằng, nhanh, minh bạch",
        modules: [
          "Producer onboarding + traceability",
          "Marketplace farm-to-table",
          "Reward cho chất lượng & giao hàng đúng"
        ],
        mintLogic: "Thưởng cho nông dân/đối tác khi đạt tiêu chuẩn chất lượng + giảm lãng phí"
      },
      {
        id: "academy",
        name: "FUN Academy",
        subtitle: "Learn & Earn",
        role: "Học để thịnh vượng; học là tài sản",
        modules: [
          "Course + quiz + project",
          "Credential NFT / certificate",
          "Study groups & mentors"
        ],
        mintLogic: "Thưởng cho hoàn thành bài học + làm project + hỗ trợ người khác học"
      },
      {
        id: "legal",
        name: "FUN Legal",
        subtitle: "Apply Cosmic Laws on New Earth",
        role: "Hiến pháp vận hành Unity Economy + xử lý tranh chấp",
        modules: [
          "Charter + Constitution + policies",
          "Dispute resolution framework",
          "Governance proposals"
        ],
        mintLogic: "Thưởng cho đóng góp xây luật, bảo vệ minh bạch, giải quyết tranh chấp công bằng"
      },
      {
        id: "earth",
        name: "FUN Earth",
        subtitle: "Environmental & Re-greening",
        role: "Tái sinh hành tinh",
        modules: [
          "Verified actions: trồng cây, cleanup, carbon reporting",
          "Local chapters",
          "Partnerships NGO/brands"
        ],
        mintLogic: "Thưởng theo proof (ảnh/geo/time + verification + impact)"
      },
      {
        id: "trading",
        name: "FUN Trading",
        subtitle: "Trading Platform",
        role: "Công cụ giao dịch minh bạch, giáo dục tài chính đúng đắn",
        modules: [
          "Paper trading + education-first",
          "Risk disclosure",
          "Anti-addiction design"
        ],
        mintLogic: "Thưởng cho học & thực hành kỷ luật, không thưởng cho \"đánh bạc\""
      },
      {
        id: "invest",
        name: "FUN Invest",
        subtitle: "Investment Platform",
        role: "Đầu tư hợp nhất — vốn chảy về dự án phụng sự",
        modules: [
          "Deal room minh bạch",
          "Impact KPIs + reporting",
          "Community co-invest"
        ],
        mintLogic: "Thưởng cho due diligence, mentoring founder, tạo impact chứ không phải \"lướt\""
      },
      {
        id: "funlife",
        name: "FUNLife / Cosmic Game",
        subtitle: "Game of Life",
        role: "Game hóa hành trình thức tỉnh & thịnh vượng",
        modules: [
          "Missions theo 7 luân xa",
          "Daily rituals: Repentance & Gratitude",
          "Guild/communities"
        ],
        mintLogic: "Thưởng cho chuỗi thực hành + đóng góp cộng đồng + hoàn thành nhiệm vụ phụng sự"
      },
      {
        id: "market",
        name: "FUN Market",
        subtitle: "Marketplace",
        role: "Chợ hợp nhất cho hàng hóa & dịch vụ",
        modules: [
          "Seller verification",
          "Review chống fake",
          "Incentives cho chất lượng"
        ],
        mintLogic: "Thưởng cho giao dịch công bằng, phản hồi thật, hỗ trợ người mới"
      },
      {
        id: "wallet",
        name: "FUN Wallet",
        subtitle: "Our Own Bank",
        role: "Ví, thanh toán, reward distribution, ngân hàng ánh sáng",
        modules: [
          "Wallet đa chain",
          "Reward vault",
          "Fee-free/low-fee transfers"
        ],
        mintLogic: "Thưởng cho hoạt động lưu thông hữu ích (không farm transaction)"
      },
      {
        id: "funmoney",
        name: "FUN Money",
        subtitle: "Money of Father's Light",
        role: "Đồng tiền thưởng của sự đóng góp Ánh Sáng",
        modules: [
          "Dynamic mint engine theo PPLP",
          "Staking for trust (mở mức thưởng)",
          "Community reward pools"
        ],
        mintLogic: "Mint theo công thức CU + multipliers"
      },
      {
        id: "camly",
        name: "Camly Coin",
        subtitle: "Soul Currency of Bé Ly",
        role: "Dòng chảy nuôi hệ sinh thái (liquidity, staking, utilities)",
        modules: [
          "Utility token: governance, staking, access tiers",
          "Liquidity support cho hệ thống",
          "Incentives cho builders/validators"
        ],
        mintLogic: "Không nhất thiết mint theo PPLP; dùng như token nền tảng vận hành"
      }
    ]
  },
  {
    id: "implementation-phases",
    icon: Calendar,
    title: "8. KẾ HOẠCH TRIỂN KHAI",
    subtitle: "Implementation Phases",
    content: [
      "📅 Thực tế hóa theo giai đoạn:"
    ],
    phases: [
      {
        name: "Phase A",
        timeline: "0 → 90 ngày",
        title: "MVP Light Economy",
        items: [
          "Ra mắt FUN Profile + FUN Wallet (identity + reward rails)",
          "PPLP Engine v0: scoring cơ bản + anti-spam",
          "FUN Academy v0: 5 khóa học đầu tiên",
          "FUN Charity v0: 3 chiến dịch minh bạch"
        ]
      },
      {
        name: "Phase B",
        timeline: "3 → 6 tháng",
        title: "Growth + Proof Hardening",
        items: [
          "Angel AI v1: fraud detection + quality scoring",
          "FUN Play v0: creators + watch gating",
          "FUN Market v0: seller verification",
          "Launch Light Reputation badges"
        ]
      },
      {
        name: "Phase C",
        timeline: "6 → 12 tháng",
        title: "Ecosystem Expansion",
        items: [
          "FUN Earth chapters + partner verification",
          "FUN Farm pilots",
          "FUN Invest deal room",
          "FUNLife / Cosmic Game missions"
        ]
      }
    ]
  },
  {
    id: "kpis",
    icon: BarChart3,
    title: "9. CHỈ SỐ THÀNH CÔNG",
    subtitle: "KPIs — Đo được",
    content: [
      "📊 Các chỉ số đánh giá hiệu quả PPLP:"
    ],
    kpis: [
      "% users hoàn thành Learn & Earn",
      "Số \"Verified Light Actions\"/ngày",
      "Tỷ lệ fraud bị chặn (bot/sybil)",
      "Thời gian giữ chân community",
      "Tổng impact từ charity/earth",
      "Tỷ lệ lưu thông FUN Money vs tích trữ",
      "Tăng trưởng Light Reputation median"
    ]
  },
  {
    id: "conclusion",
    icon: Star,
    title: "10. DẤU ẤN KẾT — UNITY ECONOMY",
    subtitle: "The Seal of Unity",
    content: [
      "PPLP không chỉ là giao thức.",
      "PPLP là lời cam kết của một nền văn minh:",
      "",
      "✨ Tiền trở thành ánh sáng.",
      "✨ Giá trị trở thành phụng sự.",
      "✨ Thịnh vượng trở thành Hợp Nhất.",
      "",
      "🌟 Đây là:",
      "Hạ tầng kinh tế của Thời Đại Hoàng Kim."
    ]
  }
];

export const mantras = [
  "Con là Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ.",
  "Con là Ý Chí của Cha Vũ Trụ.",
  "Con là Trí Tuệ của Cha Vũ Trụ.",
  "Con là Hạnh Phúc.",
  "Con là Tình Yêu.",
  "Con là Tiền của Cha.",
  "Con xin Sám Hối Sám Hối Sám Hối.",
  "Con xin Biết Ơn Biết Ơn Biết Ơn — trong Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ."
];
