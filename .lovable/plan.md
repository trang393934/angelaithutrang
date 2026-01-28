

# Kế Hoạch Thêm Link "Content Writer" vào 3 Vị Trí

## Tổng Quan
Thêm đường dẫn đến trang "Angel AI Viết Content" (`/content-writer`) vào 3 vị trí chiến lược trên giao diện:
1. **Header Navigation** - Menu điều hướng chính
2. **Hero Section** - Phần giới thiệu trang chủ  
3. **Earn Page** - Trang tích lũy ánh sáng

---

## Vị Trí 1: Header Navigation

**Thay đổi:** Thêm mục "Viết Content" vào danh sách `navItems`

```text
Trang Chủ | Về Angel AI | Knowledge | Kết Nối | Cộng đồng | Viết Content | Swap | Tích Lũy
```

**Styling:** Giữ nguyên thiết kế premium với viền vàng kim loại và hiệu ứng shimmer

---

## Vị Trí 2: Hero Section (Trang Chủ)

**Thay đổi:** Thêm nút thứ 3 bên cạnh "Trò Chuyện" và "Cộng Đồng Ánh Sáng"

```text
[✨ Trò Chuyện] [Cộng Đồng Ánh Sáng] [✍️ Viết Content]
```

**Styling:** 
- Nút style `btn-sacred-outline` để đồng bộ với "Cộng Đồng Ánh Sáng"
- Icon `PenLine` hoặc `FileEdit` từ lucide-react

---

## Vị Trí 3: Earn Page (Quick Actions)

**Thay đổi:** Thêm Card mới trong mục "Quick Actions" (hiện có 5 cards)

```text
┌─────────────┐
│   ✍️        │
│ Viết Content│
│ Sáng tạo    │
│ chuyên nghiệp│
└─────────────┘
```

**Styling:**
- Background: `cyan-100` / `cyan-900/30` (dark mode)
- Icon: `PenLine` màu cyan
- Đồng bộ với các card khác

---

## Cập Nhật Đa Ngôn Ngữ

Thêm translation keys mới cho **12 ngôn ngữ**:

| Key | VI | EN |
|-----|----|----|
| `nav.contentWriter` | Viết Content | Content Writer |
| `hero.ctaContent` | Viết Content | Write Content |
| `earn.action.writeContent` | Viết Content | Write Content |
| `earn.action.contentDesc` | Sáng tạo nội dung chuyên nghiệp | Create professional content |

---

## Chi Tiết Kỹ Thuật

### Files cần chỉnh sửa:

1. **`src/components/Header.tsx`**
   - Thêm `{ label: t("nav.contentWriter"), href: "/content-writer" }` vào `navItems`

2. **`src/components/HeroSection.tsx`**
   - Import `PenLine` từ lucide-react
   - Thêm Link component với class `btn-sacred-outline`

3. **`src/pages/Earn.tsx`**
   - Import `PenLine` từ lucide-react
   - Thêm Card component trong Quick Actions grid

4. **Translation files** (12 files):
   - `src/translations/vi.ts`
   - `src/translations/en.ts`
   - `src/translations/zh.ts`
   - `src/translations/es.ts`
   - `src/translations/ar.ts`
   - `src/translations/hi.ts`
   - `src/translations/pt.ts`
   - `src/translations/ru.ts`
   - `src/translations/ja.ts`
   - `src/translations/de.ts`
   - `src/translations/fr.ts`
   - `src/translations/ko.ts`

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:
- Người dùng có thể truy cập trang Content Writer từ **bất kỳ trang nào** qua Header
- Trang chủ **nổi bật** tính năng mới với nút CTA
- Trang Earn **khuyến khích** người dùng sử dụng công cụ viết content

