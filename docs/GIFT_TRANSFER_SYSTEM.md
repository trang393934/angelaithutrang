# 🎁 Hệ Thống Chuyển & Nhận Tiền P2P - Angel AI

## Tổng Quan Kiến Trúc

Hệ thống hỗ trợ chuyển/nhận tiền đa loại token (Camly Coin nội bộ, CAMLY Web3, FUN Money, USDT, USDC, BNB) giữa các user với đầy đủ tính năng tìm kiếm user (tên, avatar, ví), xác minh người nhận, lưu lịch sử giao dịch và hiệu ứng ăn mừng.

---

## 📁 Cấu Trúc File

```
src/
├── hooks/
│   ├── useCoinGifts.ts          # Logic tặng Camly Coin nội bộ + leaderboard
│   ├── useGiftStats.ts          # Thống kê tặng/nhận cho profile
│   ├── useWeb3Transfer.ts       # Logic chuyển token Web3 (BSC Mainnet/Testnet)
│   ├── useCamlyCoin.ts          # Quản lý số dư Camly Coin
│   └── useAuth.tsx              # Xác thực người dùng
├── components/
│   ├── gifts/
│   │   ├── GiftCoinDialog.tsx       # Dialog tặng coin chính (6 loại token)
│   │   ├── CryptoTransferTab.tsx    # Tab chuyển crypto (tìm user + nhập ví)
│   │   ├── TokenSelector.tsx        # Dropdown chọn token
│   │   ├── TipCelebrationReceipt.tsx # Biên nhận ăn mừng (confetti + pháo hoa)
│   │   └── DonateProjectDialog.tsx  # Dialog donate cho dự án
│   ├── community/
│   │   ├── GiftTransactionHistory.tsx   # Lịch sử thưởng/tặng (sidebar)
│   │   ├── GiftHonorBoard.tsx           # Bảng vinh danh người tặng/nhận
│   │   ├── DonationHonorBoard.tsx       # Bảng vinh danh nhà tài trợ
│   │   └── Web3TransactionHistory.tsx   # Lịch sử giao dịch Web3 on-chain
│   ├── profile/
│   │   └── TransactionHistorySection.tsx # Lịch sử giao dịch cá nhân (đầy đủ)
│   └── public-profile/
│       └── GiftStatsBadges.tsx          # Badge thống kê trên hồ sơ công khai
├── contexts/
│   └── Web3WalletContext.tsx     # Context quản lý ví Web3
├── lib/
│   └── funMoneyABI.ts           # ABI hợp đồng FUN Money
└── integrations/supabase/
    └── client.ts                # Supabase client

supabase/functions/
└── process-coin-gift/index.ts   # Edge Function xử lý tặng coin (server-side)
```

---

## 🗄️ Database Schema (Supabase)

### Bảng `coin_gifts`
```sql
CREATE TABLE public.coin_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gift_type TEXT DEFAULT 'internal',        -- 'internal' | 'web3' | 'web3_CAMLY' | 'web3_FUN' | 'web3_USDT' | 'web3_USDC' | 'web3_BNB'
  tx_hash TEXT,                              -- TX hash cho giao dịch on-chain
  receipt_public_id TEXT,                     -- ID công khai cho biên nhận
  context_type TEXT DEFAULT 'global',        -- 'global' | 'post' | 'comment' | 'dm'
  context_id TEXT                             -- ID của đối tượng liên quan
);
```

### Bảng `project_donations`
```sql
CREATE TABLE public.project_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  donation_type TEXT DEFAULT 'internal',     -- 'internal' | 'manual' | 'web3'
  tx_hash TEXT,
  status TEXT DEFAULT 'confirmed'
);
```

### Bảng `camly_coin_balances`
```sql
CREATE TABLE public.camly_coin_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance BIGINT DEFAULT 0,
  lifetime_earned BIGINT DEFAULT 0,
  lifetime_spent BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Bảng `camly_coin_transactions`
```sql
CREATE TABLE public.camly_coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  transaction_type coin_transaction_type NOT NULL,
  description TEXT,
  purity_score NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enum
