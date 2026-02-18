
# Thực thi Bảo vệ Nền Kinh tế Ánh sáng - Chặn 20 Tài khoản Sybil

## Tình trạng hiện tại (đã xác minh)

### 20 tài khoản bị chặn - chia thành 4 nhóm:

**Nhóm BACHP/BACHN (7 tài khoản)** - Email đồng loạt `bachp*/bachn*`:
- Như Xuyến (bachnbn991) - 2,423,209 Camly earned
- Vu Nhu (bachpn223) - 2,350,185 Camly earned
- Fan của Cha (bachnb919) - 2,274,075 Camly earned
- Lê Huệ (bachpn19) - 2,204,881 Camly earned
- Mận Trần (bachpnb991) - 2,014,505 Camly earned
- Trinh Que (bachpb19) - 1,882,337 Camly earned
- Trâm Đặng (bachpnb) - 762,900 Camly earned

**Nhóm 270818 (4 tài khoản)** - Email chứa `270818`:
- joni (vietsoan270818) - 1,949,938 Camly earned
- thuy le (luuanh270818) - 1,921,886 Camly earned
- bao ngan (baongan270818) - 1,790,536 Camly earned
- hương (nguyenhuong270818) - 1,771,400 Camly earned

**Nhóm 11136 (4 tài khoản)** - Email chứa `11136`:
- cao lan (sonth11136) - 2,163,062 Camly earned
- canh (canhth11136) - 2,146,675 Camly earned
- huyền (huyenth11136) - 1,955,293 Camly earned
- thoa (thoath11136) - 1,775,644 Camly earned

**Nhóm 442/68682 (5 tài khoản)** - Ví chuyển tiền chéo:
- le quang (lequang68682) - Ví tổng `0xAdF1E1...`
- sac (vietsac442) - Ví tổng `0x0CFc02...`
- le lien (lelien4334) - 1,248,570 Camly earned
- yên hoa (yenhoa1442) - 385,988 Camly earned
- hoa kieu (nguoigochoa442) - 313,813 Camly earned

### 13 lệnh rút PENDING cần chặn:
Tổng: **3,132,840 Camly** phải bị từ chối

## 3 việc cần thực hiện

### Việc 1: Ban tất cả 20 tài khoản (Permanent)

**Tạo edge function mới:** `supabase/functions/bulk-suspend-users/index.ts`

Function này nhận danh sách user IDs, gọi logic suspend hàng loạt:
- Loop qua từng user ID
- Insert vào `user_suspensions` với `suspension_type = 'permanent'`
- Update `user_energy_status` thành `rejected`
- Gửi `healing_message` vào bảng `healing_messages`

**Hoặc** thực thi trực tiếp qua admin action trong `AdminWalletManagement.tsx` - thêm nút "Ban hàng loạt" cho phép admin chọn nhiều tài khoản rồi ban 1 lần.

### Việc 2: Từ chối 13 lệnh rút PENDING

Update trực tiếp bảng `coin_withdrawals`:
```sql
UPDATE coin_withdrawals SET status = 'failed', admin_notes = 'Từ chối - Tài khoản nghi ngờ sybil farming' 
WHERE id IN ('3a6ce799...', '33bde1b9...', ...) AND status = 'pending';
```
Đồng thời hoàn tiền về balance (trigger `update_withdrawal_stats` đã xử lý refund tự động khi status = 'failed').

### Việc 3: Hệ thống phát hiện & cảnh báo tự động (Fraud Detection)

**Tạo bảng mới:** `sybil_pattern_registry`
```sql
CREATE TABLE sybil_pattern_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'email_suffix', 'wallet_cluster', 'ip_hash', 'registration_burst'
  pattern_value TEXT NOT NULL, -- e.g. '270818', '11136', '442'
  severity TEXT NOT NULL DEFAULT 'high', -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  flagged_by UUID, -- admin user ID
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Tạo bảng:** `fraud_alerts`
```sql
CREATE TABLE fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'email_pattern', 'bulk_registration', 'wallet_cluster', 'withdrawal_spike'
  matched_pattern TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Tạo Edge Function:** `supabase/functions/fraud-scanner/index.ts`

