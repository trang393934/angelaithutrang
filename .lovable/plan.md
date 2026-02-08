

# Kế hoạch sửa bug và bổ sung PPLP cho các hành động còn thiếu

## Tổng quan tình trạng hiện tại

### Hành động ĐA TICH HOP PPLP (dang hoat dong)
| Hành động | File | Action Type | FUN Base |
|-----------|------|-------------|----------|
| Dang bai moi | process-community-post | POST_CREATE | 70 FUN |
| Binh luan (>= 50 ky tu) | process-community-post | COMMENT_CREATE | 40 FUN |
| Chia se bai viet (trong community) | process-community-post | SHARE_CONTENT | 40 FUN |
| Chia se noi dung (ra ngoai) | process-share-reward | SHARE_CONTENT | 40 FUN |
| Bai viet dat 5+ like (thuong tac gia) | process-community-post | POST_ENGAGEMENT | 40 FUN |

### BUG nghiem trong
| Bug | File | Mo ta |
|-----|------|-------|
| Thieu import PPLP | process-engagement-reward/index.ts | Goi `submitAndScorePPLPAction` va `PPLP_ACTION_TYPES` nhung KHONG import, se crash khi cau hoi dat 10+ like |

### Hanh dong CHUA tich hop PPLP (khong tao FUN Money)
| Hanh dong | File | Trang thai |
|-----------|------|------------|
| Tang qua Camly Coin | process-coin-gift/index.ts | Chi xu ly Camly Coin, khong co PPLP |
| Donate cho du an (Camly) | process-project-donation/index.ts | Chi xu ly Camly Coin, khong co PPLP |
| Donate crypto thu cong | process-manual-donation/index.ts | Chi xu ly light_points, khong co PPLP |

---

## Ke hoach thuc hien

### Buoc 1: Sua bug import trong `process-engagement-reward`

**File**: `supabase/functions/process-engagement-reward/index.ts`

**Van de**: Dong 153-172 goi `submitAndScorePPLPAction` va `PPLP_ACTION_TYPES` nhung khong co dong `import` nao. Ham se crash voi loi `ReferenceError: submitAndScorePPLPAction is not defined` khi mot cau hoi dat 10+ luot thich.

**Giai phap**: Them dong import tu `_shared/pplp-helper.ts`:
```typescript
import { submitAndScorePPLPAction, PPLP_ACTION_TYPES } from "../_shared/pplp-helper.ts";
```

---

### Buoc 2: Bo sung PPLP cho `process-coin-gift` (Tang qua)

**File**: `supabase/functions/process-coin-gift/index.ts`

**Logic hien tai**: Nguoi gui mat Camly Coin, nguoi nhan duoc Camly Coin + thong bao. Khong co diem PPLP nao.

**Bo sung**:
- Import `submitAndScorePPLPAction`, `PPLP_ACTION_TYPES`, `generateContentHash` tu `_shared/pplp-helper.ts`
- Sau khi giao dich tang qua thanh cong (dong ~253), them PPLP submission cho **nguoi gui** (hanh dong tang qua la hanh dong Anh Sang):
  - Action type: `DONATE_SUPPORT` (viec tang qua tuong duong voi hanh dong ho tro cong dong)
  - actor_id: senderId (nguoi gui)
  - target_id: giftRecord.id
  - impact scope: `group` (anh huong den ca nguoi nhan va cong dong)
  - quality_indicators: `['generosity', 'community_support']`
  - reward_amount: gia tri qua tang (de scoring tinh toan)
  - Ghi chu: Khong tang them Camly Coin (da co roi), chi tao diem PPLP de tao FUN Money

---

### Buoc 3: Bo sung PPLP cho `process-project-donation` (Donate du an bang Camly)

**File**: `supabase/functions/process-project-donation/index.ts`

**Logic hien tai**: Tru Camly Coin cua nguoi donate, cong vao quy du an, cap nhat PoPL score. Khong co PPLP.

