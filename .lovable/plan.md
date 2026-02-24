

## Cap nhat ham slugify theo BÀI 3 — Unicode NFD normalization

### Van de hien tai

Code hien tai dung **bang map thu cong** (VIETNAMESE_MAP) voi 50+ entries de bo dau tieng Viet. Cach nay:
- De thieu sot ky tu (vd: cac ky tu Unicode dang composed khac)
- Code dai, kho bao tri
- Khong theo chuan Unicode

### Thay doi theo spec

Spec khuyen nghi dung **Unicode NFD normalize** + regex xoa diacritics. Day la cach chuan, ngan gon, va bao phu 100% ky tu co dau.

### Chi tiet thay doi

#### 1. Cap nhat `src/lib/slugify.ts`

Thay the toan bo `VIETNAMESE_MAP` + ham `removeVietnameseAccents` bang:

```typescript
export function removeVietnameseAccents(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
```

Cap nhat `generateSlug` theo dung spec:
- Fallback tra ve `"post"` thay vi chuoi rong khi title khong hop le
- Giu nguyen logic cat do dai tai word boundary

#### 2. Cap nhat slug generation trong edge function

Cap nhat `supabase/functions/process-community-post/index.ts`:
- Thay the `VIET_MAP` + ham map thu cong bang cung cach NFD normalize
- Dong bo logic voi file `slugify.ts` phia client

### Loi ich
- Code ngan gon hon (xoa 20+ dong map thu cong, thay bang 3 dong)
- Bao phu 100% ky tu Unicode co dau (khong chi tieng Viet)
- Khop chinh xac voi spec BÀI 3
- Dong nhat logic giua client va edge function
