import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ShareRequest {
  contentType: 'chat' | 'post' | 'document' | 'question';
  contentId?: string;
  contentHash: string;
  platform: string;
  rewardAmount?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create auth client for JWT validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT and get user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Processing share reward for user: ${userId}`);

    // Parse request body
    const body: ShareRequest = await req.json();
    const { contentType, contentId, contentHash, platform, rewardAmount = 500 } = body;

    // Validate required fields
    if (!contentType || !contentHash || !platform) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate reward amount is within allowed range
    const ALLOWED_REWARD = 500;
    if (rewardAmount !== ALLOWED_REWARD) {
      console.warn(`Attempted reward manipulation: requested ${rewardAmount}, allowed ${ALLOWED_REWARD}`);
    }
    const actualReward = ALLOWED_REWARD; // Always use server-side amount

    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in Vietnam timezone
    const today = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).split(',')[0];

    // Check daily share limit atomically
    const { data: dailyStatus, error: statusError } = await supabaseAdmin.rpc(
      'get_extended_daily_reward_status',
      { _user_id: userId }
    );

    if (statusError) {
      console.error('Error getting daily status:', statusError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check daily limits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sharesRemaining = dailyStatus?.[0]?.shares_remaining ?? 5;
    console.log(`User ${userId} has ${sharesRemaining} shares remaining today`);

    if (sharesRemaining <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'daily_limit_reached',
          message: 'Bạn đã đạt giới hạn 5 lần chia sẻ/ngày. Quay lại vào ngày mai nhé! 🌅'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate content share today
    const { data: existingShare, error: duplicateError } = await supabaseAdmin
      .from('content_shares')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('share_url', contentHash)
      .gte('created_at', today)
      .maybeSingle();

    if (duplicateError) {
      console.error('Error checking duplicates:', duplicateError);
    }

    if (existingShare) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'duplicate_content',
          message: '⚠️ Nội dung này đã được chia sẻ hôm nay! Hãy chia sẻ nội dung khác để nhận thưởng.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record share
    const { error: insertError } = await supabaseAdmin.from('content_shares').insert({
      user_id: userId,
      content_type: contentType,
      share_type: platform.toLowerCase(),
      share_url: contentHash,
      content_id: contentId || contentHash,
      coins_earned: actualReward,
      is_verified: true,
      verified_at: new Date().toISOString()
    });

    if (insertError) {
      console.error('Error inserting share:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to record share' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update daily tracking
    const { error: trackingError } = await supabaseAdmin
      .from('daily_reward_tracking')
      .update({
        shares_rewarded: (dailyStatus?.[0]?.shares_rewarded ?? 0) + 1,
        total_coins_today: (dailyStatus?.[0]?.total_coins_today ?? 0) + actualReward
      })
      .eq('user_id', userId)
      .eq('reward_date', today);

    if (trackingError) {
      console.error('Error updating tracking:', trackingError);
    }

    // Add coins using service role
    const { error: coinError } = await supabaseAdmin.rpc('add_camly_coins', {
      _user_id: userId,
      _amount: actualReward,
      _transaction_type: 'content_share',
      _description: `Chia sẻ ${contentType} qua ${platform}`,
      _purity_score: null,
      _metadata: { platform, content_hash: contentHash, content_type: contentType }
    });

    if (coinError) {
      console.error('Error adding coins:', coinError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to add coins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully rewarded user ${userId} with ${actualReward} coins for sharing`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coinsEarned: actualReward,
        message: `+${actualReward} Camly Coin! Cảm ơn con đã lan tỏa Ánh Sáng ✨`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing share reward:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
