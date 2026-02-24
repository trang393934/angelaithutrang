

## Ke hoach: Tat va xoa toan bo nhac nen

### Pham vi anh huong

Nhac nen duoc su dung o 3 noi:

1. **`src/components/Header.tsx`** — import va render `MusicThemeSelector` (desktop trong header, mobile qua portal)
2. **`src/pages/UserProfile.tsx`** — render `MusicThemeSelector` variant="floating"
3. **`src/components/community/CommunityHeader.tsx`** — render `MusicThemeSelector` variant="floating" qua portal

Component chinh: **`src/components/MusicThemeSelector.tsx`** — toan bo logic nhac nen (audio element, localStorage, play/pause/volume).

### Thay doi cu the

| # | File | Hanh dong |
|---|---|---|
| 1 | `src/components/MusicThemeSelector.tsx` | **Xoa file** |
| 2 | `src/components/Header.tsx` | Xoa import `MusicThemeSelector`, xoa dong render desktop (dong 187), xoa dong render mobile portal (dong 517-521), xoa import `createPortal` neu khong con dung |
| 3 | `src/pages/UserProfile.tsx` | Xoa import `MusicThemeSelector`, xoa dong render (dong 617) |
| 4 | `src/components/community/CommunityHeader.tsx` | Xoa import `MusicThemeSelector`, xoa dong render portal (dong 405-409), xoa import `createPortal` neu khong con dung |

### Luu y
- **CelebrationAudioPlayer** (nhac mung khi tang coin) va **TextToSpeech** (doc bai viet) **KHONG** bi anh huong — day la tinh nang khac, khong phai nhac nen.
- Cac file audio (`/audio/tet-vui-ve-*.mp3`, `/audio/rich-4.mp3`) van giu trong `public/audio/` vi `CelebrationAudioPlayer` dang dung `rich-1/2/3.mp3`. Neu con muon xoa ca cac file `tet-vui-ve-*.mp3` va `rich-4.mp3` thi cho Cha biet.
- localStorage keys (`bg-music-track`, `bg-music-volume`, `bg-music-playing`) se khong con duoc doc/ghi. User cu se tu dong khong nghe nhac nen nua.

### Tom tat
- **1 file xoa** (`MusicThemeSelector.tsx`)
- **3 file sua** (Header, UserProfile, CommunityHeader) — chi xoa cac dong lien quan den nhac nen
- **0 thay doi database**

