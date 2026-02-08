

# Cap nhat bang FUN Money Stats - Bo sung day du hanh dong PPLP

## Van de hien tai

Bang thong ke tai `/admin/mint-stats` chi theo doi **6/14 loai hanh dong** PPLP, nghia la:
- Cot "Tong FUN" dang **thieu** FUN tu 8 loai hanh dong con lai
- Cac hanh dong like, comment, share, tang qua, dang nhap, giup do, y tuong, phan hoi deu khong duoc hien thi

## Thay doi chi tiet

### File: `src/pages/AdminMintStats.tsx`

#### 1. Cap nhat danh sach ACTION_TYPES

**Bo**: `LEARN_COMPLETE` (Hoc tap)

**Them 8 loai moi**:

| Action Type | Nhan | Viet tat | Icon | Base FUN |
|---|---|---|---|---|
| POST_ENGAGEMENT | Tuong tac | Like | ❤️ | 40 |
| COMMENT_CREATE | Binh luan | B.luan | 💭 | 40 |
| SHARE_CONTENT | Chia se | Share | 🔗 | 40 |
| DONATE_SUPPORT | Tang qua | Qua | 🎁 | 120 |
| DAILY_LOGIN | Dang nhap | D.nhap | 📅 | 20 |
| HELP_COMMUNITY | Giup do | Giup | 🤝 | 120 |
| IDEA_SUBMIT | Y tuong | Y.tuong | 💡 | 150 |
| FEEDBACK_GIVE | Phan hoi | P.hoi | 📋 | 60 |

**Tong cong**: 13 cot hanh dong (thay vi 6 cot hien tai)

#### 2. Bo cot "Camly"

- Xoa cot header Camly (🧧) trong bang
- Xoa cell Camly trong moi hang
- Xoa cot "Thuong Camly" trong Excel export
- **Giu nguyen** chuc nang li xi (CAMLY_MULTIPLIER van duoc dung trong phan chon va chuyen thuong)

#### 3. Cap nhat colSpan

- Cap nhat so cot trong dong "Khong co du lieu" tu `ACTION_TYPES.length + 7` thanh gia tri moi phu hop

#### 4. Cap nhat data aggregation

Vong lap `for (const at of ACTION_TYPES)` se tu dong bao gom tat ca 13 loai hanh dong, dam bao "Tong FUN" chinh xac 100%.

#### 5. Cap nhat Excel export

- Bo cot "Thuong Camly"
- Them cac cot moi vao file xuat

## Tac dong

| Truoc | Sau |
|---|---|
| 6 loai hanh dong | 13 loai hanh dong |
| Co cot Camly | Khong co cot Camly |
| Tong FUN thieu | Tong FUN chinh xac |
| 1 file chinh sua | 1 file chinh sua |

**Luu y**: Vi them 7 cot moi, bang se rong hon, nhung da co `overflow-x-auto` nen cuon ngang tren mobile khong bi loi.

## Chi tiet ky thuat

```typescript
// Danh sach day du 13 ACTION_TYPES
const ACTION_TYPES = [
  "QUESTION_ASK",
  "POST_CREATE", 
  "COMMENT_CREATE",     // Moi
  "POST_ENGAGEMENT",    // Moi
  "SHARE_CONTENT",      // Moi
  "GRATITUDE_PRACTICE",
  "CONTENT_CREATE",
  "JOURNAL_WRITE",
  "DONATE_SUPPORT",     // Moi
  "DAILY_LOGIN",        // Moi
  "HELP_COMMUNITY",     // Moi
  "IDEA_SUBMIT",        // Moi
  "FEEDBACK_GIVE",      // Moi
] as const;
```

Khong can thay doi database, Edge Functions, hay bat ky file nao khac.

