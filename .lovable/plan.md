
## Sửa lỗi FUN Money Stats hiển thị 0

### Nguyên nhân gốc

Hook `useFUNMoneyStats` hiện tại truy vấn bảng **`pplp_mint_requests`** -- bảng này chỉ lưu 9 bản ghi (cho những user đã yêu cầu mint on-chain qua MetaMask). Hầu hết user **không** có bản ghi nào trong bảng này, nên thống kê luôn hiển thị **0 FUN**.

Dữ liệu FUN Money thực tế nằm ở bảng **`pplp_actions`** (trạng thái hành động) kết hợp với **`pplp_scores`** (số FUN reward cho mỗi hành động). Đây là nguồn dữ liệu đúng mà trang Mint (`/mint`) đang sử dụng.

```text
Dữ liệu hiện tại:
  pplp_mint_requests: 9 bản ghi (chỉ on-chain)
  pplp_actions + pplp_scores: hàng trăm bản ghi cho tất cả user

Ví dụ user 62694458...:
  pplp_mint_requests: 0 bản ghi --> Banner hiện 0 FUN
  pplp_actions: 13 actions, ~1,073 FUN --> Dữ liệu thực
```

### Giải pháp

Sửa hook `useFUNMoneyStats` để truy vấn đúng nguồn dữ liệu: bảng `pplp_actions` kết hợp `pplp_scores`, thay vì `pplp_mint_requests`.

### Thay đổi trạng thái hiển thị

Thay vì 3 trạng thái cũ (minted/signed/pending dựa trên mint_requests), cập nhật thành 3 trạng thái mới phản ánh đúng luồng dữ liệu:

| Trạng thái cũ (sai) | Trạng thái mới (đúng) | Ý nghĩa |
|---|---|---|
| Minted (mint_requests.status) | Da nhan (scored + pass) | FUN Money da duoc cham diem va san sang claim |
| Signed (mint_requests.status) | Da mint (minted) | FUN Money da duoc mint on-chain |
| Pending (fallback) | Dang cho (pending/scored + fail) | Dang xu ly hoac khong du dieu kien |

### Chi tiet ky thuat

**1. Sua `src/hooks/useFUNMoneyStats.ts`**

Thay doi logic truy van tu `pplp_mint_requests` sang `pplp_actions` ket hop `pplp_scores`:

- Truy van `pplp_actions` voi `select("*, pplp_scores(*)")` loc theo `actor_id`
- Voi moi action co `pplp_scores`, lay `final_reward`:
  - Neu `action.status === 'minted'` --> cong vao `totalMinted`
  - Neu `action.status === 'scored'` va `score.decision === 'pass'` --> cong vao `totalScored` (san sang claim)
  - Con lai --> cong vao `totalPending`
- Cap nhat interface `FUNMoneyStats` de phan anh dung ten moi:
  - `totalMinted` --> so FUN da mint on-chain
  - `totalScored` --> so FUN san sang claim (chua mint)
  - `totalPending` --> so FUN dang cho xu ly

**2. Cap nhat `src/components/earn/FUNMoneyStatsBanner.tsx`**

- Doi ten va icon cho 3 stat items:
  - "San sang claim" (icon CheckCircle, mau xanh la) -- totalScored
  - "Da mint" (icon Coins, mau xanh duong) -- totalMinted
  - "Dang cho" (icon Lock, mau vang) -- totalPending

**3. Cap nhat `src/pages/UserProfile.tsx`**

- Cap nhat phan hien thi FUN Money Stats trong sidebar de dung ten moi tuong ung

**4. Cap nhat translations `vi.ts` va `en.ts`**

- Thay `earn.funMoney.minted` tu "Da mint" thanh "San sang claim"
- Thay `earn.funMoney.signed` tu "Da ky" thanh "Da mint"
- Giu nguyen `earn.funMoney.pending`

### Ket qua mong doi

- Tat ca user co Light Actions se thay so FUN Money thuc te tren banner
- Thong ke phan anh dung luong du lieu: scored (san sang claim), minted (da mint on-chain), pending (dang cho)
- Hien thi nhat quan tren ca 3 trang: Earn, UserProfile, va Mint
