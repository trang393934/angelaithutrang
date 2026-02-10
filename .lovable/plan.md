

## Sửa lỗi Google Sign-In trên angel.fun.rich

### Tình trạng hiện tại
Code đã được sửa `redirect_uri` thành `"https://angelaithutrang.lovable.app"` nhưng **chưa publish**. Trên production (`angel.fun.rich`), code cũ vẫn đang chạy với `redirect_uri: window.location.origin`, gây lỗi 404 tại `angel.fun.rich/~oauth/initiate`.

### Vấn đề cần giải quyết

1. **Publish thay đổi**: Bấm Publish để code mới lên production
2. **Redirect về custom domain**: Sau khi đăng nhập Google thành công, user hiện sẽ ở lại `angelaithutrang.lovable.app` thay vì quay về `angel.fun.rich`. Cần thêm logic tự động redirect.

### Thay đổi cần thực hiện

**File: `src/pages/Auth.tsx`**

Thêm logic phát hiện user đến từ custom domain và redirect về sau khi OAuth hoàn tất:

1. Trước khi gọi `signInWithOAuth`, lưu `window.location.origin` vào `localStorage` (key: `oauth_return_origin`) nếu đang ở trên custom domain (không phải `*.lovable.app`)
2. Trong `useEffect` khởi tạo trang Auth, kiểm tra nếu có `oauth_return_origin` trong `localStorage` và user đã đăng nhập, thì redirect về origin đó + `/profile`
3. Xóa key `oauth_return_origin` sau khi redirect

```text
Flow:
  angel.fun.rich/auth
    -> Luu "https://angel.fun.rich" vao localStorage
    -> Redirect den angelaithutrang.lovable.app/~oauth/initiate
    -> Google xac thuc
    -> Redirect ve angelaithutrang.lovable.app/auth
    -> Kiem tra localStorage, thay origin la angel.fun.rich
    -> Redirect ve angel.fun.rich/profile
```

### Chi tiet ky thuat

- Dung `localStorage` de truyen thong tin cross-redirect vi ca hai domain deu dung chung mot origin cho storage (cung Lovable project)
- Kiem tra `window.location.hostname` co chua `.lovable.app` de phan biet custom domain
- Logic redirect chi chay 1 lan roi xoa key de tranh vong lap

### Luu y
- Can bam **Publish** sau khi thay doi de code moi co hieu luc tren angel.fun.rich
- Neu localStorage khong share duoc giua hai domain (khac origin), se can dung query parameter thay the

