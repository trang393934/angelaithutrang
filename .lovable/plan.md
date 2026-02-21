
# Coordinator Gate v1.0 - Kế Hoạch Triển Khai

## Tổng Quan

Xây dựng **Coordinator Gate** -- Cổng làm việc chiến lược dành cho Coordinators trong FUN Ecosystem, tích hợp Angel AI làm đồng sáng lập AI với bộ nhớ theo dự án, chế độ chuyên gia, và nhận biết ngữ cảnh hệ sinh thái.

---

## Phạm Vi Triển Khai V1.0 (MVP)

Do giới hạn về độ phức tạp, V1.0 sẽ tập trung vào các tính năng cốt lõi sau:

1. **Xác thực Coordinator** (role-based access)
2. **Dashboard dự án** (CRUD projects)
3. **Workspace dự án** (layout 3 panel)
4. **6 chế độ Spec Builder** (Product, Smart Contract, Tokenomics, UX Flow, Growth, Governance)
5. **6 vai trò AI** (Product Architect, Smart Contract Architect, Tokenomics Guardian, Growth Strategist, Legal Architect, PPLP Guardian)
6. **Chat AI tích hợp ngữ cảnh** (dùng Lovable AI qua edge function)
7. **Lưu phiên bản** (version snapshots)
8. **Xuất kết quả** (Markdown, JSON)

---

## Thay Đổi Database

### Bảng mới: `coordinator_projects`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID dự án |
| user_id | uuid (FK profiles) | Coordinator sở hữu |
| name | text | Tên dự án |
| platform_type | text | FUN Profile / FUN Play / FUN Wallet / ... |
| value_model | text | Learn & Earn / Share & Have / ... |
| token_flow_model | text | FUN Money <-> Camly Coin logic |
| vision_statement | text | Tuyên bố tầm nhìn |
| status | text | draft / in_design / testing / live |
| metadata | jsonb | Dữ liệu bổ sung |
| created_at | timestamptz | Ngày tạo |
| updated_at | timestamptz | Ngày cập nhật |

### Bảng mới: `coordinator_project_versions`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID phiên bản |
| project_id | uuid (FK) | Liên kết dự án |
| version_number | integer | Số thứ tự phiên bản |
| change_summary | text | Tóm tắt thay đổi |
| snapshot_data | jsonb | Toàn bộ nội dung spec tại thời điểm lưu |
| created_at | timestamptz | Ngày tạo |

### Bảng mới: `coordinator_chat_messages`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID tin nhắn |
| project_id | uuid (FK) | Liên kết dự án |
| user_id | uuid | Coordinator |
| role | text | user / assistant |
| content | text | Nội dung tin nhắn |
| mode | text | product_spec / smart_contract / tokenomics / ux_flow / growth / governance |
| ai_role | text | product_architect / smart_contract_architect / ... |
| created_at | timestamptz | Ngày tạo |

### Thêm role mới: `coordinator`

Thêm giá trị `coordinator` vào enum `app_role` hiện có, và thêm hàm `has_role` check cho coordinator.

### RLS Policies

- Coordinators chỉ xem/sửa/xóa dự án của chính mình
- Admin xem tất cả
- Chat messages chỉ người sở hữu dự án truy cập

---

## Edge Function Mới: `coordinator-chat`

Edge function riêng cho Coordinator Gate, khác với `angel-chat` hiện tại:

- Nhận thêm tham số: `mode`, `ai_role`, `project_context`
- System prompt thay đổi theo mode + role đã chọn
- Tự động inject ngữ cảnh hệ sinh thái FUN (PPLP, tokenomics, governance)
- Tự động inject thông tin dự án hiện tại (tên, platform, value model...)
- Gọi Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Hỗ trợ streaming SSE

---

## Cấu Trúc Files Mới

```text
src/pages/
  CoordinatorGate.tsx          -- Dashboard chính
  CoordinatorProject.tsx       -- Workspace dự án (layout 3 panel)

src/components/coordinator/
  CoordinatorSidebar.tsx       -- Panel trái (info + mode + role selector)
  CoordinatorChat.tsx          -- Panel giữa (AI chat workspace)
  CoordinatorSpecPreview.tsx   -- Panel phải (preview spec output)
  ProjectCreateDialog.tsx      -- Dialog tạo dự án mới
  ProjectCard.tsx              -- Card hiển thị dự án trên dashboard
  ModeSelector.tsx             -- Chọn chế độ (6 modes)
  RoleSelector.tsx             -- Chọn vai trò AI (6 roles)
  VersionHistory.tsx           -- Danh sách phiên bản + so sánh
  ExportMenu.tsx               -- Menu xuất (Markdown / JSON)

src/hooks/
  useCoordinatorProjects.ts    -- CRUD dự án
  useCoordinatorChat.ts        -- Chat streaming + context injection

supabase/functions/
  coordinator-chat/index.ts    -- Edge function AI cho Coordinator Gate
```

