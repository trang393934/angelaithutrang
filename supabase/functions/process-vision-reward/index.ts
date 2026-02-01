import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VisionBoardRequest {
  visionBoardId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    console.log(`Processing vision board reward for user: ${userId}`);

    // Parse request body
    const body: VisionBoardRequest = await req.json();
    const { visionBoardId } = body;

    if (!visionBoardId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing visionBoardId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if the vision board exists and belongs to user
    const { data: board, error: boardError } = await supabaseAdmin
      .from('vision_boards')
      .select('id, user_id, is_first_board, is_rewarded')
      .eq('id', visionBoardId)
      .single();

    if (boardError || !board) {
      console.error('Board not found:', boardError);
      return new Response(
        JSON.stringify({ success: false, error: 'Vision board not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (board.user_id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - not your board' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is truly the first board (server-side verification)
    const { count, error: countError } = await supabaseAdmin
      .from('vision_boards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_first_board', true);

    if (countError) {
      console.error('Error counting boards:', countError);
    }

    // If user already has a first board and it's not this one, deny reward
    if (count && count > 0 && !board.is_first_board) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'not_first_board',
          message: 'Phần thưởng chỉ dành cho Vision Board đầu tiên'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already rewarded
    if (board.is_rewarded) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'already_rewarded',
          message: 'Phần thưởng đã được nhận rồi'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if board is first board
    if (!board.is_first_board) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'not_eligible',
          message: 'Chỉ Vision Board đầu tiên mới được thưởng'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const REWARD_AMOUNT = 1000;

    // Add coins using service role
    const { error: coinError } = await supabaseAdmin.rpc('add_camly_coins', {
      _user_id: userId,
      _amount: REWARD_AMOUNT,
      _transaction_type: 'vision_reward',
      _description: 'Phần thưởng tạo Vision Board đầu tiên!',
      _purity_score: null,
      _metadata: { vision_board_id: visionBoardId }
    });

    if (coinError) {
      console.error('Error adding coins:', coinError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to add coins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark board as rewarded
    const { error: updateError } = await supabaseAdmin
      .from('vision_boards')
      .update({ is_rewarded: true, reward_amount: REWARD_AMOUNT })
      .eq('id', visionBoardId);

    if (updateError) {
      console.error('Error updating board:', updateError);
    }

    console.log(`Successfully rewarded user ${userId} with ${REWARD_AMOUNT} coins for first vision board`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coinsEarned: REWARD_AMOUNT,
        message: `🎉 Chúc mừng! Bạn đã nhận ${REWARD_AMOUNT} Camly Coin cho Vision Board đầu tiên!`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing vision reward:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
