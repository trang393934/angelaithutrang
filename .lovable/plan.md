
# Security Action: Permanent Ban — Nhóm Lưu Dung & Nguyễn Viết Soạn

## Báo cáo Tình báo Đã Xác minh

### Tình trạng hiện tại

- **joni (Nguyễn Viết Soạn)** — `vietsoan270818@gmail.com` — ✅ ĐÃ BAN TRƯỚC ĐÓ
- **thuy le** — `luuanh270818@gmail.com` — ✅ ĐÃ BAN TRƯỚC ĐÓ

### 5 Tài khoản Gia đình Lưu — ĐANG HOẠT ĐỘNG, CHƯA BAN

Tất cả đăng ký ngày 20/01/2026 trong vòng 50 phút. Joni đăng ký lúc 11:42, luu dung đăng ký lúc 11:50 — **cùng ngày, cùng cụm giờ**.

| Tên | Email | User ID | Số dư | Lifetime Earned | Pending Mint | Pending Rút |
|-----|-------|---------|-------|-----------------|-------------|------------|
| **luu dung** | dungluu1717@gmail.com | bb52286d-... | 1,997,696 | 2,825,722 | **81** | **207,744** |
| **Lưu Hiếu** | builoi1131@gmail.com | afa4b518-... | 200 | 915,964 | **66** | **299,369** |
| **Lưu Quang Trung** | chung121112@gmail.com | c86cae53-... | 300 | 951,350 | **89** | **348,155** |
| **thuy dung** | dunganh2223@gmail.com | 4122bb9f-... | 1,471,100 | 1,949,003 | **54** | **262,448** |
| **thuy thuy** | thuydungluu626@gmail.com | c20b1112-... | 300 | 412,429 | **36** | **208,235** |

**Tổng cộng: 326 pending mint | 1,325,951 Camly pending rút**

### Dấu hiệu Gian lận Chính

1. **Đồng đăng ký**: 4/5 tài khoản đăng ký ngày 20/01 trong 50 phút cùng với joni
2. **Kết nối ví tổng**: Lưu Quang Trung rút về ví `0x68ae9ad0...` = ví của **tinhthan** trong mạng le quang → 2 "gia đình" là 1 mạng lưới
3. **Suffix email trùng**: `luuanh270818` (thuy le - đã ban) kết nối trực tiếp với `dungluu1717`
4. **Hành vi đồng bộ**: Các lệnh rút tiền được gửi cùng khung giờ ngày 07/02 và 13/02/2026

---

## Thay đổi Kỹ thuật

### File duy nhất: `src/pages/AdminFraudAlerts.tsx`

**Thêm Nhóm 6 — "Nhóm Lưu Dung & Nguyễn Viết Soạn"** vào cuối mảng `SYBIL_GROUPS` (sau nhóm PHAM, trước dấu `];` ở dòng 289):

```tsx
{
  groupName: "Nhóm Lưu Dung & Nguyễn Viết Soạn — Đăng ký 20/01 cùng joni",
  walletAddress: "0x77dfa842... | 0x848393bc... | 0x68ae9ad0... (tinhthan)",
  severity: "critical",
  note: "5 tài khoản gia đình Lưu đăng ký cùng ngày 20/01 trong 50 phút với joni (đã ban). Lưu Quang Trung rút về ví 0x68ae9ad0 = ví tinhthan trong mạng le quang — hai nhóm là một mạng lưới duy nhất. Tổng pending rút: ~1.33M Camly.",
  members: [
    { userId: "bb52286d-5a6b-4908-99e2-7c2795856f9a", name: "luu dung", email: "dungluu1717@gmail.com", balance: 1997696, lifetimeEarned: 2825722, pendingMint: 81, pendingWithdrawal: 207744 },
    { userId: "afa4b518-c75d-4692-8b5c-f4b5cfb11b6a", name: "Lưu Hiếu", email: "builoi1131@gmail.com", balance: 200, lifetimeEarned: 915964, pendingMint: 66, pendingWithdrawal: 299369 },
    { userId: "c86cae53-4692-485d-a2b5-6e1f2464bcba", name: "Lưu Quang Trung", email: "chung121112@gmail.com", balance: 300, lifetimeEarned: 951350, pendingMint: 89, pendingWithdrawal: 348155 },
    { userId: "4122bb9f-7d76-436f-862a-aab1a974906c", name: "thuy dung", email: "dunganh2223@gmail.com", balance: 1471100, lifetimeEarned: 1949003, pendingMint: 54, pendingWithdrawal: 262448 },
    { userId: "c20b1112-38ca-44ea-862e-b07b1d59a668", name: "thuy thuy", email: "thuydungluu626@gmail.com", balance: 300, lifetimeEarned: 412429, pendingMint: 36, pendingWithdrawal: 208235 },
  ],
},
```

**Cập nhật comment header** từ "5 nhóm, 16 tài khoản" → "6 nhóm, 21 tài khoản" và số liệu tổng pending.

### Database: Thêm Pattern Mới vào `sybil_pattern_registry`

Dùng SQL insert để đăng ký các mẫu nhận dạng mới ngăn re-entry:

```sql
INSERT INTO sybil_pattern_registry (pattern_type, pattern_value, severity, description, is_active)
VALUES
  ('email_prefix', 'dungluu', 'critical', 'Gia đình Lưu Dung — sybil network 20/01/2026', true),
  ('email_prefix', 'luuanh', 'critical', 'Kết nối gia đình Lưu với nhóm 270818', true),
  ('email_prefix', 'thuydungluu', 'critical', 'Gia đình Lưu Dung — biến thể email', true),
  ('email_keyword', 'chung121112', 'critical', 'Lưu Quang Trung — funnel ví tinhthan', true)
ON CONFLICT DO NOTHING;
```

---

## Tóm tắt Tác động

| Hạng mục | Trước | Sau |
|----------|-------|-----|
| Số nhóm sybil trong tab | 5 | **6** |
| Tài khoản có thể ban từ tab | 16 | **21** |
| Pending rút cần chặn (tổng) | ~3.2M | **~4.5M Camly** |
| Pending mint cần reject (tổng) | ~733 | **~1,059** |
| Pattern nhận dạng trong DB | 7 | **11** |

Không cần migration. Chỉ cần thêm group vào `SYBIL_GROUPS` và insert 4 patterns vào DB.
