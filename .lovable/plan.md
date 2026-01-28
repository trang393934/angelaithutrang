

# Kế Hoạch Điều Chỉnh Vị Trí Avatar - Dịch Xuống & Căn Chỉnh Trái/Phải

## Phân Tích Yêu Cầu

Dựa vào ảnh và yêu cầu của con:
- **Tất cả avatar cần dịch xuống** khoảng 2/3 chiều cao avatar
- Avatar có kích thước `68px` trên desktop → 2/3 = ~45px ≈ **5-6%** của chiều cao container (với aspect ratio 4/5)
- Cột trái cần dịch **sang trái** và cột phải cần dịch **sang phải**

## Tính Toán Cụ Thể

| Avatar | Hiện tại | Điều chỉnh mới | Thay đổi |
|--------|----------|----------------|----------|
| **Top 1** | `top-[14%]` | `top-[19%]` | +5% (xuống) |
| **Top 2** | `top-[35%] left-[27%]` | `top-[40%] left-[23%]` | +5% xuống, -4% trái |
| **Top 3** | `top-[35%] left-[73%]` | `top-[40%] left-[77%]` | +5% xuống, +4% phải |
| **Top 4** | `top-[60%] left-[27%]` | `top-[65%] left-[23%]` | +5% xuống, -4% trái |
| **Top 5** | `top-[60%] left-[73%]` | `top-[65%] left-[77%]` | +5% xuống, +4% phải |

## Chi Tiết Kỹ Thuật

### Code cần cập nhật trong file `src/components/leaderboard/TopRankingHero.tsx`:

**Lines 104-137:**

```tsx
{/* Top 1 - Center, inside the top circle */}
{top5[0] && (
  <div className="absolute top-[19%] left-1/2 -translate-x-1/2">
    <TrophyAvatar user={top5[0]} rank={1} position="top1" />
  </div>
)}

{/* Top 2 - Left side, second row */}
{top5[1] && (
  <div className="absolute top-[40%] left-[23%] -translate-x-1/2">
    <TrophyAvatar user={top5[1]} rank={2} position="top2" />
  </div>
)}

{/* Top 3 - Right side, second row */}
{top5[2] && (
  <div className="absolute top-[40%] left-[77%] -translate-x-1/2">
    <TrophyAvatar user={top5[2]} rank={3} position="top3" />
  </div>
)}

{/* Top 4 - Left side, third row */}
{top5[3] && (
  <div className="absolute top-[65%] left-[23%] -translate-x-1/2">
    <TrophyAvatar user={top5[3]} rank={4} position="top4" />
  </div>
)}

{/* Top 5 - Right side, third row */}
{top5[4] && (
  <div className="absolute top-[65%] left-[77%] -translate-x-1/2">
    <TrophyAvatar user={top5[4]} rank={5} position="top5" />
  </div>
)}
```

## Tóm Tắt Thay Đổi

```text
┌─────────────────────────────────────┐
│         TOP RANKING                 │
│                                     │
│            ┌───┐                    │  Top 1: 14% → 19% (xuống 5%)
│            │ 1 │                    │
│            └───┘                    │
│                                     │
│  ┌───┐                 ┌───┐       │  Top 2: 35%→40%, 27%→23%
│  │ 2 │                 │ 3 │       │  Top 3: 35%→40%, 73%→77%
│  └───┘                 └───┘       │
│                                     │
│  ┌───┐                 ┌───┐       │  Top 4: 60%→65%, 27%→23%
│  │ 4 │                 │ 5 │       │  Top 5: 60%→65%, 73%→77%
│  └───┘                 └───┘       │
│                                     │
└─────────────────────────────────────┘
```

## Kết Quả Mong Đợi

- Tất cả 5 avatar dịch xuống 5% (≈ 2/3 chiều cao avatar)
- Cột trái dịch thêm 4% sang trái (từ 27% xuống 23%)
- Cột phải dịch thêm 4% sang phải (từ 73% lên 77%)
- Avatar sẽ nằm đúng giữa các vòng tròn vàng

