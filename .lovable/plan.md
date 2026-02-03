
# Kế hoạch: Giữ lại cuộc trò chuyện khi quay lại trang Chat trên điện thoại

## Tổng quan vấn đề

Khi người dùng đang chat với Angel AI trên điện thoại và chuyển sang ứng dụng khác (VD: đọc tin nhắn, check email), khi quay lại trang Chat thì cuộc trò chuyện bị mất - phải vào lịch sử chat để tìm lại.

**Mong muốn**: Cuộc trò chuyện trước đó vẫn hiển thị sẵn để tiếp tục. Nếu muốn tạo cuộc trò chuyện mới thì nhấn nút "+".

## Giải pháp

Lưu session ID đang hoạt động vào bộ nhớ tạm của trình duyệt (localStorage). Khi quay lại trang Chat, tự động tải lại cuộc trò chuyện đó.

## Các bước thực hiện

### Bước 1: Cập nhật `useChatSessions.ts`

Thêm logic persist session vào localStorage:

```text
┌─────────────────────────────────────────────────────────────┐
│                   Luồng hoạt động mới                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User vào Chat → Kiểm tra localStorage có session ID?   │
│           ↓                                                 │
│  2. CÓ → Tải session từ database → Hiển thị tin nhắn cũ    │
│           ↓                                                 │
│  3. KHÔNG → Hiển thị trang chat trống (welcome message)    │
│           ↓                                                 │
│  4. User gửi tin nhắn → Tạo session mới → Lưu ID vào       │
│     localStorage                                            │
│           ↓                                                 │
│  5. User nhấn "+" → Xóa localStorage → Trang trống mới     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Thay đổi cụ thể:**
- Thêm hằng số `LAST_SESSION_KEY = 'angel_ai_last_session_id'`
- Khi `setCurrentSession` được gọi với session hợp lệ → Lưu session ID vào localStorage
- Khi `endCurrentSession` hoặc tạo chat mới → Xóa localStorage
- Thêm logic trong `useEffect` khởi tạo: Nếu có session ID trong localStorage → Tự động `selectSession`

### Bước 2: Cập nhật `Chat.tsx`

Điều chỉnh logic khởi tạo để phối hợp với việc restore session:

**Thay đổi:**
- Thêm state `isRestoringSession` để tránh hiển thị welcome message trong lúc đang tải session cũ
- Đợi `useChatSessions` hoàn tất việc restore trước khi hiển thị nội dung

### Bước 3: Cập nhật `handleNewSession`

Đảm bảo khi user nhấn nút "+" (tạo chat mới):
- Xóa session ID trong localStorage
- Reset về trạng thái chat mới

---

## Chi tiết kỹ thuật

### File 1: `src/hooks/useChatSessions.ts`

```typescript
// Thêm constant cho localStorage key
const LAST_SESSION_KEY = 'angel_ai_last_session_id';

// Trong useChatSessions hook:

// 1. Thêm function lưu session ID
const saveLastSessionId = (sessionId: string | null) => {
  if (sessionId) {
    localStorage.setItem(LAST_SESSION_KEY, sessionId);
  } else {
    localStorage.removeItem(LAST_SESSION_KEY);
  }
};

// 2. Cập nhật selectSession để lưu vào localStorage
const selectSession = useCallback(async (session: ChatSession | null) => {
  setCurrentSession(session);
  saveLastSessionId(session?.id || null); // Lưu vào localStorage
  if (session) {
    await fetchSessionMessages(session.id);
  } else {
    setSessionMessages([]);
  }
}, [fetchSessionMessages]);

// 3. Cập nhật endCurrentSession để xóa localStorage
const endCurrentSession = useCallback(async () => {
  if (currentSession) {
    await updateSession(currentSession.id, { title: currentSession.title });
  }
  setCurrentSession(null);
  setSessionMessages([]);
  saveLastSessionId(null); // Xóa localStorage khi kết thúc session
}, [currentSession, updateSession]);

// 4. Thêm logic restore session trong useEffect
useEffect(() => {
  const restoreLastSession = async () => {
    if (!user) return;
    
    const lastSessionId = localStorage.getItem(LAST_SESSION_KEY);
    if (lastSessionId && sessions.length > 0) {
      // Tìm session trong danh sách đã tải
      const lastSession = sessions.find(s => s.id === lastSessionId);
      if (lastSession) {
        // Chỉ restore nếu session còn tồn tại
        await selectSession(lastSession);
      } else {
        // Session đã bị xóa, xóa khỏi localStorage
        localStorage.removeItem(LAST_SESSION_KEY);
      }
    }
  };
  
  // Chạy sau khi sessions được tải xong
  if (!isLoading && sessions.length >= 0) {
    restoreLastSession();
  }
}, [user, sessions, isLoading]); // Dependency: chạy khi sessions thay đổi
```

### File 2: `src/pages/Chat.tsx`

```typescript
// Không cần thay đổi nhiều, chỉ đảm bảo:

// handleNewSession đã gọi endCurrentSession() đúng cách
const handleNewSession = async () => {
  await endCurrentSession(); // Đã có sẵn - sẽ xóa localStorage
  setMessages([{ role: "assistant", content: t("chat.welcome"), type: "text" }]);
  toast.success("Bắt đầu cuộc trò chuyện mới");
};
```

---

## Kết quả mong đợi

| Tình huống | Trước | Sau |
|------------|-------|-----|
| User quay lại Chat sau khi chuyển app | Mất cuộc trò chuyện, phải vào lịch sử | Cuộc trò chuyện trước hiển thị sẵn |
| User nhấn nút "+" | Tạo chat mới | Tạo chat mới (không đổi) |
| User xóa session trong lịch sử | Session bị xóa | Session bị xóa + xóa khỏi localStorage nếu là session hiện tại |
| User đăng xuất | N/A | localStorage được xóa tự động khi user = null |

---

## Lưu ý

- localStorage persist qua các lần refresh trang và chuyển app
- Session sẽ được restore cho đến khi user chủ động tạo chat mới hoặc xóa session đó
- Không ảnh hưởng đến các tính năng khác như tạo ảnh, phân tích ảnh

