
# Fix: Lọc Tài Khoản Bị Ban Khỏi Bảng Xếp Hạng

## Nguyên nhân gốc rễ (đã xác nhận)

Hook `useLeaderboard.ts` hiện tại fetch tất cả người dùng từ `camly_coin_balances` và `profiles` **mà không kiểm tra bảng `user_suspensions`**. Do đó, các tài khoản bị ban vĩnh viễn (`suspension_type: 'permanent'`, `lifted_at: null`) vẫn xuất hiện trên bảng xếp hạng.

Bảng `user_suspensions` có cấu trúc:
- `user_id` — ID người dùng bị ban
- `suspension_type` — loại ban (`permanent`, `temporary`)
- `lifted_at` — nếu `NULL` = vẫn đang bị ban

## Thay đổi cần thực hiện

### File: `src/hooks/useLeaderboard.ts`

**Bước 1** — Fetch danh sách user bị ban (song song với fetch balances):

```typescript
// Fetch suspended user IDs (permanent bans or active temp bans)
const { data: suspensions } = await supabase
  .from("user_suspensions")
  .select("user_id")
  .is("lifted_at", null); // Only active bans
```

**Bước 2** — Tạo Set các user_id bị ban để lọc nhanh:

```typescript
const suspendedUserIds = new Set(
  suspensions?.map(s => s.user_id) || []
);
```

**Bước 3** — Lọc ra khi build `combinedUsers`:

```typescript
// First add all users from balances — EXCLUDE banned users
balances?.forEach(balance => {
  if (suspendedUserIds.has(balance.user_id)) return; // Skip banned
  // ...existing logic
});

// Add profiles that don't have balance records — EXCLUDE banned users
allProfiles?.forEach(profile => {
  if (suspendedUserIds.has(profile.user_id)) return; // Skip banned
  // ...existing logic
});
```

**Bước 4** — Đếm `total_users` cũng cần loại banned users:

```typescript
// Count non-suspended profiles only
const { count: profilesCount } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .not('user_id', 'in', `(${[...suspendedUserIds].join(',')})`);
```

> Lưu ý: Nếu danh sách ban rỗng, fallback về count bình thường.

## Tóm tắt thay đổi

| File | Thay đổi |
|------|---------|
| `src/hooks/useLeaderboard.ts` | Thêm fetch `user_suspensions` → tạo `suspendedUserIds` Set → lọc khi build danh sách → loại khỏi count stats |

## Kết quả mong đợi

- Tài khoản bị ban vĩnh viễn (`lifted_at = null`) **biến mất hoàn toàn** khỏi Top Xếp Hạng
- Số thành viên hiển thị (`total_users`) cũng **không tính** tài khoản bị ban
- Realtime updates vẫn hoạt động bình thường
- Nếu ban bị gỡ (`lifted_at` có giá trị), user tự động xuất hiện lại trong leaderboard
