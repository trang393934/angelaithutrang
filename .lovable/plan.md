

## Kế hoạch khắc phục: Cho phép user mobile chọn ảnh từ kho hình ảnh

### Vấn đề phát hiện

Hiện tại nút phân tích ảnh (Camera icon 📷) trên trang Chat sử dụng thuộc tính `capture="environment"` trong thẻ `<input type="file">`. Điều này khiến trên điện thoại, khi nhấn nút sẽ **chỉ mở camera** thay vì cho phép chọn từ thư viện ảnh.

**Code hiện tại (dòng 959-966 trong Chat.tsx):**
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  capture="environment"  // ← Vấn đề: Chỉ mở camera
  onChange={handleImageUpload}
  className="hidden"
/>
```

### Giải pháp

Tạo **2 input file riêng biệt** và **2 nút riêng biệt**:
1. **Nút Camera** → Mở camera trực tiếp (giữ `capture="environment"`)
2. **Nút Thư viện ảnh** → Cho phép chọn từ gallery (KHÔNG có `capture`)

### Chi tiết thay đổi

**File cần chỉnh sửa:** `src/pages/Chat.tsx`

1. **Thêm ref mới** cho input file thư viện:
   ```tsx
   const fileInputRef = useRef<HTMLInputElement>(null);      // Camera
   const galleryInputRef = useRef<HTMLInputElement>(null);   // Gallery (MỚI)
   ```

2. **Thêm input file thứ 2** không có `capture`:
   ```tsx
   {/* Camera input - mở camera trực tiếp */}
   <input
     ref={fileInputRef}
     type="file"
     accept="image/*"
     capture="environment"
     onChange={handleImageUpload}
     className="hidden"
   />
   
   {/* Gallery input - chọn từ thư viện ảnh */}
   <input
     ref={galleryInputRef}
     type="file"
     accept="image/*"
     onChange={handleImageUpload}
     className="hidden"
   />
   ```

3. **Cập nhật UI nút bấm** trong khu vực input:
   - Nút Camera 📷 → Mở camera trực tiếp
   - Nút thư viện ảnh (ImagePlus/Image icon) → Chọn từ gallery

   ```tsx
   {/* Nút mở camera */}
   <button
     type="button"
     onClick={() => fileInputRef.current?.click()}
     className="p-1.5 sm:p-2 rounded-full hover:bg-blue-100 transition-colors"
     title="Chụp ảnh mới"
   >
     <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
   </button>
   
   {/* Nút chọn từ thư viện */}
   <button
     type="button"
     onClick={() => galleryInputRef.current?.click()}
     className="p-1.5 sm:p-2 rounded-full hover:bg-green-100 transition-colors"
     title="Chọn ảnh từ thư viện"
   >
     <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
   </button>
   ```

### Kết quả mong đợi

| Thiết bị | Nút Camera 📷 | Nút Thư viện 🖼️ |
|----------|--------------|-----------------|
| Laptop   | Mở file picker | Mở file picker |
| Mobile   | Mở camera trực tiếp | Mở gallery để chọn ảnh có sẵn |

### Giao diện mới

Khu vực input sẽ có thêm 1 icon cho thư viện ảnh bên cạnh icon camera hiện tại, giúp user dễ dàng lựa chọn cách tải ảnh lên để phân tích.

