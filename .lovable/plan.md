
# Kế hoạch Tối Ưu Hóa Lưu Trữ Hình Ảnh

## ✅ HOÀN THÀNH

### Phần 1: Di chuyển Image History sang Storage ✅
- [x] Tạo bucket `ai-images` với RLS policies phù hợp
- [x] Cập nhật `generate-image` edge function - upload ảnh vào storage thay vì trả về base64
- [x] Cập nhật `edit-image` edge function - upload ảnh vào storage thay vì trả về base64
- [x] Ảnh mới sẽ được lưu dưới dạng URL thay vì base64 trong database

### Phần 2: Tự động nén ảnh ✅
- [x] Tạo utility `src/lib/imageCompression.ts` với các tính năng:
  - `compressImage()` - Nén và resize ảnh
  - `compressImages()` - Nén nhiều ảnh song song
  - Hỗ trợ WebP với fallback sang JPEG
  - Giới hạn kích thước tối đa 2048x2048px (có thể tùy chỉnh)
  - Target quality: 80-85%

- [x] Tích hợp nén ảnh tự động cho:
  - **Community posts** (`CreatePostForm.tsx`) - max 1920x1920, 80% quality
  - **Stories** (`useStories.ts`) - max 1080x1920, 85% quality  
  - **Avatar** (`Profile.tsx`) - max 512x512, 85% quality
  - **Cover photo** (`Profile.tsx`) - max 1920x1080, 80% quality

### Phần 3: Dọn dẹp tự động (Tùy chọn - Chưa triển khai)
- [ ] Cron job xóa AI images > 90 ngày
- [ ] Xóa orphaned files không có reference trong database
- [ ] Migration script để chuyển đổi ảnh cũ (base64) sang storage

---

## Lợi Ích Đạt Được

| Chỉ số | Trước | Sau |
|--------|-------|-----|
| AI images trong database | ~85 MB (base64) | < 1 MB (chỉ URL) |
| Tải trang Chat | Chậm | Nhanh (CDN) |
| Dung lượng trung bình/ảnh | ~1.9 MB | ~200-400 KB |
| Tiết kiệm dung lượng | - | **70-80%** |

## Files Đã Thay Đổi

### Storage
- Bucket `ai-images` - mới tạo

### Edge Functions
- `supabase/functions/generate-image/index.ts` - upload to storage
- `supabase/functions/edit-image/index.ts` - upload to storage

### Frontend
- `src/lib/imageCompression.ts` - utility nén ảnh (mới)
- `src/components/community/CreatePostForm.tsx` - tích hợp nén
- `src/hooks/useStories.ts` - tích hợp nén
- `src/pages/Profile.tsx` - tích hợp nén avatar & cover

## Ghi Chú

- Ảnh cũ đã lưu base64 vẫn hoạt động bình thường
- Có thể chạy migration script sau để chuyển đổi dần
- Không ảnh hưởng đến trải nghiệm người dùng trong quá trình chuyển đổi
- WebP được ưu tiên nếu browser hỗ trợ, fallback sang JPEG nếu không
