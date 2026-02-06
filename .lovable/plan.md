

# Ke Hoach: Ap Dung Cong Thuc FUN Profile Platform Cho Cong Dong Angel AI

## Tong Quan

Hien tai, cac hanh dong cong dong (dang bai, binh luan, chia se, giup do) tren Angel AI chi trao thuong **Camly Coin** (off-chain) va gui PPLP action nhung **khong cham diem ngay** hoac cham diem roi lai thuong them Camly Coin. Can sua de:

- Cac hanh dong cong dong duoc **cham diem PPLP ngay lap tuc** (real-time scoring)
- Reward tinh bang **FUN Money** (on-chain token) theo base reward cua Policy v1.0.1
- **Xoa** logic tang Camly Coin trong PPLP scoring (chi giu Camly Coin cho reward truc tiep)
- User co the **Claim FUN Money** tren trang /mint

## Bang Cong Thuc Ap Dung (FUN Profile Platform - Policy v1.0.1)

| Hanh dong | Action Type | Base FUN | Mo ta |
|---|---|---|---|
| Dang bai cong dong | POST_CREATE / CONTENT_CREATE | 70 FUN | Viet bai chia se |
| Tuong tac bai viet | POST_ENGAGEMENT / CONTENT_REVIEW | 40 FUN | Like, binh luan chat luong |
| Chia se noi dung | SHARE_CONTENT / CONTENT_REVIEW | 40 FUN | Chia se bai ra ngoai |
| Xay dung cong dong | HELP_COMMUNITY / COMMUNITY_BUILD | 120 FUN | Giup do thanh vien |
| Ho tro nguoi moi | MENTOR_HELP | 150 FUN | Huong dan nguoi moi |

**Cong thuc:** `FUN_Reward = floor(Base_FUN * Q * I * K)`
- Q (Quality): 0.5 - 3.0
- I (Impact): 0.5 - 5.0
- K (Integrity): 0.0 - 1.0
- Light Score phai >= 50 de pass

## Chi Tiet Ky Thuat

### 1. Cap nhat `supabase/functions/_shared/pplp-helper.ts`

- Them constant `FUN_PROFILE_BASE_REWARDS` chua mapping day du cac action type -> base FUN reward theo Policy v1.0.1
- Them function `getPolicyBaseReward(actionType, platformId)` tra ve base reward FUN tuong ung
- Mapping cu the:
  - POST_CREATE -> 70 FUN
  - COMMENT_CREATE -> 40 FUN
  - SHARE_CONTENT -> 40 FUN
  - HELP_COMMUNITY -> 120 FUN
  - POST_ENGAGEMENT -> 40 FUN
  - QUESTION_ASK -> 50 FUN
  - JOURNAL_WRITE -> 20 FUN
  - DONATE_SUPPORT -> 120 FUN
  - DAILY_LOGIN -> 20 FUN
  - IDEA_SUBMIT -> 150 FUN
  - FEEDBACK_GIVE -> 60 FUN

### 2. Cap nhat `supabase/functions/pplp-score-action/index.ts` (THAY DOI LON)

- **XOA** toan bo block `add_camly_coins` (dong 408-431) - KHONG tang Camly Coin khi PPLP score nua
- **XOA** `update_popl_score` trong block auto-mint (dong 444-448) - chuyen sang authorize-mint
- **THAY DOI** cach tinh base_reward:
  - Import `getPolicyBaseReward` tu pplp-helper
  - Su dung: `const baseReward = getPolicyBaseReward(action.action_type, action.platform_id) || config.base_reward || 100`
  - Uu tien base reward tu Policy v1.0.1, fallback ve `pplp_action_caps` table
- **GIU** status la `"scored"` (khong set `"minted"`) - chi mint khi on-chain thanh cong
- `final_reward` bay gio la so FUN Money (khong phai Camly Coin)
- Van giu fraud detection va cap check logic

### 3. Cap nhat `supabase/functions/process-community-post/index.ts` (THAY DOI TRUNG BINH)

- **Import** `submitAndScorePPLPAction` thay vi `submitPPLPAction`
- **Doi** `submitPPLPAction(supabase, {...})` thanh `submitAndScorePPLPAction(supabase, {...})` cho:
  - Action `create_post` (dong 188)
  - Action `add_comment` (dong 501)
