

# Huong Dan Ket Noi Custom Domain angel.fun.rich vao Du An Lovable

## Tong Quan

Hien tai du an Angel AI dang chay tai dia chi `angelaithutrang.lovable.app`. De domain `angel.fun.rich` tro ve du an nay, con can thuc hien 2 buoc chinh: cau hinh DNS tai nha cung cap ten mien va ket noi domain trong Lovable.

---

## Buoc 1: Truy cap cai dat Domain trong Lovable

1. Mo du an Angel AI trong Lovable
2. Bam vao **Settings** (bieu tuong banh rang o goc tren ben phai)
3. Chon tab **Domains**
4. Bam nut **Connect Domain**
5. Nhap ten mien: `angel.fun.rich`
6. Bam **Continue** - Lovable se cung cap cac ban ghi DNS can thiet

---

## Buoc 2: Cau hinh DNS tai nha cung cap ten mien

Dang nhap vao trang quan ly DNS cua ten mien `angel.fun.rich` (noi con da mua ten mien nay), roi them cac ban ghi sau:

### Ban ghi A (bat buoc - cho domain chinh)

```text
Type: A
Name: @
Value: 185.158.133.1
```

### Ban ghi A (cho www subdomain)

```text
Type: A
Name: www
Value: 185.158.133.1
```

### Ban ghi TXT (xac minh quyen so huu)

```text
Type: TXT
Name: _lovable
Value: lovable_verify=ABC    (thay ABC bang gia tri Lovable cung cap o Buoc 1)
```

**Luu y**: Gia tri `lovable_verify=...` se duoc Lovable hien thi khi con bam "Connect Domain". Hay copy chinh xac gia tri do.

---

## Buoc 3: Cho DNS lan truyen

- Sau khi luu cac ban ghi DNS, can doi **tu 15 phut den 72 gio** de DNS lan truyen toan cau
- Con co the kiem tra trang thai DNS tai: [dnschecker.org](https://dnschecker.org)
- Nhap `angel.fun.rich` va chon loai **A Record** de xem da tro dung `185.158.133.1` chua

---

## Buoc 4: Xac nhan trong Lovable

1. Quay lai **Settings > Domains** trong Lovable
2. Trang thai domain se chuyen qua cac giai doan:
   - **Verifying**: Dang cho DNS lan truyen - khong can lam gi
   - **Setting up**: Da xac minh, dang cap chung chi SSL (tu dong)
   - **Ready**: DNS da dung, chi can Publish du an
   - **Active**: Domain da hoat dong!

3. Bam **Publish** (nut o goc tren ben phai) de xuat ban du an len domain moi

---

## Buoc 5: Them ca www subdomain (khuyen nghi)

De dam bao ca `angel.fun.rich` va `www.angel.fun.rich` deu hoat dong:

1. Trong **Settings > Domains**, bam **Connect Domain** lan nua
2. Nhap `www.angel.fun.rich`
3. Chon domain chinh (`angel.fun.rich`) lam **Primary** - domain phu se tu dong chuyen huong ve domain chinh

---

## Xu ly su co thuong gap

| Van de | Cach xu ly |
|--------|-----------|
| Domain khong xac minh sau 72 gio | Kiem tra lai ban ghi A va TXT da dung chua, xoa cac ban ghi cu xung dot |
| SSL khong hoat dong | Dam bao khong co ban ghi CAA chan Let's Encrypt |
| Trang thai "Offline" | DNS da bi thay doi, cap nhat lai ban ghi A tro ve 185.158.133.1 |
| Trang thai "Failed" | Bam nut Retry trong Settings > Domains |

---

## Ket qua sau khi hoan thanh

- `angel.fun.rich/anhnguyet` se mo thang trang ho so cong khai cua Angel Anh Nguyet
- `angel.fun.rich/@anhnguyet` cung hoat dong tuong tu
- Tat ca link chia se se tu dong su dung domain `angel.fun.rich` thay vi `angelaithutrang.lovable.app`
- SSL (https) duoc cap tu dong, mien phi

---

## Luu y quan trong

- Con can co **goi tra phi** (Pro tro len) cua Lovable de su dung tinh nang custom domain
- Domain `angel.fun.rich` phai la domain con da so huu va co quyen quan ly DNS
- Neu `.rich` la ten mien dac biet (TLD moi), hay dam bao nha cung cap ten mien ho tro cau hinh A Record va TXT Record

