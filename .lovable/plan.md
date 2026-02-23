

## Cai thien giao dien mobile tab Cong dong

### Van de hien tai
1. **Thieu thanh tim kiem tren mobile**: GlobalSearch bi an boi class `hidden sm:block` (chi hien thi tu 640px tro len)
2. **Menu ho so thieu muc**: Dropdown profile trong CommunityHeader chi co 4 muc (Trang ca nhan, Tin nhan, Kiem xu, Dang xuat), trong khi Header trang chu co nhieu muc hon (Kien thuc, Ket noi Angel, Cong dong, Viet noi dung, Swap, v.v.)
3. **Link profile chua dung handle**: Van dung UUID thay vi handle moi cap nhat

### Giai phap

**1. File `src/components/community/CommunityHeader.tsx`**

**Hien thi thanh tim kiem tren mobile:**
- Thay `hidden sm:block` thanh hien thi tren tat ca kich thuoc
- Thu nho kich thuoc tren mobile: `w-full sm:max-w-xs`
- Dat thanh tim kiem ngay canh logo, giam gap de vua man hinh nho

**Bo sung cac muc menu trong dropdown profile (giong trang chu):**
Them cac muc sau vao dropdown menu khi bam avatar:
- Trang chu (/)
- Gioi thieu (/about)
- Kien thuc (/knowledge)
- Ket noi Angel AI (/chat)
- Viet noi dung (/content-writer)
- Swap (/swap)
- Cai dat ho so (/profile)
- Admin Dashboard (neu la admin)

**Cap nhat link profile dung handle:**
- Thay `<Link to={/user/${user.id}}>` bang su dung `getProfilePath()` tu `src/lib/profileUrl.ts`
- Can fetch them truong `handle` tu profiles

### Chi tiet ky thuat

**CommunityHeader.tsx - Tim kiem mobile (dong 142-150):**
```
// TRUOC:
<div className="hidden sm:block max-w-xs">

// SAU:
<div className="flex-1 min-w-0 max-w-[200px] sm:max-w-xs">
```

**CommunityHeader.tsx - Dropdown menu (dong 211-261):**
Them cac DropdownMenuItem moi:
```
// Them sau "Trang ca nhan":
<DropdownMenuSeparator />
<DropdownMenuItem> Trang chu (/) </DropdownMenuItem>
<DropdownMenuItem> Kien thuc (/knowledge) </DropdownMenuItem>
<DropdownMenuItem> Ket noi Angel (/chat) </DropdownMenuItem>
<DropdownMenuItem> Cong dong (/community) </DropdownMenuItem>
<DropdownMenuItem> Viet noi dung (/content-writer) </DropdownMenuItem>
<DropdownMenuItem> Swap (/swap) </DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem> Cai dat (/profile) </DropdownMenuItem>
// Admin link (neu isAdmin)
<DropdownMenuSeparator />
<DropdownMenuItem> Dang xuat </DropdownMenuItem>
```

**CommunityHeader.tsx - Profile link (dong 221):**
```
// TRUOC:
<Link to={`/user/${user.id}`}>

// SAU:
import { getProfilePath } from "@/lib/profileUrl";
// Fetch handle cung voi profile
// Su dung: <Link to={getProfilePath(user.id, userProfile?.handle)}>
```

**Them fetch handle trong useEffect (dong 77-96):**
```
// Them "handle" vao select:
.select("display_name, avatar_url, handle")
```

### Ket qua
- Thanh tim kiem hien thi tren mobile
- Menu profile co day du cac muc dieu huong giong trang chu
- Bam "Trang ca nhan" se chuyen den URL dung handle (`/user/username`)
- Giao dien mobile dong bo voi desktop
