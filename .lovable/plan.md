
# Sua Loi So Lieu FUN Money Stats - Vuot Gioi Han 1,000 Dong Supabase

## Nguyen Nhan Goc

Code hien tai goi `supabase.from("pplp_actions").select(...)` **KHONG co `.range()` hoac pagination**, nen Supabase chi tra ve **toi da 1,000 dong** (gioi han mac dinh). Voi **3,967 actions** trong database, dashboard chi hien thi ~25% du lieu.

## So Lieu Thuc Te Tu Database

| Chi so | Gia tri thuc | Dashboard hien thi (SAI) |
|--------|-------------|-------------------------|
| Tong actions | 3,967 | ~1,000 (bi cat) |
| Tong scores | 3,947 | ~1,000 |
| Pass | 996 | thieu |
| Fail | 2,951 | thieu |
| Tong FUN (Pass) | 147,706 | thieu |
| Users | 178 | thieu |
| Users co pass | 125 | thieu |
| Mint Requests | 9 (6 signed, 2 expired, 1 pending) | thieu |
| Avg LS (Pass) | 84.00 | sai |

## Giai Phap

Thay doi cach fetch du lieu trong `src/pages/AdminMintStats.tsx`:

### 1. Them ham fetchAllRows - Pagination tu dong

Tao ham helper de tu dong phan trang qua tat ca du lieu, moi lan lay 1,000 dong cho den het:

```text
async function fetchAllRows(table, select, filters?) {
  let allData = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  
  while (true) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    // Apply filters...
    const { data } = await query;
    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break; // Het du lieu
    from += PAGE_SIZE;
  }
  return allData;
}
```

### 2. Ap dung cho tat ca cac truy van

- **pplp_actions**: 3,967 dong -> can 4 trang (0-999, 1000-1999, 2000-2999, 3000-3966)
- **pplp_scores**: 3,947 dong -> cung can pagination (hien tai fetch theo batch 500 nhung dua tren action IDs da bi cat)
- **profiles**: fetch theo batch actorIds (da dung, khong bi loi)
- **pplp_mint_requests**: 9 dong -> khong bi loi

### 3. Cap nhat overview stats

Sau khi fetch du day du:
- Tong FUN (Pass): 147,706
- Tong actions: 3,967
- Pass rate: 25.2% (996/3,947)
- Users du DK: 125
- Mint Requests: 9 (6 signed, 2 expired, 1 pending)
- Avg LS: 84

## File Thay Doi

| File | Noi Dung |
|------|----------|
| `src/pages/AdminMintStats.tsx` | Them pagination cho fetchData, dam bao lay het tat ca dong |

## Chi Tiet Thay Doi Trong Code

### fetchData function (dong 129-293)

1. **Thay truy van pplp_actions** (dong 136-140): Tu fetch 1 lan (bi gioi han 1000) thanh vong lap pagination voi `.range(from, to)` cho den khi het du lieu.

2. **Thay truy van pplp_scores** (dong 152-160): Tuong tu, fetch scores cung can pagination vi tong co 3,947 scores. Hien tai code batch theo actionIds (500/batch) nhung actionIds da bi cat tu buoc 1. Sau khi fix buoc 1, actionIds se day du nen batch scores cung se day du.

3. **Them truy van pplp_mint_requests** (dong 209-211): Khong can thay doi vi chi co 9 dong.

4. **Overview stats**: Se tu dong chinh xac khi du lieu day du.

### Ket qua mong doi

Sau khi fix, dashboard se hien thi chinh xac:
- 178 users trong bang
- 147,706 FUN tong
- 996 pass / 2,951 fail
- 25.2% pass rate
- 125 users du dieu kien
- Avg Light Score: 84
