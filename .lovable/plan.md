

# Thiết kế lại Popup Li Xi Tet -- Pixel-Perfect theo mau

## So sanh hien tai vs mau

Sau khi xem ky screenshot hien tai va hinh mau, con nhan thay cac diem can sua:

### 1. Background chinh (outer card)
- **Hien tai**: Gradient vang dam (#f5e6b8 -> #b8860b), qua dam va toi
- **Mau**: Gradient nhe hon, sang hon (#FFF7D6 -> #F4E2A4), tone kem/vang am, co texture grain vang anh kim

### 2. Hoa trang tri goc
- **Hien tai**: SVG hoa don gian, nho, it chi tiet
- **Mau**: Canh hoa dao/hoa mai chi tiet hon, co canh cay (branches) keo dai tu cac goc, hoa nhieu lop hon voi la xanh

### 3. Den long
- **Hien tai**: Den long nho, o goc tren
- **Mau**: Den long lon hon, chi tiet hon, co tua do phia duoi, co chu trang tri tren mat den long. Goc trai co 2 den long (1 lon, 1 nho), goc phai co 1 den long nho hon va pháo

### 4. Bao li xi do (Red Envelope)
- **Hien tai**: Kha giong mau roi
- **Mau**: Tuong tu, co the tinh chinh nho kich thuoc

### 5. Khung parchment
- **Hien tai**: Bo goc (rounded-xl), vien vang
- **Mau**: Bo goc lon hon, vien mong hon (1px solid #E8D9A8), nen trang kem nhe hon, co inner shadow nhe

### 6. Typography
- **Hien tai**: font-size text-xl/text-2xl, color #6B3A10
- **Mau**: Font 28px heading, serif sang trong hon, color #5A3A00. Body text 16px, color #5C4A1A. So highlight vang #C99700

### 7. Info blocks (2 dong qua tang)
- **Hien tai**: Icon 🎁 emoji, can giua
- **Mau**: Icon qua tang vang (🎁 emoji mau vang), can trai voi icon ben trai + text ben phai (flex layout), khong phai can giua

### 8. Nut CLAIM
- **Hien tai**: Gradient xanh la, bo tron lon (rounded-xl), border 2px
- **Mau**: Gradient xanh dam hon (#2F5E2F -> #1E3D1E), border-radius 10px, co box-shadow 3D (0 4px 0 #183018), letter-spacing 0.5px, font-weight 600

### 9. Nut "Them thong tin"
- **Hien tai**: Nen trang, vien vang dam 3px, co emoji 👆
- **Mau**: Border 1px solid #C9A227, background transparent, text #5A3A00, co icon tay tro 👆 phia sau, font-weight 500

### 10. Dong thoi han
- **Hien tai**: text-xs, co text-shadow vang
- **Mau**: Font 13px, color #8A6B1F, khong co glow effect, don gian

### 11. Dong Camly Coin goc duoi trai
- **Hien tai**: 1 dong coin nho (w-12)
- **Mau**: 2-3 dong coin chong len nhau, lon hon, co glow effect vang

### 12. Overlay
- **Hien tai**: Mac dinh tu Dialog (bg-black/80)
- **Mau**: rgba(0,0,0,0.45) voi backdrop blur 4px

### 13. Animation popup
- **Hien tai**: scale 0.7 -> 1, spring bounce
- **Mau**: scale 0.9 -> 1, duration 320ms, ease-out

## Chi tiet thay doi

### File: `src/components/UserLiXiCelebrationPopup.tsx`

Viet lai toan bo phan giao dien theo dung UI spec:

1. **Background card**: Doi gradient thanh `linear-gradient(180deg, #FFF7D6 0%, #F4E2A4 100%)`, them gold grain texture overlay, border `1px solid #E8D9A8`, border-radius 16px, box-shadow theo spec

2. **Hoa trang tri goc**: Tao SVG phuc tap hon voi canh cay (branches), la xanh, nhieu bong hoa lon hon. Goc tren trai: canh dao hong + den long. Goc tren phai: canh mai vang + den long nho. Goc duoi trai va phai: hoa rai rac

3. **Den long**: Tang kich thuoc, them chi tiet tua do, dung SVG phuc tap hon co hoa van va chu trang tri

4. **Khung parchment**: Border doi thanh `1px solid #E8D9A8`, nen gradient kem sang hon, inner glow nhe hon

5. **Typography**: Heading 28px (sm:22px mobile), font-weight 700, color #5A3A00. Body 16px, line-height 1.6, color #5C4A1A. So highlight font-weight 700 color #C99700

6. **Info blocks**: Chuyen tu can giua sang flex layout (icon trai + text phai), gap 12px, margin 14px 0

7. **Nut CLAIM**: Height 48px, padding 0 36px, border-radius 10px, gradient (#2F5E2F -> #1E3D1E), shadow 3D (0 4px 0 #183018 + 0 10px 20px rgba(0,0,0,0.2)), letter-spacing 0.5px, font-weight 600. Hover: brighten 6% + translateY(-1px). Active: translateY(2px)

8. **Nut "Them thong tin"**: Height 48px, padding 0 28px, border-radius 10px, border 1px solid #C9A227, background transparent, color #5A3A00, font-weight 500. Hover: background rgba(201,162,39,0.08)

9. **Dong thoi han**: Font 13px, color #8A6B1F, bo text-shadow/glow

10. **Camly Coin goc duoi**: Tang len 2-3 dong coin chong nhau, kich thuoc lon hon (w-16 + w-14), them drop-shadow vang

11. **Overlay**: Override DialogOverlay thanh `bg-black/45 backdrop-blur-[4px]` thay vi `bg-black/80`

12. **Animation**: Doi scale 0.9 -> 1, duration 0.32s, easing ease-out (bo spring bounce)

13. **Gold shimmer**: Them animation loop 6s thay doi opacity 0.85 -> 1 cho lop overlay anh kim

14. **Mobile responsive**: Padding card 24px 20px, title 22px, button container chuyen column layout, button width 100%, decorations scale 70%

### Phan ky thuat
- Chi sua 1 file: `UserLiXiCelebrationPopup.tsx`
- Giu nguyen toan bo logic: preview mode, claim flow, effects (FireworkBurst, LiXiEffects)
- Khong them dependency moi
- Giu nguyen cac import hien co
- Tao SVG inline moi cho hoa dao/mai chi tiet hon

