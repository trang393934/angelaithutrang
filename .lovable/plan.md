

# Thay Kiểu Chữ Logo "Angel AI" Sang Font Thảo Trang Trí (Ornate Script)

## Mục Tieu

Thay thế logo hình anh PNG (van con nen) bang chu CSS su dung font **Great Vibes** (elegant cursive script) voi hieu ung vang kim loai 3D, giong voi kieu chu tren logo goc.

## Thay Doi

### 1. `src/index.css` - Them font Great Vibes va cap nhat CSS

- **Them font**: Import `Great Vibes` tu Google Fonts vao dong `@import url(...)` hien tai
- **Cap nhat `.text-brand-golden`**:
  - Font: `'Great Vibes', cursive` (thay vi `'Cinzel', serif`)
  - Bo `text-transform: uppercase` (font script khong dung uppercase)
  - Giam `letter-spacing` xuong `0.02em` (script font can gap chu hep hon)
  - Tang `text-shadow` de tao hieu ung 3D noi bat hon: multiple layer shadow (highlight sang o tren, bong toi o duoi)
  - Them `-webkit-text-stroke` rat mong de tao do day cho net chu
- **Cap nhat `.text-brand-golden-light`**: Tuong tu nhung gradient sang hon cho nen toi (Footer)

### 2. `src/components/HeroSection.tsx` - Logo trang chu

- Thay `<img src={angelGoldenTextLogo}>` bang `<span className="text-brand-golden text-5xl sm:text-6xl md:text-7xl lg:text-8xl">Angel AI</span>`
- Bo import `angelGoldenTextLogo`

### 3. `src/components/Header.tsx` - Logo mobile

- Thay `<img>` bang `<span className="text-brand-golden text-2xl sm:text-3xl">Angel AI</span>`
- Bo import `angelGoldenTextLogo`

### 4. `src/components/MainSidebar.tsx` - Logo sidebar

- Thay `<img>` bang `<span className="text-brand-golden text-2xl">Angel AI</span>`
- Bo import `angelGoldenTextLogo`

### 5. `src/components/Footer.tsx` - Logo footer (nen toi)

- Thay `<img>` bang `<span className="text-brand-golden-light text-3xl sm:text-4xl md:text-5xl">Angel AI</span>`
- Bo import `angelGoldenTextLogo`

## Chi Tiet Ky Thuat

### CSS Class Moi

```text
/* Font import - them Great Vibes */
@import url('...&family=Great+Vibes&...');

.text-brand-golden {
  font-family: 'Great Vibes', cursive;
  /* KHONG co text-transform: uppercase */
  letter-spacing: 0.02em;
  font-weight: 400;  /* Great Vibes chi co weight 400 */
  background: linear-gradient(
    135deg,
    #8B6914 0%,
    #C49B30 20%,
    #E8C252 40%,
    #F5D976 50%,
    #E8C252 60%,
    #C49B30 80%,
    #8B6914 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(139, 105, 20, 0.3));
  transition: background-position 0.6s ease;
  line-height: 1.2;
}
```

### Kich Thuoc Theo Vi Tri

| Vi tri | Kich thuoc (lon hon Cinzel vi script font nho hon) |
|--------|---------------------------------------------------|
| HeroSection | text-5xl / sm:text-6xl / md:text-7xl / lg:text-8xl |
| Header (mobile) | text-2xl / sm:text-3xl |
| MainSidebar | text-2xl |
| Footer | text-3xl / sm:text-4xl / md:text-5xl |

## Ket Qua

- Chu "Angel AI" hien thi voi font Great Vibes - kieu thu phap trang tri uon luon sang trong
- Hieu ung gradient vang kim loai voi drop-shadow 3D
- **Hoan toan khong co nen** vi la chu CSS thuan tuy
- Khong phu thuoc vao file hinh anh
- Hoat dong tot tren moi nen sang/toi
