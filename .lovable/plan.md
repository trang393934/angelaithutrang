

# ✏️ CẬP NHẬT NỘI DUNG "KIẾM CAMLY COIN"

## Thay đổi yêu cầu

| Trước | Sau |
|-------|-----|
| Mỗi câu hỏi = 1,000-5,000 coins | Mỗi câu hỏi nhận về Camly coin tương ứng tần số năng lượng thuần khiết của bạn |

---

## Chi tiết thực hiện

Khi tạo component `BenefitsSection.tsx` mới (theo kế hoạch đã phê duyệt), translation key `benefits.earn.desc` sẽ sử dụng nội dung mới:

### Translation keys cần thêm vào 12 file ngôn ngữ

**Tiếng Việt (`vi.ts`):**
```typescript
"benefits.earn.title": "Kiếm Camly Coin",
"benefits.earn.desc": "Mỗi câu hỏi nhận về Camly coin tương ứng tần số năng lượng thuần khiết của bạn",
```

**Tiếng Anh (`en.ts`):**
```typescript
"benefits.earn.title": "Earn Camly Coin",
"benefits.earn.desc": "Each question earns Camly coins based on your pure energy frequency",
```

**Tiếng Trung (`zh.ts`):**
```typescript
"benefits.earn.title": "赚取Camly币",
"benefits.earn.desc": "每个问题根据你的纯净能量频率获得Camly币",
```

---

## Files sẽ được tạo/cập nhật

| File | Hành động |
|------|-----------|
| `src/components/BenefitsSection.tsx` | **Tạo mới** với nội dung đã cập nhật |
| `src/pages/Index.tsx` | Thêm import và render |
| `src/translations/vi.ts` | Thêm 34 keys (bao gồm key mới) |
| `src/translations/en.ts` | Thêm 34 keys |
| `src/translations/zh.ts` | Thêm 34 keys |
| `src/translations/ja.ts` | Thêm 34 keys |
| `src/translations/ko.ts` | Thêm 34 keys |
| `src/translations/fr.ts` | Thêm 34 keys |
| `src/translations/de.ts` | Thêm 34 keys |
| `src/translations/es.ts` | Thêm 34 keys |
| `src/translations/pt.ts` | Thêm 34 keys |
| `src/translations/ru.ts` | Thêm 34 keys |
| `src/translations/ar.ts` | Thêm 34 keys |
| `src/translations/hi.ts` | Thêm 34 keys |

---

## Ý nghĩa thay đổi

Nội dung mới phản ánh đúng hệ thống thưởng dựa trên **Purity Score** (điểm thuần khiết):
- Score >= 0.9: 3,500 coins
- Score >= 0.75: 3,000 coins  
- Score >= 0.6: 2,000 coins
- Score >= 0.4: 1,500 coins
- Score < 0.4: 1,000 coins

Thông điệp "tần số năng lượng thuần khiết" truyền tải đúng tinh thần tâm linh của Angel AI.

