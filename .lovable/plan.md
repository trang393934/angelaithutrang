
# Kế Hoạch Thiết Kế Lại Giao Diện Mobile Menu

## Phân Tích Hiện Trạng
Giao diện mobile menu hiện tại có các vấn đề:
- Các nút navigation xếp dọc đơn điệu, chiếm nhiều không gian
- Thiếu icon đi kèm text để dễ nhận diện
- Phần Web3 Wallet và thông tin user thiếu tổ chức rõ ràng
- Chưa có animation mượt mà khi mở/đóng menu
- Layout không tận dụng tối đa không gian màn hình

---

## Thiết Kế Mới: Modern App-Style Navigation

### 1. Navigation Grid Layout (Thay vì danh sách dọc)

Chuyển từ danh sách dọc sang **lưới 2 cột** với icon + text:

```text
┌─────────────────┬─────────────────┐
│   🏠            │   ℹ️            │
│  Trang Chủ     │  Về Angel AI    │
├─────────────────┼─────────────────┤
│   📚            │   💬            │
│  Knowledge     │  Kết Nối        │
├─────────────────┼─────────────────┤
│   👥            │   ✍️            │
│  Cộng Đồng     │  Viết Content   │
├─────────────────┼─────────────────┤
│   🔄            │   ⭐            │
│  Swap          │  Tích Lũy       │
└─────────────────┴─────────────────┘
```

**Styling:**
- Cards với gradient background và shadow nhẹ
- Border radius lớn (rounded-xl)
- Icon lớn hơn (24px) phía trên text
- Active state với viền vàng và glow effect

---

### 2. User Profile Card (Compact Premium)

Thiết kế card user profile sang trọng hơn:

```text
┌─────────────────────────────────────┐
│  ┌────┐                             │
│  │ 👤 │  Trang393934           →   │
│  └────┘  Xem hồ sơ                  │
├─────────────────────────────────────┤
│  🪙 CAMLY Coin        89.200       │
└─────────────────────────────────────┘
```

**Styling:**
- Avatar với border gradient vàng
- Hiệu ứng shimmer trên số Camly Coin
- Nền gradient nhẹ (amber-50 to transparent)

---

### 3. Web3 Wallet Section (Collapsible)

```text
┌─────────────────────────────────────┐
│  💳 Ví Web3                    ▼   │
├─────────────────────────────────────┤
│  (Kết nối/Thông tin ví khi mở)     │
└─────────────────────────────────────┘
```

---

### 4. Animation & Transitions

- **Menu mở:** Slide down + fade in từng element với stagger delay
- **Menu đóng:** Fade out nhanh
- **Touch feedback:** Scale effect khi nhấn
- **Backdrop:** Blur effect phía sau menu

---

## Chi Tiết Kỹ Thuật

### Files cần chỉnh sửa:

**1. `src/components/Header.tsx`**

Thay đổi chính trong Mobile Menu section:

```tsx
// Navigation Icons mapping
const navIcons = {
  "/": Home,
  "/about": Info,
  "/knowledge": BookOpen,
  "/chat": MessageCircle,
  "/community": Users,
  "/content-writer": PenLine,
  "/swap": ArrowRightLeft,
  "/earn": Star,
};

// Grid layout thay vì flex-col
<div className="grid grid-cols-2 gap-3 px-4">
  {navItems.map((item) => {
    const Icon = navIcons[item.href];
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-xl",
          "bg-gradient-to-br from-primary-deep/90 to-primary-deep",
          "border border-amber-500/30 shadow-md",
          "transition-all duration-300 active:scale-95",
          location.pathname === item.href && 
            "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
        )}
      >
        <Icon className="w-6 h-6 mb-2 text-white/90" />
        <span className="text-sm font-medium text-white text-center">
          {item.label}
        </span>
      </Link>
    );
  })}
</div>
```

**2. User Profile Card (Redesigned)**