**Bo sung**:
- Import `submitAndScorePPLPAction`, `PPLP_ACTION_TYPES` tu `_shared/pplp-helper.ts`
- Sau khi donate thanh cong (dong ~157), them PPLP submission cho **nguoi donate**:
  - Action type: `DONATE_SUPPORT` (120 FUN base theo Policy v1.0.2)
  - actor_id: donorId
  - impact scope: `ecosystem` (dong gop cho toan he sinh thai)
  - quality_indicators: `['project_support', 'ecosystem_builder']`
  - reward_amount: donationAmount

---

### Buoc 4: Bo sung PPLP cho `process-manual-donation` (Donate crypto thu cong)

**File**: `supabase/functions/process-manual-donation/index.ts`

**Logic hien tai**: Ghi nhan donate, cong light_points, gui thong bao. Khong co PPLP.

**Bo sung**:
- Import `submitAndScorePPLPAction`, `PPLP_ACTION_TYPES` tu `_shared/pplp-helper.ts`
- Them Supabase service role client (hien tai dang dung mot client duy nhat cho ca auth va DB -- can tach ra)
- Sau khi donate thanh cong (dong ~117), them PPLP submission:
  - Action type: `DONATE_SUPPORT`
  - actor_id: user.id
  - target_id: donation.id
  - impact scope: `ecosystem`
  - quality_indicators: `['crypto_donation', 'ecosystem_builder']`
  - integrity: Kem txHash neu co de tang tinh xac thuc
  - reward_amount: amount

---

### Buoc 5: Bo sung action type moi trong `_shared/pplp-helper.ts`

**File**: `supabase/functions/_shared/pplp-helper.ts`

**Van de**: Cac hanh dong tang qua (gift) hien chua co mapping trong `mapRewardToPPLPAction`.

**Bo sung**:
- Them mapping `'gift_sent': PPLP_ACTION_TYPES.DONATE_SUPPORT` vao ham `mapRewardToPPLPAction`
- Them mapping `'crypto_donation': PPLP_ACTION_TYPES.DONATE_SUPPORT` vao ham `mapRewardToPPLPAction`

---

## Tom tat tac dong

| STT | Hanh dong | Thay doi | Ket qua |
|-----|-----------|----------|---------|
| 1 | Sua bug import | Them 1 dong import | Engagement reward (10+ like) khong bi crash nua |
| 2 | Tang qua Camly | Them ~20 dong PPLP | Nguoi tang duoc tinh diem PPLP -> tao FUN Money |
| 3 | Donate du an | Them ~20 dong PPLP | Nguoi donate duoc tinh diem PPLP -> tao FUN Money |
| 4 | Donate crypto | Them ~25 dong PPLP | Nguoi donate crypto duoc tinh diem PPLP -> tao FUN Money |
| 5 | Cap nhat helper | Them 2 mapping | Map day du cac loai giao dich |

**Tong cong**: 5 file can chinh sua, khoang 90 dong code moi. Khong can thay doi database hay tao bang moi.

## Chi tiet ky thuat

### Mau code PPLP tieu chuan (ap dung cho tat ca):
```typescript
import { submitAndScorePPLPAction, PPLP_ACTION_TYPES } from "../_shared/pplp-helper.ts";

// Sau khi hanh dong thanh cong:
submitAndScorePPLPAction(supabase, {
  action_type: PPLP_ACTION_TYPES.DONATE_SUPPORT,
  actor_id: userId,
  target_id: recordId,
  metadata: { /* chi tiet hanh dong */ },
  impact: {
    scope: 'group', // hoac 'ecosystem'
    reach_count: 1,
    quality_indicators: ['generosity'],
  },
  integrity: {
    source_verified: true,
  },
  reward_amount: amount,
}).then(r => {
  if (r.success) console.log(`[PPLP] Scored: ${r.action_id}, FUN: ${r.reward}`);
}).catch(e => console.warn('[PPLP] Error:', e));
```

### Luu y quan trong:
- Tat ca PPLP call deu la **fire-and-forget** (dung `.then().catch()`) de khong lam cham response chinh
- Khong tang them Camly Coin trong PPLP (da tach biet theo thiet ke "decoupled reward")
- FUN Money duoc tao qua PPLP scoring, nguoi dung se thay o trang /mint