Chạy khi user đăng ký mới OR khi user tạo yêu cầu rút tiền. Kiểm tra:

1. **Email Pattern Match** - So sánh email mới với `sybil_pattern_registry`:
   ```
   IF email CONTAINS any pattern in registry → CREATE fraud_alert (severity: high)
   ```

2. **Bulk Registration Burst** - Phát hiện đăng ký đồng loạt:
   ```
   IF >3 accounts registered within 2 hours with similar email prefix → alert
   ```

3. **Withdrawal Spike** - Phát hiện rút tiền hàng loạt:
   ```
   IF same day, >5 accounts with similar email suffix all request withdrawal → alert
   ```

**Tạo trang Admin mới:** `src/pages/AdminFraudAlerts.tsx`

Dashboard hiển thị:
- Danh sách cảnh báo gian lận chưa được xem xét
- Badge đỏ số lượng cảnh báo mới trên AdminNavToolbar
- Nút "Ban ngay" / "Bỏ qua" cho từng cảnh báo

**Thêm trigger tự động** trong database:
```sql
-- Trigger chạy khi user mới đăng ký (via user_light_agreements)
CREATE TRIGGER check_fraud_on_registration
AFTER INSERT ON user_light_agreements
FOR EACH ROW EXECUTE FUNCTION auto_fraud_check();
```

## Files cần thay đổi / tạo mới

### Database Migrations:
1. Tạo bảng `sybil_pattern_registry` với dữ liệu seed (các pattern đã biết: `270818`, `11136`, `442`, `4334`, `68682`, `bachp`, `bachn`)
2. Tạo bảng `fraud_alerts`
3. Database function `auto_fraud_check()` để trigger khi đăng ký mới

### Edge Functions:
4. `supabase/functions/bulk-suspend-users/index.ts` - Ban hàng loạt + từ chối withdrawal
5. `supabase/functions/fraud-scanner/index.ts` - Quét pattern mới

### Frontend:
6. `src/pages/AdminFraudAlerts.tsx` - Trang cảnh báo gian lận (MỚI)
7. `src/pages/AdminWalletManagement.tsx` - Thêm checkbox multi-select + nút "Ban hàng loạt" + action từ chối withdrawal
8. `src/components/admin/AdminNavToolbar.tsx` - Thêm "🚨 Cảnh báo" với badge số đỏ
9. `src/App.tsx` - Thêm route `/admin/fraud-alerts`

## Thứ tự thực thi

```text
Bước 1: Migration DB (bảng sybil_pattern_registry + fraud_alerts)
   ↓
Bước 2: Deploy edge function bulk-suspend-users
   ↓
Bước 3: Thực thi BAN 20 tài khoản (gọi function)
   ↓
Bước 4: Thực thi TỪ CHỐI 13 lệnh rút (gọi trực tiếp DB)
   ↓
Bước 5: Deploy fraud-scanner function
   ↓
Bước 6: Tạo frontend AdminFraudAlerts + cập nhật WalletManagement
   ↓
Bước 7: Seed dữ liệu pattern registry (7 patterns đã biết)
```

## Tác động tài chính

| Hành động | Số lượng | Camly |
|-----------|---------|-------|
| Tài khoản bị ban | 20 tài khoản | ~37.5M earned bị đóng băng |
| Lệnh rút bị từ chối | 13 lệnh | 3,132,840 Camly được hoàn lại hệ thống |
| Pattern được đăng ký | 7 patterns | Ngăn chặn sybil mới trong tương lai |

> Lưu ý: Khi từ chối withdrawal (status = 'failed'), trigger `update_withdrawal_stats` sẽ tự động hoàn trả số Camly về balance của từng tài khoản. Tuy nhiên vì tài khoản đã bị ban vĩnh viễn, số dư này sẽ bị đóng băng và không thể rút được nữa.
