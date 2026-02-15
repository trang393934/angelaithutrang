
# Chinh xac Model ID va kich thuoc anh cho che do Fast

## Van de hien tai

| Thuoc tinh | Hien tai | Can doi |
|-----------|---------|--------|
| Model ID (URL) | `fal-ai/flux/schnell` | `fal-ai/flux-1/schnell` |
| Image size | `"square_hd"` (co the > 1MP) | `{ width: 1024, height: 1024 }` (chinh xac 1MP = $0.003) |

## Thay doi

### File: `supabase/functions/generate-image/index.ts`

**Dong 134**: Doi URL endpoint
- Tu: `https://fal.run/fal-ai/flux/schnell`
- Thanh: `https://fal.run/fal-ai/flux-1/schnell`

**Dong 142**: Doi `image_size`
- Tu: `"square_hd"`
- Thanh: `{ "width": 1024, "height": 1024 }`

Chi 2 dong thay doi, khong anh huong logic khac.

## Ket qua

- Model ID chinh xac: `fal-ai/flux-1/schnell`
- Kich thuoc co dinh 1024x1024 (1 Megapixel)
- Gia: $0.003/anh (muc thap nhat cua Fal.ai Flux Schnell)
