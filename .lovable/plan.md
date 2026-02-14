
# Giu nguyen thong tin vi khi dang nhap va dam bao export chinh xac

## Van de hien tai

1. **Vi khong duoc giu khi dang nhap lai**: Khi nguoi dung ket noi vi MetaMask, dia chi duoc luu vao database (`user_wallet_addresses`). Nhung khi dang nhap lai ma khong mo MetaMask, he thong khong hien thi dia chi vi da luu -- vi `useWeb3Wallet` chi doc tu MetaMask truc tiep.

2. **Export can dam bao lay dia chi vi moi nhat**: Phan export admin (`get_admin_user_management_data` RPC) da JOIN voi `user_wallet_addresses`, nhung can dam bao no luon lay dia chi moi nhat khi MetaMask cap nhat.

## Giai phap

### 1. Tao hook `useSavedWalletAddress` -- doc vi tu database

Tao hook moi doc dia chi vi da luu trong `user_wallet_addresses` khi user dang nhap, khong phu thuoc vao MetaMask:

- Query `user_wallet_addresses` khi co `user.id`
- Tra ve `savedWalletAddress` de hien thi o header va profile
- Tu dong cap nhat khi MetaMask ket noi voi dia chi moi

### 2. Cap nhat `Web3WalletButton` -- hien thi vi da luu khi chua ket noi MetaMask

Khi user dang nhap nhung chua ket noi MetaMask:
- Hien thi dia chi vi da luu tu database (dang rut gon) thay vi nut "Ket noi vi"
- Khi bam vao, cho phep ket noi MetaMask de tuong tac on-chain
- Chi hien thi nut "Ket noi vi" khi user chua co dia chi vi nao trong he thong

### 3. Dam bao dong bo khi MetaMask ket noi

Logic hien tai trong `Web3WalletButton` da auto-save khi ket noi. Can bo sung:
- Khi MetaMask ket noi voi dia chi **khac** voi dia chi da luu, cap nhat database va hien thi dia chi moi
- Log thay doi de admin co the theo doi

### 4. Dam bao export luon chinh xac

- Xac nhan RPC `get_admin_user_management_data` da JOIN dung voi `user_wallet_addresses`
- Them `user_id` vao moi dong export CSV/Excel
- Dam bao khong co du lieu cu (cache) khi export

## Chi tiet ky thuat

### File moi

| File | Mo ta |
|------|-------|
| `src/hooks/useSavedWalletAddress.ts` | Hook doc dia chi vi da luu tu database |

### File can sua

| File | Thay doi |
|------|----------|
| `src/components/Web3WalletButton.tsx` | Hien thi dia chi vi da luu khi chua ket noi MetaMask; them trang thai "saved but not live" |
| `src/components/admin/UserManagementExportButton.tsx` | Them cot `user_id` vao export de dam bao mapping chinh xac |

### Logic xu ly

```text
Khi user dang nhap:
  1. Query user_wallet_addresses WHERE user_id = current_user
  2. Neu co dia chi -> hien thi o header (dang rut gon, badge "Da luu")
  3. Khi bam -> mo wallet selector de ket noi MetaMask

Khi MetaMask ket noi:
  1. So sanh dia chi MetaMask voi dia chi da luu
  2. Neu khac -> cap nhat database (da co san logic nay)
  3. Hien thi dia chi MetaMask (live) thay cho dia chi da luu

Khi export:
  1. Goi RPC get_admin_user_management_data (lay data moi nhat)
  2. Them cot user_id vao file xuat
  3. Dia chi vi lay truc tiep tu database, khong tu cache
```
