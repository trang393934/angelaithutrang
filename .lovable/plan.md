

# Them buoc toi uu hoa prompt bang AI cho che do Sieu toc

## Y tuong

Khi user go prompt tieng Viet (vd: "thien than bay tren troi"), he thong se dung Gemini 2.5 Flash de dich va nang cap thanh prompt tieng Anh chuyen sau cho Flux (vd: "An ethereal angel soaring across a vast heavenly sky, detailed feathered wings, ethereal lighting, high resolution, cinematic composition").

## Flow moi

```text
User prompt (tieng Viet/Anh)
    |
    v
[Gemini 2.5 Flash] -- Dich + toi uu hoa prompt --> optimized English prompt
    |
    v
[Fal.ai Flux Schnell] -- Tao anh tu prompt da toi uu
    |
    v
Upload Storage --> Tra ve user
```

## Thay doi cu the

### File: `supabase/functions/generate-image/index.ts`

Them mot buoc moi **chi trong che do "fast"** (dong 78-145), TRUOC khi goi Fal.ai:

1. Goi Gemini 2.5 Flash qua Cloudflare Gateway (hoac Google AI Studio truc tiep) voi system prompt yeu cau:
   - Dich prompt sang tieng Anh neu la tieng Viet
   - Them cac tu khoa nang cao chat luong: ethereal lighting, detailed, cinematic, v.v.
   - Giu nguyen y nghia goc cua user
   - Tra ve CHI prompt tieng Anh da toi uu (khong giai thich)

2. Dung ket qua lam `enhancedPrompt` truyen vao Fal.ai

3. Secret `GOOGLE_AI_API_KEY` da co san, khong can them secret moi

4. Neu buoc toi uu that bai (timeout, loi API), fallback ve prompt goc + quality boost nhu hien tai de khong lam gian doan trai nghiem

### Khong thay doi gi o:
- Che do Spiritual (van dung Google Gemini truc tiep de tao anh)
- Logic check/increment usage
- Frontend

## Ket qua mong doi

- User Viet Nam go "con meo dang ngoi thien" -> Flux nhan "A serene cat sitting in deep meditation pose, zen garden background, soft ethereal lighting, high resolution, 8K UHD, detailed fur texture"
- Chat luong anh tang dang ke nho prompt tieng Anh chuyen nghiep
- Khong anh huong toc do nhieu (Gemini Flash rat nhanh, ~0.5-1s)
- Neu Gemini loi, van fallback ve prompt goc

