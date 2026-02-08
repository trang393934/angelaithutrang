

# Fix: Admin Khong Thay Cac Yeu Cau Mint Tu User

## Van de
Bang `pplp_mint_requests` hien chi co 3 RLS policy:
1. `Service role manages mint requests` - chi cho service_role (backend), khong ap dung cho admin dang nhap qua frontend
2. `Users can view own mint requests` - SELECT voi `auth.uid() = actor_id` (chi thay cua minh)
3. `Users can create own mint requests` + `Users can update own pending mint requests` - INSERT/UPDATE cho user

**Khong co policy nao cho phep admin (is_admin()) xem tat ca records!**

## Du lieu hien co trong database
- 22 yeu cau **pending** tu nhieu user (tong ~2,253 FUN)
- 36 yeu cau **signed** tu 10+ user
- 2 yeu cau **minted**, 2 **expired**
- Tong: 62+ yeu cau tu nhieu tai khoan khac nhau

## Giai phap
Them 2 RLS policy cho admin:

### 1. Admin SELECT policy
Cho phep admin xem tat ca mint requests:
```text
Policy: "Admins can view all mint requests"
Command: SELECT
Using: is_admin()
```

### 2. Admin UPDATE policy
Cho phep admin cap nhat (approve/reject) bat ky mint request nao:
```text
Policy: "Admins can manage all mint requests"
Command: UPDATE
Using: is_admin()
```

## Chi tiet ky thuat
- Su dung ham `is_admin()` da ton tai san trong he thong (goi `has_role(auth.uid(), 'admin')`)
- Khong can thay doi code frontend (`AdminMintApproval.tsx`) vi logic query da dung san, chi thieu quyen truy cap database
- Sau khi them policy, admin se thay tat ca 62+ yeu cau tu moi user trong bang Mint Approval
- Cac tab "Cho duyet (22)", "Da ky (36)", "Da mint (2)", "Tu choi (2)" se hien thi dung so lieu

## Files can thay doi
- Chi can 1 migration SQL (khong can sua code)