CREATE TYPE coin_transaction_type AS ENUM (
  'chat_reward', 'journal_reward', 'post_reward', 'comment_reward',
  'share_reward', 'daily_login', 'early_adopter', 'admin_adjustment',
  'gift_sent', 'gift_received', 'spending', 'help_reward',
  'idea_reward', 'feedback_reward', 'knowledge_reward', 'bounty_reward',
  'referral_reward'
);
```

### Bảng `user_wallet_addresses`
```sql
CREATE TABLE public.user_wallet_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Bảng `coin_withdrawals`
```sql
CREATE TABLE public.coin_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',        -- 'pending' | 'processing' | 'completed' | 'failed'
  tx_hash TEXT,
  admin_notes TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  celebrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Bảng `profiles`
```sql
CREATE TABLE public.profiles (
  user_id UUID NOT NULL PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  -- ... các cột khác
);
```

---

## 🔗 Luồng Hoạt Động

### 1. Tặng Camly Coin Nội Bộ
```
User A → GiftCoinDialog → Tìm User B → Nhập số lượng → 
→ Edge Function (process-coin-gift) → Trừ số dư A, Cộng số dư B →
→ Ghi giao dịch → Gửi thông báo → Hiện TipCelebrationReceipt
```

### 2. Chuyển Crypto Web3
```
User A → GiftCoinDialog → Chọn Token (CAMLY/FUN/USDT/USDC/BNB) →
→ Tìm User B hoặc Nhập ví → CryptoTransferTab → 
→ Xác minh người nhận (wallet lookup) → MetaMask → On-chain TX →
→ Lưu coin_gifts (tx_hash) → Hiện TipCelebrationReceipt
```

### 3. Xác Minh Người Nhận (Wallet Lookup)
```
Nhập địa chỉ ví 0x... → Tìm trong user_wallet_addresses →
→ (Fallback) Tìm trong coin_withdrawals →
→ Hiển thị avatar + tên chủ ví
```

---

## 📋 Chi Tiết Từng File

---

### `src/hooks/useCoinGifts.ts` (300 dòng)

**Chức năng:** Quản lý tặng Camly Coin nội bộ + bảng xếp hạng người tặng/nhận/donate

**Exports:**
```typescript
interface TopGiver { user_id: string; display_name: string | null; avatar_url: string | null; total_given: number; }
interface TopReceiver { user_id: string; display_name: string | null; avatar_url: string | null; total_received: number; }
interface TopDonor { user_id: string; display_name: string | null; avatar_url: string | null; total_donated: number; }

function useCoinGifts(): {
  isLoading: boolean;
  topGivers: TopGiver[];      // Top 5 người tặng
  topReceivers: TopReceiver[]; // Top 5 người nhận
  topDonors: TopDonor[];       // Top 10 nhà tài trợ
  allGivers: TopGiver[];       // Tất cả người tặng (sorted)
  allReceivers: TopReceiver[]; // Tất cả người nhận (sorted)
  allDonors: TopDonor[];       // Tất cả nhà tài trợ (sorted)
  totalGifted: number;         // Tổng coin đã tặng
  totalDonated: number;        // Tổng coin đã donate
  sendGift: (receiverId, amount, message?, contextType?, contextId?) => Promise<{success, message, data?}>;
  donateToProject: (amount, message?) => Promise<{success, message}>;
  refreshLeaderboards: () => Promise<void>;
}
```

**Tính năng chính:**
- Gọi Edge Function `process-coin-gift` để xử lý tặng coin server-side
- Gọi Edge Function `process-project-donation` để donate
- Tự động cập nhật realtime qua Supabase channels (`coin_gifts_changes`, `project_donations_changes`)
- Tính toán leaderboard client-side từ dữ liệu `coin_gifts` và `project_donations`

---

### `src/hooks/useGiftStats.ts` (94 dòng)

**Chức năng:** Thống kê tặng/nhận cho 1 user cụ thể (dùng trên profile)

```typescript
interface GiftStatsData {
  totalGiven: number;
  totalReceived: number;
  giftsSentCount: number;
  giftsReceivedCount: number;
  isTopGiver: boolean;      // Top 10 người tặng
  isTopReceiver: boolean;   // Top 10 người nhận
  giverRank: number | null;
  receiverRank: number | null;
  isLoading: boolean;
}

