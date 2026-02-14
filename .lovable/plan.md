
# Sửa Lỗi Thông Báo Lì Xì Hiển Thị "Ẩn danh" Thay Vì "ANGEL AI TREASURY"

## Nguyên Nhân

Có 2 lỗi trong code backend khiến thông báo Lì Xì Tết hiển thị tên người gửi là "Ẩn danh" thay vì "ANGEL AI TREASURY":

### Lỗi 1: Biến khai báo sau khi sử dụng (`distribute-fun-camly-reward`)
Trong file `supabase/functions/distribute-fun-camly-reward/index.ts`, biến `TREASURY_USER_ID` được **sử dụng ở dòng 223** nhưng **khai báo ở dòng 233**. Trong JavaScript/TypeScript, `const` không được hoisting, nên `actor_id` bị lỗi hoặc là `undefined`, dẫn đến notification không có `actor_id` hợp lệ va hiển thị "Ẩn danh".

### Lỗi 2: Thiếu `actor_id` (`process-lixi-claim`)
Trong file `supabase/functions/process-lixi-claim/index.ts`, notification `lixi_claim_completed` (dòng 204) **hoàn toàn không có trường `actor_id`**, nên hệ thống không biết ai gửi va hiển thị "Ẩn danh".

## Cách Sửa

### File 1: `supabase/functions/distribute-fun-camly-reward/index.ts`
- Di chuyển dòng `const TREASURY_USER_ID = "9aa48f46-..."` lên **trước** khi sử dụng (từ dòng 233 lên trước dòng 218)

### File 2: `supabase/functions/process-lixi-claim/index.ts`
- Thêm `actor_id: TREASURY_USER_ID` vào notification insert ở dòng 204

## Tác Động
- Sau khi sửa, tất cả thông báo Lì Xì sẽ hiển thị đúng tên **"ANGEL AI TREASURY"** kèm avatar chính thức thay vì "Ẩn danh"
- 2 file edge function cần deploy lại
