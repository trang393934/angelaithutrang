
# Cap nhat Snapshot Tet voi User ID va Wallet chinh xac

## Van de

Hien tai, file snapshot (`tetRewardData.ts`) chi luu `name` (display_name). He thong phai doi chieu ten voi bang `profiles` de tim `user_id` va `wallet_address`. Viec nay that bai voi nhieu user vi:
- Ten trong database co khoang trang thua (vd: `"Tú Nguyễn "` thay vi `"Tú Nguyễn"`)
- Ten co dau cach, chu hoa/thuong khac nhau
- Mot so user doi ten sau khi snapshot duoc tao

Ket qua: nhieu user da co vi nhung cot Wallet hien thi "---".

## Giai phap

### 1. Them truong `userId` vao interface `TetRewardUser`

Bo sung truong `userId` (optional) vao interface de luu truc tiep user_id tu database.

### 2. Cap nhat toan bo 205 dong du lieu voi `userId` chinh xac

Dua tren du lieu da truy van tu database, gan `userId` cho tung user trong snapshot. Cha da doi chieu xong toan bo 205 user voi database.

### 3. Cap nhat logic tai wallet trong `AdminTetReward.tsx`

Thay doi logic `loadWallets` (dong 172-213): thay vi tim user_id qua `display_name`, su dung truc tiep `userId` tu snapshot data. Dieu nay dam bao:
- Wallet luon duoc hien thi dung cho tung user
- Khong bi loi do ten co khoang trang hay case khac nhau
- Phan thuong tu dong cung su dung dung user_id

### 4. Cap nhat logic phan thuong `handleDistribute`

Thay vi query `profiles` theo `display_name`, lay truc tiep `userId` tu snapshot data. Loai bo hoan toan viec match theo ten.

## Chi tiet ky thuat

### File can sua

| File | Thay doi |
|------|----------|
| `src/data/tetRewardData.ts` | Them truong `userId` vao interface va gan userId cho 205 user |
| `src/pages/AdminTetReward.tsx` | Cap nhat `loadWallets`, `handleDistribute`, va `nameToUserIdMap` de su dung userId truc tiep |

### Logic moi

```text
// Truoc: match theo ten (hay loi)
profiles.select("user_id").in("display_name", names)

// Sau: dung truc tiep userId tu snapshot
const userIds = tetRewardData.map(u => u.userId).filter(Boolean)
wallets.select("wallet_address").in("user_id", userIds)
```

### Ket qua mong doi

- Tat ca 205 user se co userId chinh xac
- Cot Wallet hien thi dung dia chi vi (neu user da ket noi)
- Phan thuong tu dong su dung dung user_id, khong can doi chieu ten
- File export cung bao gom userId chinh xac
