

# Doi nen cac bang Chuc Mung sang vang anh kim (Metallic Gold)

## Tong quan
Thay doi nen (background) cua **4 component** tu gradient cam-da cam hien tai sang **nen vang anh kim (metallic gold brushed)** giong hinh mau da dinh kem. Nen moi se su dung CSS gradient phuc tap mo phong hieu ung kim loai vang bong sang, co hieu ung anh sang brushed metal.

## Cac component can thay doi

### 1. WithdrawalCelebration.tsx
- **Hien tai**: `bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600`
- **Doi thanh**: Metallic gold gradient voi hieu ung brushed metal (inline style)

### 2. TipCelebrationReceipt.tsx (Popup chuc mung khi tang thanh cong)
- **Hien tai**: `bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600`
- **Doi thanh**: Metallic gold gradient tuong tu

### 3. LiXiCelebrationDialog.tsx (Da co nen vang nhung can thong nhat)
- **Hien tai**: inline style gradient `#8B6914, #C49B30, #E8C252, #F5D976...`
- **Dong nhat**: Cap nhat sang nen metallic gold giong cac component khac, co them hieu ung anh sang brushed metal sang hon

### 4. Receipt.tsx (Trang bien nhan cong khai)
- **Header hien tai**: `bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500`
- **Doi thanh**: Metallic gold header
- **Background trang**: Tu `from-amber-50 to-white` sang metallic gold nhe

## Chi tiet ky thuat

### CSS Metallic Gold Gradient
Su dung inline style voi gradient phuc tap de tao hieu ung vang anh kim giong hinh mau:

```css
background: linear-gradient(
  135deg, 
  #b8860b 0%,
  #daa520 15%,
  #ffd700 30%,
  #ffec8b 45%,
  #ffd700 55%,
  #daa520 70%,
  #b8860b 85%,
  #cd950c 100%
)
```

Ket hop voi lop overlay tao hieu ung anh sang brushed metal:
```css
background-image: 
  linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 30%, transparent 50%, rgba(255,255,255,0.15) 70%, transparent 100%),
  linear-gradient(...)
```

### Danh sach thay doi cu the

| File | Vi tri | Thay doi |
|------|--------|----------|
| `WithdrawalCelebration.tsx` | Dong 119 | Doi className gradient sang inline style metallic gold |
| `TipCelebrationReceipt.tsx` | Dong 154 | Doi className gradient sang inline style metallic gold |
| `LiXiCelebrationDialog.tsx` | Dong 104 | Cap nhat inline style gradient sang phien ban sang hon |
| `Receipt.tsx` | Dong 102 | Doi header gradient sang metallic gold |

### Nut hanh dong
- Nut "Dong" / "Close" giu nguyen mau trang/amber cho tuong phan
- Nut "Sao chep link" giu border trang/semi-transparent
- Text tren nen vang anh kim giu mau trang de de doc

