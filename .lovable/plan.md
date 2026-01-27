

# Kế hoạch: Layout Cộng Đồng với Sidebar Cố Định (Chỉ Cột Giữa Cuộn)

## Mục tiêu
Cấu trúc lại trang `/community` để:
- 2 sidebar trái/phải **hoàn toàn cố định** (không cuộn theo trang)
- **Chỉ cột giữa** (bài viết) có thể cuộn
- Giống layout Facebook trên desktop

## Phân tích Nguyên nhân Thất bại Trước đó

### Vấn đề 1: `overflow-hidden` trên container cha
```tsx
// Line 107 - Community.tsx
<div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-full overflow-hidden">
```
CSS `overflow-hidden` ngăn sticky hoạt động vì nó tạo một scrolling context riêng.

### Vấn đề 2: Xung đột sticky trong FunEcosystemSidebar
```tsx
// FunEcosystemSidebar.tsx line 97
className="sticky top-[120px] h-fit ..."
```
Component con đã có `sticky`, trong khi parent `aside` cũng có `sticky top-4` → xung đột.

### Vấn đề 3: Layout không viewport-locked
Toàn trang có `min-h-screen` và cuộn bình thường → không thể giữ sidebar cố định hoàn toàn.

## Giải pháp: Layout Viewport-Locked

Chuyển sang kiến trúc **3-column fixed layout**:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CommunityHeader (sticky top-0)               │
├───────────────┬─────────────────────────────┬───────────────────┤
│               │                             │                   │
│  LEFT SIDEBAR │      MAIN CONTENT           │   RIGHT SIDEBAR   │
│  (fixed)      │      (scroll)               │   (fixed)         │
│               │                             │                   │
│  FUN          │   ┌─────────────────────┐   │   Leaderboard     │
│  Ecosystem    │   │ Create Post         │   │                   │
│               │   ├─────────────────────┤   │   Quy tắc thưởng  │
│               │   │ Post 1              │   │                   │
│               │   ├─────────────────────┤   │   Về Cộng Đồng    │
│               │   │ Post 2              │   │                   │
│               │   ├─────────────────────┤   │                   │
│               │   │ Post 3...           │   │                   │
│               │   │ ↕ SCROLLABLE        │   │                   │
│               │   └─────────────────────┘   │                   │
│               │                             │                   │
└───────────────┴─────────────────────────────┴───────────────────┘
```

## Chi tiết Kỹ thuật

### Thay đổi 1: Cấu trúc Community.tsx

**Trước:**
```tsx
<div className="min-h-screen bg-gradient-to-b ...">
  <CommunityHeader />
  <div className="container mx-auto ... overflow-hidden">
    <div className="flex gap-4 ... items-start">
      <aside className="... sticky top-4 ...">
        <FunEcosystemSidebar />
      </aside>
      <main className="... overflow-hidden">...</main>
      <aside className="... sticky top-4 ...">...</aside>
    </div>
  </div>
</div>
```

**Sau:**
```tsx
<div className="h-screen flex flex-col bg-gradient-to-b ...">
  {/* Header - fixed height */}
  <CommunityHeader />
  
  {/* Content area - fills remaining height */}
  <div className="flex-1 flex overflow-hidden">
    {/* Container centering */}
    <div className="container mx-auto flex gap-4 sm:gap-6 px-3 sm:px-4 py-4">
      
      {/* Left Sidebar - FIXED, no scroll */}
      <aside className="hidden xl:flex flex-col w-[220px] flex-shrink-0 overflow-y-auto">
        <FunEcosystemSidebar className="!sticky !top-0" />
      </aside>
      
      {/* Main Content - SCROLLABLE */}
      <main className="flex-1 min-w-0 overflow-y-auto space-y-4 sm:space-y-6 pr-2">
        {/* Posts content */}
      </main>
      
      {/* Right Sidebar - FIXED, internal scroll if needed */}
      <aside className="hidden lg:flex flex-col w-[320px] flex-shrink-0 overflow-y-auto space-y-6">
        <Leaderboard />
        <RewardRulesCard />
        {/* About section */}
      </aside>
      
    </div>
  </div>
</div>
```

### Thay đổi 2: Xóa sticky trong FunEcosystemSidebar.tsx

**Trước (line 96-98):**
```tsx
className={cn(
  "sticky top-[120px] h-fit bg-white/90 ...",
  className
)}
```

**Sau:**
```tsx
className={cn(
  "h-fit bg-white/90 backdrop-blur-sm rounded-xl border border-primary/10 shadow-sm overflow-hidden",
  className
)}
```

### Giải thích Kỹ thuật

| Thay đổi | Mục đích |
|----------|----------|
| `h-screen flex flex-col` | Khóa viewport, tạo layout fixed-height |
| `flex-1 flex overflow-hidden` | Container nội dung chiếm phần còn lại, ngăn overflow |
| Sidebar: `overflow-y-auto` | Cho phép sidebar cuộn nội bộ nếu quá dài |
| Main: `overflow-y-auto` | Chỉ cột giữa cuộn |
| Xóa `sticky` khỏi FunEcosystemSidebar | Tránh xung đột, parent đã xử lý fixed |

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (<lg) | Single column, cuộn bình thường |
| lg (≥1024px) | 2 cột: main + right sidebar |
| xl (≥1280px) | 3 cột: left + main + right |

## Tóm tắt Files cần sửa

| File | Thay đổi |
|------|----------|
| `src/pages/Community.tsx` | Tái cấu trúc layout thành viewport-locked 3-column |
| `src/components/community/FunEcosystemSidebar.tsx` | Xóa `sticky top-[120px]` khỏi className |

## Lợi ích
- 2 sidebar luôn hiển thị, không bao giờ cuộn đi
- Chỉ nội dung bài viết ở giữa cuộn
- Giống trải nghiệm Facebook trên desktop
- Mobile vẫn hoạt động bình thường (single column scroll)

