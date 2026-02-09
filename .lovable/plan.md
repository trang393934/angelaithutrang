
## Kế hoạch: Cập nhật Luật Ánh Sáng mới & Sửa lỗi Google OAuth

### 📋 Phân tích hiện trạng

#### 1. Vấn đề với flow đăng ký/đăng nhập hiện tại:
- **Đăng ký mới**: Người dùng phải đọc và đồng ý "Pure Love Pledge" (nội dung cũ) → đúng logic
- **Đăng nhập (người dùng đã đồng ý trước đó)**: Vẫn BẮT BUỘC phải đánh dấu checkbox → **SAI** → cần sửa

#### 2. Vấn đề Google OAuth:
- Import hiện tại: `import { lovable } from "@/integrations/lovable"` → đúng (TypeScript tự resolve đến `/index.ts`)
- Cấu hình OAuth đã có sẵn trong Lovable Cloud (managed solution)
- **Cần debug thêm** bằng cách kiểm tra thực tế khi click nút Google

#### 3. Database `user_light_agreements`:
- Đã có bảng lưu trữ: `id`, `user_id`, `agreed_at`, `created_at`
- Logic check đã đúng trong `useLightAgreement.ts`

---

### 🔧 Thay đổi cần thực hiện

#### **File 1: `src/pages/Auth.tsx`**

**A. Cập nhật nội dung component `PureLovePledge` thành "Luật Ánh Sáng" mới:**

Nội dung mới gồm:
- Tiêu đề: "🌈 LUẬT ÁNH SÁNG CỦA CỘNG ĐỒNG FUN (PPLP)"
- Giới thiệu FUN Ecosystem với tagline "Free to Join ✨ Free to Use ✨ Earn Together"
- 5 Cột Trụ Ánh Sáng (Chân thật, Đóng góp, Chữa lành, Phụng sự, Hợp Nhất)
- 8 Thần Chú Ánh Sáng
- 5 Điều Cam Kết

**B. Thay đổi logic flow đăng nhập:**

```typescript
// TRƯỚC (SAI - yêu cầu checkbox cả khi đã đồng ý)
if (!agreedToLightLaw) { return error; }

// SAU (ĐÚNG - chỉ yêu cầu checkbox cho signup, login bypass nếu đã có agreement)
- Khi isSignUp = true: Bắt buộc đọc và đồng ý
- Khi isSignUp = false (login): 
  - Không hiển thị checkbox agreement
  - Sau khi login thành công, check database
  - Nếu chưa có agreement → redirect tới màn hình đồng ý
  - Nếu đã có → redirect tới /profile
```

**C. Cấu trúc UI mới:**

```text
┌─────────────────────────────────────────┐
│         ĐĂNG KÝ (isSignUp=true)         │
├─────────────────────────────────────────┤
│  Email input                            │
│  Password input                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ☐ Tôi đã đọc và đồng ý với      │   │
│  │   "Luật Ánh Sáng" (bấm để đọc)  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Đăng ký & Bước vào Cổng Ánh Sáng]    │
│  ─────── hoặc ──────                    │
│  [Đăng nhập với Google]                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         ĐĂNG NHẬP (isSignUp=false)      │
├─────────────────────────────────────────┤
│  Email input                            │
│  Password input                         │
│                                         │
│  [Đăng nhập] ← KHÔNG CẦN checkbox      │
│  ─────── hoặc ──────                    │
│  [Đăng nhập với Google]                 │
└─────────────────────────────────────────┘
```

---

### 📝 Chi tiết kỹ thuật

#### 1. Component `LightLawContent` mới (thay thế `PureLovePledge`):

```tsx
const LightLawContent = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="text-center">
      <span className="text-4xl">🌈</span>
      <h2>LUẬT ÁNH SÁNG CỦA CỘNG ĐỒNG FUN</h2>
      <p>(PPLP – Proof of Pure Love Protocol)</p>
    </div>
    
    {/* Intro */}
    <div>Chào mừng bạn đến với Cộng đồng FUN 💚...</div>
    
    {/* 5 Cột Trụ Ánh Sáng */}
    <div>
      1. 🔎 Chân thật & minh bạch
      2. 💎 Đóng góp bền vững
      3. 💚 Chữa lành & yêu thương
      4. 🌿 Phụng sự sự sống
      5. 🌟 Hợp Nhất với Nguồn
    </div>
    
    {/* 8 Thần Chú */}
    <div>8 THẦN CHÚ ÁNH SÁNG...</div>
    
    {/* 5 Cam Kết */}
    <div>5 Điều tôi cam kết...</div>
  </div>
);
```

#### 2. Logic flow mới:

```typescript
// Đăng nhập thường (email/password)
const handleSubmit = async () => {
  if (isSignUp) {
    // ĐĂNG KÝ: Bắt buộc đồng ý
    if (!agreedToLightLaw) return showError();
    
    await signUp(email, password);
    await saveAgreement(user.id);
    navigate("/profile");
  } else {
    // ĐĂNG NHẬP: Không cần checkbox
    await signIn(email, password);
    
    // Check agreement sau khi login
    const hasAgreement = await checkAgreement(user.id);
    if (!hasAgreement) {
      // Hiển thị dialog đồng ý (user cũ chưa ký)
      setShowPostLoginAgreement(true);
    } else {
      navigate("/profile");
    }
  }
};

// Google Sign In
const handleGoogleSignIn = async () => {
  // Cho phép sign in mà không cần checkbox trước
  // Sau khi auth xong, check agreement và xử lý
};
```

#### 3. Sửa lỗi Google OAuth:

- Thêm logging để debug khi click nút Google
- Đảm bảo `redirect_uri` đúng
- Kiểm tra flow sau khi OAuth redirect về

---

### 📁 Danh sách file cần sửa

| File | Thay đổi |
|------|----------|
| `src/pages/Auth.tsx` | Cập nhật nội dung Luật Ánh Sáng mới, thay đổi logic login/signup flow |

### ✅ Kết quả mong đợi

1. **Đăng ký mới**: Phải đọc và đồng ý "Luật Ánh Sáng" mới (PPLP) → lưu agreement → chuyển tới /profile
2. **Đăng nhập (đã đồng ý)**: Nhập email/password → đăng nhập ngay → không hiển thị Luật Ánh Sáng
3. **Đăng nhập (chưa đồng ý - user cũ)**: Đăng nhập → hiển thị dialog đồng ý → đồng ý → chuyển tới /profile  
4. **Google OAuth**: Hoạt động bình thường với cùng logic
