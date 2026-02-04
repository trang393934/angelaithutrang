

# Hoàn thiện Vision Board: Images Display + Localization

## Tổng quan
Có 2 việc cần làm để hoàn thiện Vision Board với Unsplash integration:

1. **Hiển thị Images trên VisionBoardCard** - Card hiện tại chưa render images gallery
2. **Thêm translations cho 10 ngôn ngữ còn lại** - zh, ja, ko, fr, de, es, pt, ru, ar, hi

---

## Thay đổi 1: VisionBoardCard.tsx - Thêm Images Gallery

Thêm section hiển thị images giữa header và goals list:

```text
┌──────────────────────────────────────────────────┐
│ [Title] [Public/Private Badge] [Reward Badge]    │
│ Description (nếu có)                             │
│ ─────────────────────────────────────────────────│
│ [Img1] [Img2] [Img3] [Img4] [Img5] [Img6]       │  ← NEW
│ 📷 Photo by {photographer} on Unsplash           │  ← Attribution
│ ─────────────────────────────────────────────────│
│ Progress: 3/5 goals ██████████████░░░░           │
│ ─────────────────────────────────────────────────│
│ ☐ Goal 1                                         │
│ ☑ Goal 2 ✓                                       │
│ ☐ Goal 3                                         │
└──────────────────────────────────────────────────┘
```

**Logic:**
- Thêm `images` vào VisionBoardCardProps interface
- Render grid 3 cột với aspect-video
- Click ảnh mở Lightbox (tái sử dụng ImageLightbox component)
- Hiển thị photographer attribution (tuân thủ Unsplash guidelines)

---

## Thay đổi 2: Translations - 10 ngôn ngữ

Thêm các keys Vision Board vào mỗi file translation:

| Key | Mô tả |
|-----|-------|
| `visionBoard.images` | Label cho images section |
| `visionBoard.addImage` | Nút thêm ảnh |
| `visionBoard.searchPlaceholder` | Placeholder search Unsplash |
| `visionBoard.searchHint` | Gợi ý tìm kiếm |
| `visionBoard.searchError` / `searchErrorDesc` | Lỗi search |
| `visionBoard.maxImagesReached` / `maxImagesDesc` | Đã đạt giới hạn ảnh |
| `visionBoard.imageAdded` | Toast thêm ảnh thành công |
| `visionBoard.upload` | Tab upload |
| `visionBoard.uploadHint` | Gợi ý upload |
| `visionBoard.selectFiles` | Nút chọn file |
| `visionBoard.uploading` | Đang upload |
| `visionBoard.imagesUploaded` / `imagesUploadedDesc` | Upload thành công |
| `visionBoard.uploadError` / `uploadErrorDesc` | Lỗi upload |
| `visionBoard.unsplashCredit` | Credit Unsplash |
| `visionBoard.chooseTemplate` | Chọn template |
| `visionBoard.createFromScratch` | Tạo từ đầu |
| `visionBoard.template.*` | 8 templates (Career, Health, Family, Finance, Education, Travel, Spiritual, Home) |

---

## Files cần thay đổi

| # | File | Hành động |
|---|------|-----------|
| 1 | `src/components/vision/VisionBoardCard.tsx` | Thêm images gallery với lightbox |
| 2 | `src/translations/zh.ts` | Thêm ~50 Vision Board keys |
| 3 | `src/translations/ja.ts` | Thêm ~50 Vision Board keys |
| 4 | `src/translations/ko.ts` | Thêm ~50 Vision Board keys |
| 5 | `src/translations/fr.ts` | Thêm ~50 Vision Board keys |
| 6 | `src/translations/de.ts` | Thêm ~50 Vision Board keys |
| 7 | `src/translations/es.ts` | Thêm ~50 Vision Board keys |
| 8 | `src/translations/pt.ts` | Thêm ~50 Vision Board keys |
| 9 | `src/translations/ru.ts` | Thêm ~50 Vision Board keys |
| 10 | `src/translations/ar.ts` | Thêm ~50 Vision Board keys (RTL) |
| 11 | `src/translations/hi.ts` | Thêm ~50 Vision Board keys |

**Tổng: 11 files**

---

## Kỹ thuật

### VisionBoardCard Images Section:
```typescript
// Import thêm
import { ImageLightbox } from "@/components/community/ImageLightbox";

// Thêm vào interface
interface VisionImage {
  id: string;
  url: string;
  caption?: string;
  photographer?: string;
  photographerUrl?: string;
}

// Trong props
images?: VisionImage[];

// Render images grid (sau description, trước progress)
{board.images && board.images.length > 0 && (
  <div className="mt-4 grid grid-cols-3 gap-2">
    {board.images.map((img) => (
      <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <img src={img.url} alt={img.caption || "Vision"} 
             className="w-full h-full object-cover cursor-pointer"
             onClick={() => setLightboxImage(img.url)} />
        {img.photographer && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1">
            📷 {img.photographer}
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

### Translation keys pattern:
Mỗi ngôn ngữ sẽ có translations được dịch chuyên nghiệp cho context tâm linh/manifestation của Vision Board.

---

## Kết quả mong đợi

- Images từ Unsplash/upload hiển thị đẹp trên Vision Board cards
- Attribution tuân thủ Unsplash guidelines
- Lightbox preview khi click ảnh
- UI Vision Board hoàn toàn song ngữ trên 12 ngôn ngữ
- Templates hiển thị đúng ngôn ngữ người dùng chọn

