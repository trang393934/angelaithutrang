
# Kế hoạch: Thông báo chúc mừng rút Camly Coin thành công

## Tổng quan
Tạo hệ thống thông báo vui nhộn với hiệu ứng hình ảnh và âm thanh "rich..rich..rich" khi user nhận Camly Coin thành công về ví BSC, áp dụng cho **2 trường hợp**:

1. **User đang online**: Khi admin duyệt và tiền về ví ngay lúc user đang sử dụng app
2. **User đăng nhập lại**: Khi tiền đã về ví trước đó (user offline) và user đăng nhập lại

## Phân biệt rõ ràng

| Loại phần thưởng | Hiệu ứng |
|------------------|----------|
| Hỏi đáp với Angel | Toast notification (giữ nguyên) |
| Viết nhật ký | Toast notification (giữ nguyên) |
| Đăng nhập hàng ngày | Toast notification (giữ nguyên) |
| Cộng đồng (post/comment) | Toast notification (giữ nguyên) |
| **Rút coin về ví thành công** | **Celebration popup + âm thanh "rich..rich..rich"** |

## Kiến trúc giải pháp

```text
+------------------------------------------+
|              TRƯỜNG HỢP 1                |
|         (User đang online)               |
+------------------------------------------+
|   Supabase Realtime                      |
|   (coin_withdrawals UPDATE)              |
|   status: processing -> completed        |
+-------------------+----------------------+
                    |
                    v
+-------------------+----------------------+
|      useWithdrawalNotify Hook            |
|   - Lắng nghe UPDATE event               |
|   - Filter: user_id = current user       |
|   - Filter: NEW.status = 'completed'     |
|   - Trigger celebration ngay lập tức     |
+-------------------+----------------------+
                    |
                    v
+-------------------+----------------------+
|    WithdrawalCelebration Component       |
|   - Popup chúc mừng                      |
|   - Hiệu ứng pháo giấy + đồng xu rơi     |
|   - Âm thanh "rich rich rich"            |
|   - Cập nhật celebrated_at sau khi đóng  |
+------------------------------------------+


+------------------------------------------+
|              TRƯỜNG HỢP 2                |
|      (User đăng nhập lại sau đó)         |
+------------------------------------------+
|   Khi user đăng nhập thành công          |
|   (onAuthStateChange event)              |
+-------------------+----------------------+
                    |
                    v
+-------------------+----------------------+
|      useWithdrawalNotify Hook            |
|   - Query: coin_withdrawals              |
|   - Filter: user_id = current user       |
|   - Filter: status = 'completed'         |
|   - Filter: celebrated_at IS NULL        |
|   - Trigger celebration nếu tìm thấy     |
+-------------------+----------------------+
                    |
                    v
+-------------------+----------------------+
|    WithdrawalCelebration Component       |
|   - Popup chúc mừng (như trên)           |
|   - Cập nhật celebrated_at sau khi đóng  |
+------------------------------------------+
```

## Thay đổi Database

Thêm cột mới vào bảng `coin_withdrawals` để theo dõi trạng thái đã hiển thị celebration hay chưa:

```sql
-- Thêm cột celebrated_at để biết user đã xem thông báo chưa
ALTER TABLE coin_withdrawals 
ADD COLUMN celebrated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

## Chi tiết triển khai

### 1. Hook useWithdrawalNotify
**File mới**: `src/hooks/useWithdrawalNotify.ts`

Chức năng:
- **Realtime listener**: Lắng nghe Supabase Realtime trên bảng `coin_withdrawals`
  - Chỉ trigger khi có **UPDATE** với `status = 'completed'`
  - Lọc theo `user_id` của người dùng đang đăng nhập
- **Login check**: Khi user đăng nhập (hoặc component mount)
  - Query tìm withdrawals với `status = 'completed'` AND `celebrated_at IS NULL`
  - Trigger celebration cho withdrawal đầu tiên chưa được celebrate
- **Mark as celebrated**: Sau khi user đóng popup → update `celebrated_at = now()`

### 2. Component WithdrawalCelebration
**File mới**: `src/components/WithdrawalCelebration.tsx`

Tính năng:
- **Hiệu ứng confetti/pháo giấy** - 40+ đồng xu vàng rơi từ trên xuống (Framer Motion)
- **Hiệu ứng sparkles** - Lấp lánh ngẫu nhiên (CSS animation)
- **Logo Camly Coin** quay tròn liên tục
- **Số coin đã rút** hiển thị lớn với gradient vàng rực rỡ
- **Link "Xem giao dịch"** → mở BSCScan với tx_hash
- **Âm thanh** "rich..rich..rich" tự động phát khi popup mở
- **Gradient nền** từ amber đến orange với glow effect
- **Nút "Đóng"** hoặc tự động đóng sau 8 giây
- Khi đóng → gọi callback để update `celebrated_at`

### 3. Edge Function generate-coin-sound
**File mới**: `supabase/functions/generate-coin-sound/index.ts`

- Sử dụng **ElevenLabs Sound Effects API** qua Lovable AI
- Prompt: "Joyful celebratory coin jackpot sound with cheerful upbeat voice saying rich rich rich three times, bright energetic happy triumphant tone, like winning lottery celebration"
- Duration: 2-3 giây
- Trả về audio blob để phát trên client
- Cache âm thanh trong sessionStorage để giảm API calls

### 4. Tích hợp vào App
Chỉnh sửa `src/App.tsx`:
- Thêm component `WithdrawalCelebration`
- Chỉ render khi user đã đăng nhập
- Hoạt động ở mọi trang trong ứng dụng

## Các file cần tạo/chỉnh sửa

| File | Hành động |
|------|-----------|
| `src/components/WithdrawalCelebration.tsx` | Tạo mới |
| `src/hooks/useWithdrawalNotify.ts` | Tạo mới |
| `supabase/functions/generate-coin-sound/index.ts` | Tạo mới |
| `src/App.tsx` | Chỉnh sửa - thêm component |
| `supabase/config.toml` | Chỉnh sửa - thêm function config |
| **Database migration** | Thêm cột `celebrated_at` |

## Logic chi tiết Hook useWithdrawalNotify

```text
Khởi tạo:
1. Kiểm tra user đăng nhập
2. Nếu có user:
   a. Query tìm uncelebrated withdrawals (status='completed', celebrated_at=NULL)
   b. Nếu tìm thấy → Set pendingCelebration = withdrawal đầu tiên
   c. Subscribe Supabase Realtime cho coin_withdrawals

