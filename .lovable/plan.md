
# Kế hoạch Tối Ưu Hóa Lưu Trữ Hình Ảnh

## Tình Trạng Hiện Tại

### Dung lượng Storage đang sử dụng:
| Bucket | Số file | Dung lượng |
|--------|---------|------------|
| knowledge-documents | 14 | 172 MB |
| avatars | 250 | 98 MB |
| community | 83 | 67 MB |
| stories | 14 | 18 MB |
| **Tổng cộng** | **361 files** | **~355 MB** |

### Vấn đề phát hiện - Image History:
- **45 hình ảnh** được lưu trong bảng `image_history`
- URL trung bình: **~1.9 MB mỗi URL** (dưới dạng base64 data URI)
- Tổng dung lượng ước tính trong database: **~85 MB**
- Hình ảnh AI được lưu dưới dạng **base64 trong database** thay vì blob storage

## Các Vấn Đề Cần Giải Quyết

1. **Hình ảnh AI lưu trực tiếp trong database** - Làm phình database và giảm hiệu suất
2. **Không có nén ảnh** trước khi lưu trữ
3. **Không có chính sách dọn dẹp** ảnh cũ hoặc không sử dụng
4. **Avatar có thể trùng lặp** khi user upload nhiều lần

## Giải Pháp Đề Xuất

### Phần 1: Di chuyển Image History sang Storage

**Tạo bucket mới cho AI images:**
- Tạo bucket `ai-images` trong Lovable Cloud Storage
- Cập nhật edge functions để upload ảnh vào storage thay vì trả về base64
- Chỉ lưu URL trong database `image_history`

**Thay đổi:**
- `generate-image` edge function: Upload kết quả vào storage
- `edit-image` edge function: Upload kết quả vào storage
- Giảm dung lượng database từ ~85MB xuống chỉ vài KB

### Phần 2: Tự động nén ảnh

**Cơ chế nén:**
- Nén ảnh trước khi upload (target: 80% quality JPEG/WebP)
- Giới hạn kích thước tối đa: 2048x2048 pixels
- Chuyển đổi sang WebP để tiết kiệm ~30-50% dung lượng

**Áp dụng cho:**
- Community posts
- Stories
- Avatars
- AI generated images

### Phần 3: Dọn dẹp tự động

**Chính sách xóa:**
- Stories: Xóa sau 24h (đã có sẵn)
- Ảnh AI cũ: Tùy chọn xóa sau 90 ngày
- Avatar cũ: Xóa version cũ khi upload mới

---

## Chi Tiết Kỹ Thuật

### 1. Tạo Storage Bucket cho AI Images

```sql
-- Tạo bucket cho AI generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-images', 'ai-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies cho bucket
CREATE POLICY "AI images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-images');

CREATE POLICY "Authenticated users can upload AI images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ai-images');

CREATE POLICY "Users can delete their own AI images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ai-images' AND auth.uid() = owner);
```

### 2. Cập nhật Generate Image Edge Function

```text
Thay đổi luồng xử lý:
1. Nhận kết quả từ AI API (base64)
2. Decode base64 thành binary
3. Upload vào storage bucket 'ai-images'
4. Trả về public URL thay vì base64
```

### 3. Utility nén ảnh phía client

```text
Tạo helper function:
- compressImage(file, maxWidth, quality)
- Sử dụng Canvas API để resize và nén
- Chuyển đổi sang WebP nếu browser hỗ trợ
- Fallback sang JPEG nếu không
```

### 4. Cron job dọn dẹp (tùy chọn)

```text
Tạo scheduled function:
- Chạy hàng ngày
- Xóa AI images > 90 ngày (tùy cấu hình)
- Xóa orphaned files (không có reference trong database)
```

---

## Lợi Ích Sau Tối Ưu

| Chỉ số | Hiện tại | Sau tối ưu |
|--------|----------|------------|
| Database size (image_history) | ~85 MB | < 1 MB |
| Tải trang Chat | Chậm (load base64) | Nhanh (URL) |
| Dung lượng trung bình/ảnh | ~1.9 MB | ~200-400 KB |
| Tổng tiết kiệm ước tính | - | **70-80%** |

## Các Bước Triển Khai

1. Tạo storage bucket `ai-images` với RLS policies
2. Cập nhật `generate-image` edge function để upload vào storage
3. Cập nhật `edit-image` edge function để upload vào storage
4. Thêm helper nén ảnh cho community uploads
5. (Tùy chọn) Tạo migration script để di chuyển ảnh cũ
6. (Tùy chọn) Tạo cron job dọn dẹp tự động

## Ghi Chú

- Ảnh cũ đã lưu base64 vẫn hoạt động bình thường
- Có thể chạy migration script sau để chuyển đổi dần
- Không ảnh hưởng đến trải nghiệm người dùng trong quá trình chuyển đổi