---

## Luồng UX Chi Tiết

### 1. Truy cập

- Route: `/coordinator-gate`
- Kiểm tra user đã đăng nhập + có role `coordinator` hoặc `admin`
- Nếu không: hiển thị trang "Apply for Coordinator Access" với nút liên hệ admin

### 2. Dashboard

- Hiển thị danh sách dự án theo 3 nhóm: Active / Draft / Recently Updated
- Nút "+ Create New Project" nổi bật
- Mỗi project card hiển thị: tên, platform, status badge, ngày cập nhật

### 3. Tạo Dự Án

- Dialog với các trường: Name, Platform Type (dropdown 12 platforms), Value Model, Token Flow, Vision Statement
- Click "Initialize Project" -> tạo record trong DB -> chuyển đến workspace

### 4. Project Workspace (Layout 3 cột)

- **Trái (280px)**: Project Info, Mode Selector (6 cards), Role Selector (dropdown), Version History, Export
- **Giữa (flex)**: AI Chat workspace với streaming, hiển thị badge mode + role đang active
- **Phải (320px, ẩn được)**: Structured Spec Preview -- hiển thị output gần nhất dưới dạng markdown rendered

### 5. Mode + Role

- Khi đổi mode/role: hiển thị badge trên chat, thay đổi system prompt phía backend
- Mỗi mode có suggested prompts riêng (ví dụ: Product Spec -> "Generate full PRD for...")

### 6. Version Save

- Nút "Save Version" -> lưu snapshot toàn bộ chat + spec output hiện tại
- Có thể xem lại danh sách versions, mở xem nội dung

### 7. Export

- Markdown: copy hoặc download file .md
- JSON: download structured data

---

## Thiết Kế Giao Diện

- **Phong cách**: Professional SaaS, clean, tối giản
- **Màu chủ đạo**: Dùng hệ màu primary hiện tại (golden) nhưng tone lại nhẹ hơn, thiên về neutral
- **Không dùng** hiệu ứng mystical/spiritual -- đây là dev portal chuyên nghiệp
- **Responsive**: Desktop-first, hỗ trợ tablet (collapse panel phải)

---

## Thêm Route + Navigation

- Thêm route `/coordinator-gate` và `/coordinator-gate/:projectId` vào `App.tsx`
- Thêm link "Coordinator Gate" vào Admin Nav Toolbar (nhóm mới "Portal")
- Chỉ hiển thị khi user có role coordinator hoặc admin

---

## Chi Tiết Kỹ Thuật

### System Prompt Injection (coordinator-chat edge function)

Mỗi request gửi đến AI sẽ bao gồm:

1. **Base context**: FUN Ecosystem architecture, PPLP protocol, token logic (cố định)
2. **Project context**: Tên dự án, platform type, value model, token flow (từ DB)
3. **Mode prompt**: Template reasoning cho mode đã chọn (6 templates)
4. **Role prompt**: Persona + validation criteria cho role đã chọn (6 personas)
5. **Chat history**: Toàn bộ tin nhắn trong project (persistent memory)

### Streaming

- Sử dụng SSE streaming giống `angel-chat` hiện tại
- Frontend parse SSE line-by-line, render token-by-token

### Authentication

- `verify_jwt = false` trong config.toml
- Validate JWT trong code, kiểm tra role coordinator/admin qua `user_roles` table

---

## Thứ Tự Triển Khai

1. Tạo database tables + RLS policies + enum update
2. Tạo edge function `coordinator-chat`
3. Tạo hooks (`useCoordinatorProjects`, `useCoordinatorChat`)
4. Tạo components UI (ProjectCard, ModeSelector, RoleSelector, etc.)
5. Tạo trang Dashboard (`CoordinatorGate.tsx`)
6. Tạo trang Workspace (`CoordinatorProject.tsx`)
7. Thêm routes + navigation
8. Deploy + test end-to-end
