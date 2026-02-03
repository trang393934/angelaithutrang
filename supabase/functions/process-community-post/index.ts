import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { submitPPLPAction, PPLP_ACTION_TYPES, generateContentHash } from "../_shared/pplp-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIKES_THRESHOLD = 5;
const POST_CREATION_REWARD = 1000;  // Đăng bài mới: 1000 coin
const POST_ENGAGEMENT_REWARD = 500; // Bài đạt 5+ like: +500 coin
const SHARE_REWARD = 500;
const COMMENT_REWARD = 500;
const COMMENT_MIN_LENGTH = 50;
const MAX_POSTS_REWARDED_PER_DAY = 3;
const MAX_COMMENTS_REWARDED_PER_DAY = 5;
const MAX_SHARES_PER_DAY = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT and get user ID
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !claims?.user?.id) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.user.id;
    console.log(`Processing community post action for authenticated user: ${userId}`);

    // Use service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get action and other params from body (NOT userId)
    const { action, postId, content, imageUrl, imageUrls } = await req.json();

    console.log(`Processing action: ${action} for user: ${userId}`);

    // Helper function to get or create daily tracking
    const getDailyTracking = async (uid: string) => {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("daily_reward_tracking")
        .select("*")
        .eq("user_id", uid)
        .eq("reward_date", today)
        .maybeSingle();

      if (existing) return existing;

      const { data: created } = await supabase
        .from("daily_reward_tracking")
        .insert({ user_id: uid, reward_date: today })
        .select()
        .single();

      return created;
    };

    if (action === "create_post") {
      // Support both single imageUrl (legacy) and imageUrls array
      const finalImageUrls = imageUrls || (imageUrl ? [imageUrl] : []);
      const primaryImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : null;
      
      console.log(`Creating post with ${finalImageUrls.length} images`);

      // ===== TEMPLATE/GENERIC CONTENT DETECTION =====
      const templatePatterns = [
        // Generic philosophical phrases (Vietnamese)
        /cảm ơn (cha vũ trụ|vũ trụ|cuộc sống) vì tất cả/i,
        /con biết ơn (mọi thứ|tất cả|cuộc sống)/i,
        /mỗi ngày là một (món quà|phép màu|cơ hội)/i,
        /cuộc sống thật (đẹp|tuyệt vời|ý nghĩa)/i,
        /ánh sáng (của cha|vũ trụ) soi đường/i,
        /năng lượng (tích cực|yêu thương) lan tỏa/i,
        /tâm hồn (thanh thản|bình an|an yên)/i,
        /tình yêu thương vô điều kiện/i,
        /vũ trụ (ban tặng|ban cho|cho con)/i,
        /hãy sống (tích cực|yêu thương|hạnh phúc)/i,
        /yêu thương nhân loại/i,
        /trái tim (thanh khiết|trong sáng)/i,
      ];

      // Count template pattern matches
      let templateMatchCount = 0;
      for (const pattern of templatePatterns) {
        if (pattern.test(content)) {
          templateMatchCount++;
        }
      }

      // Check for generic/template content
      const wordCount = content.split(/\s+/).filter((w: string) => w.length > 1).length;
      const isShortGeneric = wordCount < 25 && templateMatchCount >= 2;
      const isTemplateHeavy = templateMatchCount >= 3;
      
      // Low word variety indicates copy-paste
      const normalizedContent = content.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
      const uniqueWords = new Set(normalizedContent.split(' ').filter((w: string) => w.length > 2));
      const lowVariety = uniqueWords.size < wordCount * 0.5;

      if ((isTemplateHeavy || isShortGeneric) && lowVariety && finalImageUrls.length === 0) {
        console.log(`Template post detected for user ${userId}: ${templateMatchCount} patterns, ${wordCount} words`);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Con ơi, hãy chia sẻ những suy nghĩ và trải nghiệm thực sự của con thay vì những câu triết lý chung chung nhé! Cộng đồng muốn nghe câu chuyện riêng của con 💛",
            reason: "template_content",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // ===== END TEMPLATE DETECTION =====
      
      // Create the post
      const { data: newPost, error: postError } = await supabase
        .from("community_posts")
        .insert({
          user_id: userId,
          content,
          image_url: primaryImageUrl, // Keep for backward compatibility
          image_urls: finalImageUrls, // New array field
        })
        .select()
        .single();

      if (postError) throw postError;

      console.log(`Post created: ${newPost.id} with ${finalImageUrls.length} images`);

      // Check daily limit for post rewards
      const tracking = await getDailyTracking(userId);
      const postsRewarded = tracking?.posts_rewarded || 0;
      
      let coinsEarned = 0;
      let rewarded = false;
      
      // Award immediate post creation reward: 1000 coins for posting
      if (postsRewarded < MAX_POSTS_REWARDED_PER_DAY) {
        await supabase.rpc("add_camly_coins", {
          _user_id: userId,
          _amount: POST_CREATION_REWARD,
          _transaction_type: "community_support",
          _description: "Đăng bài viết mới",
        });
        
        // Update daily tracking
        await supabase
          .from("daily_reward_tracking")
          .update({
            posts_rewarded: postsRewarded + 1,
            total_coins_today: (tracking?.total_coins_today || 0) + POST_CREATION_REWARD,
          })
          .eq("id", tracking.id);
        
        coinsEarned = POST_CREATION_REWARD;
        rewarded = true;
        console.log(`Post creation reward given to user ${userId}: ${POST_CREATION_REWARD} coins`);

        // ============= PPLP Integration =============
        const pplpResult = await submitPPLPAction(supabase, {
          action_type: PPLP_ACTION_TYPES.POST_CREATE,
          actor_id: userId,
          target_id: newPost.id,
          metadata: {
            post_id: newPost.id,
            content_length: content.length,
            image_count: finalImageUrls.length,
          },
          impact: {
            scope: 'group',
            reach_count: 1,
            quality_indicators: finalImageUrls.length > 0 ? ['has_media'] : [],
          },
          integrity: {
            content_hash: generateContentHash(content),
            source_verified: true,
          },
          evidences: [{
            evidence_type: 'post_content',
            content_hash: generateContentHash(content),
            metadata: { post_id: newPost.id }
          }],
          reward_amount: POST_CREATION_REWARD,
          content_length: content.length,
        });
        
        if (pplpResult.success) {
          console.log(`[PPLP] Post creation action submitted: ${pplpResult.action_id}`);
        }
        // ============= End PPLP Integration =============
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: rewarded 
            ? `Đăng bài thành công! Bạn nhận ${POST_CREATION_REWARD} Camly Coin` 
            : "Đăng bài thành công! (Đã đạt giới hạn thưởng hôm nay)",
          post: newPost,
          rewarded,
          coinsEarned,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "toggle_like") {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("community_post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      let newLikesCount = 0;
      let liked = false;

      if (existingLike) {
        // Unlike
        await supabase.from("community_post_likes").delete().eq("id", existingLike.id);
        
        const { data: post } = await supabase
          .from("community_posts")
          .select("likes_count")
          .eq("id", postId)
          .single();
        
        newLikesCount = post?.likes_count || 0;
        liked = false;
      } else {
        // Like
        await supabase.from("community_post_likes").insert({
          post_id: postId,
          user_id: userId,
        });

        const { data: post } = await supabase
          .from("community_posts")
          .select("likes_count, is_rewarded, user_id")
          .eq("id", postId)
          .single();

        newLikesCount = post?.likes_count || 0;
        liked = true;

        // Check if post reaches threshold and not yet rewarded
        if (post && newLikesCount >= LIKES_THRESHOLD && !post.is_rewarded) {
          // Get post owner's daily tracking
          const tracking = await getDailyTracking(post.user_id);
          const postsRewarded = tracking?.posts_rewarded || 0;

          if (postsRewarded < MAX_POSTS_REWARDED_PER_DAY) {
            // Award post owner: 500 coin for 5+ likes
            await supabase.rpc("add_camly_coins", {
              _user_id: post.user_id,
              _amount: POST_ENGAGEMENT_REWARD,
              _transaction_type: "engagement_reward",
              _description: `Bài viết đạt ${LIKES_THRESHOLD}+ lượt thích`,
            });

            // Mark post as rewarded
            await supabase
              .from("community_posts")
              .update({ is_rewarded: true, reward_amount: POST_ENGAGEMENT_REWARD })
              .eq("id", postId);

            // Update daily tracking
            await supabase
              .from("daily_reward_tracking")
              .update({
                posts_rewarded: postsRewarded + 1,
                total_coins_today: (tracking?.total_coins_today || 0) + POST_ENGAGEMENT_REWARD,
              })
              .eq("id", tracking.id);

            console.log(`Post engagement reward given to user ${post.user_id}`);

            return new Response(
              JSON.stringify({
                success: true,
                liked: true,
                newLikesCount,
                postRewarded: true,
                message: `Bài viết đã đạt ${LIKES_THRESHOLD} like! Tác giả nhận ${POST_ENGAGEMENT_REWARD} Camly Coin`,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          liked,
          newLikesCount,
          message: liked ? "Đã thích bài viết" : "Đã bỏ thích",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "share_post") {
      // Check if already shared
      const { data: existingShare } = await supabase
        .from("community_shares")
        .select("id")
        .eq("post_id", postId)
        .eq("sharer_id", userId)
        .maybeSingle();

      if (existingShare) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Bạn đã chia sẻ bài viết này rồi",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get post info
      const { data: post } = await supabase
        .from("community_posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (!post) {
        return new Response(
          JSON.stringify({ success: false, message: "Không tìm thấy bài viết" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Can't share own post
      if (post.user_id === userId) {
        return new Response(
          JSON.stringify({ success: false, message: "Không thể chia sẻ bài viết của chính mình" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check sharer's daily limit
      const sharerTracking = await getDailyTracking(userId);
      const sharesRewarded = sharerTracking?.shares_rewarded || 0;

      if (sharesRewarded >= MAX_SHARES_PER_DAY) {
        // Create share but no reward
        await supabase.from("community_shares").insert({
          post_id: postId,
          sharer_id: userId,
          sharer_rewarded: false,
          post_owner_rewarded: false,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Chia sẻ thành công! (Đã đạt giới hạn thưởng hôm nay)",
            rewarded: false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create share with rewards
      await supabase.from("community_shares").insert({
        post_id: postId,
        sharer_id: userId,
        sharer_rewarded: true,
        post_owner_rewarded: true,
      });

      // Award sharer
      await supabase.rpc("add_camly_coins", {
        _user_id: userId,
        _amount: SHARE_REWARD,
        _transaction_type: "content_share",
        _description: "Chia sẻ bài viết cộng đồng",
      });

      // Award post owner
      await supabase.rpc("add_camly_coins", {
        _user_id: post.user_id,
        _amount: SHARE_REWARD,
        _transaction_type: "engagement_reward",
        _description: "Bài viết được chia sẻ",
      });

      // Update sharer's tracking
      await supabase
        .from("daily_reward_tracking")
        .update({
          shares_rewarded: sharesRewarded + 1,
          total_coins_today: (sharerTracking?.total_coins_today || 0) + SHARE_REWARD,
        })
        .eq("id", sharerTracking.id);

      console.log(`Share rewards given to sharer ${userId} and post owner ${post.user_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Chia sẻ thành công! Bạn và tác giả mỗi người nhận ${SHARE_REWARD} Camly Coin`,
          rewarded: true,
          coinsEarned: SHARE_REWARD,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "add_comment") {
      const contentLength = content?.length || 0;

      // Allow any comment length, but only reward if >= COMMENT_MIN_LENGTH
      if (contentLength < 1) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Bình luận không được để trống",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if comment is eligible for reward (>= 50 characters)
      const isEligibleForReward = contentLength >= COMMENT_MIN_LENGTH;

      // Check daily limit only if eligible for reward
      const tracking = await getDailyTracking(userId);
      const commentsRewarded = tracking?.comments_rewarded || 0;
      const canReward = isEligibleForReward && commentsRewarded < MAX_COMMENTS_REWARDED_PER_DAY;

      // Create comment
      const { data: newComment, error: commentError } = await supabase
        .from("community_comments")
        .insert({
          post_id: postId,
          user_id: userId,
          content,
          content_length: contentLength,
          is_rewarded: canReward,
          reward_amount: canReward ? COMMENT_REWARD : 0,
        })
        .select()
        .single();

      if (commentError) throw commentError;

      if (canReward) {
        // Award commenter
        await supabase.rpc("add_camly_coins", {
          _user_id: userId,
          _amount: COMMENT_REWARD,
          _transaction_type: "engagement_reward",
          _description: "Bình luận cộng đồng",
        });

        // Update tracking
        await supabase
          .from("daily_reward_tracking")
          .update({
            comments_rewarded: commentsRewarded + 1,
            total_coins_today: (tracking?.total_coins_today || 0) + COMMENT_REWARD,
          })
          .eq("id", tracking.id);

        console.log(`Comment reward given to user ${userId}`);

        // ============= PPLP Integration =============
        const pplpResult = await submitPPLPAction(supabase, {
          action_type: PPLP_ACTION_TYPES.COMMENT_CREATE,
          actor_id: userId,
          target_id: postId,
          metadata: {
            comment_id: newComment.id,
            post_id: postId,
            content_length: contentLength,
          },
          impact: {
            scope: 'group',
            quality_indicators: contentLength >= 100 ? ['detailed_comment'] : [],
          },
          integrity: {
            content_hash: generateContentHash(content),
            source_verified: true,
          },
          evidences: [{
            evidence_type: 'comment_content',
            content_hash: generateContentHash(content),
            metadata: { post_id: postId }
          }],
          reward_amount: COMMENT_REWARD,
          content_length: contentLength,
        });
        
        if (pplpResult.success) {
          console.log(`[PPLP] Comment action submitted: ${pplpResult.action_id}`);
        }
        // ============= End PPLP Integration =============

        return new Response(
          JSON.stringify({
            success: true,
            message: `Bình luận thành công! Bạn nhận ${COMMENT_REWARD} Camly Coin`,
            rewarded: true,
            coinsEarned: COMMENT_REWARD,
            comment: newComment,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Comment posted but no reward (either under 50 chars or daily limit reached)
      let message = "Bình luận thành công!";
      if (!isEligibleForReward) {
        message = "Bình luận thành công! (Bình luận từ 50 ký tự trở lên sẽ nhận thưởng)";
      } else if (commentsRewarded >= MAX_COMMENTS_REWARDED_PER_DAY) {
        message = "Bình luận thành công! (Đã đạt giới hạn thưởng hôm nay)";
      }

      return new Response(
        JSON.stringify({
          success: true,
          message,
          rewarded: false,
          comment: newComment,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "edit_post") {
      // Check if user owns the post
      const { data: post } = await supabase
        .from("community_posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (!post) {
        return new Response(
          JSON.stringify({ success: false, message: "Không tìm thấy bài viết" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (post.user_id !== userId) {
        return new Response(
          JSON.stringify({ success: false, message: "Bạn không có quyền chỉnh sửa bài viết này" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Support both single imageUrl (legacy) and imageUrls array
      const finalImageUrls = imageUrls || (imageUrl ? [imageUrl] : []);
      const primaryImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : null;

      console.log(`Editing post ${postId} with ${finalImageUrls.length} images`);

      // Update the post with multiple images support
      const { data: updatedPost, error: updateError } = await supabase
        .from("community_posts")
        .update({
          content,
          image_url: primaryImageUrl, // Keep for backward compatibility
          image_urls: finalImageUrls, // New array field
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log(`Post edited: ${postId} with ${finalImageUrls.length} images`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Chỉnh sửa bài viết thành công!",
          post: updatedPost,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_post") {
      // Check if user owns the post
      const { data: post } = await supabase
        .from("community_posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (!post) {
        return new Response(
          JSON.stringify({ success: false, message: "Không tìm thấy bài viết" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (post.user_id !== userId) {
        return new Response(
          JSON.stringify({ success: false, message: "Bạn không có quyền xóa bài viết này" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete related data first (comments, likes, shares)
      await supabase.from("community_comments").delete().eq("post_id", postId);
      await supabase.from("community_post_likes").delete().eq("post_id", postId);
      await supabase.from("community_shares").delete().eq("post_id", postId);

      // Delete the post
      const { error: deleteError } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (deleteError) throw deleteError;

      console.log(`Post deleted: ${postId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Xóa bài viết thành công!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});