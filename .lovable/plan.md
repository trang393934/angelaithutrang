
# Kế hoạch: Thêm tính năng Chỉnh sửa ảnh trực tiếp (Edit Image)

## ✅ HOÀN THÀNH

**Ngày hoàn thành:** 2026-01-29

## Tổng quan

Đã triển khai thành công tính năng **Chỉnh sửa ảnh trực tiếp** cho Angel AI, cho phép người dùng:
- Upload ảnh gốc
- Nhập lệnh chỉnh sửa (VD: "Thêm mũ phù thủy cho mèo", "Đổi nền thành hoàng hôn")  
- AI chỉnh sửa trực tiếp trên ảnh gốc (giữ nguyên bố cục)

## Các file đã tạo/sửa

| File | Hành động |
|------|-----------|
| `supabase/functions/edit-image/index.ts` | ✅ TẠO MỚI |
| `src/hooks/useImageEdit.ts` | ✅ TẠO MỚI |
| `src/pages/Chat.tsx` | ✅ Đã sửa: thêm mode, dialog, handler |
| `src/translations/en.ts` | ✅ Thêm các key dịch mới |
| `src/translations/vi.ts` | ✅ Thêm các key dịch mới |
| `supabase/config.toml` | ✅ Thêm config cho edge function |

## Luồng hoạt động

```
[User upload ảnh] 
       ↓
[Dialog popup: "Bạn muốn làm gì với ảnh này?"]
    ├── 🔍 Phân tích ảnh (analyze-image) 
    └── ✏️ Chỉnh sửa ảnh (edit-image)
       ↓
[Nếu chọn Chỉnh sửa]
       ↓
[Chọn style: Tâm linh / Thực tế / Nghệ thuật]
       ↓
[Nhập lệnh: "Thêm nền galaxy phía sau"]
       ↓
[AI chỉnh sửa trực tiếp trên ảnh gốc]
       ↓
[Hiển thị ảnh đã chỉnh sửa]
```

## Tính năng hoàn chỉnh của Angel AI

1. **Tạo ảnh mới** 🎨: Prompt → Ảnh mới hoàn toàn
2. **Phân tích ảnh** 🔍: Ảnh → AI mô tả chi tiết
3. **Chỉnh sửa ảnh** ✏️: Ảnh + Lệnh → Ảnh đã chỉnh sửa (giữ nguyên bố cục gốc)