function useGiftStats(userId?: string): GiftStatsData;
```

---

### `src/hooks/useWeb3Transfer.ts` (533 dòng)

**Chức năng:** Xử lý chuyển token Web3 trên BSC (Mainnet + Testnet)

**Token được hỗ trợ:**
| Token | Mạng | Địa chỉ Contract | Decimals |
|-------|------|-------------------|----------|
| CAMLY | BSC Mainnet (56) | `0x0910320181889fefde0bb1ca63962b0a8882e413` | 3 |
| FUN Money | BSC Testnet (97) | Từ `FUN_MONEY_ADDRESSES[97]` | 18 |
| USDT | BSC Mainnet (56) | `0x55d398326f99059fF775485246999027B3197955` | 18 |
| USDC | BSC Mainnet (56) | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | 18 |
| BNB | BSC Mainnet (56) | Native token | 18 |

**Exports:**
```typescript
export type TokenType = "camly" | "fun" | "usdt" | "usdc" | "bnb";
export interface TransferResult { success: boolean; txHash?: string; message: string; }
export const TREASURY_WALLET_ADDRESS = "0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D";

function useWeb3Transfer(): {
  isTransferring: boolean;
  camlyCoinBalance: string;
  funMoneyBalance: string;
  usdtBalance: string;
  usdcBalance: string;
  bnbBalance: string;
  fetchCamlyBalance: () => Promise<string>;
  fetchFunMoneyBalance: () => Promise<string>;
  fetchUsdtBalance: () => Promise<string>;
  fetchUsdcBalance: () => Promise<string>;
  fetchBnbBalance: () => Promise<string>;
  transferCamly: (to, amount) => Promise<TransferResult>;
  transferFunMoney: (to, amount) => Promise<TransferResult>;
  transferUsdt: (to, amount) => Promise<TransferResult>;
  transferUsdc: (to, amount) => Promise<TransferResult>;
  transferBnb: (to, amount) => Promise<TransferResult>;
  transferToken: (to, amount, tokenType) => Promise<TransferResult>;
  donateCamlyToProject: (amount) => Promise<TransferResult>;
  isConnected: boolean;
  address: string | undefined;
  hasWallet: boolean;
  connect: () => Promise<void>;
}
```

**Logic quan trọng:**
- `preflightCheck()`: Kiểm tra MetaMask sẵn sàng, iframe detection, tự động reconnect
- `switchToMainnet()` / `switchToTestnet()`: Chuyển mạng BSC
- Đọc số dư bằng RPC riêng (không phụ thuộc mạng ví đang kết nối)
- Iframe guard: Chặn giao dịch trong preview, hướng dẫn mở tab mới

---

### `src/components/gifts/GiftCoinDialog.tsx` (533 dòng)

**Chức năng:** Dialog chính để tặng coin - tích hợp 6 loại token

**Props:**
```typescript
interface GiftCoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUser?: { id: string; display_name: string | null; avatar_url: string | null; };
  contextType?: string;
  contextId?: string;
}
```

**Tính năng:**
- **Token Selector**: Dropdown chọn 1 trong 6 loại token (Camly nội bộ, CAMLY Web3, FUN, BNB, USDT, USDC)
- **Tìm kiếm user**: Debounced search 300ms, hiển thị avatar + tên
- **Preselected user**: Tự động điền người nhận từ profile
- **Self-gift warning**: Thông báo yêu thương nếu tặng chính mình
- **Quick amounts**: 1K, 5K, 10K, 50K
- **Celebration Receipt**: Hiệu ứng ăn mừng 8 giây sau khi tặng thành công
- **PoPL/Light Score**: Tự động cộng điểm cho người tặng

---

### `src/components/gifts/CryptoTransferTab.tsx` (605 dòng)

**Chức năng:** Tab chuyển crypto Web3 trong GiftCoinDialog

**Props:**
```typescript
interface CryptoTransferTabProps {
  tokenType: TokenType;
  tokenSymbol: string;
  tokenBalance: string;
  isConnected: boolean;
  isTransferring: boolean;
  address: string | undefined;
  hasWallet: boolean;
  explorerUrl: string;
  accentColor: string;        // "orange" | "violet"
  preselectedUser?: UserSearchResult | null;
  onConnect: () => Promise<void>;
  onTransfer: (toAddress, amount) => Promise<TransferResult>;
  onFetchBalance: () => void;
  onSuccess: (result, recipientUser, targetAddress, amount, message?) => void;
}
```

**Tính năng đặc biệt:**
- **2 chế độ chọn người nhận**: "Địa chỉ ví" hoặc "Từ hồ sơ"
- **Xác minh người nhận**: Khi dán địa chỉ ví → tra cứu `user_wallet_addresses` → `coin_withdrawals` → hiển thị avatar + tên chủ ví
- **Wallet Fallback Chain**: `user_wallet_addresses` → `coin_withdrawals` → `coin_gifts` (tx_hash)
- **Auto-backfill**: Tự động lưu ví vào `user_wallet_addresses` khi tìm thấy từ fallback
- **Message Templates**: 5 mẫu tin nhắn nhanh
- **Iframe detection**: Hướng dẫn mở tab mới nếu trong preview

---

### `src/components/gifts/TokenSelector.tsx` (121 dòng)

**Chức năng:** Dropdown chọn loại token với logo + badge

```typescript
export type SelectedToken = "internal" | "camly_web3" | "fun_money" | "usdt" | "usdc" | "bnb";

