

# Hiển thị công khai số liệu tài chính trên trang cá nhân

## Mục tiêu

Mở rộng mục "Giới thiệu" trên trang cá nhân `/user/:userId` để hiển thị **công khai** toàn bộ số liệu tài chính cho **tất cả người xem** (không chỉ chủ sở hữu), bao gồm:

1. **Camly Coin**: Số dư hiện tại + Tổng tích lũy
2. **PoPL Score**: Điểm + Cấp bậc huy hiệu + Số hành động tốt
3. **FUN Money (On-chain)**: Tổng FUN + Sẵn sàng claim / Đã mint / Đang chờ
4. Cập nhật **thời gian thực** khi user nhận thưởng

Giao diện giống hình mẫu đã đính kèm (image-303.png).

## Phân tích vấn đề hiện tại

### 1. Dữ liệu bị khóa bởi RLS (Row Level Security)
- `user_light_totals`: Chỉ chủ sở hữu xem được -> PoPL Score không hiển thị cho khách
- `pplp_actions` + `pplp_scores`: Chỉ chủ sở hữu xem được -> FUN Money Stats không hiển thị cho khách
- `camly_coin_balances`: Đã có chính sách public SELECT -> OK

### 2. Hook không hỗ trợ xem hồ sơ người khác
- `useCamlyCoin()` chỉ lấy dữ liệu của `auth.uid()` (người đăng nhập), không nhận tham số `userId`

### 3. Giao diện bị giới hạn
- 3 thẻ tài chính (Camly, PoPL, FUN Money) bị bọc trong `{isOwnProfile && (...)}` ở dòng 741-823

## Chi tiết kỹ thuật

### Bước 1: Cập nhật RLS (Row Level Security)

Thêm chính sách SELECT công khai cho 3 bảng:

```sql
-- 1. user_light_totals: Cho phép xem PoPL Score của bất kỳ ai
CREATE POLICY "Public can view PoPL scores"
  ON public.user_light_totals FOR SELECT
  USING (true);

-- 2. pplp_actions: Cho phép xem trạng thái action (cho FUN Money Stats)
CREATE POLICY "Public can view action status"
  ON public.pplp_actions FOR SELECT
  USING (true);

-- 3. pplp_scores: Cho phép xem điểm thưởng (cho FUN Money Stats)
CREATE POLICY "Public can view scores"
  ON public.pplp_scores FOR SELECT
  USING (true);
```

### Bước 2: Tạo hook `useUserCamlyCoin(userId)`

**Tệp mới**: `src/hooks/useUserCamlyCoin.ts`

Hook mới nhận tham số `userId` (bất kỳ) thay vì chỉ dùng `auth.uid()`:
- Truy vấn `camly_coin_balances` theo `userId` được truyền vào
- Trả về `balance` (số dư hiện tại) và `lifetimeEarned` (tổng tích lũy)
- Đăng ký **realtime subscription** để cập nhật tức thì khi số dư thay đổi
- Nhẹ hơn `useCamlyCoin` (không cần daily status, transactions)

### Bước 3: Cập nhật `UserProfile.tsx` — Mở khóa thẻ tài chính cho khách

**Tệp chỉnh sửa**: `src/pages/UserProfile.tsx`

Thay đổi chính:

1. **Import hook mới** `useUserCamlyCoin(userId)` thay vì `useCamlyCoin()` (vốn chỉ lấy auth user)

2. **Xóa điều kiện `isOwnProfile`** trên đoạn dòng 741-823 — cho phép tất cả người xem thấy:
   - Thẻ Camly Coin (số dư + tích lũy)
   - Thẻ PoPL Score (điểm + huy hiệu + hành động tốt)
   - Thẻ FUN Money (tổng + sẵn sàng claim / đã mint / đang chờ)

3. **Cập nhật tab "Giới thiệu"** (dòng 1095-1138) để cũng hiển thị 3 thẻ tài chính (đồng bộ với sidebar)

4. **Thêm realtime subscription** cho `camly_coin_balances` theo `userId` đang xem — khi admin cộng thưởng, số liệu tự cập nhật ngay

### Bước 4: Cập nhật trang HandleProfile (Public Profile)

**Tệp chỉnh sửa**: `src/hooks/usePublicProfile.ts`

Thêm truy vấn `camly_coin_balances.balance` (số dư hiện tại) và FUN Money Stats vào hàm `fetchPublicProfile`. Hiện tại chỉ lấy `lifetime_earned`.

**Tệp chỉnh sửa**: `src/components/public-profile/PublicProfileStats.tsx`

Thêm hiển thị:
- Số dư Camly Coin hiện tại (bên cạnh "tổng tích lũy" đã có)
- FUN Money tổng

## Tóm tắt tác động

| STT | Tệp | Hành động | Mô tả |
|-----|------|-----------|-------|
| 1 | Database (RLS) | Migration | Thêm 3 chính sách public SELECT cho `user_light_totals`, `pplp_actions`, `pplp_scores` |
| 2 | `src/hooks/useUserCamlyCoin.ts` | Tạo mới | Hook lấy Camly balance cho bất kỳ userId + realtime |
| 3 | `src/pages/UserProfile.tsx` | Chỉnh sửa | Xóa guard `isOwnProfile`, dùng hook mới, thêm realtime |
| 4 | `src/hooks/usePublicProfile.ts` | Chỉnh sửa | Thêm truy vấn balance + FUN Money |
| 5 | `src/components/public-profile/PublicProfileStats.tsx` | Chỉnh sửa | Hiển thị thêm số dư Camly + FUN Money |

**Tổng cộng**: 1 migration, 1 file mới, 3 file chỉnh sửa.

