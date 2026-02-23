

## Cap nhat dropdown avatar trong CommunityHeader giong trang chu

### Thay doi

**File: `src/components/community/CommunityHeader.tsx`**

Thay doi dropdown menu khi bam vao avatar de giong voi trang chu (Header.tsx):

1. **User Info Header thanh link den trang ca nhan**: Thay `<div>` thanh `<Link to={getProfilePath(...)}>` voi ten hien thi + email, bam vao se den trang ca nhan (giong Header dong 251-254)

2. **Them Admin Dashboard**: Them muc "Admin Dashboard" voi icon Shield mau tim, chi hien thi khi `isAdmin === true` (giong Header dong 256-266)

3. **Don gian hoa menu**: Loai bo cac muc dieu huong trung lap (Home, Knowledge, Chat, Content Writer, Swap, Settings, Messages, Earn) - chi giu lai: User Info (link profile) + Admin Dashboard (neu admin) + Dang xuat

4. **Them `isAdmin` tu useAuth**: Thay `const { user, signOut } = useAuth()` thanh `const { user, signOut, isAdmin } = useAuth()`

### Chi tiet ky thuat

Dropdown menu moi se co cau truc:
```
- [Link to profile] Ten nguoi dung / Email
- [Separator]
- [Admin Dashboard] (chi hien khi isAdmin)
- [Separator]
- [Dang xuat]
```

Giong het cau truc dropdown cua Header.tsx (dong 249-278).

