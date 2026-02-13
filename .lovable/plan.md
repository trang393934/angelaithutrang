
# Chinh sua thiet ke Popup Li Xi Tet theo mau

## Tong quan
Chinh sua giao dien `UserLiXiCelebrationPopup.tsx` va `Lantern.tsx` theo mau thiet ke nguoi dung gui, dong thoi thay doi dong tien thanh Camly Coin va thay chu tren den long bang hoa van trang tri.

## Chi tiet thay doi

### File 1: `src/components/lixi/Lantern.tsx`
- Xoa cac duong ke ngang (vach vang) hien tai tren than den long (dong 34-36)
- Thay bang hoa van trang tri SVG: hoa mai nho va duong cong uon luon kieu truyen thong
- Giu nguyen hieu ung lac (rotate animation) va kich thuoc

### File 2: `src/components/UserLiXiCelebrationPopup.tsx`
Tinh chinh style theo mau:

1. **Bao li xi do** (dong 122-138): Tang kich thuoc tu `w-16 h-16` len `w-20 h-20`, lam tron goc hon, va thay hinh tron vang o giua thanh dong Camly Coin nho (dung `camlyCoinLogo`)

2. **Tieu de** (dong 170-182): Tang kich thuoc font tu `text-xl` len `text-2xl`, them `italic` de giong phong cach co dien trong mau

3. **So Camly Coin** (dong 196): Tang kich thuoc tu `text-lg` len `text-2xl` de noi bat hon

4. **Nut CLAIM** (dong 240-258): Giu nguyen style xanh la dam, bo sung emoji 🧧 phia truoc chu "CLAIM"

5. **Nut "Them thong tin"** (dong 260-274): Chinh border dam hon (`3px solid`), tang font weight

6. **Dong coin goc trai duoi** (CornerCoins): Giu nguyen, da dung Camly Coin

### Phan ky thuat
- Chi thay doi style/CSS, khong thay doi logic hook hay flow claim
- 2 file can sua: `Lantern.tsx` va `UserLiXiCelebrationPopup.tsx`
- Khong can them dependency moi
