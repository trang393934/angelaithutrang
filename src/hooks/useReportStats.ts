import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReportStats {
  // Người dùng
  totalUsers: number;
  totalEarlyAdopters: number;
  totalFriendships: number;
  totalHandles: number;

  // Cộng đồng
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalStories: number;
  totalDirectMessages: number;
  totalGratitudeJournals: number;
  totalIdeas: number;
  totalVisionBoards: number;
  totalBountySubmissions: number;
  totalCircles: number;
  totalShares: number;

  // Tài chính Camly
  totalCamlyIssued: number;
  totalCamlyBalance: number;
  totalCamlyWithdrawn: number;
  totalWithdrawalsSuccess: number;
  totalCamlyGifted: number;
  totalGiftCount: number;
  totalGiftSenders: number;
  totalProjectDonations: number;

  // FUN Money (PPLP)
  totalPPLPActions: number;
  totalPPLPMinted: number;
  totalPPLPScored: number;
  totalPPLPMiners: number;
  totalFUNScored: number;
  avgLightScore: number;
  avgRewardPerAction: number;
  totalPPLPPass: number;
  totalPPLPFail: number;
  totalMintRequests: number;
  mintRequestsMinted: number;
  mintRequestsPending: number;
  mintRequestsSigned: number;
  totalFUNInRequests: number;
  totalFUNClaimed: number;

  // AI & Nội dung
  totalChatQuestions: number;
  totalChatSessions: number;
  totalImageHistory: number;
  totalKnowledgeDocs: number;
  totalChatFeedback: number;
  totalContentShares: number;

  // Đăng nhập
  maxStreak: number;
  totalDailyLogins: number;

  // Healing
  totalHealingMessages: number;

  // Thời gian
  fetchedAt: string;
}

const defaultStats: ReportStats = {
  totalUsers: 0, totalEarlyAdopters: 0, totalFriendships: 0, totalHandles: 0,
  totalPosts: 0, totalComments: 0, totalLikes: 0, totalStories: 0,
  totalDirectMessages: 0, totalGratitudeJournals: 0, totalIdeas: 0,
  totalVisionBoards: 0, totalBountySubmissions: 0, totalCircles: 0, totalShares: 0,
  totalCamlyIssued: 0, totalCamlyBalance: 0, totalCamlyWithdrawn: 0,
  totalWithdrawalsSuccess: 0, totalCamlyGifted: 0, totalGiftCount: 0,
  totalGiftSenders: 0, totalProjectDonations: 0,
  totalPPLPActions: 0, totalPPLPMinted: 0, totalPPLPScored: 0, totalPPLPMiners: 0,
  totalFUNScored: 0, avgLightScore: 0, avgRewardPerAction: 0,
  totalPPLPPass: 0, totalPPLPFail: 0, totalMintRequests: 0,
  mintRequestsMinted: 0, mintRequestsPending: 0, mintRequestsSigned: 0,
  totalFUNInRequests: 0, totalFUNClaimed: 0,
  totalChatQuestions: 0, totalChatSessions: 0, totalImageHistory: 0,
  totalKnowledgeDocs: 0, totalChatFeedback: 0, totalContentShares: 0,
  maxStreak: 0, totalDailyLogins: 0, totalHealingMessages: 0,
  fetchedAt: "",
};

