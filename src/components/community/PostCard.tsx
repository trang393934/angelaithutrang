import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Award, Coins, Send, Loader2, MoreHorizontal, Pencil, Trash2, X, Check, Image, ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import { CommunityPost, CommunityComment } from "@/hooks/useCommunityPosts";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { ImageLightbox } from "./ImageLightbox";
import ShareDialog from "@/components/ShareDialog";
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
  const [editImageUrl, setEditImageUrl] = useState<string | null>(post.image_url);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Image lightbox state
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  
  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isOwner = currentUserId === post.user_id;

  const handleLike = async () => {
    setIsLiking(true);
    await onLike(post.id);
    setIsLiking(false);
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
  };

  const handleShareSuccess = async () => {
    setIsSharing(true);
    await onShare(post.id);
    setIsSharing(false);
    setShowShareDialog(false);
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
    setEditImageUrl(post.image_url);
    setEditImageFile(null);
    setEditImagePreview(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setEditImageUrl(post.image_url);
    setEditImageFile(null);
    setEditImagePreview(null);
    setIsEditing(false);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ảnh không được vượt quá 5MB");
        return;
      }
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      // Clear the existing image URL since we're uploading a new one
      setEditImageUrl(null);
    }
  };

  const handleRemoveEditImage = () => {
    setEditImageUrl(null);
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const uploadEditImage = async (file: File): Promise<string | null> => {
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("community")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editContent.trim() || !onEdit) return;

    setIsSubmittingEdit(true);
    
    let finalImageUrl: string | undefined = editImageUrl || undefined;
    
    // Upload new image if selected
    if (editImageFile) {
      const uploadedUrl = await uploadEditImage(editImageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }
    
    const result = await onEdit(post.id, editContent.trim(), finalImageUrl);
    
    if (result.success) {
      setIsEditing(false);
      setEditImageFile(null);
      setEditImagePreview(null);
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
            <Link to={`/user/${post.user_id}`}>
              <Avatar className="w-11 h-11 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                <AvatarImage src={post.user_avatar_url || angelAvatar} alt={post.user_display_name} />
                <AvatarFallback>{post.user_display_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/user/${post.user_id}`} className="hover:underline">
                  <span className="font-semibold text-foreground">
                    {post.user_display_name}
                  </span>
                </Link>
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
            <div className="mb-4 space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="Nội dung bài viết..."
              />
              
              {/* Edit Image Section */}
              <div className="space-y-2">
                {/* Show current/new image preview */}
                {(editImageUrl || editImagePreview) && (
                  <div className="relative inline-block">
                    <img
                      src={editImagePreview || editImageUrl || ""}
                      alt="Preview"
                      className="max-h-48 rounded-lg object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleRemoveEditImage}
                      disabled={isSubmittingEdit || isUploadingImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Image upload input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageSelect}
                  ref={editFileInputRef}
                  className="hidden"
                />
                
                {/* Image action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isSubmittingEdit || isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Image className="w-4 h-4 mr-1" />
                    )}
                    {editImageUrl || editImagePreview ? "Đổi ảnh" : "Thêm ảnh"}
                  </Button>
                  
                  {(editImageUrl || editImagePreview) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveEditImage}
                      disabled={isSubmittingEdit || isUploadingImage}
                      className="text-red-600 hover:text-red-700"
                    >
                      <ImageOff className="w-4 h-4 mr-1" />
                      Xóa ảnh
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelEdit}
                  disabled={isSubmittingEdit || isUploadingImage}
                >
                  <X className="w-4 h-4 mr-1" />
                  Hủy
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSubmitEdit}
                  disabled={!editContent.trim() || isSubmittingEdit || isUploadingImage}
                  className="bg-sapphire-gradient"
                >
                  {isSubmittingEdit || isUploadingImage ? (
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

          {/* Image - only show in non-edit mode */}
          {!isEditing && post.image_url && (
            <div 
              className="mb-4 rounded-xl overflow-hidden cursor-pointer group relative"
              onClick={() => setShowImageLightbox(true)}
            >
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full max-h-96 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
                  Nhấn để xem
                </span>
              </div>
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
              onClick={handleShareClick}
              disabled={isSharing || post.is_shared_by_me || post.user_id === currentUserId || !currentUserId}
              className={`flex-1 ${post.is_shared_by_me ? 'text-green-600' : 'text-foreground-muted'}`}
              title={!currentUserId ? 'Vui lòng đăng nhập để chia sẻ' : post.user_id === currentUserId ? 'Không thể chia sẻ bài viết của mình' : ''}
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

      {/* Image Lightbox */}
      {post.image_url && (
        <ImageLightbox
          imageUrl={post.image_url}
          alt="Post image"
          isOpen={showImageLightbox}
          onClose={() => setShowImageLightbox(false)}
        />
      )}

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        contentType="post"
        contentId={post.id}
        title={`Bài viết từ ${post.user_display_name}`}
        content={post.content}
        onShareSuccess={handleShareSuccess}
        showRewards={!post.is_shared_by_me && post.user_id !== currentUserId}
        rewardAmount={500}
      />
    </>
  );
}
