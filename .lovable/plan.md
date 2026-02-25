

## Kế hoạch: Tự động đăng thiệp chúc mừng lên Newsfeed khi tặng thưởng Web3

### Mục tiêu
Khi hoàn thành tặng thưởng Web3 (CAMLY, FUN, BNB, USDT, BTC), hệ thống sẽ **tự động**:
1. Đăng thiệp chúc mừng lên **Newsfeed cộng đồng** (tự xóa sau 24h)
2. Hiển thị trên **trang cá nhân người tặng** như bài đăng bình thường
3. Gửi **tin nhắn tự động** cho người nhận (đã có sẵn — `autoSendDM`)
4. Gửi **thông báo tự động** cho người nhận

### Phân tích hiện trạng
- **Tin nhắn tự động**: ĐÃ CÓ — `autoSendDM` trong `GiftCoinDialog.tsx` gửi DM cho receiver
- **Thông báo**: CHƯA CÓ cho Web3 gifts (chỉ có cho internal gifts qua `process-coin-gift`)
- **Đăng Newsfeed**: CHƯA CÓ
- **Tự xóa sau 24h**: CHƯA CÓ

### Thay đổi Database

**1. Thêm cột `post_type` và `metadata` vào bảng `community_posts`** (migration)
```sql
ALTER TABLE community_posts 
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'user' NOT NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Index để query celebration posts cần xóa
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type 
  ON community_posts(post_type) WHERE post_type = 'celebration';

-- Thêm cột expires_at cho auto-delete
ALTER TABLE community_posts 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_expires 
  ON community_posts(expires_at) WHERE expires_at IS NOT NULL;
```

- `post_type`: `'user'` (bài đăng thường) | `'celebration'` (thiệp tặng thưởng)
- `metadata`: JSONB chứa thông tin gift (token, amount, tx_hash, receiver info...)
- `expires_at`: Thời điểm tự xóa (24h sau khi tạo)

**2. Tạo DB function dọn bài hết hạn**
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_posts() RETURNS void AS $$
BEGIN
  DELETE FROM community_posts WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**3. Cron job dọn bài hết hạn mỗi giờ** (SQL insert — không dùng migration)

### Thay đổi Frontend

**File: `src/components/gifts/GiftCoinDialog.tsx`**
- Trong `handleCryptoSuccess`: sau khi set celebration data và gửi DM, thêm logic:
  1. **Auto-post lên community_posts** với `post_type: 'celebration'`, `expires_at: now + 24h`, `metadata` chứa gift info
  2. **Auto-send notification** cho receiver qua bảng `notifications`

Thêm function `autoPostCelebration`:
```typescript
const autoPostCelebration = async (celData: CelebrationData) => {
  // Tạo nội dung bài đăng celebration
  const tokenLabel = ...;
  const content = `🎁 ${celData.sender_name} đã tặng ${celData.amount.toLocaleString()} ${tokenLabel} cho ${celData.receiver_name}! ✨\n${celData.message ? `💬 "${celData.message}"` : ""}\n🌟 Cùng chung tay xây dựng cộng đồng yêu thương!`;
  
  // Insert vào community_posts
  await supabase.from("community_posts").insert({
    user_id: user.id,
    content,
    post_type: 'celebration',
    expires_at: new Date(Date.now() + 24*60*60*1000).toISOString(),
    metadata: {
      gift_type: 'web3',
      token_type: celData.tokenType,
      token_symbol: tokenLabel,
      amount: celData.amount,
      receiver_id: celData.receiver_id,
      receiver_name: celData.receiver_name,
      tx_hash: celData.tx_hash,
      receipt_public_id: celData.receipt_public_id,
    },
    slug: `celebration-${Date.now()}`,
  });
};
```

Thêm function `autoSendNotification`:
```typescript
const autoSendNotification = async (celData: CelebrationData) => {
  // Gửi notification cho receiver
  await supabase.from("notifications").insert({
    user_id: celData.receiver_id,
    type: 'gift_received',
    title: '🎁 Bạn nhận được quà!',
    content: `đã tặng bạn ${celData.amount.toLocaleString()} ${tokenLabel} on-chain`,
    actor_id: user.id,
    reference_type: 'gift',
    metadata: {
      amount: celData.amount,
      token_type: celData.tokenType,
      tx_hash: celData.tx_hash,
    },
  });
};
```

**File: `src/components/community/PostCard.tsx`**
- Thêm UI đặc biệt cho bài đăng `post_type === 'celebration'`:
  - Badge "🎁 Thiệp Tặng Thưởng" với style golden
  - Hiển thị countdown "Tự động xóa sau X giờ"
  - Hiển thị thông tin token + amount nổi bật

**File: `src/hooks/useCommunityPosts.ts`**
- Cập nhật query để bao gồm cả `post_type` và `metadata` trong kết quả

### Tóm tắt

| # | File/Resource | Thay đổi |
|---|---|---|
| 1 | Database migration | Thêm 3 cột: `post_type`, `metadata`, `expires_at` vào `community_posts` |
| 2 | Database function | Tạo `cleanup_expired_posts()` |
| 3 | Cron job (SQL insert) | Chạy cleanup mỗi giờ |
| 4 | `GiftCoinDialog.tsx` | Thêm `autoPostCelebration` + `autoSendNotification` trong `handleCryptoSuccess` |
| 5 | `PostCard.tsx` | Thêm UI celebration card với badge golden + countdown |
| 6 | `useCommunityPosts.ts` | Thêm `post_type`, `metadata`, `expires_at` vào select query |

- **1 migration**
- **1 cron job**
- **3 file sửa**
- **0 file mới**

