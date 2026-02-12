

## Thiết kế lại Popup Lì xì Tết theo hình mẫu

### Mục tiêu
Cập nhật component `UserLiXiCelebrationPopup.tsx` cho khớp với thiết kế trong hình tham khảo, giữ nguyên dữ liệu động (camly_amount, fun_amount) theo từng user, bổ sung hiệu ứng pháo hoa và đồng Camly Coin + FUN Money.

### So sánh hiện tại vs hình mẫu

Popup hiện tại đã có hầu hết các thành phần (nền vàng kim, khung giấy cổ, cành hoa đào, đèn lồng, confetti, coin rơi). Cần tinh chỉnh:

| Thành phần | Hiện tại | Cần thay đổi |
|---|---|---|
| Đồng coin Camly/FUN | Xoay 3D trong khung giấy | Chuyển xuống góc trái dưới như hình mẫu, chồng lên nhau |
| Pháo hoa | Chưa có | Thêm hiệu ứng firework burst (tia sáng tỏa ra từ tâm) |
| Bố cục khung giấy | Coin nằm trong khung | Coin nằm ngoài khung, sát góc trái dưới popup |
| Cành hoa đào | Trên cùng hai bên | Mở rộng thêm hoa ở cạnh trái/phải giống hình |
| Nút "Thêm thông tin" | Link đến /admin/tet-reward | Giữ nguyên nhưng thêm icon tay chỉ giống hình |

### Các thay đổi cụ thể

**File: `src/components/UserLiXiCelebrationPopup.tsx`**

1. **Thêm hiệu ứng pháo hoa (Firework)**
   - Tạo component `FireworkBurst` với các tia sáng phóng ra từ tâm theo hình tròn
   - 3-4 đợt pháo hoa bắn ở các vị trí khác nhau, stagger delay
   - Màu sắc: vàng, đỏ, hồng, trắng

2. **Di chuyển đồng coin ra góc trái dưới**
   - Xóa khối coin xoay 3D khỏi bên trong khung giấy (dòng 415-441)
   - Đặt 2-3 đồng coin (Camly + FUN) ở góc trái dưới popup, chồng lên nhau, có hiệu ứng glow vàng, nằm ngoài khung giấy

3. **Mở rộng trang trí hoa đào hai bên**
   - Thêm hoa ở cạnh trái và phải (giữa popup) để tạo hiệu ứng bao quanh như hình mẫu
   - Thêm vài cánh hoa rải rác ở góc phải dưới

4. **Tinh chỉnh nút "Thêm thông tin"**
   - Thêm emoji/icon con trỏ tay (giống hình mẫu) bên cạnh text

5. **Giữ nguyên logic dữ liệu động**
   - `pendingLiXi.camlyAmount` và `pendingLiXi.funAmount` từ `useLiXiCelebration` hook
   - Nút CLAIM gọi hàm `claim()` -> Edge Function `process-lixi-claim` tự động chuyển on-chain

### Chi tiết kỹ thuật

**Component FireworkBurst mới:**
```text
- Mỗi firework gồm ~12 tia sáng phóng ra từ tâm theo góc đều
- Mỗi tia: motion.div nhỏ, animate từ tâm ra ngoài + fade out
- 3 firework bursts ở vị trí (20%, 10%), (80%, 15%), (50%, 5%) với delay khác nhau
- Lặp lại 2 lần rồi dừng
```

**Bố cục đồng coin góc trái dưới:**
```text
- Position absolute, bottom: -10px, left: 10px
- 2 coin chồng: Camly lớn (w-16) phía trước, FUN nhỏ hơn (w-12) phía sau
- Hiệu ứng glow vàng (box-shadow) + nhẹ nhàng lắc lư
```

Chỉ sửa 1 file duy nhất: `src/components/UserLiXiCelebrationPopup.tsx`