```tsx
// Premium user card với gradient border
<div className="mx-4 rounded-2xl overflow-hidden 
  bg-gradient-to-r from-amber-100/50 via-white to-amber-100/50 
  dark:from-amber-950/30 dark:via-gray-900 dark:to-amber-950/30
  border border-amber-300/50 shadow-lg">
  
  {/* Profile row */}
  <Link to="/profile" className="flex items-center gap-4 p-4">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r 
        from-amber-400 to-orange-500 animate-pulse" />
      <img src={avatar} className="relative w-14 h-14 rounded-full 
        border-2 border-white object-cover" />
    </div>
    <div className="flex-1">
      <p className="font-bold text-lg">{displayName}</p>
      <p className="text-sm text-muted-foreground">Xem hồ sơ</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </Link>
  
  {/* Camly Coin row */}
  <Link to="/earn" className="flex items-center justify-between 
    px-4 py-3 border-t border-amber-200/50">
    <div className="flex items-center gap-2">
      <img src={camlyCoinLogo} className="w-7 h-7" />
      <span className="font-medium">CAMLY Coin</span>
    </div>
    <span className="text-xl font-bold text-amber-600">
      {balance.toLocaleString()}
    </span>
  </Link>
</div>
```

**3. Web3 Wallet (Collapsible với icon)**

```tsx
<Collapsible className="mx-4">
  <CollapsibleTrigger className="flex items-center justify-between 
    w-full p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 
    dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50">
    <div className="flex items-center gap-2">
      <Wallet className="w-5 h-5 text-blue-600" />
      <span className="font-medium">Ví Web3</span>
    </div>
    <ChevronDown className="w-5 h-5 transition-transform 
      data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2">
    <Web3WalletButton />
  </CollapsibleContent>
</Collapsible>
```

---

### Cấu Trúc Layout Mới

```text
┌─────────────────────────────────────┐
│  [Logo]    [Lang] [X Close]         │  <- Header
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │  🏠     │ │  ℹ️     │           │
│  │Trang Chủ│ │Về Angel │           │  <- Navigation Grid
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │  📚     │ │  💬     │           │
│  │Knowledge│ │ Kết Nối │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │  👥     │ │  ✍️     │           │
│  │Cộng Đồng│ │ Content │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │  🔄     │ │  ⭐     │           │
│  │  Swap   │ │ Tích Lũy│           │
│  └─────────┘ └─────────┘           │
│                                     │
├─────────────────────────────────────┤
│  💳 Ví Web3                    ▼   │  <- Web3 Collapsible
├─────────────────────────────────────┤
│  ┌────┐                             │
│  │ 👤 │  Trang393934           →   │  <- User Profile Card
│  └────┘  Xem hồ sơ                  │
│  ─────────────────────────────────  │
│  🪙 CAMLY Coin        89.200       │
├─────────────────────────────────────┤
│  [🚪 Đăng xuất]                     │  <- Logout Button
└─────────────────────────────────────┘
```

---

## Thêm Import & Dependencies

Cần import thêm các icons từ lucide-react:

```tsx
import {
  Home, Info, BookOpen, MessageCircle, Users, 
  PenLine, ArrowRightLeft, Star, Wallet, 
  ChevronRight, ChevronDown
} from "lucide-react";
```

Sử dụng Collapsible từ shadcn/ui:

```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
```

---

## Animations (CSS/Tailwind)

Thêm vào index.css hoặc sử dụng inline:

```css
/* Staggered animation cho grid items */
.mobile-nav-item {
  animation: slideUp 0.3s ease-out forwards;
  opacity: 0;
}

.mobile-nav-item:nth-child(1) { animation-delay: 0.05s; }
.mobile-nav-item:nth-child(2) { animation-delay: 0.1s; }
.mobile-nav-item:nth-child(3) { animation-delay: 0.15s; }
/* ... tiếp tục cho các items */

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:
- Giao diện mobile menu **chuyên nghiệp** như các app native
- **Dễ sử dụng** hơn với icon rõ ràng
- **Compact** hơn nhờ layout 2 cột
- **Animation mượt mà** tạo cảm giác cao cấp
- **User profile nổi bật** với thiết kế premium
- **Touch-friendly** với target size lớn (48x48px+)
