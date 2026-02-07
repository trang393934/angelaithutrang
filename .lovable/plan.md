

# Thay Doi Logic Dang Nhap - Mo Cua Cho Tat Ca Truy Cap

## Muc Tieu
Tat ca moi nguoi deu co the xem noi dung cac trang cua Angel AI ma khong can dang nhap. Chi khi thuc hien cac hanh dong can tai khoan (mint FUN Money, nhan thuong Camly Coin, dang bai, chat, gui tin nhan, v.v.) thi moi yeu cau dang ky/dang nhap.

## Thay Doi Chinh

### 1. Xoa tat ca Gate khoi routing (App.tsx)
Hien tai cac trang nhu `/chat`, `/community`, `/earn`, `/vision`, `/ideas`, `/bounty`, `/content-writer`, `/messages`, `/activity-history`, `/mint`, `/community-questions` deu bi boc boi `ProfileCompletionGate`, chan nguoi dung chua dang nhap.

**Thay doi:** Xoa `ProfileCompletionGate` boc quanh tat ca cac route nay de moi nguoi deu co the truy cap xem noi dung.

### 2. Tao component `AuthActionGuard` moi
Tao mot component moi de bao ve cac **hanh dong** (khong phai trang) can dang nhap. Component nay se:
- Hien thi popup/dialog yeu cau dang nhap khi user chua dang nhap nhan vao nut hanh dong
- Hien thi popup yeu cau dong y Luat Anh Sang neu chua dong y
- Hien thi popup yeu cau hoan thien ho so neu chua day du
- Neu da hoan tat tat ca, cho phep thuc hien hanh dong

### 3. Cap nhat tung trang de bao ve hanh dong thay vi bao ve ca trang

**Chat (`/chat`):**
- Cho xem giao dien chat (co the xem lich su cau hoi cong dong)
- Yeu cau dang nhap khi gui tin nhan

**Community (`/community`):**
- Cho xem tat ca bai dang, binh luan, leaderboard
- Yeu cau dang nhap khi: dang bai, binh luan, like, chia se, tang thuong

**Earn (`/earn`):**
- Cho xem thong tin cach kiem Camly Coin
- Yeu cau dang nhap khi nhan thuong, dang nhap hang ngay

**Vision (`/vision`):**
- Cho xem vision board cong khai
- Yeu cau dang nhap khi tao vision board moi

**Ideas (`/ideas`):**
- Cho xem danh sach y tuong
- Yeu cau dang nhap khi gui y tuong, vote

**Bounty (`/bounty`):**
- Cho xem danh sach nhiem vu
- Yeu cau dang nhap khi nop bai

**Mint (`/mint`):**
- Cho xem thong tin ve FUN Money (da co san phan nay)
- Yeu cau dang nhap de mint (da co san phan nay)

**Messages (`/messages`):**
- Yeu cau dang nhap vi day la tin nhan ca nhan

**Content Writer (`/content-writer`):**
- Cho xem giao dien
- Yeu cau dang nhap khi tao noi dung

**Activity History (`/activity-history`):**
- Yeu cau dang nhap vi day la lich su ca nhan

**Community Questions (`/community-questions`):**
- Cho xem cau hoi
- Yeu cau dang nhap khi like, tra loi

### 4. Cac trang giu nguyen yeu cau dang nhap
- `/messages` va `/activity-history` van can dang nhap vi la du lieu ca nhan
- Cac trang admin giu nguyen

---

## Chi Tiet Ky Thuat

### File moi:
- `src/components/AuthActionGuard.tsx` - Component popup yeu cau dang nhap khi thuc hien hanh dong

### File chinh sua:
- `src/App.tsx` - Xoa `ProfileCompletionGate` khoi cac route (tru `/messages`, `/activity-history`)
- `src/pages/Chat.tsx` - Hien thi giao dien doc-only cho khach, yeu cau dang nhap khi gui tin
- `src/pages/Community.tsx` - Xoa gate, them kiem tra dang nhap cho tung hanh dong (post, like, comment, share)
- `src/pages/Earn.tsx` - Hien thi thong tin cho khach, kiem tra dang nhap cho hanh dong nhan thuong
- `src/pages/Vision.tsx` - Hien thi board cong khai, kiem tra dang nhap khi tao
- `src/pages/Ideas.tsx` - Hien thi y tuong, kiem tra dang nhap khi gui/vote
- `src/pages/Bounty.tsx` - Hien thi nhiem vu, kiem tra dang nhap khi nop
- `src/pages/ContentWriter.tsx` - Hien thi giao dien, kiem tra dang nhap khi tao
- `src/pages/CommunityQuestions.tsx` - Hien thi cau hoi, kiem tra dang nhap khi tuong tac
- `src/pages/Mint.tsx` - Xoa `LightGate` boc, giu lai phan hien thi thong tin cho khach (da co san)

### Logic cua AuthActionGuard:
```text
+------------------------------+
|   User click hanh dong       |
+------------------------------+
           |
           v
+------------------------------+
|   Kiem tra da dang nhap?     |
+------------------------------+
     |              |
   Chua           Da dang nhap
     |              |
     v              v
+-----------+  +------------------+
| Hien thi  |  | Da dong y Luat   |
| Dialog    |  | Anh Sang?        |
| Dang nhap |  +------------------+
+-----------+     |          |
                 Chua       Da
                  |          |
                  v          v
            +-----------+  Thuc hien
            | Chuyen    |  hanh dong
            | den /auth |
            +-----------+
```

### Cach xu ly tren tung trang:
- Moi trang se tu xu ly viec kiem tra `user` tu `useAuth()` truoc khi thuc hien hanh dong
- Neu `!user`, hien toast thong bao "Vui long dang nhap" kem nut chuyen den `/auth`
- Giao dien trang van hien thi binh thuong cho khach (read-only mode)
