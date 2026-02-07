
## Sửa lỗi hiển thị nút Claim FUN Money trên trang /mint

### Nguyên nhân gốc

Dữ liệu điểm số (`pplp_scores`) và yêu cầu mint (`pplp_mint_requests`) có quan hệ **one-to-one** với `pplp_actions` trong database. Khi truy vấn, hệ thống trả về dạng **object** (đối tượng đơn), nhưng code hiện tại lại truy cập dạng **array** (`pplp_scores?.[0]`), dẫn đến giá trị luôn là `undefined`.

Kết quả:
- Thông tin Light Score, 5 trụ cột, phần thưởng FUN không hiển thị
- Nút "Claim FUN Money" không bao giờ xuất hiện, luôn hiện "Không đủ điều kiện mint"
- Các action bị fail (Light Score dưới 60) vẫn hiện badge "Sẵn sàng claim" gây nhầm lẫn

### Kế hoạch sửa

#### 1. Sửa FUNMoneyMintCard - xử lý data format (File: `src/components/mint/FUNMoneyMintCard.tsx`)

- Thay `action.pplp_scores?.[0]` bằng logic tương thích cả object lẫn array:
  ```
  const score = Array.isArray(action.pplp_scores) 
    ? action.pplp_scores[0] 
    : action.pplp_scores;
  ```
- Tương tự cho `pplp_mint_requests`
- Cập nhật interface `PPLPAction` để phản ánh đúng: `pplp_scores` có thể là object hoặc array

#### 2. Sửa MintActionsList - lọc action chính xác (File: `src/components/mint/MintActionsList.tsx`)

- Phân loại rõ ràng 3 nhóm action:
  - **Sẵn sàng claim** (scored + decision = pass): Hiện nút Claim
  - **Không đạt** (scored + decision = fail): Hiện badge riêng, tách ra khỏi nhóm claimable
  - **Đang xử lý** (pending): Giữ nguyên
- Thêm nhóm hiển thị riêng cho các action "Không đạt" với badge màu đỏ/cam

#### 3. Sửa usePPLPActions - cập nhật type (File: `src/hooks/usePPLPActions.ts`)

- Cập nhật interface `PPLPAction` để `pplp_scores` và `pplp_mint_requests` có thể là object đơn (không chỉ array)

### Chi tiết kỹ thuật

**File 1: `src/components/mint/FUNMoneyMintCard.tsx`**
- Dòng 99: Sửa `action.pplp_scores?.[0]` thành logic kiểm tra `Array.isArray`
- Dòng 100: Sửa `action.pplp_mint_requests?.[0]` tương tự
- Cập nhật interface `PPLPAction` (dòng 22-45) để chấp nhận cả object lẫn array

**File 2: `src/components/mint/MintActionsList.tsx`**
- Dòng 39-43: Thêm hàm helper để đọc score từ action (tương thích object/array)
- Cập nhật filter `mintableActions` để chỉ lấy actions có `decision === "pass"`
- Thêm nhóm `failedActions` hiển thị riêng với label "Không đạt điểm" 
- Hiện rõ lý do (Light Score thấp) cho actions bị fail

**File 3: `src/hooks/usePPLPActions.ts`**
- Cập nhật type `pplp_scores` và `pplp_mint_requests` để chấp nhận cả object lẫn array

### Không thay đổi database

Chỉ sửa frontend, không cần migration hay thay đổi schema.
