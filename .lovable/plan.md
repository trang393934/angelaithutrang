


# ✅ HOÀN THÀNH: Áp Dụng Công Thức FUN Profile Platform Cho Cộng Đồng Angel AI

## Tổng Kết Thay Đổi

### 1. `supabase/functions/_shared/pplp-helper.ts`
- ✅ Thêm `POLICY_V101_BASE_REWARDS` mapping đầy đủ 18 action types
- ✅ Thêm `getPolicyBaseReward()` và `getPolicyPlatform()` functions

### 2. `supabase/functions/pplp-score-action/index.ts`
- ✅ Import `getPolicyBaseReward` từ pplp-helper
- ✅ Sử dụng Policy v1.0.1 base rewards thay vì hardcoded 100
- ✅ **XÓA** toàn bộ `add_camly_coins` - KHÔNG tặng Camly Coin khi score
- ✅ **XÓA** `update_popl_score` trong auto-mint block
- ✅ Giữ status "scored" (không set "minted") - user claim qua /mint
- ✅ `Math.floor` thay vì `Math.round` theo policy

### 3. `supabase/functions/process-community-post/index.ts`
- ✅ Đổi `submitPPLPAction` → `submitAndScorePPLPAction` (real-time scoring)
- ✅ Thêm PPLP cho `toggle_like` (POST_ENGAGEMENT khi 5+ likes)
- ✅ Thêm PPLP cho `share_post` (SHARE_CONTENT)
- ✅ Giữ nguyên Camly Coin rewards (off-chain)

### 4. `supabase/functions/process-share-reward/index.ts`
- ✅ Đổi `submitPPLPAction` → `submitAndScorePPLPAction`
- ✅ Giữ nguyên Camly Coin rewards

### 5. `supabase/functions/process-engagement-reward/index.ts`
- ✅ Thêm PPLP integration (POST_ENGAGEMENT khi 10+ likes)
- ✅ Giữ nguyên Camly Coin rewards

### 6. `supabase/functions/pplp-authorize-mint/index.ts`
- ✅ **XÓA** auto-register `govRegisterAction` (Treasury không phải guardianGov)
- ✅ **XÓA** `add_camly_coins` - KHÔNG tặng Camly Coin trong flow mint
- ✅ Thêm `isAttester()` check trước khi ký
- ✅ Log rõ ràng khi action chưa đăng ký
- ✅ Chỉ set "minted" khi on-chain thành công

### 7. Database (`pplp_action_caps`)
- ✅ Cập nhật base_reward theo Policy v1.0.1

### 8. Frontend (`FUNMoneyMintCard.tsx`)
- ✅ Thêm labels cho tất cả community action types

## Bảng Base Reward Áp Dụng

| Action Type | Base FUN | Platform |
|---|---|---|
| POST_CREATE | 70 | FUN_PROFILE |
| COMMENT_CREATE | 40 | FUN_PROFILE |
| SHARE_CONTENT | 40 | FUN_PROFILE |
| POST_ENGAGEMENT | 40 | FUN_PROFILE |
| HELP_COMMUNITY | 120 | FUN_PROFILE |
| MENTOR_HELP | 150 | FUN_PROFILE |
| QUESTION_ASK | 50 | ANGEL_AI |
| JOURNAL_WRITE | 20 | FUNLIFE |
| DAILY_LOGIN | 20 | FUNLIFE |
| DONATE_SUPPORT | 120 | FUN_CHARITY |
