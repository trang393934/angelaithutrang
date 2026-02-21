

# Kế Hoạch Chống Sybil Attack Cho Hệ Sinh Thái FUN

## Tình Trạng Hiện Tại - Đã Có Gì

Cha đã kiểm tra kỹ toàn bộ codebase và thấy hệ thống FUN đã có nền tảng chống gian lận khá tốt:

### Đã hoạt động (6/10 điểm)

| Lớp bảo vệ | Trạng thái | Chi tiết |
|---|---|---|
| Device fingerprint | Có | `pplp_device_registry`, `register_device_fingerprint()` |
| Phát hiện Bot | Có | `pplp-detect-fraud`: kiểm tra tần suất, timing pattern |
| Phát hiện Sybil | Có | Kiểm tra device_hash và IP trùng lặp |
| Phát hiện Spam | Có | Nội dung ngắn, nội dung trùng lặp (content_hash) |
| Phát hiện Thông đồng | Có | Phát hiện tương tác tập trung bất thường |
| Giới hạn tốc độ | Có | Cooldown 30s (câu hỏi), 10 tips/ngày, action caps |
| Hệ thống Trust/Tier | Có | `pplp_user_tiers` với 5 cấp (0-4), trust_score |
| Kiểm tra chất lượng AI | Có | `analyze-reward-journal` và `process-community-post` kiểm tra nội dung sáo rỗng |
| Khoá ví | Có | Ví khoá vĩnh viễn sau khi kết nối |
| Đình chỉ bởi Admin | Có | `user_suspensions`, `bulk-suspend-users`, healing messages |

### Chưa có - Lỗ hổng nghiêm trọng

| Lỗ hổng | Mức độ | Mô tả |
|---|---|---|
| Cổng thời gian tài khoản | Nghiêm trọng | User mới đăng ký xong là farm ngay, chưa có yêu cầu 7 ngày tuổi |
| Trì hoãn phần thưởng | Nghiêm trọng | Thưởng cấp ngay lập tức, không có delay 48h |
| Yêu cầu stake | Trung bình | Chưa yêu cầu giữ FUN tối thiểu để kiếm thưởng |
| Giới hạn user mới | Nghiêm trọng | User mới và cũ có cùng giới hạn hành động |
| Kiểm tra tuổi ví | Trung bình | Chưa kiểm tra tuổi của ví on-chain |
| Kiểm tra ngẫu nhiên | Trung bình | Hàm `schedule_random_audit()` tồn tại nhưng chưa có cron job chạy |
| Tự động xử lý khi phát hiện gian lận | Nghiêm trọng | Phát hiện fraud nhưng chưa tự động đình chỉ (chỉ ghi log) |

---

## Kế Hoạch Triển Khai - 5 Bước Ưu Tiên

### Bước 1: Cổng Thời Gian Tài Khoản (Chống farm ngay lập tức)

**Vấn đề**: User đăng ký xong là farm reward ngay, không có rào cản nào.

**Giải pháp**: Thêm kiểm tra `tuổi tài khoản` vào các edge function thưởng:
- User duoi 3 ngày tuổi: Giới hạn 3 hành động/ngày, phần thưởng giảm 50%
- User 3-7 ngày: Giới hạn 5 hành động/ngày, phần thưởng giảm 25%
- User trên 7 ngày: Giới hạn bình thường

**Thay đổi kỹ thuật**:
- Thêm cột `earned_before_gate` vào `camly_coin_balances` (theo dõi số dư trước khi mở khoá)
- Sửa các edge function: `analyze-reward-question`, `analyze-reward-journal`, `process-community-post`, `process-share-reward`, `process-engagement-reward`
- Thêm hàm database `get_account_age_days(_user_id)` truy vấn `user_light_agreements.agreed_at`

---

### Bước 2: Trì Hoãn Phần Thưởng (Delay 24-48h cho user mới)

**Vấn đề**: Phần thưởng cấp ngay cho phép bot rút tiền nhanh chóng.

**Giải pháp**: Tạo bảng `pending_rewards` lưu phần thưởng chưa xác nhận:
- User tier 0-1: Phần thưởng chờ 48h trước khi cộng vào số dư
- User tier 2 trở lên: Phần thưởng cấp ngay (người dùng đáng tin cậy)
- Admin có thể huỷ phần thưởng đang chờ nếu phát hiện gian lận

**Thay đổi kỹ thuật**:
- Tạo bảng `pending_rewards (id, user_id, amount, reason, transaction_type, release_at, status, created_at)`
- Tạo cron job `release-pending-rewards` chạy mỗi giờ để chuyển pending sang balance
- Sửa các edge function thưởng để ghi vào `pending_rewards` thay vì `add_camly_coins` trực tiếp (cho user tier thấp)

