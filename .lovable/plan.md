

# Thay Logo Hình Ảnh Bằng Chữ "ANGEL AI" Kiểu Font Vàng Kim Loại

## Phân Tích Font Chữ Trong Hình

Dựa trên hình ảnh con gửi, font chữ "ANGEL AI" có đặc điểm:
- Font serif cổ điển, kiểu chữ La Mã trang trọng
- Chữ in hoa (uppercase), khoảng cách rộng giữa các ký tự
- Hiệu ứng gradient vàng kim loại (sáng ở giữa, tối ở rìa)

Font phù hợp nhất là **Cinzel** (Google Font miễn phí) - một font serif lấy cảm hứng từ chữ khắc La Mã cổ đại, rất sang trọng và quý phái. Đây là font phổ biến nhất cho các thiết kế luxury/gold branding.

## Thay Đổi Cần Thực Hiện

### 1. Thêm Font Cinzel (Google Fonts)

**File `index.html`**: Thêm link font Cinzel vào `<head>`.

**File `src/index.css`**: Thêm Cinzel vào `@import` Google Fonts đã có.

**File `tailwind.config.ts`**: Thêm font family mới `brand` cho chữ thương hiệu.

### 2. Tạo CSS Class Cho Chữ Vàng Kim Loại

**File `src/index.css`**: Thêm class `.text-brand-golden` với hiệu ứng:
- Font: Cinzel, serif
- Chữ in hoa, letter-spacing rộng
- Gradient vàng kim loại dùng `background-clip: text` (sáng ở giữa, đậm ở rìa)
- Text shadow nhẹ tạo chiều sâu 3D
- Hiệu ứng hover: gradient di chuyển tạo cảm giác lấp lánh

### 3. Thay Thế Logo Hình Ảnh Bằng Chữ Styled

Thay `<img src={angelGoldenLogo}>` bằng `<span className="text-brand-golden">ANGEL AI</span>` tại:

- **`src/components/Header.tsx`**: Logo mobile (dòng 127-136)
- **`src/components/MainSidebar.tsx`**: Logo sidebar expanded (dòng 57-61)
- **`src/components/HeroSection.tsx`**: Tiêu đề chính trang chủ (dòng 34-43) - kích thước lớn nhất
- **`src/components/Footer.tsx`**: Tên brand ở footer (dòng 33-35) - đã là text, chỉ cần đổi class

## Chi Tiết Kỹ Thuật

### CSS Class `.text-brand-golden`

```text
font-family: 'Cinzel', serif
text-transform: uppercase
letter-spacing: 0.15em
font-weight: 700
background: linear-gradient(
  135deg, 
  #8B6914 0%,      -- vang nau dam (rim)
  #C49B30 20%,     -- vang trung
  #E8C252 40%,     -- vang sang
  #F5D976 50%,     -- vang rat sang (giua)
  #E8C252 60%,     -- vang sang
  #C49B30 80%,     -- vang trung
  #8B6914 100%     -- vang nau dam (rim)
)
background-clip: text
-webkit-text-fill-color: transparent
text-shadow: 0 2px 4px rgba(139, 105, 20, 0.3)
```

### Kích Thước Theo Vị Trí

| Vi tri | Kich thuoc |
|--------|-----------|
| HeroSection (trang chu) | text-4xl sm:text-5xl md:text-6xl lg:text-7xl |
| Header (mobile) | text-xl sm:text-2xl |
| MainSidebar (expanded) | text-xl |
| Footer | text-xl sm:text-2xl md:text-3xl |

### File Cần Sửa (5 file)

1. `index.html` - Thêm link font Cinzel
2. `src/index.css` - Thêm class `.text-brand-golden` + import font
3. `tailwind.config.ts` - Thêm fontFamily `brand`
4. `src/components/Header.tsx` - Thay img bằng text
5. `src/components/MainSidebar.tsx` - Thay img bằng text
6. `src/components/HeroSection.tsx` - Thay img bằng text
7. `src/components/Footer.tsx` - Cập nhật class cho text brand

