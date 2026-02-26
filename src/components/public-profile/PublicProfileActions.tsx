import { UserPlus, MessageCircle, Gift, UserCheck, Clock, Loader2, Lock, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuthActionGuard } from "@/components/AuthActionGuard";
import { useAuth } from "@/hooks/useAuth";
import { useFriendship } from "@/hooks/useFriendship";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";
import type { PublicSettings } from "@/hooks/usePublicProfile";

interface PublicProfileActionsProps {
  userId: string;
  displayName: string | null;
  publicSettings?: PublicSettings;
}

export function PublicProfileActions({ userId, displayName, publicSettings }: PublicProfileActionsProps) {
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
  const isFriend = friendshipStatus?.status === "accepted";

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

  const canMessage = publicSettings?.allow_public_message !== false || isFriend;
  const canTransfer = publicSettings?.allow_public_transfer !== false || isFriend;
  const showDonate = publicSettings?.show_donation_button === true;

  const renderFriendButton = () => {
    if (friendshipLoading) {
      return (
        <Button disabled size="lg">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        </Button>
      );
    }

    if (!friendshipStatus) {
      if (publicSettings?.allow_public_follow === false) {
        return (
          <Button variant="secondary" size="lg" disabled>
            <Lock className="w-4 h-4 mr-2" />
            {t("publicProfile.friendsOnly") || "Chỉ bạn bè"}
          </Button>
        );
      }
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
          <Button variant="secondary" size="lg" onClick={() => cancelFriendRequest(friendshipStatus.id)}>
            <Clock className="w-4 h-4 mr-2" />
            {t("publicProfile.requestSent") || "Đã gửi lời mời"}
          </Button>
        );
      }
      return (
        <Button size="lg" onClick={() => acceptFriendRequest(friendshipStatus.id)}>
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
        {renderFriendButton()}

        {/* Message button */}
        {canMessage ? (
          <AuthActionGuard>
            <Button variant="outline" size="lg" onClick={() => navigate(`/messages/${userId}`)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              {t("publicProfile.message") || "Nhắn tin"}
            </Button>
          </AuthActionGuard>
        ) : (
          <Button variant="outline" size="lg" disabled>
            <Lock className="w-4 h-4 mr-2" />
            {t("publicProfile.friendsOnly") || "Chỉ bạn bè"}
          </Button>
        )}

        {/* Gift/Send Coins button */}
        {canTransfer ? (
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
        ) : (
          <Button variant="secondary" size="lg" disabled>
            <Lock className="w-4 h-4 mr-2" />
            {t("publicProfile.friendsOnly") || "Chỉ bạn bè"}
          </Button>
        )}

        {/* Donation button */}
        {showDonate && (
          <AuthActionGuard>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setGiftDialogOpen(true)}
              className="border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate
            </Button>
          </AuthActionGuard>
        )}
      </motion.div>

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
