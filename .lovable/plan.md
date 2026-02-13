
## Fix lỗi Lì Xì bị claim trùng lặp (Double-Claim Prevention)

### Nguyên nhân

User "Tran Phuong" nhan nut "Nhan Li Xi" 2 lan trong 3 giay. Ca 2 request deu duoc xu ly thanh cong vi backend khong kiem tra xem notification do da co claim completed chua. Ket qua: Treasury bi tru 10.000 CAMLY thay vi 5.000.

### Ke hoach sua

**1. Backend: `supabase/functions/process-lixi-claim/index.ts`**

Them kiem tra deduplication TRUOC khi xu ly:

- Sau khi lay claim detail (dong 96-107), them logic kiem tra: "Co claim nao KHAC cung notification_id va status = 'completed' khong?"
- Neu co -> tra ve loi "Da duoc xu ly" va KHONG thuc hien giao dich on-chain
- Them SELECT ... FOR UPDATE hoac check status = 'pending' de tranh race condition

Cu the:
```
// After getting claim, check for duplicate completed claims with same notification
const { data: existingCompleted } = await adminClient
  .from('lixi_claims')
  .select('id, tx_hash')
  .eq('notification_id', claim.notification_id)
  .eq('status', 'completed')
  .neq('id', claim_id)
  .limit(1);

if (existingCompleted && existingCompleted.length > 0) {
  // Mark this duplicate as rejected
  await adminClient.from('lixi_claims').update({ 
    status: 'failed', 
    error_message: 'Duplicate claim - already processed' 
  }).eq('id', claim_id);
  
  return Response with error "Already claimed via another request"
}
```

- Them kiem tra claim.status phai la 'pending' (hien tai chi check !== 'completed', nghia la 'processing' van duoc xu ly lai)

**2. Frontend: `src/components/UserLiXiCelebrationPopup.tsx`**

- Them state `isClaiming` de disable nut ngay khi user click lan dau
- Set `isClaiming = true` TRUOC khi goi API
- Disable nut khi `isClaiming === true`

**3. Xu ly du lieu sai hien tai**

Mot trong 2 claim la du thua. Can:
- Danh dau 1 claim (id: `8e7edaaa...`) la `status = 'duplicate'` hoac `failed` de ghi nhan day la giao dich trung
- Giao dich on-chain da thuc hien roi nen khong thu hoi duoc, nhung can ghi nhan de doi soat

### Database migration

Khong can thay doi schema. Chi can update du lieu sai:

```sql
UPDATE lixi_claims 
SET status = 'failed', error_message = 'Duplicate claim - same notification already processed'
WHERE id = '8e7edaaa-227b-4e88-9d4a-0aa35f6bf351';
```

### Files thay doi
1. `supabase/functions/process-lixi-claim/index.ts` - Them deduplication check
2. `src/components/UserLiXiCelebrationPopup.tsx` - Disable nut sau khi click