Realtime Event (UPDATE):
1. Nhận payload.new
2. Kiểm tra:
   - user_id === current user
   - new.status === 'completed'
   - old.status !== 'completed' (để tránh trigger lặp)
3. Nếu đúng → Set pendingCelebration = new withdrawal

Khi user đóng popup:
1. Gọi supabase.from('coin_withdrawals').update({ celebrated_at: now() })
2. Clear pendingCelebration
3. Kiểm tra còn uncelebrated nào không → hiển thị tiếp nếu có

State:
- pendingCelebration: { id, amount, tx_hash, wallet_address } | null
- isPlaying: boolean
- audioUrl: string | null
```

## Luồng hoạt động chi tiết

### Trường hợp 1: User đang online

```text
1. User có withdrawal đang ở trạng thái "pending" hoặc "processing"
2. Admin vào /admin/withdrawals → nhấn "Duyệt"
3. Edge function process-withdrawal chạy:
   - Gửi CAMLY đến ví BSC của user
   - Update status = 'completed', tx_hash = '0x...'
4. Supabase Realtime gửi UPDATE event
5. Hook useWithdrawalNotify nhận event:
   - Kiểm tra user_id trùng với user đang đăng nhập
   - Kiểm tra status mới = 'completed'
6. Set pendingCelebration với thông tin withdrawal
7. Component WithdrawalCelebration hiển thị:
   - Phát âm thanh "rich..rich..rich"
   - Popup xuất hiện với hiệu ứng rực rỡ
   - Đồng xu rơi, sparkles, confetti
   - Hiển thị số coin và link BSCScan
8. User nhấn "Đóng" hoặc đợi 8 giây:
   - Gọi API update celebrated_at = now()
   - Đóng popup
```

### Trường hợp 2: User đăng nhập lại

```text
1. Admin duyệt withdrawal khi user offline
2. Status đã chuyển thành 'completed', celebrated_at = NULL
3. User mở app và đăng nhập
4. Hook useWithdrawalNotify mount:
   - Query: SELECT * FROM coin_withdrawals 
     WHERE user_id = ? AND status = 'completed' AND celebrated_at IS NULL
   - Tìm thấy 1 withdrawal chưa celebrate
5. Set pendingCelebration
6. Component WithdrawalCelebration hiển thị (như trên)
7. Sau khi đóng → update celebrated_at
```

## Component WithdrawalCelebration - Chi tiết UI

```text
+--------------------------------------------------+
|  ✕ (nút đóng góc phải)                          |
|                                                  |
|     [40+ đồng xu vàng rơi từ trên xuống]        |
|                                                  |
|           🪙 (Logo Camly quay 360°)             |
|                  (glow effect)                   |
|                                                  |
|        🎉 Chúc mừng! 🎉                         |
|                                                  |
|     Camly Coin đã về ví của bạn!                |
|                                                  |
|  +------------------------------------------+   |
|  |                                          |   |
|  |      +500,000 CAMLY                      |   |
|  |      (gradient vàng, font lớn)           |   |
|  |                                          |   |
|  +------------------------------------------+   |
|                                                  |
|     Ví: 0x02D5...9a0D                           |
|                                                  |
|     [🔗 Xem giao dịch trên BSCScan]             |
|                                                  |
|     [     Tuyệt vời!     ]  ← Button            |
|                                                  |
|     ✨ Sparkles lấp lánh xung quanh ✨          |
+--------------------------------------------------+

Âm thanh: "rich..rich..rich" (ElevenLabs SFX)
Duration popup: 8 giây hoặc khi user nhấn button
```

## Âm thanh ElevenLabs

```text
API: Sound Effects Generation
Prompt: "Joyful celebratory coin jackpot sound with cheerful 
upbeat voice saying rich rich rich three times, bright energetic 
happy triumphant tone, like winning lottery celebration, 
casino jackpot bells and coins falling"

Duration: 2-3 giây
Format: MP3
Cache: sessionStorage để không gọi API lặp lại
```

## Lưu ý bảo mật và hiệu năng

- **RLS Policy**: Cột `celebrated_at` chỉ có thể được update bởi chính user sở hữu withdrawal đó (đã có policy "Users can view their own withdrawals")
- **Cần thêm UPDATE policy**: Cho phép user update `celebrated_at` của withdrawal của mình
- **Audio caching**: Lưu audio vào sessionStorage sau lần đầu generate để tái sử dụng
- **Celebration chỉ hiện 1 lần**: Sau khi `celebrated_at` được set, sẽ không hiện lại
- **Không ảnh hưởng admin**: Admin không nhận celebration (hook chỉ chạy cho user thường)

## Database Migration SQL

```sql
-- Thêm cột celebrated_at
ALTER TABLE coin_withdrawals 
ADD COLUMN celebrated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Thêm RLS policy cho user update celebrated_at
CREATE POLICY "Users can update celebrated_at on their withdrawals" 
ON coin_withdrawals FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
