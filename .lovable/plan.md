

# Kế hoạch: Tách biệt Lì xì Tết & Quy trình Claim thưởng

## Tổng quan

Hiện tại, Camly Coin nhận từ chương trình Lì xì Tết đang được tính chung vào "Tổng tích lũy" (`lifetime_earned`). Kế hoạch này sẽ:

1. **Tách riêng** số Camly Coin Lì xì ra khỏi "Tổng tích lũy", hiển thị trong mục "Nhận thưởng" riêng biệt
2. **Thay đổi quy trình Claim**: Khi user nhấn CLAIM, hệ thống ghi nhận yêu cầu claim (chưa chuyển coin ngay). Admin thấy yêu cầu và chủ động chuyển CAMLY token từ ví Treasury đến ví Web3 của user
3. **Thêm cột trạng thái Claim** trên trang admin để theo dõi ai đã claim, ví nhận, và trạng thái chuyển on-chain

---

## Chi tiết kỹ thuật

### 1. Database Migration

Tạo bảng `lixi_claims` để lưu yêu cầu claim từ user:

```text
lixi_claims
----------------------------------------------
id               UUID (PK, default gen_random_uuid())
user_id          UUID (NOT NULL)
notification_id  UUID (NOT NULL, FK -> notifications.id)
camly_amount     BIGINT (NOT NULL)
fun_amount       BIGINT (NOT NULL)
wallet_address   TEXT (nullable - ví Web3 của user)
status           TEXT (default 'pending') -- pending | processing | completed | failed
tx_hash          TEXT (nullable - hash giao dịch on-chain)
claimed_at       TIMESTAMPTZ (default now())
processed_at     TIMESTAMPTZ (nullable)
processed_by     UUID (nullable - admin ID)
error_message    TEXT (nullable)
----------------------------------------------
```

RLS policies:
- User SELECT: chỉ xem claim của mình
- User INSERT: chỉ tạo claim cho mình
- Admin ALL: quản lý toàn bộ

Enable realtime cho bảng này.

### 2. Hook `useLiXiCelebration` - Cập nhật logic Claim

Khi user nhấn CLAIM:
- Lấy `wallet_address` từ bảng `user_wallet_addresses` (ví Web3 đã đăng ký)
- Insert record vào `lixi_claims` với status `pending`
- Đánh dấu notification `is_read = true`
- Hiển thị thông báo "Yêu cầu claim đã gửi, admin sẽ chuyển thưởng đến ví Web3 của bạn"

### 3. UI - Tách mục "Nhận thưởng" trên Profile

**a. Hook `useUserCamlyCoin`** - Thêm trường `lixiReward`:
- Query bảng `camly_coin_transactions` lọc `metadata.source = 'fun_to_camly_reward'` để tính tổng Camly Coin từ Lì xì
- Trả về: `balance`, `lifetimeEarned` (trừ Lì xì), `lixiReward` (riêng Lì xì)

**b. `CamlyCoinDisplay`** (trang Profile cá nhân):
- "Tổng tích lũy" = `lifetime_earned - lixiReward`
- Thêm dòng mới "Nhận thưởng Lì xì" với icon bao lì xì, hiển thị số Camly Coin + trạng thái claim

**c. `UserProfile.tsx`** (trang xem profile người khác):
- Tương tự: tách "Tổng tích lũy" và "Nhận thưởng" trong sidebar Intro và tab About

**d. `PublicProfileStats`** (profile công khai):
- Cập nhật `lifetimeEarned` chỉ hiển thị phần tích lũy tự nhiên (không bao gồm Lì xì)

### 4. Admin Dashboard - Cột trạng thái Claim

Trên trang `/admin/tet-reward`, thêm:
- **Cột "Claim"** mới bên cạnh cột "Lì xì": hiển thị trạng thái claim của từng user
  - Chưa claim: icon "---"
  - Đã claim (pending): icon dong ho vang + ví Web3 rut gon
  - Admin đã chuyển (completed): icon xanh + tx hash on-chain
  - Lỗi: icon đỏ + lý do

- **Nút "Chuyển thưởng On-chain"**: Admin chọn user đã claim, xác nhận chuyển CAMLY token từ ví Treasury (`0x02D5...9a0D`) đến ví Web3 của user. Sau khi chuyển thành công, cập nhật `lixi_claims.status = 'completed'` + `tx_hash`

- Admin cũng thấy **realtime notification** khi có user claim mới

### 5. Realtime notification cho Admin

Khi user claim, insert record vào `notifications` cho admin (type: `lixi_claim_request`) để admin biết ngay có yêu cầu mới.

---

## Luong xu ly

```text
User thay popup Li xi
        |
        v
User nhan CLAIM
        |
        v
He thong:
  1. Insert lixi_claims (status: pending, wallet_address)
  2. Danh dau notification da doc
  3. Gui notification cho admin (lixi_claim_request)
        |
        v
Admin thay yeu cau claim tren /admin/tet-reward
        |
        v
Admin ket noi vi Treasury (MetaMask)
  -> Chuyen CAMLY token den vi Web3 cua user
        |
        v
Ghi nhan tx_hash, cap nhat status = completed
```

---

## Danh sach file can sua

| File | Thay doi |
|------|----------|
| Database migration | Tao bang `lixi_claims` + RLS + realtime |
| `src/hooks/useLiXiCelebration.ts` | Cap nhat ham `claim()` de insert vao `lixi_claims` |
| `src/hooks/useUserCamlyCoin.ts` | Them truong `lixiReward` tu transactions |
| `src/components/CamlyCoinDisplay.tsx` | Tach "Tong tich luy" va "Nhan thuong Li xi" |
| `src/pages/UserProfile.tsx` | Tach hien thi tuong tu tren sidebar + tab About |
| `src/components/public-profile/PublicProfileStats.tsx` | Tru Li xi khoi lifetimeEarned |
| `src/pages/AdminTetReward.tsx` | Them cot Claim, nut chuyen on-chain |

