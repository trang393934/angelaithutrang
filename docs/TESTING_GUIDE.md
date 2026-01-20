# 📋 Hướng Dẫn Test Hệ Thống Angel AI

> **Mục đích**: Kiểm tra đầy đủ các flow chính trước khi launch cho users
> **Thời gian ước tính**: 30-45 phút cho full test

---

## 🔐 1. Authentication Flow

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 1.1 | Đăng ký mới | Vào /auth → Nhập email mới + password → Submit | Account tạo thành công, redirect về app |  |
| 1.2 | Đăng ký với password yếu | Dùng password "123456" hoặc "password" | Hiện lỗi, không cho đăng ký |  |
| 1.3 | Đăng ký với password bị lộ | Dùng password phổ biến đã bị breach | Hiện cảnh báo Leaked Password |  |
| 1.4 | Đăng nhập đúng | Nhập email/password đã đăng ký | Login thành công, thấy avatar |  |
| 1.5 | Đăng nhập sai | Nhập sai password | Hiện lỗi "Invalid credentials" |  |
| 1.6 | Đăng xuất | Click avatar → Logout | Trở về trạng thái guest |  |

---

## 💬 2. Chat AI Flow

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 2.1 | Gửi câu hỏi cơ bản | Vào /chat → Nhập "Làm sao để sống hạnh phúc?" | AI trả lời với streaming text |  |
| 2.2 | Nhận coin từ câu hỏi hay | Hỏi câu hỏi sâu sắc, có ý nghĩa | Popup thông báo nhận 1-5 CAMLY |  |
| 2.3 | Câu chào hỏi đơn giản | Gửi "Xin chào", "Hello" | AI chào lại, KHÔNG tặng coin |  |
| 2.4 | Câu hỏi spam/ngắn | Gửi "abc", "123", "test" | AI từ chối hoặc không reward |  |
| 2.5 | Câu hỏi tiêu cực | Hỏi nội dung toxic/harmful | AI từ chối trả lời lịch sự |  |
| 2.6 | Share conversation | Click Share button | Mở dialog share thành công |  |

---

## 📝 3. Gratitude Journal Flow

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 3.1 | Viết journal đầu tiên | Earn → Viết gratitude > 50 ký tự | Lưu thành công, hiện toast |  |
| 3.2 | Nhận reward từ journal | Viết nội dung chân thành | Nhận CAMLY coins |  |
| 3.3 | Journal quá ngắn | Viết < 20 ký tự | Hiện warning/không cho submit |  |
| 3.4 | Daily limit | Viết > 3 journals trong ngày | Thông báo đã hết limit |  |
| 3.5 | Xem history | Check journal history | Thấy các entries đã viết |  |

---

## 👥 4. Community Posts Flow

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 4.1 | Tạo post mới | Community → Viết nội dung → Post | Post hiện trong feed |  |
| 4.2 | Post với hình ảnh | Upload image khi tạo post | Hiển thị image preview |  |
| 4.3 | Like post | Click heart icon | Count tăng, animation |  |
| 4.4 | Unlike post | Click heart lần nữa | Count giảm |  |
| 4.5 | Comment on post | Mở post → Viết comment | Comment hiện dưới post |  |
| 4.6 | Share post | Click share icon | Mở share dialog |  |
| 4.7 | Nhận coin từ engagement | Được like/share bởi người khác | Nhận reward notification |  |

---

## ❓ 5. Community Questions Flow

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 5.1 | Đặt câu hỏi mới | Questions → Nhập câu hỏi → Submit | Câu hỏi xuất hiện trong list |  |
| 5.2 | Like câu hỏi | Click like trên question | Like count tăng |  |
| 5.3 | Reply câu hỏi | Click reply → Viết answer | Reply hiện dưới question |  |
| 5.4 | Câu hỏi trùng lặp | Submit câu hỏi giống nhau | Hiện warning hoặc merge |  |

---

## 🏆 6. Leaderboard & Earn Flow

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 6.1 | Xem leaderboard | Mở /earn hoặc leaderboard section | Thấy ranking users với coins |  |
| 6.2 | Daily login | Login lần đầu trong ngày | Nhận daily login bonus |  |
| 6.3 | Login streak | Login nhiều ngày liên tiếp | Streak count tăng, bonus cao hơn |  |
| 6.4 | Early adopter progress | Xem progress section | Thấy % và số questions needed |  |
| 6.5 | Xem earn breakdown | Expand earnings detail | Thấy chi tiết từng nguồn coin |  |

---

## 👤 7. Profile & Wallet Flow

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 7.1 | Xem profile bản thân | Click avatar → Profile | Thấy full profile info |  |
| 7.2 | Edit display name | Profile → Edit name | Lưu thành công |  |
| 7.3 | Update avatar | Upload new avatar | Avatar đổi trên toàn app |  |
| 7.4 | Xem balance | Header hoặc profile | Thấy số CAMLY coins chính xác |  |
| 7.5 | Connect wallet | Profile → Connect Web3 wallet | MetaMask popup, connect BSC |  |
| 7.6 | Xem user profile khác | Click vào avatar user khác | Thấy public profile |  |

---

## 🔒 8. Security Tests (QUAN TRỌNG!)

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 8.1 | Protected route khi chưa login | Logout → Vào /earn, /community | Redirect về /auth |  |
| 8.2 | API spoofing test | Dùng Postman gọi edge function không có JWT | Response 401 Unauthorized |  |
| 8.3 | Profile privacy | Logout → Query profiles API | Không trả về data |  |
| 8.4 | userId spoofing | Thử modify request với fake userId | Request bị reject hoặc dùng JWT userId |  |
| 8.5 | Rate limiting | Gửi 50+ requests liên tiếp | Bị slow down hoặc block |  |

---

## 📱 9. Responsive & Cross-Browser

| # | Test Case | Bước thực hiện | Kết quả mong đợi | ✓/✗ |
|---|-----------|----------------|------------------|-----|
| 9.1 | Mobile view | Resize browser 375px | Layout không bị vỡ |  |
| 9.2 | Tablet view | Resize browser 768px | Layout responsive |  |
| 9.3 | Chrome | Test full flow | Hoạt động bình thường |  |
| 9.4 | Firefox | Test full flow | Hoạt động bình thường |  |
| 9.5 | Safari | Test full flow | Hoạt động bình thường |  |

---

## 🐛 Bug Report Template

Nếu phát hiện bug, ghi lại theo format sau:

```
**Bug ID**: BUG-XXX
**Severity**: Critical / High / Medium / Low
**Flow**: (ví dụ: Authentication)
**Test Case**: (ví dụ: 1.3)
**Mô tả**: 
**Steps to reproduce**:
1. 
2. 
3. 
**Expected result**: 
**Actual result**: 
**Screenshot/Video**: 
**Browser/Device**: 
```

---

## ✅ Sign-off Checklist

Trước khi launch, đảm bảo:

- [ ] Tất cả test cases Authentication PASSED
- [ ] Tất cả test cases Chat AI PASSED  
- [ ] Tất cả test cases Security PASSED
- [ ] Không có Critical/High bugs chưa fix
- [ ] Leaked Password Protection đã BẬT
- [ ] Test trên ít nhất 2 browsers
- [ ] Test responsive mobile

---

**Tested by**: _________________  
**Date**: _________________  
**Result**: ⬜ PASSED / ⬜ FAILED  
**Notes**: 