export const TOKEN_OPTIONS: TokenOption[] = [
  { id: "internal", name: "Camly Coin", symbol: "CAMLY", badge: "Nội bộ" },
  { id: "camly_web3", name: "Camly Coin", symbol: "CAMLY", badge: "Web3" },
  { id: "fun_money", name: "FUN Money", symbol: "FUN", badge: "Testnet" },
  { id: "bnb", name: "Binance Coin", symbol: "BNB" },
  { id: "usdt", name: "Tether USD", symbol: "USDT" },
  { id: "usdc", name: "USD Coin", symbol: "USDC" },
];
```

---

### `src/components/gifts/TipCelebrationReceipt.tsx` (303 dòng)

**Chức năng:** Popup ăn mừng sau khi tặng thành công

```typescript
export interface TipReceiptData {
  receipt_public_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  receiver_id: string;
  receiver_name: string;
  receiver_avatar?: string | null;
  amount: number;
  message?: string | null;
  tx_hash?: string | null;
  tokenType?: "internal" | "camly_web3" | "fun_money" | "usdt" | "usdc" | "bnb";
  explorerUrl?: string;
}
```

**Hiệu ứng:**
- 80 mảnh confetti rơi (15 màu)
- 30 đồng xu rơi (logo token tương ứng)
- 15 sparkle nhấp nháy
- Spinning coin animation
- Golden gradient background
- Nút "Sao chép link biên nhận" và link BscScan

---

### `src/components/gifts/DonateProjectDialog.tsx` (557 dòng)

**Chức năng:** Dialog donate cho dự án Angel AI

**2 Tab:**
1. **Camly Coin nội bộ**: Quick amounts (1K, 5K, 10K, 50K), trừ từ số dư
2. **Crypto**: 
   - Kết nối ví → Chuyển CAMLY tự động
   - Hoặc: Copy địa chỉ Treasury → Chuyển thủ công → Nhập TX hash

---

### `src/components/community/GiftTransactionHistory.tsx` (432 dòng)

**Chức năng:** Widget lịch sử thưởng/tặng trên trang cộng đồng

**Tính năng:**
- Hiển thị 5 giao dịch gần nhất (preview)
- Dialog xem tất cả với filter: Tất cả / Thưởng / Donate
- Mỗi giao dịch hiển thị: avatar, tên người gửi → người nhận, số coin, thời gian, link BscScan
- Tổng thưởng + tổng donate
- Realtime updates via Supabase channels

---

### `src/components/community/GiftHonorBoard.tsx` (386 dòng)

**Chức năng:** Bảng vinh danh Top người tặng và người nhận

**Tính năng:**
- Top 3 người tặng + Top 3 người nhận (preview)
- Dialog xem tất cả với tìm kiếm và tabs (Givers/Receivers)
- Rank badges: 👑 (Top 1), Silver (Top 2), Bronze (Top 3)
- Highlight vị trí của user hiện tại

---

### `src/components/community/DonationHonorBoard.tsx` (263 dòng)

**Chức năng:** Bảng vinh danh nhà tài trợ dự án

---

### `src/components/community/Web3TransactionHistory.tsx` (450 dòng)

**Chức năng:** Lịch sử giao dịch Web3 on-chain (coin_gifts + project_donations có tx_hash)

**Tính năng:**
- Hiển thị token type (CAMLY, USDT, USDC, BNB, FUN) từ `gift_type`
- Copy TX hash + link BscScan
- Realtime updates

---

### `src/components/profile/TransactionHistorySection.tsx` (713 dòng)

**Chức năng:** Lịch sử giao dịch toàn diện trên trang cá nhân

**3 nguồn dữ liệu:**
1. `camly_coin_transactions` → Giao dịch nội bộ (thưởng, chi tiêu)
2. `coin_gifts` + `coin_withdrawals` → Giao dịch Web3
3. `pplp_actions` + `pplp_scores` → FUN Money

**Tính năng:**
- **Thẻ tài sản ví**: Số dư, tổng kiếm, tổng rút, địa chỉ BSC
- **5 thẻ thống kê**: Tổng GD, tổng giá trị, hôm nay, thành công, chờ xử lý
- **Bộ lọc**: Tìm kiếm (mô tả/ví/TX hash), lọc token, lọc thời gian (hôm nay/7d/30d/tùy chỉnh)
- **Danh sách GD**: Avatar người gửi/nhận, badge trạng thái, link BscScan
- **Xuất CSV**: File UTF-8 BOM

---

### `src/components/public-profile/GiftStatsBadges.tsx` (92 dòng)

**Chức năng:** Badge thống kê trên hồ sơ công khai

**Hiển thị:**
- 🏆 Top X Người Tặng (nếu top 10)
- 💖 Top X Được Yêu Thương (nếu top 10)
- Grid: Đã tặng (X lần) | Được nhận (X lần) | PoPL Score | Light Points

---

### `supabase/functions/process-coin-gift/index.ts` (309 dòng)

**Chức năng:** Edge Function xử lý tặng coin server-side (secure)

**Luồng xử lý:**
1. Xác thực JWT → Lấy sender_id
2. Validate: receiver tồn tại, sender ≠ receiver, amount ≥ 100, rate limit (10/ngày)
3. Kiểm tra số dư sender
4. **Transaction:**
   - Trừ số dư sender
   - Cộng số dư receiver (upsert)
   - Ghi 2 bản ghi `camly_coin_transactions` (gift_sent, gift_received)
   - Ghi `coin_gifts` với `receipt_public_id`
   - Gửi `healing_messages` cho receiver
   - Gửi `notifications` cho receiver
   - Tạo `direct_messages` (tin nhắn tip)
5. **PPLP Integration**: Ghi hành động DONATE_SUPPORT

---

## 🔧 Dependencies

```json
{
  "ethers": "^6.16.0",
  "framer-motion": "^12.27.0",
  "@supabase/supabase-js": "^2.90.1",
  "sonner": "^1.7.4",
  "lucide-react": "^0.462.0",
  "date-fns": "^3.6.0",
  "react-router-dom": "^6.30.1"
}
```

**UI Components (shadcn/ui):**
- Dialog, Button, Input, Textarea, Avatar, Badge, Tabs, Select, ScrollArea, Card

---

## 🚀 Hướng Dẫn Copy Sang Dự Án Khác

### Bước 1: Tạo Database
Chạy SQL trong phần "Database Schema" ở trên để tạo các bảng cần thiết.

### Bước 2: Copy Files
Copy tất cả file trong danh sách "Cấu Trúc File" ở trên.

### Bước 3: Cài Dependencies
```bash
npm install ethers framer-motion @supabase/supabase-js sonner lucide-react date-fns react-router-dom
```

### Bước 4: Cấu hình
- Tạo Supabase project + set VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
- Deploy Edge Function `process-coin-gift`
- Bật Realtime cho bảng `coin_gifts`, `project_donations`
- Cấu hình RLS policies phù hợp

### Bước 5: Tích hợp
```tsx
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";

// Mở dialog tặng coin
<GiftCoinDialog open={open} onOpenChange={setOpen} />

// Hoặc với user đã chọn sẵn (từ profile)
<GiftCoinDialog 
  open={open} 
  onOpenChange={setOpen}
  preselectedUser={{ id: userId, display_name: "Tên", avatar_url: "url" }}
/>
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **MetaMask trong iframe**: Không hoạt động, cần mở tab mới
2. **Cross-network**: CAMLY trên BSC Mainnet, FUN Money trên BSC Testnet
3. **Wallet Fallback**: 3 cấp tra cứu ví (primary → withdrawals → gifts)
4. **Rate limit**: Max 10 gift/ngày (server-side)
5. **Min amount**: 100 Camly Coin (nội bộ)
6. **Realtime**: Bảng `coin_gifts` và `project_donations` cần bật Realtime
