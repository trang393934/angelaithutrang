
# Kế Hoạch Thiết Kế Lại Bảng Xếp Hạng Trang Chủ

## Ý Tưởng Thiết Kế (Dựa trên mẫu)

Tạo một bảng xếp hạng vinh danh sang trọng với:

1. **Biểu tượng vinh danh trung tâm**: Logo Angel AI hoặc biểu tượng Trophy nằm chính giữa với hiệu ứng lấp lánh
2. **Top 5 Avatar bao quanh**: 5 avatar xếp theo hình bán nguyệt hoặc vòng cung quanh biểu tượng trung tâm
3. **Viền vàng kim loại 3D**: Mỗi avatar có viền 3 lớp gradient vàng tạo hiệu ứng 3D kim loại sáng
4. **Tiêu đề "TOP RANKING"**: Màu vàng gradient lấp lánh
5. **Danh sách xếp hạng bên dưới**: Hiển thị thông tin chi tiết (tên, điểm) với viền vàng
6. **Nút xem đầy đủ**: Dẫn đến trang Community hoặc mở rộng danh sách

---

## Chi Tiết Thiết Kế

### Khu vực Vinh Danh (Hero Zone)

```text
                    ┌─────────────────────────────────────┐
                    │         🏆 ANGEL AI LOGO 🏆          │
                    │      (Hiệu ứng phát sáng, lấp lánh)  │
                    └─────────────────────────────────────┘
                    
          ┌──────┐                           ┌──────┐
          │ #2   │                           │ #3   │
          │Avatar│                           │Avatar│
          │ Kim  │                           │ Hoa  │
          │ Ngân │                           │ Nguy │
          └──────┘                           └──────┘
                    
                         ┌───────────┐
                         │   #1      │  ← Avatar lớn nhất
                         │  Avatar   │     với vương miện
                         │  Thiên    │
                         │   Hạnh    │
                         └───────────┘
                         
          ┌──────┐                           ┌──────┐
          │ #4   │                           │ #5   │
          │Avatar│                           │Avatar│
          │ Hải  │                           │ joni │
          │ Vũ   │                           │      │
          └──────┘                           └──────┘
```

### Chi Tiết Avatar Vinh Danh

- **Top 1**: Avatar lớn nhất (80px), có vương miện phía trên, viền vàng dày 4px với glow mạnh
- **Top 2-3**: Avatar vừa (64px), viền vàng 3px, nằm 2 bên phía trên
- **Top 4-5**: Avatar nhỏ hơn (56px), viền vàng 2px, nằm 2 bên phía dưới
- Tất cả avatar có **hiệu ứng hover** phóng to nhẹ và tăng glow

### Danh Sách Chi Tiết Bên Dưới

Giống mẫu tham khảo:
- Mỗi hàng hiển thị: Thứ hạng | Avatar nhỏ | Tên | Số coin (màu vàng/xanh lá)
- Viền vàng kim loại 3D bao quanh từng hàng
- Hover highlight row

---

## Thay Đổi File

| File | Thay Đổi |
|------|----------|
| `src/components/Leaderboard.tsx` | Viết lại toàn bộ với thiết kế mới |

---

## Chi Tiết Kỹ Thuật

### 1. Cấu Trúc Component Mới

```text
<Card>
  {/* Header với logo trung tâm */}
  <div className="relative">
    {/* Logo Angel AI với hiệu ứng lấp lánh */}
    <motion.div animate sparkle effect>
      <img src={angelLogo} />
    </motion.div>
    
    {/* Tiêu đề "TOP RANKING" vàng gradient */}
    <h2 className="golden-gradient-text">TOP RANKING</h2>
  </div>
  
  {/* Khu vực Avatar vinh danh - dạng pyramid/arc */}
  <div className="flex flex-col items-center">
    {/* Row 1: Top 2 và Top 3 */}
    <div className="flex justify-center gap-8">
      <AvatarBadge rank={2} user={top2} size="md" />
      <AvatarBadge rank={3} user={top3} size="md" />
    </div>
    
    {/* Row 2: Top 1 ở giữa (lớn nhất) */}
    <div className="flex justify-center -mt-2">
      <AvatarBadge rank={1} user={top1} size="lg" crown />
    </div>
    
    {/* Row 3: Top 4 và Top 5 */}
    <div className="flex justify-center gap-12 -mt-2">
      <AvatarBadge rank={4} user={top4} size="sm" />
      <AvatarBadge rank={5} user={top5} size="sm" />
    </div>
  </div>
  
  {/* Danh sách chi tiết */}
  <div className="space-y-2">
    {top5Users.map(user => (
      <RankingRow user={user} />
    ))}
  </div>
  
  {/* Nút xem đầy đủ */}
  <Button>Xem bảng xếp hạng đầy đủ →</Button>
</Card>
```

### 2. AvatarBadge Component

```text
Props:
- rank: number (1-5)
- user: LeaderboardUser
- size: "sm" | "md" | "lg"
- crown?: boolean (chỉ Top 1)

Features:
- Viền vàng 3D 3 lớp (outer glow, highlight, inner shadow)
- Badge số thứ hạng góc dưới
- Hiệu ứng hover phóng to + tăng glow
- Crown icon cho Top 1
- Link đến profile user
```

### 3. RankingRow Component

```text
Layout: [Rank#] [Avatar nhỏ] [Tên] [Số coin]

Features:
- Viền vàng kim loại 3D bao quanh
- Số coin màu vàng đậm
- Hover highlight
- Click vào để xem profile
```

### 4. Hiệu Ứng Animation

- Logo trung tâm: pulse glow + rotating sparkles
- Tiêu đề: shimmer effect (giống HonorBoard)
- Avatar: subtle float animation
- Viền vàng: glow tăng khi hover
- Số coin: count-up animation khi load

### 5. Màu Sắc

- Nền: Gradient trắng-primary pale (sáng, thanh lịch)
- Viền vàng: `yellow-200` → `amber-400` → `yellow-500`
- Tiêu đề: Gradient vàng từ `yellow-300` → `amber-500`
- Số coin: `text-amber-600` hoặc `text-green-600` (như mẫu)
- Thứ hạng: `text-primary-deep` đậm

---

## Kết Quả Mong Đợi

1. **Bảng xếp hạng nổi bật** với thiết kế sang trọng, vinh danh Top 5 users
2. **Avatar Top 5** được hiển thị ở vị trí trung tâm theo dạng pyramid/arc
3. **Viền vàng kim loại 3D** sáng bóng cho tất cả avatar và hàng ranking
4. **Hiệu ứng lấp lánh** cho tiêu đề và logo trung tâm
5. **Responsive** - hiển thị đẹp trên cả mobile và desktop
6. **Real-time updates** - cập nhật thứ hạng tự động
7. **Navigation** - click avatar/tên để xem profile user
