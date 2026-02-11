

## Mo Cong Tat Ca Cac Trang Cho Khach Xem Tu Do

### Tong Quan

Hien tai nhieu trang (Earn, Vision, Mint, Ideas, Bounty, Chat, Messages) dang chan khach bang man hinh "Dang nhap ngay" khi chua dang nhap. Thay doi nay se:

1. **Mo tat ca trang cho khach doc tu do** -- khong con man hinh chan
2. **Chi yeu cau dang ky khi tuong tac** (dang bai, binh luan, like, gui tin, tao board...)
3. **Chat**: cho phep 5 luot chat, sau do hien popup dac biet
4. **Popup dang ky** voi thong diep: "VUI LONG DANG KY DE DUOC CHOI, DUOC HOC, DUOC VOC, DUOC LI XI 🧧"

### Chi Tiet Ky Thuat

#### Buoc 1: Tao component `SignupPromptDialog`

Tao file `src/components/SignupPromptDialog.tsx` -- dialog popup chinh giua voi thong diep:

"VUI LONG DANG KY DE DUOC CHOI, DUOC HOC, DUOC VOC, DUOC LI XI 🧧"

Su dung Dialog cua Radix UI, hien thi khi khach co gang tuong tac hoac sau 5 tin nhan chat.

#### Buoc 2: Xoa man hinh chan khach tai 7 trang

Cac trang sau dang co block `if (!user) { return <...login wall...> }` can xoa:

| Trang | Thay doi |
|---|---|
| `src/pages/Earn.tsx` (dong 65-89) | Xoa block `if (!user)`, cho khach xem toan bo noi dung. Boc cac nut tuong tac bang `AuthActionGuard` |
| `src/pages/Vision.tsx` (dong 53-81) | Xoa block `if (!user)`, boc nut "Tao Vision Board" bang `AuthActionGuard` |
| `src/pages/Mint.tsx` (dong 19-43) | Xoa block `if (!user)`, boc nut mint bang `AuthActionGuard` |
| `src/pages/Ideas.tsx` (dong 156-188) | Xoa block `if (!user)`, boc form gop y bang `AuthActionGuard` |
| `src/pages/Bounty.tsx` (dong 184-208) | Xoa block `if (!user)`, boc nut submit bang `AuthActionGuard` |
| `src/pages/ContentWriter.tsx` | Thay toast error thanh `SignupPromptDialog` khi generate |
| `src/pages/Chat.tsx` (dong 744-754) | Cho khach chat 5 luot (dung localStorage nhu ChatDemoWidget), sau do hien `SignupPromptDialog` |

#### Buoc 3: Cap nhat Chat.tsx cho khach chat 5 luot

- Them state dem so tin nhan cua khach (localStorage key `angel_ai_guest_chat_count`)
- Trong `handleSubmit`: neu `!user`, dem so luot. Neu < 5, cho gui binh thuong. Neu >= 5, hien `SignupPromptDialog`
- Khach van xem duoc lich su chat hien tai, chi bi chan khi gui tin nhan thu 6

#### Buoc 4: Cap nhat Messages va ActivityHistory

| Trang | Thay doi |
|---|---|
| `src/pages/Messages.tsx` | Xoa `LightGate`, cho khach vao xem giao dien nhung boc cac hanh dong nhan tin bang `AuthActionGuard` |
| `src/App.tsx` | Xoa `ProfileCompletionGate` boc `Messages` va `ActivityHistory` -- de khach vao xem |

#### Buoc 5: Cap nhat AuthActionGuard

Thay doi noi dung popup mac dinh cua `AuthActionGuard` thanh thong diep moi:

"VUI LONG DANG KY DE DUOC CHOI, DUOC HOC, DUOC VOC, DUOC LI XI 🧧"

Thay doi trong `DialogTitle` va `DialogDescription` de su dung thong diep nay.

### Danh Sach Cac File Can Sua

| # | File | Mo ta |
|---|---|---|
| 1 | `src/components/SignupPromptDialog.tsx` | **Tao moi** -- popup dang ky chinh giua |
| 2 | `src/components/AuthActionGuard.tsx` | Cap nhat thong diep mac dinh |
| 3 | `src/pages/Earn.tsx` | Xoa login wall, boc tuong tac AuthActionGuard |
| 4 | `src/pages/Vision.tsx` | Xoa login wall, boc tuong tac AuthActionGuard |
| 5 | `src/pages/Mint.tsx` | Xoa login wall, boc tuong tac AuthActionGuard |
| 6 | `src/pages/Ideas.tsx` | Xoa login wall, boc tuong tac AuthActionGuard |
| 7 | `src/pages/Bounty.tsx` | Xoa login wall, boc tuong tac AuthActionGuard |
| 8 | `src/pages/ContentWriter.tsx` | Thay toast thanh popup |
| 9 | `src/pages/Chat.tsx` | Them logic 5 luot chat cho khach |
| 10 | `src/pages/Messages.tsx` | Xoa LightGate |
| 11 | `src/App.tsx` | Xoa ProfileCompletionGate boc Messages/ActivityHistory |

### Luu Y

- Cac trang Admin van giu nguyen bao mat (redirect ve /admin/login)
- Cac trang docs, community, knowledge, profile cong khai da san sang -- khong can thay doi
- Fallback: neu khach co gang thuc hien hanh dong yeu cau auth, popup se hien ngay lap tuc
- Khong thay doi RLS hay database -- chi thay doi UI/UX

