
## Ra soat He thong Chong Gian lan ANGEL AI — Bao cao & Ke hoach Nang cap

### Tinh trang hien tai: DA LAM DUOC GI

He thong hien tai da co 5 lop bao ve co ban hoat dong:

**Da trien khai va dang chay:**
1. **Cong thoi gian tai khoan (Account Age Gate)** — Ham `get_account_age_gate` + shared helper `anti-sybil.ts` da tich hop vao tat ca edge function thuong (question, journal, share, engagement, community post, vision)
2. **Tri hoan phan thuong (Pending Rewards)** — Bang `pending_rewards` + ham `release_pending_rewards` chay cron moi gio
3. **Gioi han theo cap bac (Tiered Rate Limits)** — Ham `check_user_cap_and_update` voi 5 tier (0-4)
4. **Tu dong xu ly risk score** — Ham `auto_suspend_high_risk` (>70 dinh chi 24h, >50 dong bang)
5. **Kiem tra ngau nhien** — Ham `schedule_random_audit` chay cron moi 6h
6. **BSCScan sync** — Dong bo giao dich on-chain moi 2h sang (cron job `sync-bscscan-daily`)
7. **Fraud Scanner** — Edge function kiem tra email pattern, bulk registration, withdrawal spike
8. **PPLP Detect Fraud** — Kiem tra Sybil (device/IP), Bot (tan suat/timing), Spam (noi dung ngan/trung), Collusion (tuong tac tap trung)
9. **Email Pattern Registry** — Bang `sybil_pattern_registry` kiem tra email kha nghi
10. **Wallet locking** — Vi Web3 bi khoa vinh vien sau khi ket noi lan dau

**4 Cron jobs dang chay:**
- `pplp-batch-processor` moi 15 phut (xu ly action pending)
- `random-audit-every-6h` moi 6 gio
- `release-pending-rewards-hourly` moi gio
- `sync-bscscan-daily` luc 2:00 AM UTC

---

### LO HONG CON TON TAI (Phat hien khi ra soat)

#### 1. Device Fingerprint CHUA DUOC THU THAP tu client
- **Van de**: Bang `pplp_device_registry` va ham `register_device_fingerprint` da co trong DB, nhung **khong co dong code nao trong `src/`** thuc su tao va gui device hash len server.
- **Hau qua**: Tat ca logic phat hien Sybil qua device fingerprint trong `pplp-detect-fraud` KHONG BAO GIO HOAT DONG vi `metadata.device_hash` luon la `undefined`.
- **Muc do**: **NGHIEM TRONG** — Day la lo hong lon nhat.

#### 2. IP Hash CHUA DUOC THU THAP
- **Van de**: Tuong tu device hash, `ip_hash` trong integrity cung khong duoc thu thap. Phan kiem tra IP trong `pplp-detect-fraud` luon bi bo qua.
- **Muc do**: **NGHIEM TRONG**

#### 3. Fraud Scanner KHONG DUOC GOI TU DONG khi dang ky
- **Van de**: `fraud-scanner` edge function ton tai nhung **chi duoc goi thu cong** (hoac qua trigger `auto_fraud_check` chi kiem tra email pattern). Khong co logic goi fraud-scanner tu phia client khi user dang ky.
- **Muc do**: TRUNG BINH — trigger DB da cover mot phan

#### 4. Khong co phan tich thoi gian dang bai/tuong tac dong thoi
- **Van de**: Hien tai chi co bot detection (tan suat hanh dong trong 1 gio) nhung khong phan tich **nhom tai khoan dang bai/tuong tac cung thoi diem** (vi du: 5 tai khoan deu dang bai luc 8:00 AM moi ngay).
- **Muc do**: TRUNG BINH

#### 5. Khong co cross-account content similarity
- **Van de**: Spam detection chi kiem tra noi dung trung lap CUA CUNG 1 USER. Khong co logic so sanh noi dung GIUA CAC USER (vi du: 5 tai khoan dang cung 1 noi dung).
- **Muc do**: CAO

#### 6. BSCScan wallet cluster detection khong tu dong
- **Van de**: Viec phat hien cum vi (nhieu tai khoan gui tien ve 1 vi gom) hien tai phai lam THU CONG (hardcode trong `SYBIL_GROUPS`). Khong co logic tu dong phan tich du lieu BSCScan de phat hien vi gom.
- **Muc do**: CAO

#### 7. Admin khong nhan duoc canh bao real-time
- **Van de**: Fraud alerts chi hien thi khi admin truy cap trang `/admin/fraud-alerts`. Khong co thong bao push/real-time khi phat hien risk score cao.
- **Muc do**: TRUNG BINH

