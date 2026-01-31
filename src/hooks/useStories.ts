import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compressImage, formatFileSize } from "@/lib/imageCompression";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  views_count: number;
  created_at: string;
  expires_at: string;
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupedStories {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active stories (not expired)
      const { data: storiesData, error } = await supabase
        .from("community_stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (storiesData && storiesData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(storiesData.map(s => s.user_id))];
        
        // Fetch user profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Fetch viewed stories for current user
        let viewedIds = new Set<string>();
        if (user) {
          const { data: viewsData } = await supabase
            .from("community_story_views")
            .select("story_id")
            .eq("viewer_id", user.id);
          
          viewedIds = new Set(viewsData?.map(v => v.story_id) || []);
          setViewedStoryIds(viewedIds);
        }

        // Enrich stories with user profiles
        const enrichedStories: Story[] = storiesData.map(story => ({
          ...story,
          media_type: story.media_type as "image" | "video",
          user_profile: profileMap.get(story.user_id) || null,
        }));

        setStories(enrichedStories);

        // Group stories by user
        const grouped: Map<string, GroupedStories> = new Map();
        
        for (const story of enrichedStories) {
          if (!grouped.has(story.user_id)) {
            grouped.set(story.user_id, {
              user_id: story.user_id,
              display_name: story.user_profile?.display_name || "Thành viên",
              avatar_url: story.user_profile?.avatar_url || null,
              stories: [],
              hasUnviewed: false,
            });
          }
          
          const group = grouped.get(story.user_id)!;
          group.stories.push(story);
          
          if (!viewedIds.has(story.id)) {
            group.hasUnviewed = true;
          }
        }

        // Sort: current user first, then users with unviewed stories
        const groupedArray = Array.from(grouped.values()).sort((a, b) => {
          if (a.user_id === user?.id) return -1;
          if (b.user_id === user?.id) return 1;
          if (a.hasUnviewed && !b.hasUnviewed) return -1;
          if (!a.hasUnviewed && b.hasUnviewed) return 1;
          return 0;
        });

        setGroupedStories(groupedArray);
      } else {
        setStories([]);
        setGroupedStories([]);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createStory = async (file: File, caption?: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập" };
    }

    try {
      let processedFile = file;
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      
      // Compress image before upload (skip videos)
      if (mediaType === "image") {
        try {
          const originalSize = file.size;
          processedFile = await compressImage(file, {
            maxWidth: 1080,
            maxHeight: 1920,
            quality: 0.9,
            format: 'webp'
          });
          console.log(`Story image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(processedFile.size)}`);
        } catch (compressError) {
          console.warn("Story image compression failed, using original:", compressError);
        }
      }
      
      // Upload file to storage
      const fileExt = processedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(fileName, processedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("stories")
        .getPublicUrl(fileName);

      // Create story record
      const { error: insertError } = await supabase
        .from("community_stories")
        .insert({
          user_id: user.id,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          caption: caption || null,
        });

      if (insertError) throw insertError;

      await fetchStories();
      return { success: true, message: "Đã đăng tin thành công!" };
    } catch (error: any) {
      console.error("Error creating story:", error);
      return { success: false, message: error.message || "Có lỗi xảy ra" };
    }
  };

  const markAsViewed = async (storyId: string) => {
    if (!user || viewedStoryIds.has(storyId)) return;

    try {
      await supabase
        .from("community_story_views")
        .upsert({
          story_id: storyId,
          viewer_id: user.id,
        }, {
          onConflict: "story_id,viewer_id",
        });

      setViewedStoryIds(prev => new Set([...prev, storyId]));

      // Update views count
      await supabase
        .from("community_stories")
        .update({ views_count: stories.find(s => s.id === storyId)?.views_count! + 1 })
        .eq("id", storyId);
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  };

  const deleteStory = async (storyId: string): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    try {
      const story = stories.find(s => s.id === storyId);
      if (!story || story.user_id !== user.id) {
        return { success: false };
      }

      // Delete from storage
      const fileName = story.media_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("stories")
          .remove([`${user.id}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from("community_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;

      await fetchStories();
      return { success: true };
    } catch (error) {
      console.error("Error deleting story:", error);
      return { success: false };
    }
  };

  useEffect(() => {
    fetchStories();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("stories-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_stories" },
        () => fetchStories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStories]);

  return {
    stories,
    groupedStories,
    isLoading,
    viewedStoryIds,
    createStory,
    markAsViewed,
    deleteStory,
    refreshStories: fetchStories,
  };
}
