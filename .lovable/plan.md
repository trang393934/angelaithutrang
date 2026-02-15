

# Tang gioi han tao anh len 5 anh/ngay

## Thay doi

Co 2 noi can cap nhat:

### 1. Edge Function `supabase/functions/generate-image/index.ts`
- Dong 10: Doi `DAILY_IMAGE_LIMIT = 3` thanh `DAILY_IMAGE_LIMIT = 5`

### 2. Database function `get_daily_ai_usage`
- Ham nay tra ve `daily_limit` cho frontend hien thi thanh tien trinh (progress bar)
- Hien tai tra ve `3` cho `generate_image` va `edit_image`
- Doi thanh `5` cho ca hai

| File | Thay doi |
|------|----------|
| `supabase/functions/generate-image/index.ts` | `DAILY_IMAGE_LIMIT = 3` -> `5` |
| Database migration | Cap nhat ham `get_daily_ai_usage`: tra ve `5` thay vi `3` |

Thay doi nho, khong anh huong logic khac.

