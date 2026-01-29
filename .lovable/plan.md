

# Kế hoạch Thiết kế Lại Trang Chủ - Bố cục 3 Phần

## Tổng quan

Chuyển từ thiết kế header ngang hiện tại sang bố cục 3 cột hiện đại với sidebar điều hướng bên trái, logo/branding ở giữa, và bảng xếp hạng bên phải.

```text
┌────────────────────────────────────────────────────────────────────┐
│                    HEADER MỚI (thu gọn)                            │
│  [Tìm kiếm] [Ngôn ngữ] [Ví] [Coin] [User] [Đăng xuất]             │
├──────────┬─────────────────────────────────────────┬───────────────┤
│          │                                         │               │
│  SIDEBAR │           CONTENT GIỮA                 │   LEADERBOARD │
│  TRÁI    │                                         │   PHẢI        │
│          │    ┌─────────────────────────┐         │               │
│ ┌──────┐ │    │                         │         │  ┌─────────┐  │
│ │ Home │ │    │     ANGEL AI LOGO       │         │  │ TOP     │  │
│ ├──────┤ │    │       (Avatar)          │         │  │ RANKING │  │
│ │About │ │    │                         │         │  │         │  │
│ ├──────┤ │    └─────────────────────────┘         │  │ #1 User │  │
│ │Knowl.│ │                                         │  │ #2 User │  │
│ ├──────┤ │         ANGEL AI                        │  │ #3 User │  │
│ │Chat  │ │                                         │  └─────────┘  │
│ ├──────┤ │  Ánh Sáng Thông Minh Từ Cha Vũ Trụ    │               │
│ │Commu.│ │                                         │               │
│ ├──────┤ │  The Intelligent Light of Father       │               │
│ │Writer│ │           Universe                      │               │
│ ├──────┤ │                                         │               │
│ │ Swap │ │    [Kết nối Angel AI] [Cộng đồng]      │               │
│ ├──────┤ │                                         │               │
│ │ Earn │ │                                         │               │
│ └──────┘ │                                         │               │
│          │                                         │               │
└──────────┴─────────────────────────────────────────┴───────────────┘
```

## Chi tiết Thay đổi

### Phần 1: Header Mới (Thu gọn)
- Loại bỏ navigation từ header, chỉ giữ lại các công cụ tiện ích
- Vẫn giữ logo nhỏ ANGEL AI ở góc trái như hiện tại
- Thanh tìm kiếm ở giữa
- Các nút: Ngôn ngữ, Ví Web3, Camly Coin, Thông tin User, Đăng xuất bên phải

### Phần 2: Sidebar Trái - Navigation
- Tạo component `MainSidebar.tsx` mới
- Sử dụng `SidebarProvider` và `Sidebar` từ thư viện UI có sẵn
- 8 mục điều hướng chính với icon và tên:
  - Trang chủ / Về Angel AI / Tri Thức / Kết Nối / Cộng đồng / Viết Content / Swap / Tích Lũy Ánh Sáng
- Có thể thu nhỏ thành mini-mode (chỉ hiện icon)
- Sticky position để luôn hiển thị khi cuộn

### Phần 3: Content Giữa - Logo & Branding
- Logo Angel AI avatar lớn ở trung tâm
- Chữ **"ANGEL AI"** in đậm, uppercase
- Tagline tiếng Việt: **"Ánh Sáng Thông Minh Từ Cha Vũ Trụ"**
- Tagline tiếng Anh: **"The Intelligent Light of Father Universe"**
- Các nút CTA: Kết nối Angel AI, Cộng đồng, Viết Content
- Các section khác: CamlyCoinPriceChart, MissionSection, CoreValuesSection, ConnectionSection

### Phần 4: Sidebar Phải - Leaderboard
- Component `Leaderboard` hiện tại được di chuyển sang vị trí cố định bên phải
- Sticky position để luôn hiển thị
- Giữ nguyên thiết kế Top Ranking hiện có

## Các File Cần Thay đổi

| File | Thay đổi |
|------|----------|
| `src/components/MainSidebar.tsx` | **TẠO MỚI** - Sidebar điều hướng trái |
| `src/pages/Index.tsx` | Cập nhật layout 3 cột với SidebarProvider |
| `src/components/Header.tsx` | Loại bỏ navigation bar, giữ utilities |
| `src/components/HeroSection.tsx` | Điều chỉnh để focus vào logo/branding ở giữa |

## Chi tiết Kỹ thuật

### MainSidebar.tsx (Component mới)
```
- Sử dụng SidebarProvider, Sidebar, SidebarContent từ ui/sidebar
- navItems giống như trong Header nhưng hiển thị dọc
- Thu nhỏ được thành 60px (mini-mode) chỉ hiện icon
- Animation mượt với framer-motion
- Active route highlighting với NavLink
```

### Index.tsx (Layout mới)
```
- Wrap toàn bộ trong SidebarProvider
- Flex container với 3 phần: Sidebar | Main | Leaderboard
- Main content scrollable, 2 sidebars sticky
```

### Header.tsx (Thu gọn)
```
- Xóa toàn bộ navItems render trong desktop nav
- Giữ lại: Logo nhỏ, Search, Language, Web3 Wallet, Coin balance, User profile
- Mobile menu giữ nguyên (vẫn cần cho mobile)
```

### HeroSection.tsx (Focus branding)
```
- Loại bỏ Leaderboard từ đây (đã chuyển sang sidebar phải)
- Logo/avatar Angel AI căn giữa
- Text branding căn giữa
- Responsive: trên mobile vẫn hiển thị full-width
```

## Responsive Design

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥1280px) | 3 cột đầy đủ |
| Laptop (1024-1279px) | Sidebar trái mini-mode, 2 cột |
| Tablet (768-1023px) | Ẩn sidebar trái, 2 cột (content + leaderboard) |
| Mobile (<768px) | 1 cột, hamburger menu, leaderboard dưới content |

## Lợi ích

1. **UX tốt hơn**: Navigation dễ tìm, luôn hiển thị
2. **Branding mạnh**: Logo và slogan nổi bật ở trung tâm
3. **Không bị cắt chữ**: Navigation không còn bị giới hạn bởi chiều ngang
4. **Leaderboard always visible**: Tăng engagement với bảng xếp hạng

