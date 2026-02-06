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
  category: 'mint_guide' | 'pillars' | 'distribution' | 'actions' | 'anti_fraud';
  content: string;
}

export const PPLP_KNOWLEDGE_TEMPLATES: PPLPKnowledgeTemplate[] = [
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
  }
];

// Helper to get PPLP folder name
export const PPLP_FOLDER_NAME = 'PPLP Documents';

// Helper to get document title with prefix
export const getPPLPDocumentTitle = (templateTitle: string) => `[PPLP] ${templateTitle}`;
