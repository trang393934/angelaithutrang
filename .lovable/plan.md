

## Fix: Loai bo ky hieu Markdown trong cau tra loi Angel AI (giu numbered lists)

### Van de
Angel AI tra ve noi dung chua ky hieu Markdown nhu `**bold**`, `##`, backticks. Giao dien Chat chi render plain text nen cac ky hieu nay hien thi tho, kho doc.

### Giai phap: 2 lop bao ve

**Lop 1 - Backend: Cap nhat system prompt**
File: `supabase/functions/angel-chat/index.ts`

Cap nhat FORMATTING RULES trong `BASE_SYSTEM_PROMPT`:
- Cam triet de: `**`, `*`, `##`, `###`, backticks, `>`, `---`
- GIU NGUYEN so thu tu dang `1. noi dung`, `2. noi dung` (numbered lists binh thuong, KHONG kem `**bold**`)
- Khi can nhan manh, dung ngon tu manh me thay vi ky hieu
- Viet van xuoi tu nhien, mach lac

**Lop 2 - Frontend: Tao ham stripMarkdown()**
File moi: `src/lib/stripMarkdown.ts`

Ham xu ly:
- Loai bo `**` va `*` (bold/italic markers)
- Loai bo `##`, `###` (heading markers)
- Loai bo backticks va code blocks
- Loai bo `>` blockquote, `---` horizontal rule
- GIU NGUYEN numbered lists (`1. `, `2. `, ...)
- GIU NGUYEN noi dung van ban

Ap dung tai:
- `src/pages/Chat.tsx` - noi dung assistant message
- `src/pages/AdminActivityHistory.tsx` - phan xem chi tiet answer

### Files thay doi
1. `supabase/functions/angel-chat/index.ts` - Cap nhat FORMATTING RULES
2. `src/lib/stripMarkdown.ts` - Tao utility function moi
3. `src/pages/Chat.tsx` - Ap dung stripMarkdown cho assistant content
4. `src/pages/AdminActivityHistory.tsx` - Ap dung stripMarkdown cho view dialog

