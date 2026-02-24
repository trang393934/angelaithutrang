

## Don gian hoa nut Chia se thanh Popover nho (giong fun.rich)

### Hien trang

Hien tai khi bam "Chia se" tren PostCard, he thong mo **ShareDialog** (modal lon) voi nhieu tab, nut mang xa hoi, FUN Ecosystem links. Theo hinh mau tu fun.rich, nguoi dung muon nut "Chia se" chi hien **popover nho** voi 2 lua chon:

1. **Chia se len trang ca nhan** → mo ShareDialog day du (giu nguyen noi dung chia se mang xa hoi)
2. **Sao chep lien ket** → copy link bai viet vao clipboard

### Thay doi

#### File: `src/components/community/PostCard.tsx`

1. **Import them** `Popover, PopoverContent, PopoverTrigger` tu `@/components/ui/popover` va `Copy, Link` tu lucide-react (dong 1-4)

2. **Thay the nut Share hien tai** (dong 580-594): Thay vi `onClick={handleShareClick}` mo thang ShareDialog, boc nut trong `Popover` hien 2 muc:
   - "Chia se len trang ca nhan" → goi `setShowShareDialog(true)` (mo ShareDialog day du voi mang xa hoi)
   - "Sao chep lien ket" → copy URL bai viet (`getPostPath`) vao clipboard, hien toast "Da sao chep lien ket!"

3. **Giu nguyen ShareDialog** (dong 816-827) — khong thay doi gi, van hoat dong khi chon "Chia se len trang ca nhan"

4. **Them ham `handleCopyPostLink`**: Tao URL bai viet bang `getPostPath(post.id, post.slug, post.user_handle)`, ghep voi domain `https://angel.fun.rich`, copy vao clipboard

### Giao dien Popover

```text
┌──────────────────────────┐
│ 📤 Chia sẻ lên trang     │
│    cá nhân                │
│──────────────────────────│
│ 🔗 Sao chép liên kết     │
└──────────────────────────┘
```

- Popover xuat hien ngay phia tren nut "Chia se"
- 2 muc don gian, font nho, nhe ngang
- Click ngoai popover → dong

### Tom tat

| Thay doi | File | Muc dich |
|---|---|---|
| Boc nut Share trong Popover | `PostCard.tsx` | Hien menu nho 2 muc thay vi mo dialog ngay |
| Them ham copy link | `PostCard.tsx` | Sao chep URL bai viet vao clipboard |
| Giu nguyen ShareDialog | `PostCard.tsx` | Van co day du chia se mang xa hoi khi chon "Chia se len trang ca nhan" |

- **1 file thay doi**: `PostCard.tsx`
- **0 file moi**
- **0 thay doi database**

