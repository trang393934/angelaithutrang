

# Thêm Tab "Quy Trình Chống Sybil" Vào Trang Cảnh Báo Gian Lận

## Mục tiêu

Thêm một tab mới "Quy trình" vào trang `/admin/fraud-alerts` hiển thị toàn bộ quy trình chống Sybil Attack đang hoạt động trong hệ thống, giúp admin hiểu rõ cơ chế bảo vệ.

## Nội dung tab sẽ hiển thị

### 5 lớp bảo vệ đang hoạt động

**Lớp 1 — Cổng Thời Gian Tài Khoản (Account Age Gate)**
- Tài khoản dưới 3 ngày: phần thưởng giảm 50%, tối đa 3 hành động/ngày
- Tài khoản 3-7 ngày: phần thưởng giảm 25%, tối đa 5 hành động/ngày
- Tài khoản trên 7 ngày: không giới hạn

**Lớp 2 — Trì Hoãn Phần Thưởng (Pending Rewards)**
- Tier 0-1, tài khoản dưới 3 ngày: chờ 48 giờ
- Tier 0-1, tài khoản 3-7 ngày: chờ 24 giờ
- Tier 0-1, tài khoản 7-14 ngày: chờ 12 giờ
- Tier 2 trở lên hoặc trên 14 ngày: cấp ngay

**Lớp 3 — Giới Hạn Theo Cấp Bậc Tin Cậy (Tiered Rate Limits)**
- Tier 0: hệ số 0.4x (chỉ được 40% giới hạn bình thường)
- Tier 1: hệ số 0.7x
- Tier 2: hệ số 1.0x (chuẩn)
- Tier 3: hệ số 1.5x
- Tier 4: hệ số 2.0x

**Lớp 4 — Tự Động Xử Lý Khi Rủi Ro Cao (Auto Fraud Response)**
- Risk score trên 70: tự động đình chỉ 24 giờ + healing message + fraud alert
- Risk score trên 50: đóng băng phần thưởng pending
- Risk score trên 25: theo dõi

**Lớp 5 — Kiểm Tra Ngẫu Nhiên (Random Audit)**
- Cron job mỗi 6 giờ, kiểm tra 5% hành động đã mint trong 24 giờ
- Tích luỹ 3 lần bị gắn cờ: tự động đình chỉ

### Hệ thống phát hiện bổ trợ
- Device Fingerprint (kiểm tra device_hash trùng lặp giữa các tài khoản)
- Bot Detection (tần suất hành động, timing pattern đều đặn)
- Spam Detection (nội dung ngắn, nội dung trùng lặp)
- Collusion Detection (tương tác tập trung bất thường)
- Pattern Registry (email prefix/suffix, bulk registration)

## Thay đổi kỹ thuật

### File sửa: `src/pages/AdminFraudAlerts.tsx`

1. Thêm giá trị `"process"` vào state `activeTab`
2. Thêm nút tab mới "Quy trình" với icon `FileText`
3. Thêm nội dung tab hiển thị quy trình dưới dạng các card/section trực quan:
   - Mỗi lớp bảo vệ là 1 card có tiêu đề, mô tả ngắn, và bảng chi tiết
   - Sử dụng màu sắc phân biệt trạng thái (xanh = hoạt động)
   - Hiển thị sơ đồ luồng xử lý khi user thực hiện hành động kiếm thưởng

Không cần thay đổi database hay edge function — đây chỉ là UI hiển thị tài liệu quy trình.
