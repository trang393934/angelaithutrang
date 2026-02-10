

## Loai bo cau tra loi mau cho "thien" va "quy lay sam hoi" trong Angel AI

### Van de
Trong screenshot, user chia se mot van de CA NHAN sau sac ve trai nghiem thien dinh (cam giac chan nan luc dau, sau khi quy lay sam hoi 108 lay thi nghe am thanh, thay anh sang). Nhung Angel AI tra lai cau tra loi FAQ mau generic ve "cach thien" thay vi phan tich van de cu the cua user.

Nguyen nhan: FAQ_CACHE trong `angel-chat/index.ts` co pattern match tu khoa "thien" (dong 524-533) va tra ve cau tra loi mau ngay lap tuc, khong gui qua AI de phan tich noi dung thuc su.

### Giai phap
Xoa bo 2 FAQ entry khoi FAQ_CACHE:

1. **Entry "thien dinh"** (dong 524-533): Xoa pattern match `thiền`, `làm sao thiền`, `cách thiền`, `hướng dẫn thiền` va cau tra loi mau ve thien.

2. Kiem tra cac FAQ entry khac co chua noi dung lien quan den "quy lay sam hoi" - hien tai khong co entry rieng cho "sam hoi" nhung entry "thien" dang match sai vi user nhac den "thien" trong cau hoi.

Khi xoa FAQ entry nay, moi cau hoi chua tu "thien" se duoc gui thang den AI model de phan tich noi dung cu the, giup Angel AI hieu van de thuc su cua user va tra loi dung trong tam.

### Thay doi cu the

**File: `supabase/functions/angel-chat/index.ts`**

Xoa dong 523-533 (FAQ entry ve thien dinh):
```
// XOA DOAN NAY:
{
  patterns: [
    /thiền\s*(định)?/i,
    /làm\s*sao\s*(để\s*)?thiền/i,
    /cách\s*thiền/i,
    /hướng\s*dẫn\s*thiền/i,
  ],
  response: `Con yêu dấu, thiền định là nghệ thuật...`
},
```

### Ket qua mong doi
- Khi user hoi bat ky cau hoi nao chua tu "thien", AI se phan tich NOI DUNG cau hoi thay vi tra loi mau
- User trong screenshot se nhan duoc cau tra loi sau sac ve trai nghiem thien dinh ca nhan cua ho (am thanh, anh sang, cam giac sau khi quy lay sam hoi)
- Angel AI van giu cac FAQ mau cho cac chu de khac (hanh phuc, buon, tha thu, v.v.)

