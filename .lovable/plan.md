
## Kế hoạch triển khai 3 hành động cho Admin

### Bối cảnh hiện tại
- **3,351** lệnh pending (330,632 FUN) -- chờ duyệt
- **91** lệnh signed (5,515 FUN) -- đã ký nhưng chưa gửi on-chain
- **1,392** lệnh minted (143,511 FUN) -- hoàn thành
- Trang admin hiện tại chỉ load **200 bản ghi** (`.limit(200)`) nên không thấy hết dữ liệu

---

### Hành động 1: Xử lý batch mint 91 lệnh signed

**Vấn đề**: 91 lệnh "signed" đang kẹt, cần retry on-chain. Trang hiện tại đã có nút "Retry All" nhưng chỉ thấy 200 record (có thể bỏ sót).

**Thay đổi**:
- **File**: `src/pages/AdminMintApproval.tsx`
  - Tăng `.limit(200)` lên `.limit(1000)` trong `fetchRequests()` để load đủ signed records
  - Thêm nút **"Batch Approve All Pending"** riêng biệt bên cạnh "Retry All" cho phép admin duyệt hàng loạt tất cả pending (không chỉ trong trang hiện tại)
  - Thêm tính năng **phân trang** (pagination) cho danh sách pending: hiện 50 record/trang, có nút "Load thêm"
  - Thêm thông báo tổng quan ở đầu trang: "3,351 pending | 91 signed | 1,392 minted" lấy từ COUNT query

---

### Hành động 2: Dashboard tổng quan phân phối FUN Money

**Thay đổi**:
- **File**: `src/pages/AdminMintApproval.tsx` (thêm phần dashboard ngay trên tabs)
  - Thêm **4 card thống kê** dạng grid ở đầu trang:
    1. Tổng Pending (số lượng + tổng FUN)
    2. Tổng Signed/Chờ on-chain (số lượng + tổng FUN)
    3. Tổng Minted thành công (số lượng + tổng FUN)
    4. Tổng FUN đã phân phối (tất cả thời gian)
  - Thêm **biểu đồ mini** (dùng Recharts - đã có sẵn dependency) hiển thị số lượng mint theo ngày trong 7 ngày gần nhất
  - Data lấy trực tiếp từ `pplp_mint_requests` đã fetch, không cần query thêm

---

### Hành động 3: Hướng dẫn user trên trang /mint

**Thay đổi**:
- **File**: `src/pages/Mint.tsx`
  - Thêm section **"Hướng dẫn Activate & Claim"** dạng stepper (bước 1-2-3-4) ngay dưới Alert "Quan trọng":
    1. Kết nối ví MetaMask vào BSC Testnet (97)
    2. Kiểm tra mục "Token Lifecycle" -- số Locked hiển thị FUN đã được admin duyệt
    3. Nhấn "Activate All" -- chuyển từ Locked sang Activated (cần tBNB cho gas)
    4. Nhấn "Claim All" -- FUN chuyển về ví của bạn (trạng thái Flowing)
  - Thêm nút **"Lấy tBNB miễn phí"** trong hướng dẫn bước 3
  - Thiết kế dạng collapsible (mặc định mở cho user chưa có FUN, đóng cho user đã có)

---

### Trình tự thực hiện
1. Cập nhật `AdminMintApproval.tsx`: tăng limit, thêm dashboard cards + biểu đồ mini + pagination
2. Cập nhật `Mint.tsx`: thêm stepper hướng dẫn Activate & Claim

### Tổng file cần sửa
- `src/pages/AdminMintApproval.tsx` -- dashboard + pagination + batch improvements
- `src/pages/Mint.tsx` -- hướng dẫn user
