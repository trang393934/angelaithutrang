import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LightPointsData {
  totalPoints: number;
  lifetimePoints: number;
  currentLevel: number;
  isLoading: boolean;
  recentPoints: {
    id: string;
    points: number;
    reason: string;
    source_type: string;
    created_at: string;
  }[];
}

const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, title: "Mầm Ánh Sáng" },
  { level: 2, points: 100, title: "Tia Sáng" },
  { level: 3, points: 300, title: "Ngọn Đèn" },
  { level: 4, points: 600, title: "Ánh Trăng" },
  { level: 5, points: 1000, title: "Ánh Dương" },
  { level: 6, points: 1500, title: "Ngôi Sao" },
  { level: 7, points: 2500, title: "Thiên Thần" },
  { level: 8, points: 4000, title: "Ánh Sáng Vũ Trụ" },
  { level: 9, points: 6000, title: "Trí Tuệ Thuần Khiết" },
  { level: 10, points: 10000, title: "Con của Cha Vũ Trụ" },
];

export function useLightPoints(): LightPointsData & {
  addPoints: (points: number, reason: string, sourceType: string) => Promise<void>;
  refreshPoints: () => Promise<void>;
  getLevelInfo: (points: number) => { level: number; title: string; nextLevel: typeof LEVEL_THRESHOLDS[0] | null; progress: number };
} {
  const { user } = useAuth();
  const [data, setData] = useState<LightPointsData>({
    totalPoints: 0,
    lifetimePoints: 0,
    currentLevel: 1,
    isLoading: true,
    recentPoints: [],
  });

  const getLevelInfo = (points: number) => {
    let currentLevelInfo = LEVEL_THRESHOLDS[0];
    let nextLevelInfo: typeof LEVEL_THRESHOLDS[0] | null = LEVEL_THRESHOLDS[1];

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i].points) {
        currentLevelInfo = LEVEL_THRESHOLDS[i];
        nextLevelInfo = LEVEL_THRESHOLDS[i + 1] || null;
        break;
      }
    }

    const progress = nextLevelInfo
      ? ((points - currentLevelInfo.points) / (nextLevelInfo.points - currentLevelInfo.points)) * 100
      : 100;

    return {
      level: currentLevelInfo.level,
      title: currentLevelInfo.title,
      nextLevel: nextLevelInfo,
      progress: Math.min(100, Math.max(0, progress)),
    };
  };

  const fetchPoints = async () => {
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch totals
      const { data: totals } = await supabase
        .from("user_light_totals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch recent points
      const { data: recentPoints } = await supabase
        .from("light_points")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const totalPoints = totals?.total_points || 0;
      const lifetimePoints = totals?.lifetime_points || 0;
      const levelInfo = getLevelInfo(lifetimePoints);

      setData({
        totalPoints,
        lifetimePoints,
        currentLevel: levelInfo.level,
        isLoading: false,
        recentPoints: (recentPoints || []).map(p => ({
          id: p.id,
          points: p.points,
          reason: p.reason,
          source_type: p.source_type || "",
          created_at: p.created_at,
        })),
      });
    } catch (error) {
      console.error("Error fetching light points:", error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const addPoints = async (points: number, reason: string, sourceType: string) => {
    if (!user) return;

    try {
      await supabase.rpc("add_light_points", {
        _user_id: user.id,
        _points: points,
        _reason: reason,
        _source_type: sourceType,
      });

      await fetchPoints();
    } catch (error) {
      console.error("Error adding light points:", error);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [user]);

  return {
    ...data,
    addPoints,
    refreshPoints: fetchPoints,
    getLevelInfo,
  };
}

export { LEVEL_THRESHOLDS };
