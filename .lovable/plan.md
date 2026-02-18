
# Fix Cột "Cảnh báo" - Hiển thị Trực tiếp Shared Wallet & Wallet Rotation

## Nguyên nhân gốc rễ đã xác định

Qua điều tra database, phát hiện:
- **`fraud_alerts` table hiện tại: 0 alert chưa reviewed** — tất cả đã được xử lý/reviewed trước đó
- **Nhưng có 20+ users đang dùng shared wallet** (ví dụ: Kim Xuyen + Nguyễn Thị Tươi cùng dùng `0x0b78f86...`, hoặc 3 người dùng `0x89c387...`)
- **3 users có wallet rotation** (Mận Trần, Hải Vũ, Hoài Như — dùng 2+ ví khác nhau để rút)
- Những users này **không có fraud_alert** trong DB → cột "Cảnh báo" hiển thị trống vì badge chỉ dựa vào `fraud_alerts`

## Giải pháp

Nâng cấp `fetchWallets()` để **tự tính cảnh báo trực tiếp từ data** — không phụ thuộc `fraud_alerts` table:

### Thêm 2 nguồn cảnh báo mới vào `WalletEntry`:

```typescript
interface WalletEntry {
  // ... existing fields
  is_shared_wallet: boolean;        // Ví này đang được dùng bởi nhiều users
  shared_wallet_user_count: number; // Số users dùng chung ví này
  // withdrawal_wallet_count đã có → dùng để detect rotation
}
```

### Cập nhật `fetchWallets()`:

Thêm query để phát hiện **shared wallets từ `user_wallet_addresses`**:
```
GROUP BY wallet_address HAVING COUNT(DISTINCT user_id) > 1
```
→ Tạo `Set<string>` của các wallet_address đang bị shared, kèm số lượng users

### Cập nhật hàm `getFraudBadge()` hoặc tạo hàm `getWalletWarningBadge()`:

Hiển thị cảnh báo kết hợp **nhiều nguồn**:

**Nguồn 1:** `fraud_alerts` (nếu có)
**Nguồn 2:** `is_shared_wallet = true` → Badge đỏ "🔴 VÍ DÙNG CHUNG"
**Nguồn 3:** `withdrawal_wallet_count >= 2` → Badge cam "🟠 HOÁN ĐỔI VÍ"

Tooltip khi hover sẽ hiển thị chi tiết:
- Ví dùng chung X người
- Đã dùng Y ví khác nhau để rút
- Chi tiết fraud_alerts nếu có

### Ví dụ hiển thị sau khi fix:

| User | Cảnh báo |
|---|---|
| Kim Xuyen | 🔴 VÍ DÙNG CHUNG (2 người) |
| Nguyễn Thị Tươi | 🔴 VÍ DÙNG CHUNG (2 người) |
| tungphatloc | 🔴 VÍ DÙNG CHUNG (3 người) |
| ĐÀM THỊ MAI | 🔴 VÍ DÙNG CHUNG (3 người) |
| Hải Vũ | 🟠 HOÁN ĐỔI VÍ (2 ví) |
| Mận Trần | 🟠 HOÁN ĐỔI VÍ (2 ví) |
| Hoài Như | 🟠 HOÁN ĐỔI VÍ (2 ví) |

## Technical Implementation

### File duy nhất thay đổi: `src/pages/AdminWalletManagement.tsx`

**Bước 1:** Cập nhật `WalletEntry` interface — thêm `is_shared_wallet` và `shared_wallet_user_count`

**Bước 2:** Trong `fetchWallets()`, thêm query detect shared wallets:
```typescript
// Fetch tất cả wallet addresses để detect shared
const { data: allWalletData } = await supabase
  .from("user_wallet_addresses")
  .select("wallet_address, user_id");

// Build sharedWalletMap: wallet_address → số users
const walletAddressCount: Record<string, number> = {};
allWalletData?.forEach((w) => {
  walletAddressCount[w.wallet_address] = (walletAddressCount[w.wallet_address] || 0) + 1;
});
```

Rồi trong merge step:
```typescript
const sharedCount = walletAddressCount[w.wallet_address] ?? 1;
return {
  ...existingFields,
  is_shared_wallet: sharedCount > 1,
  shared_wallet_user_count: sharedCount,
}
```

**Bước 3:** Tạo hàm `getWalletWarningBadges()` mới thay thế `getFraudBadge()` trong cột Cảnh báo:

```typescript
const getWalletWarningBadges = (w: WalletEntry) => {
  const badges = [];
  
  // Priority 1: Shared wallet (critical)
  if (w.is_shared_wallet) {
    badges.push({ severity: "critical", type: "shared_wallet", detail: `${w.shared_wallet_user_count} users` });
  }
  
  // Priority 2: Wallet rotation (high)
  if (w.withdrawal_wallet_count >= 2) {
    badges.push({ severity: "high", type: "wallet_rotation", detail: `${w.withdrawal_wallet_count} ví` });
  }
  
  // Priority 3: fraud_alerts (existing)
  if (w.fraud_alert_count > 0) {
    badges.push(...w.fraud_alert_details.map(d => ({ ...d, fromAlerts: true })));
  }
  
  if (badges.length === 0) return null;
  
  // Hiển thị badge cao nhất + tooltip đầy đủ
  return <TooltipProvider>...</TooltipProvider>;
};
```

**Bước 4:** Tooltip chi tiết khi hover sẽ hiển thị tất cả lý do cảnh báo:
- "🔴 Ví dùng chung với 2 tài khoản khác"
- "🟠 Đã sử dụng 2 địa chỉ ví khác nhau để rút tiền"
- Danh sách fraud_alerts nếu có

## Thứ tự thực thi

```text
Bước 1: Cập nhật WalletEntry interface
  ↓
Bước 2: Cập nhật fetchWallets() để detect shared wallets
  ↓  
Bước 3: Tạo getWalletWarningBadges() đa nguồn
  ↓
Bước 4: Thay thế getFraudBadge() call trong TableCell bằng getWalletWarningBadges()
```

## Kết quả

Cột "Cảnh báo" sẽ hiển thị ngay lập tức với đầy đủ thông tin cho:
- 20+ users dùng shared wallet (không cần fraud_alert trong DB)
- 3+ users có wallet rotation
- Bất kỳ user nào có fraud_alert trong tương lai
- Tất cả kết hợp trong 1 tooltip rõ ràng khi hover