---

### Bước 3: Giới Hạn Hành Động Theo Cấp Bậc Tin Cậy

**Vấn đề**: User mới và cũ có cùng giới hạn hành động.

**Giải pháp**: Áp dụng giới hạn theo trust tier:

```text
Tier 0 (Mới):     3 bài đăng/ngày,  5 câu hỏi/ngày,  1 nhật ký/ngày
Tier 1 (7 ngày+):  5 bài đăng/ngày, 10 câu hỏi/ngày,  3 nhật ký/ngày
Tier 2 (30 ngày+): 10 bài đăng/ngày, 15 câu hỏi/ngày,  3 nhật ký/ngày
Tier 3-4:          Như hiện tại (không giới hạn cứng)
```

**Thay đổi kỹ thuật**:
- Sửa hàm `check_user_cap_and_update()` để đọc tier từ `pplp_user_tiers`
- Áp dụng hệ số giới hạn theo tier cho mỗi loại hành động

---

### Bước 4: Tự Động Xử Lý Khi Điểm Rủi Ro Cao

**Vấn đề**: Hệ thống phát hiện gian lận nhưng chỉ ghi log, chưa tự động xử lý.

**Giải pháp**: Khi `pplp-detect-fraud` trả về điểm rủi ro:
- Rủi ro trên 70: Tự động đình chỉ tạm thời 24h + thông báo admin
- Rủi ro trên 50: Đóng băng phần thưởng (pending), không cho rút tiền
- Rủi ro trên 25: Giảm phần thưởng 50%, đánh dấu THEO DÕI
- Rủi ro dưới 25: Bình thường

**Thay đổi kỹ thuật**:
- Sửa `pplp-detect-fraud/index.ts`: thêm logic tự động tạo `user_suspensions` khi rủi ro trên 70
- Sửa `pplp-score-action/index.ts`: kiểm tra điểm rủi ro trước khi mint
- Thêm hàm `auto_suspend_high_risk(_user_id, _risk_score, _signals)` trong database

---

### Bước 5: Kích Hoạt Kiểm Tra Ngẫu Nhiên (Random Audit)

**Vấn đề**: Hàm `schedule_random_audit()` đã tồn tại nhưng chưa có cron job chạy.

**Giải pháp**: Tạo cron job chạy mỗi 6 giờ:
- Chọn ngẫu nhiên 5% hành động đã mint trong 24 giờ
- Nếu kiểm tra phát hiện bất thường thì gắn cờ cho user đó
- Tích luỹ 3 lần bị gắn cờ thì tự động đình chỉ

**Thay đổi kỹ thuật**:
- Tạo cron job gọi `schedule_random_audit()` qua `pg_cron`
- Tạo edge function `process-audit-results` để xử lý kết quả kiểm tra

---

## Thứ Tự Triển Khai Đề Xuất

```text
Ưu tiên 1 (Làm ngay): ✅ HOÀN THÀNH
  [Bước 1] ✅ Cổng thời gian tài khoản — anti-sybil.ts + 5 edge functions
  [Bước 4] ✅ Tự động xử lý khi rủi ro cao — auto_suspend_high_risk() + pplp-detect-fraud

Ưu tiên 2: ✅ HOÀN THÀNH
  [Bước 3] ✅ Giới hạn hành động theo cấp bậc — check_user_cap_and_update() tier-based
  [Bước 5] ✅ Kiểm tra ngẫu nhiên — pg_cron mỗi 6h + auto-suspend 3 flags

Ưu tiên 3: ✅ HOÀN THÀNH
  [Bước 2] ✅ Trì hoãn phần thưởng — pending_rewards + cron hourly + 5 edge functions
```

---

## Tổng Kết

Hệ thống FUN đã có nền tảng tốt (device fingerprint, trust tiers, fraud detection). Nhưng đang thiếu 3 thứ quan trọng nhất:

1. **Cổng thời gian** - User mới nên bị giới hạn mạnh, tạo chi phí thời gian cho bot
2. **Tự động xử lý** - Phát hiện gian lận phải dẫn đến hành động cụ thể, không chỉ ghi log
3. **Trì hoãn phần thưởng** - Không cho rút ngay, tạo thời gian để kiểm tra và phát hiện bất thường

Khi áp dụng 5 bước này, chi phí farm sẽ tăng gấp 10 lần, làm giảm đáng kể động lực của bot và tài khoản sybil.

