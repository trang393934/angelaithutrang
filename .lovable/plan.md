

# Kế hoạch: Sửa lỗi giao dịch Web3 không hiển thị trong Lịch sử

## Nguyên nhân gốc rễ

Sau khi kiểm tra kỹ, Cha đã tìm ra vấn đề:

1. **Giao dịch on-chain đã thành công**: ANGEL ÁNH NGUYỆT gửi 10,000 CAMLY đến Angel Ai Van (ví `0x5102E...8a402`) -- blockchain xác nhận OK.

2. **Nhưng `record-gift` không ghi được vào database**: Hàm `record-gift` edge function đang hoạt động (đã kiểm tra), nhưng không có log nào cho thấy nó được gọi thành công. Điều này nghĩa là cuộc gọi từ trình duyệt đến edge function đã thất bại (có thể do mất kết nối mạng, trình duyệt đóng quá sớm sau khi MetaMask xác nhận, hoặc lỗi timeout).

3. **Cơ chế retry đã lưu vào localStorage**: Code hiện tại có retry 3 lần, và nếu thất bại sẽ lưu vào `localStorage` dưới dạng `pending_gift_records`. Tuy nhiên, nếu người dùng đóng trình duyệt hoặc xóa cache, dữ liệu pending sẽ bị mất.

4. **BSCScan cron job sẽ tự động bắt giao dịch này**: Cron job chạy lúc 2:00 AM UTC hàng ngày đã được thiết lập và đang hoạt động. Cả 2 ví (người gửi `0xf398...` và người nhận `0x5102E...`) đều đã đăng ký trong hệ thống. Vì vậy giao dịch này SẼ được tự động đồng bộ vào lần chạy cron tiếp theo.

## Vấn đề cần khắc phục

Mặc dù cron job sẽ bắt giao dịch, có 2 vấn đề cần sửa để tránh tái phát:

### Vấn đề 1: Không có cơ chế đồng bộ lại tức thì cho người dùng
Hiện tại chỉ admin mới có nút "Đồng bộ BSCScan". Người dùng thường không có cách nào để kích hoạt đồng bộ khi giao dịch bị lỗi ghi.

### Vấn đề 2: Retry logic dễ bị mất dữ liệu
Nếu trình duyệt đóng trước khi 3 lần retry hoàn tất, hoặc localStorage bị xóa, giao dịch sẽ bị mất cho đến khi cron job chạy.

## Kế hoạch sửa chữa

### Buoc 1: Kích hoạt đồng bộ BSCScan ngay lập tức
- Gọi hàm `sync-bscscan-gifts` thủ công ngay bây giờ để giao dịch bị thiếu được ghi vào database
- Giao dịch CAMLY từ ví `0xf398...` đến `0x5102E...` sẽ được bắt và hiển thị

### Buoc 2: Thêm nút "Đồng bộ" cho tất cả người dùng đã đăng nhập
- Hiện tại chỉ admin thấy nút đồng bộ BSCScan
- Thêm nút đồng bộ nhỏ cho người dùng thường (giới hạn 1 lần/giờ để tránh lạm dụng API)
- Khi bấm, hệ thống sẽ quét ví của chính người dùng đó trên BSCScan

### Buoc 3: Cải thiện retry logic trong CryptoTransferTab
- Sau khi blockchain xác nhận thành công, nếu `record-gift` thất bại, hiển thị thông báo rõ ràng hơn cho người dùng
- Tự động retry pending gifts khi người dùng mở lại trang Activity History
- Thêm nút "Đồng bộ giao dịch thiếu" trên trang Activity History cho tất cả người dùng

## Chi tiết kỹ thuật

### Tệp cần sửa đổi

| Tệp | Thay đổi |
|-----|---------|
| `src/pages/ActivityHistory.tsx` | Thêm nút đồng bộ cho người dùng thường (không chỉ admin). Tự động retry pending gifts từ localStorage khi tải trang. |
| `supabase/functions/sync-bscscan-gifts/index.ts` | Cho phép người dùng thường gọi hàm này nhưng chỉ quét ví của chính họ (không phải tất cả ví như admin). |

### Logic xác thực mới cho sync-bscscan-gifts

```text
Hiện tại:
- Admin: quét TẤT CẢ ví
- Cron: quét TẤT CẢ ví
- User thường: KHÔNG ĐƯỢC PHÉP

Sau khi sửa:
- Admin: quét TẤT CẢ ví (giữ nguyên)
- Cron: quét TẤT CẢ ví (giữ nguyên)  
- User thường: CHỈ quét ví của chính mình (mới)
```

### Tự động retry pending gifts

```text
Khi trang ActivityHistory tải:
1. Kiểm tra localStorage có "pending_gift_records" không
2. Nếu có, tự động gọi record-gift để thử ghi lại
3. Nếu thành công, xóa khỏi localStorage và hiển thị thông báo
4. Nếu thất bại, giữ nguyên và hiển thị banner cảnh báo
```

## Kết quả mong đợi

- Giao dịch 10,000 CAMLY từ ANGEL ÁNH NGUYỆT đến Angel Ai Van sẽ hiển thị ngay sau khi đồng bộ
- Trong tương lai, mọi giao dịch Web3 sẽ được ghi nhận qua ít nhất 3 cơ chế: (1) record-gift trực tiếp, (2) localStorage retry, (3) BSCScan cron hàng ngày
- Người dùng có thể tự kích hoạt đồng bộ ví của mình mà không cần nhờ admin
