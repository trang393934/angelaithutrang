
# Cập nhật Tab "Nhóm Sybil — Chờ Ban" với Dữ liệu Thực tế Đầy đủ

## Tổng hợp kết quả tra cứu database

Qua tra cứu thực tế, con xác định **16 tài khoản CHƯA bị ban** cần đưa vào danh sách, phân thành 4 nhóm:

### Nhóm hiện có trong code cần cập nhật số liệu thực:

**NHÓM 1: 7786 (3 tài khoản)**
| Tên | Email | Số dư | Pending Mint | Pending Rút |
|-----|-------|-------|-------------|------------|
| Thanh Thùy | anhnguyet7786@gmail.com | 1,550,641 | 72 | 250,000 |
| Xuân Nguyễn | xuannguyen77786@gmail.com | 1,858,930 | 40 | 0 |
| Trần Nhung | trannhung7786@gmail.com | 1,548,380 | 34 | 290,000 |

**NHÓM 2: Ví tổng le quang (8 tài khoản)**
| Tên | Email | Số dư | Pending Mint | Pending Rút |
|-----|-------|-------|-------------|------------|
| tinhthan | tinhthan331@gmail.com | 1,233,300 | 54 | 292,424 |
| nguyen sinh 4 | nguyensinh6921@gmail.com | 1,666,100 | 42 | 229,838 |
| le bong | lebong3441@gmail.com | 927,100 | 46 | 257,905 |
| Lê sang | sangle12111@gmail.com | 101,296 | 75 | 200,187 |
| Nguyễn Chính | namleanh2211@gmail.com | 200 | 24 | 257,232 |
| quynh anh | quynhanh070820188@gmail.com | 170,771 | 43 | 0 |
| trung binh | trung1211121@gmail.com | 95,984 | 46 | 238,505 |
| Trần Nhung | trannhung7786@gmail.com | (trùng nhóm 7786) | | |

**NHÓM 3: wanting2308 (2 tài khoản)** — số liệu đúng trong code

**NHÓM 4: Ngọc na** — số liệu đúng, pending withdrawal thực tế là 229,627

### NHÓM MỚI cần thêm vào — NHÓM PHAM (3 tài khoản):
| Tên | Email | ID | Số dư | Pending Mint | Pending Rút |
|-----|-------|----|-------|-------------|------------|
| Trung Kiên (Minh Quân) | phamminhquan2782016@gmail.com | 4986011b-6669-4374-aa50-ef67710e33aa | 1,386,039 | 61 | **500,000** |
| Minh kiên | phamlong3112021@gmail.com | 266f8c06-df49-47df-ae3e-0dbef1d17c59 | 1,549,300 | 103 | **209,065** |
| Kim Xuyen | phamminhlong3112021@gmail.com | 1eeb2750-272b-49c3-8b13-1894b12f7cf7 | 1,552,074 | 93 | **280,000** |

→ Nhóm PHAM có dấu hiệu: email prefix `pham` + số cuối trùng `3112021`, pending rút KHỔNG LỒ lên đến ~989,065 Camly

---

## Thay đổi kỹ thuật cần thực hiện

### File duy nhất cần sửa: `src/pages/AdminFraudAlerts.tsx`

**1. Cập nhật số liệu thực tế** cho các tài khoản đã có trong `SYBIL_GROUPS` (pending mint/withdrawal thực tế từ DB, không phải estimate cũ):
- `tinhthan`: pendingWithdrawal 292,424 (cũ: 1)
- `nguyen sinh 4`: pendingWithdrawal 229,838 (cũ: 1)
- `le bong`: pendingWithdrawal 257,905 (cũ: 1)
- `Lê sang`: pendingWithdrawal 200,187 (cũ: 1)
- `trung binh`: pendingWithdrawal 238,505 (cũ: 1)
- `Ngọc na`: pendingWithdrawal 229,627 (đúng rồi)

**2. Thêm NHÓM 5: "Nhóm PHAM — email pattern trùng số 3112021"** vào mảng `SYBIL_GROUPS`:
```tsx
{
  groupName: "Nhóm PHAM — Email pattern 3112021",
  walletAddress: "0x75be0d3Bd905ecF6188F26B430cE6483d3905278",
  severity: "critical",
  note: "3 tài khoản email prefix 'pham', suffix trùng '3112021'. Pending rút tổng ~989,000 Camly",
  members: [
    {
      userId: "4986011b-6669-4374-aa50-ef67710e33aa",
      name: "Trung Kiên",
      email: "phamminhquan2782016@gmail.com",
      balance: 1386039,
      lifetimeEarned: 2609201,
      pendingMint: 61,
      pendingWithdrawal: 500000,
    },
    {
      userId: "266f8c06-df49-47df-ae3e-0dbef1d17c59",
      name: "Minh kiên",
      email: "phamlong3112021@gmail.com",
      balance: 1549300,
      lifetimeEarned: 2382324,
      pendingMint: 103,
      pendingWithdrawal: 209065,
    },
    {
      userId: "1eeb2750-272b-49c3-8b13-1894b12f7cf7",
      name: "Kim Xuyen",
      email: "phamminhlong3112021@gmail.com",
      balance: 1552074,
      lifetimeEarned: 2386921,
      pendingMint: 93,
      pendingWithdrawal: 280000,
    },
  ],
},
```

**3. Cập nhật `ALL_SYBIL_USER_IDS`** để bao gồm 3 userId mới của nhóm PHAM (tự động vì dùng `flatMap`).

**4. Cập nhật summary stats** ở đầu tab — tổng 19 tài khoản thay vì 14.

---

## Tóm tắt tác động

| Hạng mục | Trước | Sau |
|----------|-------|-----|
| Số nhóm sybil | 4 | 5 |
| Tổng tài khoản trong danh sách | 14 | 16 (thêm 3 PHAM, trừ 1 Trần Nhung trùng) |
| Tổng pending rút cần chặn | ~1.7M | ~3.2M Camly |
| Tổng pending mint cần reject | ~549 | ~733 requests |

Không cần thay đổi database, không cần thêm migration — chỉ cập nhật dữ liệu hardcode trong file `src/pages/AdminFraudAlerts.tsx`.
