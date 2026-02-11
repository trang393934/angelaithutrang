

# Cập Nhật Logo Angel AI Toàn Hệ Thống

## Tổng Quan
Thay thế logo Angel AI cũ bằng logo mới (hình thiên thần vàng kim) ở **tất cả** các vị trí hiển thị, đồng thời loại bỏ nền trắng để logo tràn viền.

## Thay Đổi

### 1. Thay thế file ảnh
- Copy file `user-uploads://photo_2026-01-20_09-24-47.jpg` vào `src/assets/angel-avatar.png` (ghi đè)
- Copy cùng file vào `src/assets/angel-ai-logo.png` (ghi đè)
- Copy cùng file vào `src/assets/angel-ai-golden-logo.png` (ghi đè)

Vì tất cả 54+ file đều import từ 3 file asset này, việc ghi đè sẽ tự động cập nhật logo ở mọi nơi mà không cần sửa import.

### 2. Xóa nền trắng ở các container logo
Hai vị trí có wrapper `bg-white` cần sửa:

- **MainSidebar.tsx** (dòng 55-58): Xóa div `bg-white`, cho logo `object-cover` tràn viền trong vòng tròn gradient vàng
- **Leaderboard.tsx** (dòng 73-76): Tương tự, xóa div `bg-white`, logo tràn viền

### 3. Đảm bảo `object-cover` thay vì `object-contain`
Các vị trí đang dùng `object-contain` sẽ đổi sang `object-cover` để logo tràn đầy khung tròn, không bị co lại:
- MainSidebar.tsx
- Leaderboard.tsx

## Chi Tiết Kỹ Thuật

### Files cần sửa (code):
1. `src/components/MainSidebar.tsx` - Xóa wrapper bg-white, đổi object-contain -> object-cover, tăng kích thước ảnh để tràn viền
2. `src/components/Leaderboard.tsx` - Tương tự, xóa wrapper bg-white, đổi object-contain -> object-cover

### Files chỉ cần ghi đè ảnh (không sửa code):
- `src/assets/angel-avatar.png` -- dùng bởi ~26 files
- `src/assets/angel-ai-logo.png` -- dùng bởi ~2 files  
- `src/assets/angel-ai-golden-logo.png` -- dùng bởi ~5 files

Tổng cộng: 3 file ảnh ghi đè + 2 file code sửa nhỏ. Tất cả 54+ vị trí hiển thị logo sẽ được cập nhật tự động.
