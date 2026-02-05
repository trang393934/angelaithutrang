
# KẾ HOẠCH: Sửa lỗi Database Constraint cho PPLP Scoring

## I. VẤN ĐỀ PHÁT HIỆN

**Lỗi từ logs:**
```
new row for relation "pplp_scores" violates check constraint "pplp_scores_multiplier_i_check"
```

### Phân tích chi tiết:

| Constraint | Yêu cầu | Giá trị thực tế | Trạng thái |
|------------|---------|-----------------|------------|
| `multiplier_i` | **≥ 1.0** AND ≤ 5.0 | 0.87 | **VI PHẠM** |
| `multiplier_q` | ≥ 1.0 AND ≤ 3.0 | 1.80 | OK |
| `multiplier_k` | ≥ 0.0 AND ≤ 1.0 | 0.94 | OK |

### Nguyên nhân gốc rễ:
- Config trong `pplp_action_caps`: `multiplier_ranges.I = [0.5, 5.0]`
- Công thức: `I = 0.5 + (5.0 - 0.5) × iNormalized`
- Với `iNormalized = 0.1` (beneficiaries=1 / 10): `I = 0.5 + 4.5 × 0.1 = 0.95`
- **Kết quả 0.95 < 1.0** → Vi phạm constraint!

---

## II. GIẢI PHÁP

### Có 2 lựa chọn:

**Option A: Sửa Database Constraint** (Khuyến nghị)
- Thay đổi constraint `multiplier_i >= 0.5` thay vì `>= 1.0`
- Ít thay đổi code, phù hợp với thiết kế ban đầu

**Option B: Sửa Range Config trong Code**
- Thay đổi range từ `[0.5, 5.0]` thành `[1.0, 5.0]`
- Cần update cả DB table `pplp_action_caps`

---

## III. CHI TIẾT THỰC HIỆN (Option A - Khuyến nghị)

### Bước 1: Database Migration

```sql
-- Sửa constraint cho multiplier_i từ >= 1.0 thành >= 0.5
ALTER TABLE pplp_scores DROP CONSTRAINT pplp_scores_multiplier_i_check;
ALTER TABLE pplp_scores ADD CONSTRAINT pplp_scores_multiplier_i_check 
  CHECK (multiplier_i >= 0.5 AND multiplier_i <= 5.0);
```

### Bước 2: Chạy lại scoring cho các actions pending

Gọi `pplp-batch-processor` để chấm điểm lại tất cả actions đang pending.

---

## IV. FLOW SAU KHI SỬA

```text
User hỏi Angel AI
       ↓
Submit PPLP Action (với enriched metadata)
       ↓
pplp-score-action chấm điểm
       ↓
✅ Light Score = 84.35 (PASS)
✅ multiplier_i = 0.87 (hợp lệ với constraint mới >= 0.5)
       ↓
Insert vào pplp_scores thành công
       ↓
Auto-mint FUN Money
       ↓
User thấy "Sẵn sàng claim" 🎉
```

---

## V. KẾT QUẢ MONG ĐỢI

Sau khi sửa:
- 10+ actions đang pending sẽ được chấm điểm thành công
- Light Score ~84 sẽ PASS threshold
- FUN Money được mint tự động
- UI Mint page hiển thị "Đã mint" với Light Score

---

## VI. THỜI GIAN THỰC HIỆN

| Bước | Việc cần làm | Thời gian |
|------|--------------|-----------|
| 1 | Chạy migration sửa constraint | 1 phút |
| 2 | Chạy batch processor | 2 phút |
| 3 | Verify kết quả | 2 phút |

**Tổng cộng:** ~5 phút
