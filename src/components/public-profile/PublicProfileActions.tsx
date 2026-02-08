import { UserPlus, MessageCircle, Gift, UserCheck, Clock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuthActionGuard } from "@/components/AuthActionGuard";
import { useAuth } from "@/hooks/useAuth";
import { useFriendship } from "@/hooks/useFriendship";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";

interface PublicProfileActionsProps {
  userId: string;
  displayName: string | null;
}

export function PublicProfileActions({ userId, displayName }: PublicProfileActionsProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const {
    friendshipStatus,
    isLoading: friendshipLoading,
    sendFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
  } = useFriendship(userId);

  const isOwnProfile = user?.id === userId;

  if (isOwnProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 mt-6"
      >
        <Link to="/profile">
          <Button variant="outline" size="lg">
            {t("publicProfile.editProfile") || "Chỉnh sửa hồ sơ"}
          </Button>
        </Link>
      </motion.div>
    );
  }

  const renderFriendButton = () => {
    if (friendshipLoading) {
      return (
        <Button disabled size="lg">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        </Button>
      );
    }

    if (!friendshipStatus) {
      return (
        <AuthActionGuard>
          <Button size="lg" onClick={() => sendFriendRequest(userId)}>
            <UserPlus className="w-4 h-4 mr-2" />
            {t("publicProfile.addFriend") || "Kết bạn"}
          </Button>
        </AuthActionGuard>
      );
    }

    if (friendshipStatus.status === "pending") {
      if (friendshipStatus.requester_id === user?.id) {
        return (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => cancelFriendRequest(friendshipStatus.id)}
          >
            <Clock className="w-4 h-4 mr-2" />
            {t("publicProfile.requestSent") || "Đã gửi lời mời"}
          </Button>
        );
      }
      return (
        <Button
          size="lg"
          onClick={() => acceptFriendRequest(friendshipStatus.id)}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          {t("publicProfile.acceptRequest") || "Chấp nhận"}
        </Button>
      );
    }

    if (friendshipStatus.status === "accepted") {
      return (
        <Button variant="secondary" size="lg">
          <UserCheck className="w-4 h-4 mr-2" />
          {t("publicProfile.friends") || "Bạn bè"}
        </Button>
      );
    }

    return null;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 mt-6"
      >
        {/* Friend/Follow button */}
        {renderFriendButton()}

        {/* Message button */}
        <AuthActionGuard>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/messages/${userId}`)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t("publicProfile.message") || "Nhắn tin"}
          </Button>
        </AuthActionGuard>

        {/* Gift/Send Coins button */}
        <AuthActionGuard>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setGiftDialogOpen(true)}
            className="bg-gradient-to-r from-primary-pale to-accent hover:from-primary-light hover:to-accent-gold/30 text-primary-deep border border-primary/20"
          >
            <Gift className="w-4 h-4 mr-2" />
            {t("publicProfile.sendGift") || "Tặng quà"}
          </Button>
        </AuthActionGuard>
      </motion.div>

      {/* Gift Dialog */}
      {user && (
        <GiftCoinDialog
          open={giftDialogOpen}
          onOpenChange={setGiftDialogOpen}
          preselectedUser={{
            id: userId,
            display_name: displayName,
            avatar_url: null,
          }}
          contextType="profile"
        />
      )}
    </>
  );
}
