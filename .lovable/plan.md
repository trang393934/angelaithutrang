

# Sửa lỗi Popup Lì xì hiện liên tục trên tài khoản Preview

## Nguyên nhân

URL đang có tham số `?preview_lixi=true` -- đây là chế độ xem trước dùng để kiểm tra giao diện popup Lì xì. Mỗi lần tải trang với tham số này, popup sẽ tự động mở lại vì state `previewOpen` luôn được khởi tạo là `true`.

## Ảnh hưởng các tài khoản khác

Tất cả thông báo Lì xì trong hệ thống đều đã được đọc và đã claim xong. Do đó **KHÔNG có tài khoản nào khác bị hiện popup** khi truy cập bình thường (không có `?preview_lixi=true` trong URL).

## Giải pháp

### File: `src/components/UserLiXiCelebrationPopup.tsx`

1. **Khi đóng popup preview, tự xóa tham số URL**: Sau khi người dùng nhấn đóng hoặc Claim trong chế độ preview, tự động xóa `?preview_lixi=true` khỏi URL bằng `window.history.replaceState` để không bị hiện lại khi refresh trang.

2. **Giới hạn preview chỉ dành cho admin** (tùy chọn): Thêm kiểm tra quyền admin trước khi cho phép chế độ preview hoạt động.

### Chi tiết kỹ thuật

Sửa hàm `setPreviewOpen` tại dòng 242-244:

```text
// Hiện tại:
const [previewOpen, setPreviewOpen] = useState(isPreview);

// Sau khi sửa: wrap setPreviewOpen để xóa URL param khi đóng
const [previewOpen, setPreviewOpenRaw] = useState(isPreview);
const setPreviewOpen = (open: boolean) => {
  setPreviewOpenRaw(open);
  if (!open && isPreview) {
    const url = new URL(window.location.href);
    url.searchParams.delete("preview_lixi");
    window.history.replaceState({}, "", url.toString());
  }
};
```

Thay đổi nhỏ, không ảnh hưởng logic chính, chỉ sửa 1 file duy nhất.

