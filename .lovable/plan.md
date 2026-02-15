

# Sua loi mat luot tao anh khi that bai

## Van de

Ham `check_and_increment_ai_usage` trong database tang bo dem (`usage_count`) TRUOC khi anh duoc tao thanh cong. Neu qua trinh tao anh bi loi (Fal.ai timeout, loi mang, Google API loi...), bo dem van bi tang. User mat luot ma khong nhan duoc anh.

## Giai phap

Tach logic thanh 2 buoc:
1. **Kiem tra** gioi han truoc (KHONG tang bo dem)
2. **Tang bo dem** CHI SAU KHI anh duoc tao thanh cong

### Thay doi cu the

#### 1. Tao ham database moi: `check_ai_usage_only`

Ham nay chi kiem tra gioi han, KHONG tang bo dem:
- Neu `usage_count >= daily_limit` -> tra ve `allowed = false`
- Neu chua dat gioi han -> tra ve `allowed = true` (khong increment)

#### 2. Tao ham database moi: `increment_ai_usage`

Ham nay chi tang bo dem, goi SAU KHI thanh cong:
- Tang `usage_count + 1`
- Tra ve count moi

#### 3. Cap nhat Edge Function `generate-image/index.ts`

Thay doi flow:

```text
Truoc:
  check_and_increment (tang luon) -> tao anh (co the loi) -> tra ve

Sau:
  check_ai_usage_only (chi kiem tra) -> tao anh -> NEU thanh cong -> increment_ai_usage
```

Cu the:
- Dong 37-56: Thay `check_and_increment_ai_usage` bang `check_ai_usage_only`
- Them logic goi `increment_ai_usage` SAU dong 236 (sau khi anh da tao thanh cong)

## File can sua

| File/Doi tuong | Thay doi |
|----------------|----------|
| Database migration | Tao 2 ham moi: `check_ai_usage_only` va `increment_ai_usage` |
| `supabase/functions/generate-image/index.ts` | Doi flow: check truoc, increment sau khi thanh cong |

## Ket qua mong doi

- User chi bi tru luot khi THUC SU nhan duoc anh
- Neu tao anh that bai, luot khong bi mat
- Gioi han 3 anh/ngay van duoc dam bao

