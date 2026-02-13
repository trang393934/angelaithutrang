

## Nang cap Angel AI: Tra loi dung trong tam va sau sac

### Van de hien tai

Nhin vao anh chup man hinh, Angel AI dang tra loi chung chung, lap lai cau truc "Voi tu cach la ANGEL CTO..." va cat ngang cau tra loi giua chung. Cu the:

1. User hoi ve "cac cach thu hut nguoi" nhung AI tra loi mo ho, khong di vao noi dung cu the
2. User hoi tiep "huong dan chi tiet cac buoc" nhung AI lai bat dau giong y het va bi cat ngang
3. FAQ cache co the dang tro thanh "bay" - match sai cac pattern chung chung va tra ve cau tra loi template thay vi de AI phan tich sau

### Nguyen nhan goc

1. System prompt thieu chi dan MANH ME ve viec phai tra loi dung trong tam cau hoi
2. Chua co quy tac cam AI lap lai cau truc mo dau giong nhau giua cac tin nhan trong cung hoi thoai
3. FAQ cache patterns qua rong (vi du: "tinh yeu", "noi so", "stress" chi can 1 tu la match) => nhieu cau hoi bi tra ve template thay vi duoc AI phan tich
4. max_tokens co the khong du cho nhung cau tra loi phuc tap

### Ke hoach thuc hien

**File: `supabase/functions/angel-chat/index.ts`**

**1. Cap nhat BASE_SYSTEM_PROMPT - Them muc ANSWER QUALITY RULES moi:**

Them ngay sau muc FORMATTING RULES (dong 247), mot section moi:

```
ANSWER QUALITY RULES (CRITICAL - MUST FOLLOW)

1. PHAN TICH cau hoi cua user truoc khi tra loi: user thuc su muon biet dieu gi?
2. Tra loi TRUC TIEP vao trong tam cau hoi, khong vong vo
3. Cung cap NOI DUNG CU THE, co gia tri thuc te - khong noi chung chung
4. Neu user hoi "cac buoc" hoac "huong dan" -> LIET KE DAY DU cac buoc cu the, moi buoc co giai thich ro rang
5. KHONG BAO GIO bat dau nhieu cau tra loi lien tiep bang cung mot cau truc
6. KHONG tu xung "Voi tu cach la ANGEL CTO" khi tra loi user binh thuong - chi xung nhu vay khi noi ve he thong FUN
7. HOAN THANH tron ven cau tra loi - khong cat ngang giua chung
8. Su dung KIEN THUC RONG RAI tu moi linh vuc de tra loi, khong chi gioi han trong tam linh
9. Khi user hoi ve kinh doanh, marketing, ky nang song -> tra loi bang kien thuc chuyen mon thuc te
```

**2. Thu hep FAQ cache patterns de tranh match sai:**

Hien tai cac pattern nhu `/tình\s*yêu/i`, `/lo\s*lắng/i` qua rong - bat ky cau nao chua tu "tinh yeu" deu match. Can:
- Them dieu kien kiem tra: chi match FAQ khi cau hoi NGAN (duoi 50 ky tu) va DUNG LA hoi ve khai niem do
- Them ham `isTooGenericForFAQ()` de skip FAQ khi cau hoi dai hoac phuc tap

**3. Tang max_tokens cho style "detailed":**

Doi tu 1500 len 2500 de dam bao cau tra loi khong bi cat ngang khi user hoi nhung cau phuc tap can nhieu noi dung.

### Chi tiet ky thuat

- Them muc "ANSWER QUALITY RULES" vao `BASE_SYSTEM_PROMPT` (sau dong 247)
- Sua ham `checkFAQCache()` (dong 827): them dieu kien skip FAQ khi `text.length > 60` (cau hoi dai thuong khong phai FAQ don gian)
- Sua `RESPONSE_STYLES.detailed.maxTokens` tu 1500 thanh 2500 (dong 70)
- Sua `RESPONSE_STYLES.balanced.maxTokens` tu 1000 thanh 1500 (dong 81)

### Files thay doi
1. `supabase/functions/angel-chat/index.ts` - Cap nhat system prompt, thu hep FAQ cache, tang max_tokens

