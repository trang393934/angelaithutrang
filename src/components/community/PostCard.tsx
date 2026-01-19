import { useState } from "react";
import { Heart, MessageCircle, Share2, Award, Coins, Send, Loader2, MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import { CommunityPost, CommunityComment } from "@/hooks/useCommunityPosts";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onLike: (postId: string) => Promise<any>;
  onShare: (postId: string) => Promise<any>;
  onComment: (postId: string, content: string) => Promise<any>;
  onEdit?: (postId: string, content: string, imageUrl?: string) => Promise<any>;
  onDelete?: (postId: string) => Promise<any>;
  fetchComments: (postId: string) => Promise<CommunityComment[]>;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onShare,
  onComment,
  onEdit,
  onDelete,
  fetchComments,
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  
  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === post.user_id;

  const handleLike = async () => {
    setIsLiking(true);
    await onLike(post.id);
    setIsLiking(false);
  };

  const handleShare = async () => {
    setIsSharing(true);
    await onShare(post.id);
    setIsSharing(false);
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      setIsLoadingComments(true);
      const data = await fetchComments(post.id);
      setComments(data);
      setIsLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    const result = await onComment(post.id, commentText.trim());
    
    if (result.success) {
      setCommentText("");
      // Refresh comments
      const data = await fetchComments(post.id);
      setComments(data);
    }
    setIsSubmittingComment(false);
  };

  const handleStartEdit = () => {
    setEditContent(post.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
  };

  const handleSubmitEdit = async () => {
    if (!editContent.trim() || !onEdit) return;

    setIsSubmittingEdit(true);
    const result = await onEdit(post.id, editContent.trim(), post.image_url || undefined);
    
    if (result.success) {
      setIsEditing(false);
    }
    setIsSubmittingEdit(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    await onDelete(post.id);
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const isNearThreshold = post.likes_count >= 3 && post.likes_count < 5;

  return (
    <>
      <Card className={`
        overflow-hidden transition-all duration-300
        ${post.is_rewarded ? 'border-amber-300 bg-gradient-to-r from-amber-50/50 to-orange-50/30' : 'border-primary/10'}
      `}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-11 h-11 border-2 border-primary/20">
              <AvatarImage src={post.user_avatar_url || angelAvatar} alt={post.user_display_name} />
              <AvatarFallback>{post.user_display_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {post.user_display_name}
                </span>
                {post.is_rewarded && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Đã thưởng
                  </span>
                )}
              </div>
              <span className="text-xs text-foreground-muted">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
              </span>
            </div>

            {/* Owner Actions Menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleStartEdit} className="cursor-pointer">
                    <Pencil className="w-4 h-4 mr-2" />
                    Chỉnh sửa bài viết
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)} 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa bài viết
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content - Normal or Edit Mode */}
          {isEditing ? (
            <div className="mb-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="Nội dung bài viết..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelEdit}
                  disabled={isSubmittingEdit}
                >
                  <X className="w-4 h-4 mr-1" />
                  Hủy
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSubmitEdit}
                  disabled={!editContent.trim() || isSubmittingEdit}
                  className="bg-sapphire-gradient"
                >
                  {isSubmittingEdit ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  Lưu
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {/* Image */}
          {post.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-foreground-muted mb-3 pb-3 border-b border-primary/10">
            <span>{post.likes_count} lượt thích</span>
            <span>{post.comments_count} bình luận</span>
            <span>{post.shares_count} chia sẻ</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`flex-1 ${post.is_liked_by_me ? 'text-red-500' : 'text-foreground-muted'}`}
            >
              <Heart className={`w-5 h-5 mr-2 ${post.is_liked_by_me ? 'fill-red-500' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
              Thích
              {isNearThreshold && !post.is_rewarded && (
                <span className="text-xs text-blue-600 ml-1">({5 - post.likes_count} nữa!)</span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              className="flex-1 text-foreground-muted"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Bình luận
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={isSharing || post.is_shared_by_me || post.user_id === currentUserId}
              className={`flex-1 ${post.is_shared_by_me ? 'text-green-600' : 'text-foreground-muted'}`}
            >
              {isSharing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Share2 className={`w-5 h-5 mr-2 ${post.is_shared_by_me ? 'fill-green-200' : ''}`} />
              )}
              {post.is_shared_by_me ? 'Đã chia sẻ' : 'Chia sẻ'}
            </Button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-primary/10"
              >
                {/* Comment Input */}
                <div className="flex gap-3 mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={angelAvatar} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Viết bình luận (tối thiểu 50 ký tự để nhận thưởng)..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                    />
                    <Button
                      size="icon"
                      onClick={handleSubmitComment}
                      disabled={commentText.length < 1 || isSubmittingComment}
                      className="bg-sapphire-gradient"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-foreground-muted mb-3">
                  {commentText.length}/50 ký tự
                  {commentText.length >= 50 && (
                    <span className="text-green-600 ml-2">✓ Đủ điều kiện nhận thưởng</span>
                  )}
                </div>

                {/* Comments List */}
                {isLoadingComments ? (
                  <div className="text-center py-4 text-foreground-muted">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-foreground-muted text-sm">
                    Chưa có bình luận nào
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.user_avatar_url || angelAvatar} />
                          <AvatarFallback>{comment.user_display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-primary/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.user_display_name}</span>
                            {comment.is_rewarded && (
                              <Coins className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-foreground/90">{comment.content}</p>
                          <span className="text-xs text-foreground-muted mt-1 block">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
              Tất cả bình luận và lượt thích cũng sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa bài viết"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
