
# Cập nhật HandleSelector: Đổi Tên & Sửa Link

## Phạm vi thay đổi

Chỉ 1 file: `src/components/profile/HandleSelector.tsx`

## Chi tiết thay đổi

### 1. Đổi label "FUN Profile Link" → "Angel AI Profile Link"

Dòng 63 hiện tại:
```tsx
{source === "signup" ? "Chọn FUN Link của bạn" : "FUN Profile Link"}
```

Sửa thành:
```tsx
{source === "signup" ? "Chọn Angel AI Profile Link của bạn" : "Angel AI Profile Link"}
```

### 2. Sửa link để dẫn đến trang cá nhân đúng cách

Dòng 76–83 hiện tại — link dùng `href="/@${currentHandle}"` với `target="_blank"`, nhưng cần đảm bảo route hoạt động trong app (hệ thống đã có workaround tại NotFound.tsx để xử lý `/@handle`). Thêm `useNavigate` để tạo link nội bộ hoạt động mượt mà hơn.

Sửa thành dùng React Router `<Link>` hoặc `useNavigate` để navigate đến `/@${currentHandle}`:

```tsx
import { Link } from "react-router-dom";

// Thay thế <a> bằng <Link>
{currentHandle ? (
  <Link
    to={`/@${currentHandle}`}
    className="text-divine-gold hover:underline font-medium inline-flex items-center gap-1"
  >
    <ExternalLink className="w-3 h-3" />
    angel.fun.rich/{currentHandle}
  </Link>
) : (
  <span className="text-muted-foreground">angel.fun.rich/</span>
)}
```

Dùng React Router `<Link>` thay vì thẻ `<a>` để navigation diễn ra trong SPA (không reload trang), đồng thời bỏ `target="_blank"` để mở ngay trên tab hiện tại (giữ trải nghiệm mượt mà hơn).

## Tóm tắt

| Thay đổi | Dòng | Nội dung |
|---------|------|---------|
| Đổi tên label | 63 | "FUN Profile Link" → "Angel AI Profile Link" |
| Đổi tên signup text | 63 | "Chọn FUN Link..." → "Chọn Angel AI Profile Link..." |
| Sửa link | 74–87 | Dùng React Router `<Link>` thay `<a>`, bỏ `target="_blank"` |
| Thêm icon | — | `ExternalLink` nhỏ bên cạnh link |
