import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface VisionImage {
  id: string;
  url: string;
  caption?: string;
}

interface VisionBoard {
  id: string;
  title: string;
  description: string | null;
  goals: Goal[];
  images: VisionImage[];
  is_public: boolean;
  is_first_board: boolean;
  is_rewarded: boolean;
  reward_amount: number;
  completed_goals_count: number;
  total_goals_count: number;
  created_at: string;
  updated_at: string;
}

interface UseVisionBoardReturn {
  boards: VisionBoard[];
  isLoading: boolean;
  isCreating: boolean;
  hasFirstBoard: boolean;
  createBoard: (data: CreateBoardData) => Promise<{ success: boolean; reward?: number }>;
  updateBoard: (id: string, data: Partial<CreateBoardData>) => Promise<boolean>;
  deleteBoard: (id: string) => Promise<boolean>;
  toggleGoal: (boardId: string, goalId: string) => Promise<boolean>;
  refreshBoards: () => Promise<void>;
}

interface CreateBoardData {
  title: string;
  description?: string;
  goals: string[];
  images?: VisionImage[];
  is_public?: boolean;
}

export function useVisionBoard(): UseVisionBoardReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [boards, setBoards] = useState<VisionBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [hasFirstBoard, setHasFirstBoard] = useState(false);

  const fetchBoards = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("vision_boards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsedBoards: VisionBoard[] = (data || []).map(board => ({
        ...board,
        goals: Array.isArray(board.goals) ? (board.goals as unknown as Goal[]) : [],
        images: Array.isArray(board.images) ? (board.images as unknown as VisionImage[]) : [],
      }));

      setBoards(parsedBoards);
      setHasFirstBoard(parsedBoards.some(b => b.is_first_board));
    } catch (error) {
      console.error("Error fetching vision boards:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createBoard = async (data: CreateBoardData): Promise<{ success: boolean; reward?: number }> => {
    if (!user) return { success: false };

    setIsCreating(true);
    try {
      const isFirst = !hasFirstBoard;
      const goals: Goal[] = data.goals.map((text, index) => ({
        id: `goal-${Date.now()}-${index}`,
        text,
        isCompleted: false,
      }));

      const insertData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        goals: JSON.parse(JSON.stringify(goals)),
        images: JSON.parse(JSON.stringify(data.images || [])),
        is_public: data.is_public || false,
        is_first_board: isFirst,
        is_rewarded: false, // Server will set this to true after reward
        reward_amount: 0, // Server will set the actual amount
        total_goals_count: goals.length,
        completed_goals_count: 0,
      };

      const { data: newBoard, error } = await supabase
        .from("vision_boards")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // If this is the first board, process reward via secure edge function
      if (isFirst && newBoard) {
        const { data: rewardData, error: rewardError } = await supabase.functions.invoke(
          'process-vision-reward',
          { body: { visionBoardId: newBoard.id } }
        );

        if (rewardError) {
          console.error("Error processing vision reward:", rewardError);
        } else if (rewardData?.success) {
          toast({
            title: "🎉 Chúc mừng!",
            description: rewardData.message,
          });
        } else if (rewardData?.error) {
          console.log("Vision reward not given:", rewardData.message);
        }
      }

      await fetchBoards();
      return { success: true, reward: isFirst ? 1000 : 0 };
    } catch (error) {
      console.error("Error creating vision board:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo Vision Board. Vui lòng thử lại.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsCreating(false);
    }
  };

  const updateBoard = async (id: string, data: Partial<CreateBoardData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: Record<string, unknown> = {};
      
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.is_public !== undefined) updateData.is_public = data.is_public;
      if (data.images) updateData.images = data.images;
      if (data.goals) {
        const goals: Goal[] = data.goals.map((text, index) => ({
          id: `goal-${Date.now()}-${index}`,
          text,
          isCompleted: false,
        }));
        updateData.goals = goals;
        updateData.total_goals_count = goals.length;
      }

      const { error } = await supabase
        .from("vision_boards")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchBoards();
      return true;
    } catch (error) {
      console.error("Error updating vision board:", error);
      return false;
    }
  };

  const deleteBoard = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("vision_boards")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchBoards();
      return true;
    } catch (error) {
      console.error("Error deleting vision board:", error);
      return false;
    }
  };

  const toggleGoal = async (boardId: string, goalId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return false;

      const updatedGoals = board.goals.map(g =>
        g.id === goalId ? { ...g, isCompleted: !g.isCompleted } : g
      );
      const completedCount = updatedGoals.filter(g => g.isCompleted).length;

      const { error } = await supabase
        .from("vision_boards")
        .update({
          goals: JSON.parse(JSON.stringify(updatedGoals)),
          completed_goals_count: completedCount,
        })
        .eq("id", boardId)
        .eq("user_id", user.id);

      if (error) throw error;

      setBoards(prev =>
        prev.map(b =>
          b.id === boardId
            ? { ...b, goals: updatedGoals, completed_goals_count: completedCount }
            : b
        )
      );

      return true;
    } catch (error) {
      console.error("Error toggling goal:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return {
    boards,
    isLoading,
    isCreating,
    hasFirstBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    toggleGoal,
    refreshBoards: fetchBoards,
  };
}
