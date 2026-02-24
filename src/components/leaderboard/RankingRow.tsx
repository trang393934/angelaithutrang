import { Link } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardUser } from "@/hooks/useLeaderboard";
import angelAvatar from "@/assets/angel-avatar.png";

interface RankingRowProps {
  user: LeaderboardUser;
  isCurrentUser?: boolean;
}

export function RankingRow({ user, isCurrentUser }: RankingRowProps) {
  return (
    <Link
      to={getProfilePath(user.user_id)}
      className="group relative block"
    >
      {/* Outer Glow Border */}
      <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 opacity-60 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(255,215,0,0.4)] group-hover:shadow-[0_0_12px_rgba(255,215,0,0.6)]" />
      
      {/* Middle Border */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-300" />
      
      {/* Inner Content */}
      <div
        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg bg-white/95 backdrop-blur-sm ${
          isCurrentUser ? "ring-2 ring-primary/30 bg-primary/5" : ""
        }`}
      >
        {/* Rank Number */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
          <span className="text-xs font-bold text-white">{user.rank}</span>
        </div>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-[2px] rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
          <Avatar className="relative w-8 h-8 border-2 border-white">
            <AvatarImage src={user.avatar_url || angelAvatar} />
            <AvatarFallback className="text-xs">
              {user.display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium group-hover:text-primary transition-colors ${
              isCurrentUser ? "text-primary font-semibold" : "text-foreground"
            }`}
            title={user.display_name || "Ẩn danh"}
          >
            <span className="block truncate">
              {user.display_name || "Ẩn danh"}
              {isCurrentUser && (
                <span className="ml-1 text-xs text-primary/70">(Bạn)</span>
              )}
            </span>
          </p>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-600">
            {user.lifetime_earned.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
