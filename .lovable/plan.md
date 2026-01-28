
# Kế hoạch: Cải thiện UX thả Like/Reaction trên trang Cộng đồng

## Vấn đề hiện tại
1. **Thời gian chờ ~5s**: Edge function xử lý nhiều bước tuần tự
2. **Trang scroll về đầu**: Realtime subscription gọi `fetchPosts()` sau mỗi thay đổi, gây re-render toàn bộ danh sách

## Giải pháp

### Phần 1: Tối ưu Realtime Subscription (Nguyên nhân chính)

**File:** `src/hooks/useCommunityPosts.ts`

Thay vì gọi `fetchPosts()` khi nhận realtime event, ta sẽ:
- **Bỏ việc refetch toàn bộ** khi có UPDATE event từ realtime
- Chỉ **merge payload data** trực tiếp vào state hiện tại
- Giữ nguyên vị trí scroll vì không có re-render toàn bộ

```text
Trước:
┌───────────────────────────────────────┐
│  Realtime Event (UPDATE)              │
│       ↓                               │
│  fetchPosts() → Full API call         │
│       ↓                               │
│  setPosts(newPosts) → Full re-render  │
│       ↓                               │
│  Scroll reset về đầu ❌                │
└───────────────────────────────────────┘

Sau:
┌───────────────────────────────────────┐
│  Realtime Event (UPDATE)              │
│       ↓                               │
│  Merge payload vào post tương ứng     │
│       ↓                               │
│  Chỉ re-render 1 PostCard ✅           │
│       ↓                               │
│  Giữ nguyên scroll position ✅         │
└───────────────────────────────────────┘
```

### Phần 2: Bỏ refetch khi toggle_like thành công

**File:** `src/hooks/useCommunityPosts.ts` - function `toggleLike`

Hiện tại đã có optimistic update tốt. Tuy nhiên sau khi edge function response, realtime vẫn trigger refetch. Ta cần:
- Loại bỏ việc refetch trong realtime callback cho UPDATE events
- Chỉ fetch lại khi có INSERT (bài viết mới) để thêm vào list

### Phần 3: Skip Realtime trigger cho chính user đang thao tác

**File:** `src/hooks/useCommunityPosts.ts`

- Thêm một "pending action" ref để track các post đang được like
- Khi realtime event đến cho post đang pending → skip, không update state
- Điều này tránh conflict giữa optimistic update và realtime update

## Chi tiết Implementation

### Thay đổi 1: Cải tiến Realtime Subscription

```typescript
// Thay thế logic hiện tại
.on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' },
  (payload) => {
    if (payload.eventType === 'DELETE') {
      setPosts(current => current.filter(p => p.id !== payload.old.id));
      return;
    }
    
    if (payload.eventType === 'INSERT') {
      // Chỉ refetch khi có bài viết MỚI
      fetchPosts();
      return;
    }
    
    if (payload.eventType === 'UPDATE') {
      // KHÔNG refetch - chỉ merge data vào post tương ứng
      const updated = payload.new;
      setPosts(current => current.map(p => 
        p.id === updated.id 
          ? { ...p, 
              likes_count: updated.likes_count ?? p.likes_count,
              comments_count: updated.comments_count ?? p.comments_count,
              shares_count: updated.shares_count ?? p.shares_count,
              is_rewarded: updated.is_rewarded ?? p.is_rewarded,
            }
          : p
      ));
    }
  }
)
```

### Thay đổi 2: Thêm Pending Action Tracking

```typescript
// Thêm ref để track pending actions
const pendingLikesRef = useRef<Set<string>>(new Set());

// Trong toggleLike - đánh dấu pending trước khi call API
pendingLikesRef.current.add(postId);

// Sau khi API trả về - xóa pending
pendingLikesRef.current.delete(postId);

// Trong realtime callback - skip nếu post đang pending
if (payload.eventType === 'UPDATE') {
  const postId = payload.new?.id;
  if (pendingLikesRef.current.has(postId)) {
    // Skip - đang có optimistic update xử lý rồi
    return;
  }
  // ... merge logic
}
```

## Kết quả mong đợi

| Trước | Sau |
|-------|-----|
| Like → chờ 5s | Like → UI update ngay lập tức |
| Scroll về đầu trang | Giữ nguyên vị trí scroll |
| Re-render toàn bộ list | Chỉ re-render 1 PostCard |
| Realtime gây conflict | Realtime skip khi đang pending |

## Files cần chỉnh sửa

1. **`src/hooks/useCommunityPosts.ts`**
   - Cải tiến realtime subscription logic
   - Thêm pending action tracking
   - Tối ưu UPDATE event handling
