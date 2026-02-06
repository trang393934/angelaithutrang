

# Thay Logo Hình Ảnh Bằng Chữ CSS "Angel AI" - Loại Bỏ Hoàn Toàn Nền

## Vấn Đề Hiện Tại

File hình `angel-ai-logo-golden-text.png` vẫn còn nền trắng/xám phía sau chữ, dù đã xử lý nhiều lần. Nền này hiển thị rõ trên giao diện tại Sidebar, Header, Hero và Footer.

## Giải Pháp Triệt Để

Thay tất cả `<img>` logo bằng **chữ CSS thuần túy** sử dụng font **Cinzel** + hiệu ứng gradient vàng kim loại. Chữ CSS không có nền nên vấn đề được giải quyết 100%.

Kiểu chữ sẽ giống hệt hình gốc:
- Font: Cinzel (đã có sẵn trong dự án)
- Màu: Gradient vàng kim loại (sáng ở giữa, tối ở rìa)
- Hiệu ứng: Drop shadow tạo chiều sâu

## Các File Cần Sửa

### 1. `src/index.css` - Thêm class `.text-brand-golden`

Thêm class CSS mới cho chữ thương hiệu vàng kim loại:
- Font family: Cinzel, serif
- Gradient vàng: `linear-gradient(135deg, #8B6914, #C49B30, #E8C252, #F5D976, #E8C252, #C49B30, #8B6914)`
- Kỹ thuật: `background-clip: text` + `-webkit-text-fill-color: transparent`
- Drop shadow nhẹ tạo chiều sâu 3D
- Phiên bản `.text-brand-golden-light` cho nền tối (Footer)

### 2. `src/components/HeroSection.tsx` - Logo trang chủ (lớn nhất)

Thay:
```
<img src={angelGoldenTextLogo} ... />
```
Bằng:
```
<span class="text-brand-golden text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Angel AI</span>
```

Bỏ import `angelGoldenTextLogo` nếu không còn dùng.

### 3. `src/components/Header.tsx` - Logo mobile

Thay `<img>` bằng chữ CSS kích thước `text-xl sm:text-2xl`.

### 4. `src/components/MainSidebar.tsx` - Logo sidebar

Thay `<img>` bằng chữ CSS kích thước `text-xl` khi sidebar mở rộng.

### 5. `src/components/Footer.tsx` - Logo footer (nền tối)

Thay `<img>` bằng chữ CSS dùng class `.text-brand-golden-light` (gradient sáng hơn cho nền tối).

## Chi Tiết Kỹ Thuật

### CSS Class `.text-brand-golden`

```text
.text-brand-golden {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: linear-gradient(
    135deg,
    #8B6914 0%,
    #C49B30 20%,
    #E8C252 40%,
    #F5D976 50%,
    #E8C252 60%,
    #C49B30 80%,
    #8B6914 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(139, 105, 20, 0.3));
}
```

### Phiên bản cho nền tối (Footer)

```text
.text-brand-golden-light {
  /* Giong nhu tren nhung gradient sang hon */
  background: linear-gradient(
    135deg,
    #C49B30 0%,
    #E8C252 25%,
    #F5D976 50%,
    #E8C252 75%,
    #C49B30 100%
  );
}
```

### Kích thước theo vị trí

| Vi tri | Kich thuoc |
|--------|-----------|
| HeroSection | text-4xl / sm:text-5xl / md:text-6xl / lg:text-7xl |
| Header (mobile) | text-xl / sm:text-2xl |
| MainSidebar | text-xl |
| Footer | text-xl / sm:text-2xl / md:text-3xl |

## Kết Quả

- Chữ "Angel AI" hiển thị với font Cinzel vàng kim loại sang trọng
- **Hoàn toàn không có nền** vì là chữ CSS thuần túy
- Hoạt động tốt trên mọi nền sáng/tối
- Không phụ thuộc vào file hình ảnh

