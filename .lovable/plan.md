

## Sửa lỗi Google Sign-In trên Custom Domain (angel.fun.rich)

### Vấn đề
Khi bấm "Đăng nhập với Google" trên domain `angel.fun.rich`, trình duyệt chuyển đến `angel.fun.rich/~oauth/initiate?...` nhưng nhận lỗi 404. Lý do: route `~oauth/initiate` chỉ hoạt động trên domain gốc `angelaithutrang.lovable.app`, không hoạt động trên custom domain.

### Giải pháp
Thay đổi `redirect_uri` trong lời gọi Google Sign-In để luôn sử dụng domain `.lovable.app` thay vì `window.location.origin`. Sau khi đăng nhập thành công qua Google trên domain `.lovable.app`, session token sẽ được thiết lập và user sẽ được redirect trở lại.

### Thay đổi cần thực hiện

**File: `src/pages/Auth.tsx`**

Cập nhật `handleGoogleSignIn` - thay `redirect_uri: window.location.origin` thành `redirect_uri: "https://angelaithutrang.lovable.app"`:

```typescript
const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: "https://angelaithutrang.lovable.app",
});
```

### Chi tiết kỹ thuật
- Route `~oauth/initiate` là route nội bộ của Lovable Cloud, chỉ hoạt động trên domain `*.lovable.app`
- Khi dùng custom domain, OAuth initiation cần được thực hiện qua domain `.lovable.app`
- Sau khi Google xác thực xong, user sẽ được redirect về `angelaithutrang.lovable.app` nơi session được thiết lập
- Session cookie sẽ hoạt động khi user quay lại `angel.fun.rich` vì cùng chung backend

### Lưu ý
- Cần test lại trên cả hai domain sau khi sửa
- Nếu giải pháp này vẫn gặp vấn đề với cross-domain session, có thể cần thêm logic redirect từ `.lovable.app` về custom domain sau khi login thành công

