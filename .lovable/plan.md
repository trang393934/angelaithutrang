

# Bổ sung Số Liệu Tổng Quan Dự Án vào Trang Quản Lý User

## Vấn đề hiện tại
Hiện tại trang Quản lý User chỉ có 5 thẻ thống kê:
1. Tổng users
2. Camly đã phát
3. FUN Money
4. Tặng nội bộ
5. Tặng Web3

Thiếu nhiều số liệu tổng quan quan trọng để quản lý toàn diện dự án.

## Giải pháp

### Chỉnh sửa tệp: `src/pages/AdminUserManagement.tsx`

**Mở rộng phần tính toán `stats`** để bổ sung thêm các con số tổng:

| Số liệu mới | Cách tính | Mô tả |
|---|---|---|
| Tổng Camly còn lại | Tổng `camly_balance` tất cả user | Số Camly Coin đang tồn tại trong tài khoản |
| Tổng Camly đã tiêu | Tổng `camly_lifetime_spent` | Bao gồm rút + tặng + chi tiêu |
| Tổng đã rút | Tổng `total_withdrawn` | Camly đã rút ra ví ngoài |
| Tổng tặng nội bộ (nhận) | Tổng `gift_internal_received` | Camly nhận được từ tặng nội bộ |
| Tổng tặng Web3 (nhận) | Tổng `gift_web3_received` | Nhận được từ Web3 |
| Tổng bài đăng | Tổng `post_count` | Tổng bài viết cộng đồng |
| Tổng bình luận | Tổng `comment_count` | Tổng bình luận |

**Thay đổi bố cục thẻ thống kê:**
- Chia thành 2 hàng thẻ thống kê:
  - Hàng 1 (5 thẻ): Tổng users, Camly còn lại, Camly đã phát, Camly đã tiêu, Tổng đã rút
  - Hàng 2 (5 thẻ): FUN Money, Tặng nội bộ (gửi), Tặng nội bộ (nhận), Tặng Web3 (gửi), Tặng Web3 (nhận)
  - Hàng 3 (3 thẻ, nhỏ hơn): Tổng bài đăng, Tổng bình luận, Tổng yêu cầu rút

### Chi tiết kỹ thuật
- Chỉ chỉnh sửa 1 tệp: `src/pages/AdminUserManagement.tsx`
- Thêm các phép tính `reduce` mới vào `useMemo` của `stats`
- Thêm thêm icon từ `lucide-react` (ví dụ: `TrendingDown`, `ArrowDownToLine`, `MessageSquare`, `FileText`)
- Mở rộng grid từ 1 hàng thành 2-3 hàng thẻ thống kê

