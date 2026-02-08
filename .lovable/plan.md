

# Ke hoach sua loi Content Moderation - False Positive

## Van de chinh

He thong kiem duyet noi dung (`src/lib/contentModeration.ts`) dang chan nhieu bai viet hop le vi 2 ly do:

1. **Tu "gay" bi liet ke la tu co hai** (dong 30) - nhung day la am tiet tieng Viet binh thuong ("gay go", "gay gat", "gay can")
2. **Kiem tra tu tieng Viet dung `includes()` (dong 83-84)** - tim chuoi con thay vi tim tu nguyen ven, gay ra false positive hang loat

Trong khi do, kiem tra tu tieng Anh (dong 90-91) da dung dung cach `\b` word boundary.

## Giai phap

### Buoc 1: Xoa "gay" khoi danh sach tu co hai

**File**: `src/lib/contentModeration.ts`, dong 30

**Thay doi**: Xoa `'gay'` khoi mang `HARMFUL_WORDS_VI`. Day khong phai tu co hai trong tieng Viet, va viec liet ke no gay chan hang loat bai viet hop le.

**Truoc:**
```
'do cho', 'con cho', 'thang ngu', 'con ngu', 'do ngu', 'mat lon', 'do diem',
'gay', 'be de', 'pe de',
```

**Sau:**
```
'do cho', 'con cho', 'thang ngu', 'con ngu', 'do ngu', 'mat lon', 'do diem',
'be de', 'pe de',
```

### Buoc 2: Chuyen kiem tra tu tieng Viet sang word-boundary regex

**File**: `src/lib/contentModeration.ts`, dong 82-87

**Van de**: `lowerText.includes(word)` tim chuoi con, nen tu "dam" trong "dam ra" cung bi bat.

**Thay doi**: Su dung `\b` regex giong nhu kiem tra tieng Anh. Tieng Viet tach am tiet bang dau cach, nen `\b` hoat dong tot.

**Truoc:**
```typescript
// Check Vietnamese harmful words
for (const word of HARMFUL_WORDS_VI) {
  if (lowerText.includes(word.toLowerCase())) {
    foundWords.push(word);
  }
}
```

**Sau:**
```typescript
// Check Vietnamese harmful words (with word boundary to avoid false positives)
for (const word of HARMFUL_WORDS_VI) {
  const escapedWord = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s|[.,!?;:"'()\\[\\]{}])${escapedWord}($|\\s|[.,!?;:"'()\\[\\]{}])`, 'i');
  if (regex.test(lowerText)) {
    foundWords.push(word);
  }
}
```

Dung boundary tuy chinh (dau cach + dau cau) thay vi `\b` de xu ly chinh xac hon voi cac ky tu Unicode/dau thanh tieng Viet.

### Buoc 3: Them whitelist cac cum tu tieng Viet vo hai

**File**: `src/lib/contentModeration.ts`

**Them moi**: Mot danh sach whitelist cac cum tu tieng Viet pho bien chua am tiet trung voi tu co hai nhung hoan toan vo hai:

```typescript
const VIETNAMESE_SAFE_PHRASES = [
  'dam ra',     // tro nen (khac voi "dam" bao luc)
  'chem gio',   // noi chuyen phiem (khac voi "chem" bao luc)
  'gay go',     // kho khan
  'gay gat',    // khan truong
  'gay can',    // hoi hop
];
```

Logic: Truoc khi kiem tra tu co hai, thay the cac cum tu vo hai bang placeholder de chung khong bi bat lam.

### Buoc 4: Cai thien kiem tra ten file anh

**File**: `src/lib/contentModeration.ts`, dong 180

**Van de**: Ham `checkImageFilename` cung dung `includes()`, co the chan file anh co ten nhu "sunset_sexy_beach.jpg" khi nguoi dung chi muon chia se anh hoang hon.

**Thay doi**: Ap dung word-boundary check tuong tu cho ten file.

---

## Tom tat tac dong

| STT | Thay doi | Ket qua |
|-----|----------|---------|
| 1 | Xoa "gay" khoi HARMFUL_WORDS_VI | Cac bai viet chua "gay go", "gay gat" khong bi chan nua |
| 2 | Chuyen sang word-boundary regex | Cac tu nhu "dam ra" khong bi nham la "dam" bao luc |
| 3 | Them whitelist cum tu vo hai | Bao ve them cac truong hop phuc tap |
| 4 | Sua checkImageFilename | Giam false positive cho ten file anh |

**Tong cong**: 1 file can chinh sua (`src/lib/contentModeration.ts`), khong can thay doi database.

## Chi tiet ky thuat

### Logic xu ly whitelist:

```typescript
function sanitizeForCheck(text: string): string {
  let sanitized = text.toLowerCase();
  for (const phrase of VIETNAMESE_SAFE_PHRASES) {
    sanitized = sanitized.replaceAll(phrase, ' __safe__ ');
  }
  return sanitized;
}
```

### Regex boundary cho tieng Viet:

Thay vi dung `\b` (khong xu ly tot voi Unicode), su dung boundary tuy chinh:
- Bat dau/ket thuc chuoi
- Dau cach
- Dau cau (, . ! ? ; : " ' vv.)

Dieu nay dam bao:
- "gay go" -> "gay" la tu rieng biet -> nhung da bi xoa khoi danh sach nen OK
- "dam ra" -> "dam" co boundary nhung nam trong whitelist -> OK  
- "dit me" -> "dit" la tu rieng biet + khong trong whitelist -> BI CHAN (dung)

### Luu y:
- Thay doi nay chi anh huong den client-side moderation (truoc khi gui bai)
- Server-side (process-community-post) van hoat dong binh thuong vi no khong dung file nay
- Khong can deploy lai Edge Functions
