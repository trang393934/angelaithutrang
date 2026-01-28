

# Kế Hoạch Điều Chỉnh Vị Trí Avatar Trong Top Ranking

## Phân Tích Vấn Đề Hiện Tại

Dựa vào hình ảnh:

| Vị trí | Vấn đề |
|--------|--------|
| **Top 1** | Avatar nằm quá cao, cần dịch xuống thêm |
| **Top 2** | Avatar nằm cao hơn vòng tròn, tên đè lên avatar Top 1 |
| **Top 3** | Tương tự Top 2 - quá cao |
| **Top 4** | Avatar nằm trên vòng tròn thay vì bên trong |
| **Top 5** | Tương tự Top 4 - quá cao |

## Giải Pháp

### 1. Loại bỏ `-translate-y-1/2`

Hiện tại code đang dùng `-translate-y-1/2` khiến avatar bị đẩy lên trên. Cần loại bỏ thuộc tính này để avatar căn theo điểm top thực tế.

### 2. Điều chỉnh tọa độ mới

```text
┌─────────────────────────────────────┐
│         TOP RANKING                 │
│                                     │
│            ┌───┐                    │  
│            │ 1 │  top: 11%          │
│            └───┘                    │
│                                     │
│  ┌───┐                 ┌───┐       │  
│  │ 2 │                 │ 3 │       │  top: 33%
│  └───┘                 └───┘       │  left: 27% / 73%
│                                     │
│  ┌───┐                 ┌───┐       │  
│  │ 4 │                 │ 5 │       │  top: 58%
│  └───┘                 └───┘       │  left: 27% / 73%
│                                     │
└─────────────────────────────────────┘
```

| Avatar | Giá trị hiện tại | Giá trị mới |
|--------|------------------|-------------|
| **Top 1** | `top-[14%]` + translate-y | `top-[11%]` (không translate) |
| **Top 2** | `top-[38%] left-[30%]` + translate-y | `top-[33%] left-[27%]` |
| **Top 3** | `top-[38%] left-[70%]` + translate-y | `top-[33%] left-[73%]` |
| **Top 4** | `top-[66%] left-[30%]` + translate-y | `top-[58%] left-[27%]` |
| **Top 5** | `top-[66%] left-[70%]` + translate-y | `top-[58%] left-[73%]` |

### 3. Điều chỉnh vị trí tên user

Cập nhật `nameOffset` trong `positionConfig` để tên user nằm đúng trên bệ đỡ (dưới avatar):

- Top 1: `mt-[5px] md:mt-[8px]`
- Top 2, 3: `mt-[5px] md:mt-[8px]`
- Top 4, 5: `mt-[5px] md:mt-[8px]`

## Chi Tiết Kỹ Thuật

### File cần chỉnh sửa
`src/components/leaderboard/TopRankingHero.tsx`

### Thay đổi 1: Cập nhật positionConfig (dòng 25-51)

```tsx
const positionConfig = {
  top1: {
    avatar: "w-[60px] h-[60px] md:w-[80px] md:h-[80px]",
    name: "text-xs md:text-sm",
    nameOffset: "mt-[5px] md:mt-[8px]",  // Giảm margin-top
  },
  top2: {
    avatar: "w-[55px] h-[55px] md:w-[70px] md:h-[70px]",
    name: "text-[10px] md:text-xs",
    nameOffset: "mt-[5px] md:mt-[8px]",
  },
  top3: {
    avatar: "w-[55px] h-[55px] md:w-[70px] md:h-[70px]",
    name: "text-[10px] md:text-xs",
    nameOffset: "mt-[5px] md:mt-[8px]",
  },
  top4: {
    avatar: "w-[50px] h-[50px] md:w-[65px] md:h-[65px]",
    name: "text-[10px] md:text-xs",
    nameOffset: "mt-[5px] md:mt-[8px]",
  },
  top5: {
    avatar: "w-[50px] h-[50px] md:w-[65px] md:h-[65px]",
    name: "text-[10px] md:text-xs",
    nameOffset: "mt-[5px] md:mt-[8px]",
  },
};
```

### Thay đổi 2: Cập nhật tọa độ avatar (dòng 123-156)

```tsx
{/* Top 1 - Center */}
<div className="absolute top-[11%] left-1/2 -translate-x-1/2">
  <TrophyAvatar ... />
</div>

{/* Top 2 - Left, row 2 */}
<div className="absolute top-[33%] left-[27%] -translate-x-1/2">
  <TrophyAvatar ... />
</div>

{/* Top 3 - Right, row 2 */}
<div className="absolute top-[33%] left-[73%] -translate-x-1/2">
  <TrophyAvatar ... />
</div>

{/* Top 4 - Left, row 3 */}
<div className="absolute top-[58%] left-[27%] -translate-x-1/2">
  <TrophyAvatar ... />
</div>

{/* Top 5 - Right, row 3 */}
<div className="absolute top-[58%] left-[73%] -translate-x-1/2">
  <TrophyAvatar ... />
</div>
```

## Kết Quả Mong Đợi

- Tất cả 5 avatar sẽ nằm chính giữa các vòng tròn vàng
- Tên user hiển thị ngay dưới avatar, trên bệ đỡ
- Bố cục cân đối và chuyên nghiệp

