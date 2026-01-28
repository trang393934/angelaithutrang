
# Kế Hoạch Điều Chỉnh Vị Trí Avatar Top 5

## Phân Tích Vấn Đề Hiện Tại

Dựa vào hình ảnh con cung cấp và hình nền gốc, cha nhận thấy các vấn đề sau:

| Vị trí | Vấn đề hiện tại |
|--------|-----------------|
| **Top 1** | Avatar hơi cao, cần xuống thấp hơn một chút |
| **Top 2** | Avatar quá lệch trái, cần dịch sang phải |
| **Top 3** | Avatar quá lệch phải, cần dịch sang trái |
| **Top 4** | Avatar quá lệch trái và cao, cần dịch phải và xuống |
| **Top 5** | Avatar quá lệch phải và cao, cần dịch trái và xuống |

## Đo Lường Vị Trí Chính Xác Từ Hình Nền

Dựa vào hình nền với tỷ lệ `4/5`, cha đã đo được tọa độ tâm của từng vòng tròn:

```text
┌─────────────────────────────────────┐
│         TOP RANKING                 │
│                                     │
│            ┌───┐                    │  Top 1: top=14%, left=50%
│            │ 1 │                    │
│            └───┘                    │
│                                     │
│     ┌───┐           ┌───┐          │  Top 2: top=35%, left=27%
│     │ 2 │           │ 3 │          │  Top 3: top=35%, left=73%
│     └───┘           └───┘          │
│                                     │
│     ┌───┐           ┌───┐          │  Top 4: top=60%, left=27%
│     │ 4 │           │ 5 │          │  Top 5: top=60%, left=73%
│     └───┘           └───┘          │
│                                     │
└─────────────────────────────────────┘
```

## Giá Trị CSS Chính Xác Cần Cập Nhật

### Thay đổi trong file `src/components/leaderboard/TopRankingHero.tsx`:

| Avatar | Hiện tại | Điều chỉnh mới |
|--------|----------|----------------|
| **Top 1** | `top-[11%] left-1/2 -translate-x-1/2` | `top-[14%] left-1/2 -translate-x-1/2` |
| **Top 2** | `top-[32%] left-[18%] -translate-x-1/2` | `top-[35%] left-[27%] -translate-x-1/2` |
| **Top 3** | `top-[32%] right-[18%] translate-x-1/2` | `top-[35%] left-[73%] -translate-x-1/2` |
| **Top 4** | `top-[56%] left-[18%] -translate-x-1/2` | `top-[60%] left-[27%] -translate-x-1/2` |
| **Top 5** | `top-[56%] right-[18%] translate-x-1/2` | `top-[60%] left-[73%] -translate-x-1/2` |

### Thay đổi quan trọng:
1. **Sử dụng `left` thay vì `right`** cho Top 3 và Top 5 để căn chỉnh đồng nhất với `-translate-x-1/2`
2. **Điều chỉnh tọa độ `top`** để avatar nằm đúng tâm vòng tròn theo chiều dọc
3. **Điều chỉnh tọa độ `left`** để avatar nằm đúng tâm vòng tròn theo chiều ngang

## Chi Tiết Kỹ Thuật

### Code cần cập nhật (lines 104-137):

```tsx
{/* Top 1 - Center, inside the top circle */}
{top5[0] && (
  <div className="absolute top-[14%] left-1/2 -translate-x-1/2">
    <TrophyAvatar user={top5[0]} rank={1} position="top1" />
  </div>
)}

{/* Top 2 - Left side, second row */}
{top5[1] && (
  <div className="absolute top-[35%] left-[27%] -translate-x-1/2">
    <TrophyAvatar user={top5[1]} rank={2} position="top2" />
  </div>
)}

{/* Top 3 - Right side, second row */}
{top5[2] && (
  <div className="absolute top-[35%] left-[73%] -translate-x-1/2">
    <TrophyAvatar user={top5[2]} rank={3} position="top3" />
  </div>
)}

{/* Top 4 - Left side, third row */}
{top5[3] && (
  <div className="absolute top-[60%] left-[27%] -translate-x-1/2">
    <TrophyAvatar user={top5[3]} rank={4} position="top4" />
  </div>
)}

{/* Top 5 - Right side, third row */}
{top5[4] && (
  <div className="absolute top-[60%] left-[73%] -translate-x-1/2">
    <TrophyAvatar user={top5[4]} rank={5} position="top5" />
  </div>
)}
```

## Kết Quả Mong Đợi

Sau khi áp dụng thay đổi:
- Tất cả 5 avatar sẽ nằm **chính giữa** các vòng tròn vàng
- Tên người dùng sẽ nằm trên đế đỡ bên dưới mỗi vòng tròn
- Layout sẽ hoạt động tốt trên cả mobile và desktop
