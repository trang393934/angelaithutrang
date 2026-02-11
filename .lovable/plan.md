

# Sửa lỗi và mở rộng toàn màn hình Hộp thoại Chi tiết User

## Vấn đề hiện tại
Từ ảnh chụp màn hình, hộp thoại chi tiết user đang gặp các lỗi:
1. **Kích thước quá nhỏ** -- nội dung bị cắt ngang, các thẻ thống kê chỉ hiển thị 1-2 cột, không thấy hết thông tin.
2. **Giá trị bị thiếu** -- các dòng PoPL Score, FUN Money, Tặng nội bộ không hiển thị số liệu bên phải.
3. **Tab "Phân tích thưởng" và "Lịch sử giao dịch"** bị trộn lẫn -- nội dung lịch sử giao dịch đang hiển thị ngay dưới mà không nằm trong tab riêng.

## Giải pháp

### Chỉnh sửa tệp: `src/components/admin/UserDetailDialog.tsx`

1. **Mở rộng toàn màn hình**: Thay đổi `DialogContent` từ `max-w-2xl` sang kích thước gần toàn màn hình (`max-w-[95vw] w-full h-[90vh]`), để tất cả nội dung hiển thị rõ ràng trên màn hình lớn.

2. **Sửa bố cục thẻ thống kê**: Đảm bảo 4 thẻ (Số dư, Tổng kiếm, Điểm Ánh sáng, Đã rút) hiển thị đều trên 1 hàng ngang với kích thước phù hợp.

3. **Sửa các dòng thông tin bị thiếu giá trị**: Kiểm tra lại cách hiển thị PoPL Score, FUN Money, Tặng nội bộ/Web3 -- đảm bảo giá trị số nằm bên phải mỗi dòng.

4. **Tăng chiều cao vùng cuộn (ScrollArea)**: Mở rộng `ScrollArea` để tận dụng toàn bộ chiều cao hộp thoại, tránh nội dung bị ẩn.

5. **Đảm bảo tab hoạt động đúng**: Hai tab "Phân tích thưởng" và "Lịch sử giao dịch" phải tách biệt rõ ràng, không hiển thị chồng chéo.

### Tệp cần chỉnh sửa
- `src/components/admin/UserDetailDialog.tsx` -- điều chỉnh kích thước, bố cục, và sửa hiển thị dữ liệu.

