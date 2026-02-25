

## Ket qua kiem tra: Han muc tao/sua anh

### Van de tim thay

| # | Van de | File | Chi tiet |
|---|---|---|---|
| 1 | **edit-image gioi han 3, khong phai 5** | `supabase/functions/edit-image/index.ts` dong 10 | `DAILY_EDIT_LIMIT = 3` thay vi 5 |
| 2 | **edit-image tang luot TRUOC khi sua thanh cong** | `supabase/functions/edit-image/index.ts` dong 47-48 | Dung `check_and_increment_ai_usage` (tang ngay) thay vi `check_ai_usage_only` + `increment_ai_usage` (kiem tra truoc, tang sau). Neu sua anh that bai (Google API loi), user van bi tru luot |
| 3 | **generate-image: DUNG** | `supabase/functions/generate-image/index.ts` | Limit = 5, dung mo hinh "kiem tra truoc - tang sau" (check_ai_usage_only + increment_ai_usage) |

### Nguyen nhan user bi "het luot" sau 1 lan

Khi user **sua anh** (edit-image):
- Goi `check_and_increment_ai_usage` → tang count **TRUOC** khi Google AI xu ly
- Neu Google AI tra loi loi (429, 500, anh khong hop le...) → count da bi tang roi, khong rollback
- User thu lai → count tang tiep → nhanh chong dat gioi han 3
- Frontend (`get_daily_ai_usage`) hien thi gioi han 5 nhung edge function thuc te chi cho 3 → gay nham lan

### Ke hoach sua

| # | File | Thay doi |
|---|---|---|
| 1 | `supabase/functions/edit-image/index.ts` dong 10 | Doi `DAILY_EDIT_LIMIT = 3` thanh `DAILY_EDIT_LIMIT = 5` |
| 2 | `supabase/functions/edit-image/index.ts` dong 47-49 | Doi `check_and_increment_ai_usage` thanh `check_ai_usage_only` (chi kiem tra, khong tang) |
| 3 | `supabase/functions/edit-image/index.ts` cuoi file | Them block `increment_ai_usage` SAU KHI sua anh thanh cong (giong generate-image dong 290-303) |

### Chi tiet ky thuat

**Buoc 1:** Dong 10
```typescript
// Truoc:
const DAILY_EDIT_LIMIT = 3;
// Sau:
const DAILY_EDIT_LIMIT = 5;
```

**Buoc 2:** Dong 47-49
```typescript
// Truoc:
const { data: usageCheck, error: usageError } = await supabase.rpc(
  'check_and_increment_ai_usage',
  { _user_id: userId, _usage_type: 'edit_image', _daily_limit: DAILY_EDIT_LIMIT }
);

// Sau:
const { data: usageCheck, error: usageError } = await supabase.rpc(
  'check_ai_usage_only',
  { _user_id: userId, _usage_type: 'edit_image', _daily_limit: DAILY_EDIT_LIMIT }
);
```

**Buoc 3:** Them block increment sau dong 197 (sau khi upload thanh cong):
```typescript
if (userId) {
  const supabaseForIncrement = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader! } }
  });
  await supabaseForIncrement.rpc('increment_ai_usage', {
    _user_id: userId, _usage_type: 'edit_image'
  });
}
```

### Tom tat
- **1 file sua**: `supabase/functions/edit-image/index.ts`
- **0 file moi, 0 thay doi database**
- generate-image da dung — khong can sua

