
## Thay hình kim cương mới cho huy hiệu avatar

### Thay doi
Thay the hình kim cương cu (gold-diamond-badge.jpeg) bang hình kim cương vàng mới ma con vua upload. Hình mới da co nen trong suot san, rat dep va sang trong.

### Cac buoc thuc hien

**1. Thay the file anh**
- Copy file `user-uploads://ChatGPT_Image_07_33_50_23_thg_2_2026.png` vao `src/assets/gold-diamond-badge.png`
- Cap nhat import trong ca 3 file tu `.jpeg` sang `.png`

**2. Dieu chinh hien thi trong `src/pages/UserProfile.tsx`**
- Component `DiamondBadge`: bo vien tron (rounded-full, border) vi hinh moi da dep san, khong can khung tron nua
- Tang kich thuoc len khoang 44-48px de kim cuong hien thi ro rang
- Dieu chinh `top` de day nhon kim cuong cham vien avatar (khoang `-24` den `-26`)
- Bo `overflow-hidden` va `bg-gradient` vi hinh da co nen trong suot

**3. Ap dung tuong tu cho `src/pages/Profile.tsx`**
- Cap nhat import tu `.jpeg` sang `.png`
- Dieu chinh vi tri va kich thuoc giong nhu UserProfile

**4. Ap dung cho `src/components/public-profile/PublicProfileHeader.tsx`**
- Cap nhat import tu `.jpeg` sang `.png`
- Phan huy hieu kim cuong trong component nay da co san, chi can cap nhat tuong tu

### Chi tiet ky thuat
- 3 file can sua: `UserProfile.tsx`, `Profile.tsx`, `PublicProfileHeader.tsx`
- 1 file anh moi: `src/assets/gold-diamond-badge.png`
- Style moi cho DiamondBadge: bo khung tron, dung hinh nguyen ban voi drop-shadow vang, dinh vi top-center tren avatar
