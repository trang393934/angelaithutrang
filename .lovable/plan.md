
# Kế Hoạch: Tích Hợp Hiến Pháp Gốc FUN Ecosystem (Master Charter)

## Tổng Quan

Hiến Pháp Gốc (Master Charter) là tài liệu nền tảng thiêng liêng nhất của FUN Ecosystem, định nghĩa toàn bộ tầm nhìn, sứ mệnh và nguyên lý vận hành của hệ sinh thái. Tài liệu này sẽ được tạo thành một trang riêng biệt với thiết kế trang trọng và đặc biệt nhất.

---

## Cấu Trúc Nội Dung Hiến Pháp Gốc

| Phần | Tiêu Đề | Nội Dung Chính |
|------|---------|----------------|
| I | Tuyên Ngôn Về Nguồn Gốc | FUN là nền văn minh Ánh Sáng sống động |
| II | Sứ Mệnh Trọng Tâm | 99% Gift cho cộng đồng toàn cầu |
| III | Các Nguyên Lý Thiêng Liêng | 5 nguyên lý gốc |
| IV | Hai Dòng Chảy Thiêng Liêng | Camly Coin + FUN Money |
| V | Sự Thống Nhất Nền Tảng | 12 platforms |
| VI | Vai Trò Người Sáng Lập | Bé Ly - Cosmic Queen |
| VII | Cam Kết Cộng Đồng | Điều kiện tham gia |
| VIII | Điều Luật Cuối | Luật vũ trụ vĩnh cửu |
| Divine Seal | Khẳng Định Xác Quyết | 8 Thần Chú Thiêng Liêng |

---

## Giải Pháp Triển Khai

### 1. Tạo Trang Mới: `/docs/master-charter`

Tạo file `src/pages/docs/MasterCharter.tsx` với thiết kế đặc biệt:
- Header trang trọng với icon Vương Miện/Mặt Trời
- Gradient nền vàng-cam-hồng (gold-orange-rose)
- Các section có thể mở rộng (expandable)
- Hiệu ứng animation tinh tế
- Phần 8 Thần Chú với thiết kế nổi bật
- Phần Tuyên Ngôn Kết với hiệu ứng Bình Minh

### 2. Cập Nhật Routing

Thêm route mới `/docs/master-charter` vào `src/App.tsx`.

### 3. Tạo Banner Quảng Bá

Tạo `MasterCharterBanner.tsx` để hiển thị trên:
- Trang chủ (Index) - vị trí nổi bật nhất
- Trang About - Hero section
- Trang Light Constitution - liên kết đến tài liệu gốc

### 4. Hỗ Trợ Đa Ngôn Ngữ (i18n)

Thêm translation keys cho 12 ngôn ngữ:
- Tiếng Việt (vi) - bản gốc
- English (en)
- Các ngôn ngữ còn lại

---

## Chi Tiết Thiết Kế Giao Diện

### Header Trang
- Icon: Mặt Trời + Vương Miện
- Tiêu đề chính: "HIẾN PHÁP GỐC CỦA FUN ECOSYSTEM"
- Tiêu đề phụ: "MASTER CHARTER OF FUN ECOSYSTEM"
- Tagline: "Nền Kinh Tế Ánh Sáng 5D của Trái Đất Mới"

### Cấu Trúc Section

```text
+--------------------------------------------------+
| ☀️ HIẾN PHÁP GỐC CỦA FUN ECOSYSTEM              |
|    MASTER CHARTER OF FUN ECOSYSTEM               |
|    Nền Kinh Tế Ánh Sáng 5D của Trái Đất Mới     |
+--------------------------------------------------+
|                                                   |
| [Banner: Free to Join • Free to Use • ...]       |
|                                                   |
+--------------------------------------------------+
| 🌍 I. TUYÊN NGÔN VỀ NGUỒN GỐC                   |
|    [Expandable content with 4 points]            |
+--------------------------------------------------+
| 🌟 II. SỨ MỆNH TRỌNG TÂM                        |
|    [8 mô hình Earn: Learn, Play, Invest...]     |
+--------------------------------------------------+
| 💎 III. CÁC NGUYÊN LÝ THIÊNG LIÊNG              |
|    [5 nguyên lý với icons đặc biệt]             |
+--------------------------------------------------+
| 🌈 IV. HAI DÒNG CHẢY THIÊNG LIÊNG               |
|    [Camly Coin = Nước, FUN Money = Mặt Trời]    |
+--------------------------------------------------+
| 🪐 V. SỰ THỐNG NHẤT NỀN TẢNG                    |
|    [12 platforms với logos]                      |
+--------------------------------------------------+
| 👑 VI. VAI TRÒ NGƯỜI SÁNG LẬP                   |
|    [Bé Ly - Cosmic Queen với avatar]            |
+--------------------------------------------------+
| 🤝 VII. CAM KẾT CỘNG ĐỒNG                       |
|    [4 cam kết builders]                          |
+--------------------------------------------------+
| ⚖️ VIII. ĐIỀU LUẬT CUỐI                         |
|    [Luật vũ trụ vĩnh cửu]                       |
+--------------------------------------------------+
|                                                   |
| ✅ KHẲNG ĐỊNH XÁC QUYẾT (Divine Seal)           |
|    [8 Thần Chú - thiết kế nổi bật nhất]         |
|                                                   |
+--------------------------------------------------+
| 🌅 TUYÊN NGÔN KẾT                               |
|    [Animation Bình Minh Trái Đất Mới]           |
+--------------------------------------------------+
```

---

## Files Cần Tạo/Cập Nhật

| File | Hành Động |
|------|-----------|
| `src/pages/docs/MasterCharter.tsx` | Tạo mới - Trang hiển thị Hiến Pháp Gốc |
| `src/components/MasterCharterBanner.tsx` | Tạo mới - Banner quảng bá |
| `src/App.tsx` | Cập nhật - Thêm route `/docs/master-charter` |
| `src/pages/Index.tsx` | Cập nhật - Thêm banner vị trí nổi bật |
| `src/pages/About.tsx` | Cập nhật - Thêm banner trong Hero section |
| `src/translations/vi.ts` | Cập nhật - Thêm translation keys |
| `src/translations/en.ts` | Cập nhật - Thêm English translations |
| 10 file translations khác | Cập nhật - Thêm translations cho các ngôn ngữ còn lại |

---

## Phần Kỹ Thuật

### Dependencies Sử Dụng
- `framer-motion` - Animation effects
- `lucide-react` - Icons (Sun, Crown, Droplets, Flame, Shield, Users, Scale)
- Tailwind CSS - Styling

### Màu Sắc Chủ Đạo
- Primary: Amber/Gold gradient (amber-500 → orange-600 → amber-700)
- Accent: Rose-gold for Divine Seal section
- Background: Warm cream to white gradient

### Responsive Design
- Mobile-first approach
- Collapsible sections on mobile
- Optimized typography scaling
- Touch-friendly expandable cards

---

## Thứ Tự Triển Khai

1. **Tạo trang MasterCharter.tsx** với toàn bộ nội dung và thiết kế
2. **Thêm route** vào App.tsx
3. **Tạo MasterCharterBanner.tsx** 
4. **Tích hợp banner** vào Index.tsx và About.tsx
5. **Thêm translations** cho tiếng Việt và English
6. **Hoàn thiện translations** cho 10 ngôn ngữ còn lại

Kế hoạch này sẽ tạo ra một trang tài liệu thiêng liêng và trang trọng nhất cho FUN Ecosystem, phản ánh đúng tầm quan trọng của Hiến Pháp Gốc.