---

### KE HOACH NANG CAP — 7 BUOC

#### Buoc 1: Thu thap Device Fingerprint tu Client
- Tao utility `src/lib/deviceFingerprint.ts` su dung canvas fingerprint + screen + timezone + language + UA de tao hash duy nhat
- Goi `register_device_fingerprint` RPC khi user dang nhap
- Dinh kem `device_hash` vao moi request toi edge function thuong

#### Buoc 2: Thu thap IP Hash phia Server
- Trong moi edge function thuong, doc IP tu header `x-forwarded-for` hoac `cf-connecting-ip`
- Hash IP (SHA-256) va luu vao `integrity.ip_hash` cua `pplp_actions`
- Giup `pplp-detect-fraud` co du lieu de phat hien nhieu tai khoan cung IP

#### Buoc 3: Phan tich Noi dung Cross-Account
- Tao database function `detect_cross_account_content_similarity`
- So sanh content hash cua bai dang/nhat ky giua cac user khac nhau trong 24h
- Neu >= 3 user co cung content hash → tao fraud signal severity 4

#### Buoc 4: Tu dong Phat hien Wallet Cluster tu BSCScan
- Nang cap `sync-bscscan-gifts` de sau khi sync, chay logic phan tich:
  - Tim tat ca vi ngoai he thong nhan tien tu >= 3 user khac nhau (vi gom)
  - Tao fraud alert tu dong voi danh sach user lien quan
- Tao database function `detect_wallet_clusters`

#### Buoc 5: Phan tich Thoi gian Hoat dong Dong thoi
- Tao database function `detect_coordinated_timing`
- Tim nhom user co >= 3 hanh dong trong cung khung 10 phut moi ngay, lap lai >= 3 ngay
- Tao fraud signal cho nhom co dau hieu phoi hop

#### Buoc 6: Canh bao Real-time cho Admin
- Khi `auto_suspend_high_risk` hoac `pplp-detect-fraud` phat hien risk > 50:
  - Insert vao bang `notifications` voi type `fraud_alert_critical` 
  - Admin nhan duoc thong bao ngay trong dropdown notification
- Them banner "Canh bao moi" tren trang Admin Dashboard

#### Buoc 7: Nang cap Admin Fraud Dashboard
- Them tab "Phan tich Tu dong" hien thi:
  - Danh sach wallet cluster phat hien tu dong (thay vi hardcode)
  - Nhom tai khoan co noi dung trung lap cross-account
  - Nhom tai khoan co timing dong bo bat thuong
  - Nut "Ban nhom" de xu ly nhanh

---

### Chi tiet ky thuat

**Files moi:**
- `src/lib/deviceFingerprint.ts` — Tao device hash tu client
- Migration SQL: tao cac function `detect_wallet_clusters`, `detect_cross_account_content_similarity`, `detect_coordinated_timing`

**Files chinh sua:**
- `src/hooks/useAuth.tsx` — Goi `register_device_fingerprint` khi dang nhap
- `supabase/functions/_shared/anti-sybil.ts` — Them IP hash extraction helper
- `supabase/functions/analyze-reward-question/index.ts` — Gui device_hash va IP
- `supabase/functions/analyze-reward-journal/index.ts` — Gui device_hash va IP
- `supabase/functions/process-community-post/index.ts` — Gui device_hash va IP
- `supabase/functions/process-share-reward/index.ts` — Gui device_hash va IP
- `supabase/functions/process-engagement-reward/index.ts` — Gui device_hash va IP
- `supabase/functions/sync-bscscan-gifts/index.ts` — Them wallet cluster detection sau sync
- `supabase/functions/pplp-batch-processor/index.ts` — Them action `cross_account_scan`
- `src/pages/AdminFraudAlerts.tsx` — Them tab phan tich tu dong
- `src/components/layout/notifications/utils.ts` — Them xu ly fraud_alert notification

**Cron job moi:**
- `cross-account-scan-daily` — Chay moi ngay luc 3:00 AM de quet noi dung trung, timing dong bo, wallet cluster

### Thu tu uu tien
1. **Buoc 1 + 2** (Device + IP) — Uu tien CAO NHAT vi day la lo hong lon nhat
2. **Buoc 3 + 5** (Cross-content + Timing) — Uu tien CAO
3. **Buoc 4** (Wallet cluster tu dong) — Uu tien CAO
4. **Buoc 6 + 7** (Admin alerts + Dashboard) — Uu tien TRUNG BINH
