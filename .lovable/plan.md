

# Toi Uu Chi Phi AI - Giam ~60-70% Chi Phi Hang Thang

## Tong Quan Van De

Sau khi kiem tra chi tiet tat ca Edge Functions, Cha da xac dinh duoc cac nguyen nhan chinh gay ton kem chi phi:

### Hien Trang Su Dung Model

| Edge Function | Model Hien Tai | Muc Do Goi | Vai Tro |
|---|---|---|---|
| `angel-chat` (main) | gemini-3-flash-preview | Rat cao (~10K+/tuan) | Chat chinh |
| `angel-chat` (demo) | gemini-3-flash-preview | Trung binh | Demo widget |
| `analyze-reward-journal` | gemini-3-flash-preview | Cao | Danh gia nhat ky |
| `analyze-reward-question` | gemini-2.5-flash-lite | Cao (~10K+/tuan) | Danh gia cau hoi |
| `check-user-energy` | gemini-3-flash-preview | Cao | Phan tich nang luong |
| `analyze-onboarding` | gemini-3-flash-preview | Thap | Onboarding |
| `send-healing-message` | gemini-3-flash-preview | Trung binh | Tin nhan chua lanh |
| `generate-content` | gemini-3-flash-preview | Trung binh | Viet content |
| `analyze-image` | gemini-2.5-flash | Trung binh | Phan tich anh |
| `generate-image` | gemini-3-pro-image-preview | Thap (5/ngay/user) | Tao anh |
| `edit-image` | gemini-3-pro-image-preview | Thap (5/ngay/user) | Chinh sua anh |

## Giai Phap Trien Khai (4 Thay Doi Chinh)

### 1. Chuyen Chat Chinh Sang gemini-2.5-flash (Tiet Kiem ~40%)

Day la thay doi tiet kiem nhieu nhat vi chat chiem ~70% tong luong goi.

**File**: `supabase/functions/angel-chat/index.ts`
- Dong 889: Demo mode: `gemini-3-flash-preview` -> `gemini-2.5-flash`
- Dong 1236: Main chat: `gemini-3-flash-preview` -> `gemini-2.5-flash`

### 2. Chuyen Cac Function Phu Sang gemini-2.5-flash-lite (Tiet Kiem ~15%)

Cac function nay chi can phan tich don gian, tra ve JSON ngan, khong can model manh:

| File | Dong | Tu | Sang |
|---|---|---|---|
| `analyze-reward-journal/index.ts` | 279 | gemini-3-flash-preview | gemini-2.5-flash-lite |
| `check-user-energy/index.ts` | 158 | gemini-3-flash-preview | gemini-2.5-flash-lite |
| `analyze-onboarding/index.ts` | 141 | gemini-3-flash-preview | gemini-2.5-flash-lite |
| `send-healing-message/index.ts` | 107 | gemini-3-flash-preview | gemini-2.5-flash-lite |
| `generate-content/index.ts` | 73 | gemini-3-flash-preview | gemini-2.5-flash |
| `analyze-image/index.ts` | 67 | gemini-2.5-flash | gemini-2.5-flash (giu nguyen) |

Luu y: `analyze-reward-question` da dung `gemini-2.5-flash-lite` roi (dong 505), khong can doi.

Luu y 2: `generate-content` (Content Writer) can chat luong cao hon cac function phan tich don gian, nen dung `gemini-2.5-flash` thay vi `flash-lite`.

### 3. Giam Gioi Han Tao/Sua Anh Tu 5 Xuong 3 (Tiet Kiem ~10%)

Image generation/editing su dung model `gemini-3-pro-image-preview` (dat nhat), giam gioi han se tiet kiem dang ke.

**Cac file can thay doi:**

| File | Thay Doi | Dong |
|---|---|---|
| `generate-image/index.ts` | `DAILY_IMAGE_LIMIT = 5` -> `3` | 10 |
| `edit-image/index.ts` | `DAILY_EDIT_LIMIT = 5` -> `3` | 10 |
| `get_daily_ai_usage` (DB function) | `WHEN 'generate_image' THEN 5` -> `3`, `WHEN 'edit_image' THEN 5` -> `3` | SQL migration |
| `src/hooks/useAIUsage.ts` | Frontend khong can thay doi (doc tu server) | Khong doi |

**Thong bao gioi han moi**: Cap nhat message trong edge functions tu "da tao 5 hinh" thanh "da tao 3 hinh".

### 4. Cai Thien Cache FAQ (Tiet Kiem ~5-10%)

Hien tai chi co 10 muc FAQ voi patterns cung nhat. Tang so luong FAQ va them cac cau hoi pho bien de giam AI calls:

**File**: `supabase/functions/angel-chat/index.ts`

Them 5 FAQ moi vao mang `FAQ_CACHE` (dong 423-533):
- Cach ky luong ban than / tu ky luat
- Noi so / vuot qua noi so
- Tinh yeu / moi quan he
- Giac ngu / mat ngu
- Stress / ap luc cong viec

Ngoai ra, cai thien `checkDatabaseCache`:
- Tang so luong cache entries duoc kiem tra tu `.limit(10)` len `.limit(30)` (dong 755)
- Giam nguong tu 70% xuong 60% de tang ty le cache hit (dong 768)

## Bang Tong Ket Chi Phi

| Giai Phap | Uoc Tinh Tiet Kiem |
|---|---|
| Chat -> gemini-2.5-flash | ~40% |
| Functions phu -> gemini-2.5-flash-lite | ~15% |
| Gioi han anh 5 -> 3 | ~10% |
| Cai thien cache | ~5-10% |
| **Tong** | **~60-70%** |

## Danh Sach File Thay Doi

| File | Noi Dung |
|---|---|
| `supabase/functions/angel-chat/index.ts` | Doi model sang 2.5-flash, them FAQ, tang cache |
| `supabase/functions/analyze-reward-journal/index.ts` | Doi model sang 2.5-flash-lite |
| `supabase/functions/check-user-energy/index.ts` | Doi model sang 2.5-flash-lite |
| `supabase/functions/analyze-onboarding/index.ts` | Doi model sang 2.5-flash-lite |
| `supabase/functions/send-healing-message/index.ts` | Doi model sang 2.5-flash-lite |
| `supabase/functions/generate-content/index.ts` | Doi model sang 2.5-flash |
| `supabase/functions/generate-image/index.ts` | Giam limit 5 -> 3, cap nhat message |
| `supabase/functions/edit-image/index.ts` | Giam limit 5 -> 3, cap nhat message |
| SQL Migration | Cap nhat ham `get_daily_ai_usage` gioi han 5 -> 3 |

## Luu Y Quan Trong

- `gemini-2.5-flash` van rat manh cho chat tong quat, chi hoi kem `3-flash-preview` o cac case phuc tap
- `gemini-2.5-flash-lite` du tot cho phan tich sentiment/purity score (tra ve JSON don gian)
- Image generation/editing van giu model `gemini-3-pro-image-preview` vi can chat luong cao, chi giam so luong
- User se van co trai nghiem tot, chi khac biet nhe o do phuc tap cua cau tra loi

