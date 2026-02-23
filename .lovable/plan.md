
## Cap nhat URL ho so ca nhan thanh `/user/username`

### Muc tieu
Khi user truy cap ho so ca nhan, URL se hien thi `angel.fun.rich/user/angelanhnguyet` (handle) thay vi `angel.fun.rich/user/d8721926-ad98-...` (UUID).

### Cach tiep can

Thay vi sua tat ca 23+ file chua link `/user/userId`, su dung phuong phap thong minh hon:

**1. File `src/pages/UserProfile.tsx`** - Thay doi chinh:
- Doi ten param tu `userId` thanh `identifier` (co the la UUID hoac handle)
- Them logic phat hien: neu `identifier` la UUID → fetch binh thuong; neu la handle → tim user_id tu bang `profiles`
- Sau khi load profile, neu URL dang la UUID va user co handle → tu dong doi URL thanh `/user/handle` bang `navigate(replace: true)` (khong reload trang)

**2. File `src/App.tsx`** - Thay doi route:
- Giu nguyen route `/user/:userId` (khong can doi ten param vi chi dung noi bo)

**3. Tao helper function** `src/lib/profileUrl.ts`:
- Ham `getProfilePath(userId, handle?)` tra ve `/user/{handle}` neu co handle, nguoc lai `/user/{userId}`
- Dan dan cap nhat cac file link quan trong nhat (PostCard, GlobalSearch, community components) de su dung helper nay

**4. Cap nhat cac file link chinh** (uu tien cac noi user thuong thay):
- `src/components/community/PostCard.tsx` - link tren bai viet
- `src/components/GlobalSearch.tsx` - ket qua tim kiem  
- `src/components/community/SuggestedFriendsCard.tsx` - goi y ban be
- `src/components/community/FriendSearchModal.tsx` - tim ban
- `src/pages/Profile.tsx` - link "Angel AI Profile"
- `src/components/profile/HandleSelector.tsx` - link handle
- `src/components/public-profile/PublicProfileFriends.tsx` - danh sach ban be (da dung handle)

### Chi tiet ky thuat

**UserProfile.tsx** - Logic phat hien UUID vs handle:
```
const { userId: identifier } = useParams();
const isUUID = /^[0-9a-f]{8}-/.test(identifier);

// Neu la handle → query profiles by handle de lay user_id
// Neu la UUID → su dung truc tiep

// Sau khi load xong, neu URL la UUID va profile co handle:
useEffect(() => {
  if (isUUID && profile?.handle) {
    navigate(`/user/${profile.handle}`, { replace: true });
  }
}, [profile?.handle]);
```

**profileUrl.ts** - Helper:
```
export function getProfilePath(userId: string, handle?: string | null) {
  return handle ? `/user/${handle}` : `/user/${userId}`;
}
```

### Ket qua
- URL hien thi dep: `angel.fun.rich/user/angelanhnguyet`
- Tuong thich nguoc: link cu voi UUID van hoat dong (tu dong chuyen sang handle)
- Khong bi loi khi user chua co handle (giu UUID)
