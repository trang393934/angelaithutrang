

# Cai thien UX: Canh bao vi khong khop tren Token Lifecycle

## Van de hien tai
Khi user ket noi vi khac voi vi da nhan FUN Money locked (qua `lockWithPPLP`), giao dien hien thi Locked/Activated/Flowing = 0 ma khong giai thich. User khong biet phai chuyen lai vi cu de activate/claim.

## Giai phap
Bo sung canh bao thong minh tren TokenLifecyclePanel khi phat hien vi hien tai khong co allocation nhung database ghi nhan mint_request thanh cong cho vi khac.

## Chi tiet ky thuat

### 1. Cap nhat TokenLifecyclePanel.tsx
- Khi ket noi vi va tat ca allocation = 0, truy van bang `pplp_mint_requests` de kiem tra xem user hien tai co mint_request nao da thanh cong (`status = 'minted'` va co `tx_hash`) voi `recipient_address` khac voi vi dang ket noi hay khong.
- Neu co, hien thi Alert voi noi dung:
  - "Ban co 124 FUN dang locked tai vi 0x8004...6966. Vui long chuyen ve vi do de activate va claim."
  - Nut "Sao chep dia chi vi" de user copy dia chi vi cu
  - Link den BSCScan de kiem tra giao dich

### 2. Logic kiem tra
```text
1. User ket noi vi A (vi moi)
2. Contract doc alloc(vi A) = {locked: 0, activated: 0}
3. Query Supabase: SELECT recipient_address, amount, tx_hash 
   FROM pplp_mint_requests 
   WHERE status = 'minted' AND tx_hash IS NOT NULL 
   AND action_id IN (SELECT id FROM pplp_actions WHERE actor_id = current_user_id)
   AND recipient_address != vi A
4. Neu co ket qua -> hien thi canh bao voi thong tin vi cu va so FUN
```

### 3. Giao dien canh bao
- Dat trong TokenLifecyclePanel, ngay duoi phan 3-Stage Pipeline khi tat ca = 0
- Mau vang/amber de canh bao (khong phai loi)
- Noi dung: 
  - Icon canh bao + "FUN Money cua ban dang o vi khac"
  - Dia chi vi cu (truncated voi nut copy)
  - So luong FUN locked
  - Huong dan ngan: "Chuyen ve vi nay trong MetaMask de activate va claim"

### 4. Files can sua
- `src/components/mint/TokenLifecyclePanel.tsx` - Them logic kiem tra va UI canh bao

### 5. Khong can migration database
- Chi doc du lieu tu bang `pplp_mint_requests` va `pplp_actions` da co san

