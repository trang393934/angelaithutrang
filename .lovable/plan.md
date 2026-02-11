

## Kiểm tra toàn diện quy trình Mint FUN Money -- Phát hiện & Kế hoạch khắc phục

### Tổng quan quy trình hiện tại

```text
User Action (Chat/Post/Journal/...)
  |
  v
Edge Function (analyze-reward-question, process-community-post, ...)
  |--- Camly Coin reward (off-chain)
  |--- submitAndScorePPLPAction() --> pplp_actions [status: scored]
  |
  v
User vào /mint --> thấy Light Actions --> nhấn "Request Mint"
  |
  v
useMintRequest.requestMint() --> upsert pplp_mint_requests [status: pending]
  |
  v
Admin vào /admin/mint-approval --> Approve --> pplp-authorize-mint
  |--- EIP-712 Sign
  |--- lockWithPPLP() on-chain
  |--- pplp_mint_requests [status: minted]
  |
  v
User kết nối ví MetaMask --> TokenLifecyclePanel
  |--- activate() on-chain
  |--- claim() on-chain --> FUN về ví
```

---

### Phát hiện quan trọng

#### 1. NGHIEM TRONG: 2,036 actions "scored + pass" KHONG CO mint request

**Van de**: Co 8,431 actions da scored nhung chi co 4,918 mint requests (3,358 pending + 88 signed + 1,470 minted + 2 expired). Nghia la **2,036 actions da dat diem nhung user chua bao gio nhan "Request Mint"** tren trang /mint.

**Nguyen nhan goc**: User phai thu cong vao /mint, ket noi vi, va nhan "Request Mint FUN" cho **tung action mot**. Voi 6,000+ QUESTION_ASK actions, day la trai nghiem rat kho chiu.

**De xuat**: Tu dong tao mint request khi action duoc scored + pass, hoac them nut "Request Mint All" de gui tat ca cung luc.

#### 2. NGHIEM TRONG: Journal actions chi submit, khong tu dong score

**Van de**: `analyze-reward-journal` goi `submitPPLPAction()` (chi submit) thay vi `submitAndScorePPLPAction()` (submit + score). Ket qua la journal actions co the bi ket o trang thai "pending" va khong bao gio duoc cham diem.

**Bang chung**: Chi co 15 JOURNAL_WRITE va 1,240 GRATITUDE_PRACTICE trong database, nhung co 1 action van o status "pending".

**De xuat**: Doi sang `submitAndScorePPLPAction()` trong `analyze-reward-journal`.

#### 3. THIEU: DAILY_LOGIN va VISION_CREATE khong co tich hop PPLP

**Van de**: Hai loai hanh dong nay duoc dinh nghia trong `pplp-types.ts` (BASE_REWARDS: DAILY_LOGIN = 100, VISION_CREATE khong co) nhung **khong co edge function nao goi submitPPLPAction** cho chung.

**De xuat**: Them PPLP integration vao `process-daily-login` (hoac hook `useDailyLogin`) va `process-vision-reward`.

#### 4. UX: User phai nhan "Request Mint" tung action mot

**Van de**: Trang /mint hien thi danh sach FUNMoneyMintCard, moi card co nut "Request Mint FUN". Voi hang ngan actions, user phai nhan tung cai mot --> khong thuc te.

**De xuat**: Them nut "Request Mint All" de gui tat ca scored+pass actions chua co mint request cung luc.

#### 5. HIEU SUAT: usePPLPActions chi load 50 actions

**Van de**: `fetchActions(limit = 50)` mac dinh chi lay 50 actions gan nhat. User co 6,000+ actions se khong thay nhung cai cu hon.

**De xuat**: Them pagination hoac tang limit, hoac chi hien cac actions chua mint.

#### 6. THIEU: Khong co PPLP tu dong khi user thuc hien hanh dong

**Van de**: `submitAction` tu `usePPLPActions` duoc export nhung **khong bao gio duoc goi tu bat ky component UI nao**. Moi tich hop PPLP deu chay phia server (edge functions). Day la thiet ke dung, nhung can dam bao moi edge function deu goi PPLP.

#### 7. CANH BAO: Nonce on-chain co the xung dot khi batch mint

**Van de**: Khi admin approve nhieu mint requests dong thoi, moi request doc `nonces(address)` tu contract. Nhung neu 2 transactions cung su dung cung nonce, mot trong hai se bi revert.

**Hien trang**: Admin da gap loi "already minted" (409) --> da xu ly bang cach bat exception. Nhung day la trieu chung cua van de nonce management.

---

### Ke hoach trien khai (theo thu tu uu tien)

#### Buoc 1: Sua loi Journal khong tu dong score
- **File**: `supabase/functions/analyze-reward-journal/index.ts`
- Doi `submitPPLPAction` thanh `submitAndScorePPLPAction` trong import va loi goi
- Dam bao GRATITUDE_PRACTICE va JOURNAL_WRITE duoc cham diem ngay

#### Buoc 2: Them nut "Request Mint All" tren trang /mint
- **File**: `src/components/mint/MintActionsList.tsx`
- Them nut "Gui tat ca yeu cau mint" o dau danh sach
- Goi `requestMint()` cho tung scored+pass action chua co mint request
- Hien thi progress bar (VD: "15/200 da gui...")
- **File**: `src/hooks/useMintRequest.ts`
- Them ham `requestMintBatch(actions[], walletAddress)` de xu ly hang loat

#### Buoc 3: Tang so luong actions hien thi tren /mint
- **File**: `src/hooks/usePPLPActions.ts`
- Them bo loc `status` de chi lay actions can thiet (scored + pass + chua mint)
- Tang limit hoac them pagination
- Them option `fetchUnmintedOnly()` de chi lay actions chua co mint request

#### Buoc 4: Them PPLP cho DAILY_LOGIN
- **File**: `supabase/functions/process-vision-reward/index.ts` (kiem tra va them PPLP)
- Tao logic tich hop PPLP trong quy trinh daily login (co the qua edge function moi hoac bo sung vao process co san)

#### Buoc 5: Cai thien UX trang /mint
- **File**: `src/pages/Mint.tsx`
- Them tab tong quan: "X actions san sang mint | Y dang cho duyet | Z da mint"
- Them thong bao khi user co actions chua gui mint request
- **File**: `src/components/mint/FUNMoneyMintCard.tsx`
- Them checkbox de chon nhieu actions cung luc

---

### Tong hop file can sua
1. `supabase/functions/analyze-reward-journal/index.ts` -- Sua loi scoring
2. `src/components/mint/MintActionsList.tsx` -- Them "Mint All" + pagination
3. `src/hooks/useMintRequest.ts` -- Them batch mint function
4. `src/hooks/usePPLPActions.ts` -- Them bo loc va tang limit
5. `src/pages/Mint.tsx` -- Cai thien UX tong quan
6. `supabase/functions/process-vision-reward/index.ts` -- Them PPLP (kiem tra)

### Phan ky thuat chi tiet

**Batch Mint Request Logic:**
```text
requestMintBatch(scoredActions[]) {
  for each action in scoredActions:
    - Skip if already has mint_request
    - Create mint_request with status "pending"
    - Show progress: "X/Y da gui"
  Refresh list when done
}
```

**Filtered fetch:**
```text
fetchUnmintedActions() {
  SELECT * FROM pplp_actions
  WHERE actor_id = userId
    AND status = 'scored'
    AND id NOT IN (SELECT action_id FROM pplp_mint_requests)
  JOIN pplp_scores ON decision = 'pass'
  ORDER BY created_at DESC
}
```