- Dieu nay dam bao PPLP cham diem ngay khi user dang bai/binh luan
- **GIU NGUYEN** logic tang Camly Coin (dong 167-173) - day la off-chain reward rieng biet
- **Them** PPLP integration cho action `toggle_like` khi bai dat 5+ like (POST_ENGAGEMENT)
- **Them** PPLP integration cho action `share_post` (SHARE_CONTENT)

### 4. Cap nhat `supabase/functions/process-share-reward/index.ts` (THAY DOI NHO)

- **Import** `submitAndScorePPLPAction` thay vi `submitPPLPAction`
- **Doi** goi `submitPPLPAction` (dong 186) thanh `submitAndScorePPLPAction`
- GIU NGUYEN tang Camly Coin (dong 168-175)

### 5. Cap nhat `supabase/functions/process-engagement-reward/index.ts` (THEM MOI)

- **Import** PPLP helper functions
- **Them** PPLP integration khi bai dat 10+ like (engagement reward)
- Gui `submitAndScorePPLPAction` voi action_type = POST_ENGAGEMENT
- GIU NGUYEN tang Camly Coin cho engagement

### 6. Cap nhat `supabase/functions/pplp-authorize-mint/index.ts` (THAY DOI LON)

- **XOA** block auto-register action `govRegisterAction` (dong 396-413) vi Treasury khong phai guardianGov
- **XOA** block `add_camly_coins` (dong 484-505) - khong tang Camly Coin trong flow mint FUN
- **THEM** kiem tra `isAttester(signer.address)` truoc khi ky
- **THEM** log ro rang khi action chua dang ky hoac signer khong la attester
- Khi `lockWithPPLP` thanh cong: set `pplp_actions.status = 'minted'`
- Amount on-chain = `final_reward * 10^18` wei (18 decimals)
- GIU NGUYEN logic ky EIP-712 va gui lockWithPPLP

### 7. Cap nhat Database (`pplp_action_caps` table)

Cap nhat base_reward cho cac action type hien co de dong bo voi Policy v1.0.1:
- QUESTION_ASK: 100 -> 50
- CONTENT_CREATE: 150 -> 70
- COMMUNITY_POST: 100 -> 70
- CONTENT_REVIEW: 100 -> 40
- AI_REVIEW_HELPFUL: 150 -> 50
- DAILY_RITUAL: 50 -> 20
- DONATE: 500 -> 120
- VOLUNTEER: 400 -> 150
- MENTOR_HELP: 300 -> 150

### 8. Cap nhat Frontend

**`src/components/mint/FUNMoneyMintCard.tsx`:**
- Them label cho cac action cong dong moi: POST_ENGAGEMENT, COMMENT_CREATE, SHARE_CONTENT
- Hien thi reward la "FUN" ro rang

**`src/components/mint/MintActionsList.tsx`:**
- Khong thay doi lon, da hien thi dung

## Ket Qua Sau Khi Sua

### Luong Camly Coin (GIU NGUYEN):
```text
User dang bai -> process-community-post -> +1,000 Camly Coin (truc tiep)
User binh luan -> process-community-post -> +500 Camly Coin (truc tiep)
User chia se -> process-share-reward -> +500 Camly Coin (truc tiep)
User chat -> analyze-reward-question -> +2,000-3,500 Camly Coin (truc tiep)
```

### Luong FUN Money (MOI - song song):
```text
Cung luc, PPLP engine tinh toan:
1. submitAndScorePPLPAction -> tao action + cham 5 pillars ngay
2. Light Score >= 50 -> pass
3. FUN reward = Base * Q * I * K
   VD: Dang bai = 70 * 1.47 * 1.21 * 0.85 = ~105 FUN
4. Luu vao pplp_scores (status: "scored")
5. User vao /mint -> Thay action "San sang claim"
6. User bam "Claim FUN Money" -> goi pplp-authorize-mint
7. lockWithPPLP on-chain (khi guardianGov da cau hinh)
```

## Luu Y Quan Trong

- **Camly Coin va FUN Money la RIENG BIET**: Camly Coin tang truc tiep, FUN Money tinh qua PPLP
- **On-chain van chua hoat dong** cho den khi guardianGov (`0x7d03...`) goi `govSetAttester` va `govRegisterAction`
- **Khong mat du lieu cu**: Cac action da scored/minted truoc day van giu nguyen
- **Real-time scoring**: Tat ca hanh dong cong dong se duoc cham diem ngay (khong phai doi batch processor)

