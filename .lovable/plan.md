
# Kế Hoạch Sửa Lỗi: Sidebar Phải & Bảng Danh Dự

## Mục Tiêu
1. Hiển thị đầy đủ **Bảng Danh Dự** ở vị trí trên cùng của sidebar phải
2. Ghim **Bảng Danh Dự** cố định khi cuộn nội dung sidebar
3. Cho phép sidebar phải **cuộn nội bộ** để xem hết các thẻ phía dưới (Gợi ý kết bạn, Bảng xếp hạng, Luật thưởng, Về cộng đồng)

---

## Giải Pháp Kỹ Thuật

### Thay đổi 1: Cập nhật bố cục trang Community.tsx

**Vấn đề hiện tại:**
- Sidebar phải dùng `sticky top-[9.5rem]` nhưng parent container có `overflow-hidden`, khiến sticky không hoạt động đúng
- Chiều cao sidebar không được tính toán chính xác với header và stories section

**Giải pháp:**
- Bỏ `sticky` trên sidebar, thay bằng cấu trúc flexbox thuần
- Chia sidebar thành 2 phần:
  - **Phần trên (fixed)**: Bảng Danh Dự - dùng `flex-shrink-0` để không bị nén
  - **Phần dưới (scrollable)**: Các thẻ còn lại - dùng `flex-1 overflow-y-auto`

**Code mới cho sidebar phải:**
```text
<aside className="hidden lg:flex flex-col w-[320px] flex-shrink-0 h-full">
  {/* Bảng Danh Dự - Ghim trên cùng */}
  <div className="flex-shrink-0 pb-4">
    <HonorBoard />
  </div>
  
  {/* Phần cuộn - Các thẻ còn lại */}
  <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 pr-1">
    <SuggestedFriendsCard />
    <Leaderboard />
    <RewardRulesCard dailyLimits={dailyLimits} />
    <div className="bg-white/80 ...">Về Cộng Đồng</div>
  </div>
</aside>
```

### Thay đổi 2: Điều chỉnh container cha

**Vấn đề:**
- Container `<div className="container mx-auto flex gap-4...">` cần đảm bảo chiều cao đầy đủ cho sidebar

**Giải pháp:**
- Thêm `h-full` vào container chính để các cột con stretch đúng chiều cao

---

## Tóm Tắt Thay Đổi File

| File | Thay đổi |
|------|----------|
| `src/pages/Community.tsx` | Cấu trúc lại sidebar phải: tách Bảng Danh Dự thành phần cố định, phần còn lại cuộn riêng |

---

## Kết Quả Mong Đợi

1. **Bảng Danh Dự** luôn hiển thị đầy đủ ở vị trí trên cùng sidebar phải
2. **Bảng Danh Dự** cố định khi người dùng cuộn phần nội dung phía dưới trong sidebar
3. **Các thẻ phía dưới** (Gợi ý kết bạn, Bảng xếp hạng, Luật thưởng, Về cộng đồng) có thể cuộn riêng trong sidebar
4. **Bài viết ở giữa** vẫn cuộn độc lập như hiện tại
5. Giữ nguyên giao diện màu sáng sang trọng của Bảng Danh Dự
