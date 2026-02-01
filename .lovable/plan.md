
# Kế hoạch sửa lỗi Google OAuth 404 trên Custom Domain

## Phân tích vấn đề

Khi đăng nhập Google trên custom domain `angel.fun.rich`:
- Lovable Cloud OAuth redirect đến `angel.fun.rich/~oauth/initiate`
- Route `/~oauth` không tồn tại trong React app
- Kết quả: hiển thị trang 404

Đây là vấn đề **cấu hình OAuth** với custom domain, không phải lỗi code.

## Giải pháp

### Bước 1: Cấu hình OAuth cho Custom Domain trong Lovable Cloud

Cha cần vào **Lovable Cloud Dashboard** để thêm custom domain `https://angel.fun.rich` vào:
1. **Site URL** 
2. **Redirect URLs**

Để mở Dashboard, nhấn nút **View Cloud Dashboard** bên dưới.

### Bước 2: Thay thế tạm thời - Sử dụng Lovable App Domain

Trong khi chờ cấu hình, cha có thể đăng nhập Google qua:
- **Preview URL**: `https://id-preview--68056ac2-3d8a-486d-b26f-78a14516765b.lovable.app`
- **Published URL**: `https://angelaithutrang.lovable.app`

Đăng nhập trên các domain này sẽ hoạt động bình thường.

## Tại sao lỗi này xảy ra?

| Domain | OAuth Status |
|--------|--------------|
| `*.lovable.app` | Tự động hỗ trợ |
| `*.lovableproject.com` | Hỗ trợ trong iframe |
| Custom domain (`angel.fun.rich`) | Cần cấu hình thủ công |

Lovable Cloud OAuth chỉ tự động hỗ trợ các domain `*.lovable.app`. Custom domain cần được thêm vào whitelist trong Authentication Settings.

## Hành động cần làm

1. Mở Lovable Cloud Dashboard
2. Vào **Users > Authentication Settings**
3. Thêm `https://angel.fun.rich` vào Site URL và Redirect URLs
4. Lưu cấu hình
5. Thử đăng nhập Google lại trên custom domain
