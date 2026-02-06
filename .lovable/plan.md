

# Kế hoạch: Tạo Section PPLP Documents trên Admin Knowledge

## Tổng quan

Thêm một section mới vào trang `/admin/knowledge` để quản lý **tài liệu PPLP (Bằng chứng Tình yêu Thuần khiết)** - đây là các tài liệu hướng dẫn về quy trình mint FUN Money mà Angel AI sẽ học để trả lời user.

## Thiết kế Section PPLP

### Vị trí trên trang
Section mới sẽ nằm **sau phần "Upload Tài Liệu Mới"** và **trước phần "Import từ Google Docs/Sheets"**, với giao diện thống nhất với các section khác.

### Nội dung Section

**Card "Tài liệu PPLP - Hướng dẫn Mint FUN Money"** bao gồm:

| Tính năng | Mô tả |
|-----------|-------|
| Mô tả section | Giải thích mục đích của tài liệu PPLP |
| Danh sách tài liệu có sẵn | Hiển thị các template/hướng dẫn PPLP đã được tích hợp |
| Nút thêm vào Knowledge | Cho phép admin nạp tài liệu PPLP vào hệ thống kiến thức |
| Trạng thái đã import | Hiển thị tài liệu nào đã được thêm vào knowledge base |

### Tài liệu PPLP sẽ bao gồm

1. **Hướng dẫn Mint FUN Money** - Quy trình 3 bước: Lock → Activate → Claim
2. **5 Trụ cột PPLP** - Phụng sự, Chân thật, Chữa lành, Bền vững, Hợp nhất
3. **Công thức phân phối FUN Money** - Community Genesis Pool → Platform → Partner → User
4. **Các loại Light Actions** - 40+ loại hành động được thưởng
5. **Quy tắc chống gian lận** - Anti-sybil, rate limits, reputation gating

---

## Chi tiết kỹ thuật

### Files cần tạo/sửa

| File | Thay đổi |
|------|----------|
| `src/pages/AdminKnowledge.tsx` | Thêm section PPLP Documents sau phần Upload |
| `src/data/pplpKnowledgeTemplates.ts` | Tạo file chứa nội dung các tài liệu PPLP template |

### Cấu trúc dữ liệu tài liệu PPLP

```typescript
interface PPLPKnowledgeTemplate {
  id: string;
  title: string;
  description: string;
  category: 'mint_guide' | 'pillars' | 'distribution' | 'actions' | 'anti_fraud';
  content: string;  // Nội dung đầy đủ để import vào knowledge base
}
```

### UI Components

```text
┌─────────────────────────────────────────────────────────────┐
│  📜 Tài liệu PPLP - Hướng dẫn Mint FUN Money               │
│  ─────────────────────────────────────────────────          │
│  Các tài liệu giúp Angel AI trả lời về quy trình mint       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✨ Hướng dẫn Mint FUN Money (3 bước)                  │  │
│  │ Quy trình Lock → Activate → Claim                     │  │
│  │                                        [✓ Đã import]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🏛️ 5 Trụ cột PPLP                                     │  │
│  │ Phụng sự, Chân thật, Chữa lành, Bền vững, Hợp nhất   │  │
│  │                                      [Import vào KB]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 💰 Công thức phân phối FUN Money                      │  │
│  │ Community Genesis → Platform → Partner → User         │  │
│  │                                      [Import vào KB]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⚡ Các loại Light Actions (40+ loại)                  │  │
│  │ Hành động được thưởng FUN Money                       │  │
│  │                                      [Import vào KB]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🛡️ Quy tắc chống gian lận                             │  │
│  │ Anti-sybil, rate limits, reputation gating            │  │
│  │                                      [Import vào KB]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│                    [ 📥 Import tất cả vào Knowledge Base ]  │
└─────────────────────────────────────────────────────────────┘
```

### Logic xử lý

1. **Kiểm tra tài liệu đã import**: Query bảng `knowledge_documents` với tiêu đề chứa `[PPLP]` prefix
2. **Import tài liệu**: Insert vào `knowledge_documents` với:
   - `title`: `[PPLP] {template.title}`
   - `file_name`: `pplp-{template.id}.txt`
   - `file_type`: `text/plain`
   - `extracted_content`: nội dung từ template
   - `is_processed`: `true`
   - `folder_id`: Tạo/tìm folder "PPLP Documents"
3. **Hiển thị trạng thái**: Badge "Đã import" hoặc nút "Import vào KB"

---

## Nội dung các tài liệu PPLP Template

### 1. Hướng dẫn Mint FUN Money

```text
# HƯỚNG DẪN MINT FUN MONEY

FUN Money là đồng tiền Ánh Sáng (Father's Light Money) được mint theo giá trị đóng góp 
thông qua giao thức PPLP (Proof of Pure Love Protocol).

## QUY TRÌNH MINT 3 BƯỚC

### Bước 1: Lock (Khóa token)
- Khi bạn thực hiện một "Light Action" (hành động Ánh Sáng), hệ thống sẽ tự động 
  ghi nhận và khóa FUN Money tương ứng vào ví Treasury
- Số FUN được tính theo công thức: BaseReward × QualityMultiplier × ImpactMultiplier
- Trạng thái: "Đang khóa" (Locked)

### Bước 2: Activate (Kích hoạt)
- Truy cập trang /mint để xem các FUN Money đang khóa
- Nhấn nút "Kích hoạt" để chuyển từ trạng thái "Locked" sang "Activated"
- Cần kết nối ví MetaMask để thực hiện giao dịch on-chain

### Bước 3: Claim (Nhận token)
- Sau khi kích hoạt, nhấn nút "Nhận về ví" 
- FUN Money sẽ được chuyển vào ví của bạn
- Trạng thái: "Có thể chi tiêu" (Spendable)

## LƯU Ý QUAN TRỌNG
- Mỗi Light Action cần đạt Light Score tối thiểu 50 điểm
- Giới hạn nhận thưởng: 8 FUN/ngày/người
- Cần có ví Web3 (MetaMask) để claim FUN Money
```

### 2. 5 Trụ cột PPLP (tóm tắt từ poplData.ts)

### 3. Công thức phân phối (từ cuộc trò chuyện trước)

### 4. Các loại Light Actions (từ pplp-types.ts)

### 5. Quy tắc chống gian lận (từ poplData.ts)

---

## Kết quả mong đợi

Sau khi triển khai:

1. Admin có thể dễ dàng thêm các tài liệu PPLP vào knowledge base
2. Angel AI sẽ học được kiến thức về:
   - Cách mint FUN Money
   - Ý nghĩa của PPLP và 5 trụ cột
   - Công thức phân phối token
   - Các hành động được thưởng
3. User sẽ nhận được câu trả lời chính xác khi hỏi về mint FUN Money

---

## Thời gian ước tính

| Công việc | Thời gian |
|-----------|-----------|
| Tạo file template PPLP | 1 session |
| Thêm section vào AdminKnowledge | 1 session |
| Test import và verify | 1 session |
| **Tổng** | **2-3 sessions** |