async function countTable(table: string): Promise<number> {
  const { count } = await supabase.from(table as any).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export function useReportStats() {
  const [stats, setStats] = useState<ReportStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        users, earlyAdopters, friendships, handles,
        posts, comments, likes, stories, dms, journals, ideas, visions, bounties, circles, shares,
        camlyBalances, withdrawalsSuccess,
        gifts,
        chatQuestions, chatSessions, imageHistory, knowledgeDocs, chatFeedback, contentShares,
        dailyLogins, healingMessages,
        pplpActions, pplpScored, pplpMinted,
        mintRequests, mintMinted, mintPending, mintSigned,
      ] = await Promise.all([
        // Người dùng
        countTable("early_adopter_rewards"),
        countTable("early_adopter_rewards"),
        countTable("friendships"),
        countTable("handle_audit_log"),
        // Cộng đồng
        countTable("community_posts"),
        countTable("community_comments"),
        countTable("community_post_likes"),
        countTable("community_stories"),
        countTable("direct_messages"),
        countTable("gratitude_journal"),
        countTable("build_ideas"),
        countTable("vision_boards"),
        countTable("bounty_submissions"),
        countTable("community_circles"),
        countTable("community_shares"),
        // Tài chính
        supabase.from("camly_coin_balances").select("balance, lifetime_earned"),
        supabase.from("coin_withdrawals").select("amount").eq("status", "completed"),
        supabase.from("coin_gifts").select("amount, sender_id"),
        // AI
        countTable("chat_questions"),
        countTable("chat_sessions"),
        countTable("image_history"),
        countTable("knowledge_documents"),
        countTable("chat_feedback"),
        countTable("content_shares"),
        // Login
        supabase.from("daily_login_tracking").select("streak_count"),
        countTable("healing_messages"),
        // PPLP
        countTable("pplp_actions"),
        supabase.from("pplp_actions").select("*", { count: "exact", head: true }).eq("status", "scored"),
        supabase.from("pplp_actions").select("*", { count: "exact", head: true }).eq("status", "minted"),
        // Mint requests
        supabase.from("pplp_mint_requests").select("*", { count: "exact", head: true }),
        supabase.from("pplp_mint_requests").select("amount").eq("status", "minted"),
        supabase.from("pplp_mint_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("pplp_mint_requests").select("*", { count: "exact", head: true }).eq("status", "signed"),
      ]);

      // PPLP scores
      const { data: scoresData } = await supabase.from("pplp_scores").select("light_score, final_reward, decision");
      const { data: actorsData } = await supabase.from("pplp_actions").select("actor_id");

      // Calculate
      const balancesData = camlyBalances.data || [];
      const totalIssued = balancesData.reduce((s, b) => s + Number(b.lifetime_earned || 0), 0);
      const totalBalance = balancesData.reduce((s, b) => s + Number(b.balance || 0), 0);

      const wData = withdrawalsSuccess.data || [];
      const totalWithdrawn = wData.reduce((s, w) => s + Number(w.amount || 0), 0);

      const gData = gifts.data || [];
      const totalGifted = gData.reduce((s, g) => s + Number(g.amount || 0), 0);
      const uniqueSenders = new Set(gData.map(g => g.sender_id)).size;

      const loginData = dailyLogins.data || [];
      const maxStreakVal = loginData.length > 0 ? Math.max(...loginData.map(l => l.streak_count || 0)) : 0;

      const scores = scoresData || [];
      const totalFUN = scores.reduce((s, sc) => s + Number(sc.final_reward || 0), 0);
      const avgLight = scores.length > 0 ? scores.reduce((s, sc) => s + Number(sc.light_score || 0), 0) / scores.length : 0;
      const avgReward = scores.length > 0 ? totalFUN / scores.length : 0;
      const passCount = scores.filter(s => s.decision === "pass").length;
      const failCount = scores.filter(s => s.decision === "fail").length;

      const uniqueMiners = new Set((actorsData || []).map(a => a.actor_id)).size;

      const mintedData = mintMinted.data || [];
      const totalClaimed = mintedData.reduce((s, m) => s + Number(m.amount || 0), 0);

      // Mint requests total FUN
      const { data: allMintReqs } = await supabase.from("pplp_mint_requests").select("amount");
      const totalFUNReqs = (allMintReqs || []).reduce((s, m) => s + Number(m.amount || 0), 0);

      // Project donations
      const projectDonations = await countTable("coin_gifts");

      setStats({
        totalUsers: users,
        totalEarlyAdopters: earlyAdopters,
        totalFriendships: friendships,
        totalHandles: handles,
        totalPosts: posts,
        totalComments: comments,
        totalLikes: likes,
        totalStories: stories,
        totalDirectMessages: dms,
        totalGratitudeJournals: journals,
        totalIdeas: ideas,
        totalVisionBoards: visions,
        totalBountySubmissions: bounties,
        totalCircles: circles,
        totalShares: shares,
        totalCamlyIssued: totalIssued,
        totalCamlyBalance: totalBalance,
        totalCamlyWithdrawn: totalWithdrawn,
        totalWithdrawalsSuccess: wData.length,
        totalCamlyGifted: totalGifted,
        totalGiftCount: gData.length,
        totalGiftSenders: uniqueSenders,
        totalProjectDonations: projectDonations,
        totalPPLPActions: pplpActions,
        totalPPLPMinted: pplpMinted.count ?? 0,
        totalPPLPScored: pplpScored.count ?? 0,
        totalPPLPMiners: uniqueMiners,
        totalFUNScored: totalFUN,
        avgLightScore: Math.round(avgLight * 100) / 100,
        avgRewardPerAction: Math.round(avgReward),
        totalPPLPPass: passCount,
        totalPPLPFail: failCount,
        totalMintRequests: mintRequests.count ?? 0,
        mintRequestsMinted: mintedData.length,
        mintRequestsPending: mintPending.count ?? 0,
        mintRequestsSigned: mintSigned.count ?? 0,
        totalFUNInRequests: totalFUNReqs,
        totalFUNClaimed: totalClaimed,
        totalChatQuestions: chatQuestions,
        totalChatSessions: chatSessions,
        totalImageHistory: imageHistory,
        totalKnowledgeDocs: knowledgeDocs,
        totalChatFeedback: chatFeedback,
        totalContentShares: contentShares,
        maxStreak: maxStreakVal,
        totalDailyLogins: loginData.length,
        totalHealingMessages: healingMessages,
        fetchedAt: new Date().toLocaleString("vi-VN"),
      });
    } catch (err) {
      console.error("Error fetching report stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return { stats, loading, refresh: fetchStats };
}
