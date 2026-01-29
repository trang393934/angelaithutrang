
# Kế hoạch: Thêm tính năng Chỉnh sửa ảnh trực tiếp (Edit Image)

## Phân tích vấn đề

**Hiện tại Angel AI có:**
1. ✅ **Tạo ảnh mới** (`generate-image`): Nhập prompt → Tạo ảnh mới hoàn toàn
2. ✅ **Phân tích ảnh** (`analyze-image`): Upload ảnh → AI mô tả nội dung

**Còn thiếu:**
3. ❌ **Chỉnh sửa ảnh** (`edit-image`): Upload ảnh có sẵn + nhập lệnh chỉnh sửa → Trả về ảnh đã được chỉnh sửa trực tiếp

## Giải pháp

Thêm chế độ **"edit-image"** mới cho phép user:
- Upload ảnh gốc
- Nhập lệnh chỉnh sửa (VD: "Thêm mũ phù thủy cho mèo", "Đổi nền thành hoàng hôn")
- AI sẽ **chỉnh sửa trực tiếp trên ảnh gốc** thay vì tạo ảnh mới hoàn toàn

## Chi tiết kỹ thuật

### 1. Tạo Edge Function mới: `edit-image`

**File:** `supabase/functions/edit-image/index.ts`

```typescript
// Nhận vào:
// - imageUrl: ảnh gốc (base64 hoặc URL)
// - instruction: lệnh chỉnh sửa từ user
// - style: phong cách (spiritual/realistic/artistic)

// Gọi Gemini API với cấu trúc multimodal:
messages: [
  {
    role: "user",
    content: [
      { type: "text", text: "Chỉnh sửa hình ảnh này: [instruction]" },
      { type: "image_url", image_url: { url: imageUrl } }
    ]
  }
]
modalities: ["image", "text"]
```

### 2. Tạo Hook mới: `useImageEdit`

**File:** `src/hooks/useImageEdit.ts`

```typescript
export function useImageEdit() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedImage, setEditedImage] = useState(null);
  
  const editImage = async (imageUrl: string, instruction: string, style?: string) => {
    // Gọi edge function edit-image
    // Trả về ảnh đã chỉnh sửa
  };
  
  return { isEditing, editedImage, editImage, clearEdit };
}
```

### 3. Cập nhật Chat.tsx

**Thay đổi:**

| Mục | Hiện tại | Sau khi cập nhật |
|-----|----------|------------------|
| ChatMode | `"chat" \| "generate-image" \| "analyze-image"` | `"chat" \| "generate-image" \| "analyze-image" \| "edit-image"` |
| Nút Upload ảnh | Chỉ vào mode `analyze-image` | Hiện dialog chọn: Phân tích hay Chỉnh sửa? |
| Xử lý submit | `handleAnalyzeImage()` | Thêm `handleEditImage()` |

**Luồng UI mới:**

```
[User upload ảnh]
       ↓
[Dialog popup: "Bạn muốn làm gì với ảnh này?"]
    ├── 🔍 Phân tích ảnh (analyze-image) 
    └── ✏️ Chỉnh sửa ảnh (edit-image) ← MỚI
       ↓
[Nếu chọn Chỉnh sửa]
       ↓
[Nhập lệnh: "Thêm nền galaxy phía sau"]
       ↓
[AI chỉnh sửa trực tiếp trên ảnh gốc]
       ↓
[Hiển thị ảnh đã chỉnh sửa]
```

### 4. Cập nhật UI Mode Indicator

Khi ở mode `edit-image`:
- Hiển thị ảnh gốc ở preview area
- Placeholder: "Mô tả cách bạn muốn chỉnh sửa ảnh..."
- Có dropdown chọn style (như mode generate-image)

### 5. Lưu vào Image History

Lưu với `image_type: 'edited'` vào bảng `image_history`:
- `prompt`: Lệnh chỉnh sửa
- `image_url`: Ảnh sau khi chỉnh sửa
- `response_text`: Mô tả từ AI về những gì đã thay đổi

## Các file cần tạo/sửa

| File | Hành động |
|------|-----------|
| `supabase/functions/edit-image/index.ts` | **TẠO MỚI** |
| `src/hooks/useImageEdit.ts` | **TẠO MỚI** |
| `src/pages/Chat.tsx` | Sửa: thêm mode, dialog, handler |
| `src/translations/*.ts` | Thêm các key dịch mới |

## Giao diện so sánh

```
┌─────────────────────────────────────────────────────┐
│ Thanh chế độ (Mode buttons)                         │
├──────────┬──────────┬──────────┬───────────────────┤
│ 💬 Chat  │ 🎨 Tạo   │ 🔍 Phân  │ ✏️ Chỉnh sửa     │
│          │ ảnh mới  │ tích ảnh │ ảnh (MỚI)        │
└──────────┴──────────┴──────────┴───────────────────┘
```

## Kết quả mong đợi

Sau khi hoàn thành, Angel AI sẽ có đầy đủ 3 tính năng ảnh:

1. **Tạo ảnh mới** 🎨: Prompt → Ảnh mới
2. **Phân tích ảnh** 🔍: Ảnh → Mô tả chi tiết
3. **Chỉnh sửa ảnh** ✏️: Ảnh + Lệnh → Ảnh đã chỉnh sửa (giữ nguyên bố cục gốc)
