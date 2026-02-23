
-- =============================================
-- CROSS-ACCOUNT CONTENT SIMILARITY DETECTION
-- Phát hiện nhiều user đăng cùng nội dung
-- =============================================
CREATE OR REPLACE FUNCTION public.detect_cross_account_content_similarity()
RETURNS TABLE(
  content_hash TEXT,
  user_count INTEGER,
  user_ids UUID[],
  sample_content TEXT,
  detected_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check community posts with same content in last 24h
  RETURN QUERY
  WITH post_hashes AS (
    SELECT 
      md5(lower(trim(regexp_replace(cp.content, '\s+', ' ', 'g')))) AS c_hash,
      cp.user_id,
      cp.content,
      cp.created_at
    FROM community_posts cp
    WHERE cp.created_at > now() - interval '24 hours'
  ),
  duplicates AS (
    SELECT 
      ph.c_hash,
      COUNT(DISTINCT ph.user_id)::INTEGER AS u_count,
      array_agg(DISTINCT ph.user_id) AS u_ids,
      (array_agg(ph.content ORDER BY ph.created_at))[1] AS sample
    FROM post_hashes ph
    GROUP BY ph.c_hash
    HAVING COUNT(DISTINCT ph.user_id) >= 3
  )
  SELECT 
    d.c_hash,
    d.u_count,
    d.u_ids,
    left(d.sample, 200),
    now()
  FROM duplicates d;

  -- Also check gratitude journals
  RETURN QUERY
  WITH journal_hashes AS (
    SELECT 
      md5(lower(trim(regexp_replace(gj.content, '\s+', ' ', 'g')))) AS c_hash,
      gj.user_id,
      gj.content,
      gj.created_at
    FROM gratitude_journal gj
    WHERE gj.created_at > now() - interval '24 hours'
  ),
  j_duplicates AS (
    SELECT 
      jh.c_hash,
      COUNT(DISTINCT jh.user_id)::INTEGER AS u_count,
      array_agg(DISTINCT jh.user_id) AS u_ids,
      (array_agg(jh.content ORDER BY jh.created_at))[1] AS sample
    FROM journal_hashes jh
    GROUP BY jh.c_hash
    HAVING COUNT(DISTINCT jh.user_id) >= 3
  )
  SELECT 
    d.c_hash,
    d.u_count,
    d.u_ids,
    left(d.sample, 200),
    now()
  FROM j_duplicates d;
END;
$function$;

-- =============================================
-- COORDINATED TIMING DETECTION
-- Phát hiện nhóm user hoạt động đồng thời
-- =============================================
CREATE OR REPLACE FUNCTION public.detect_coordinated_timing()
RETURNS TABLE(
  time_window TIMESTAMPTZ,
  user_count INTEGER,
  user_ids UUID[],
  action_count INTEGER,
  pattern_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Find groups of users who consistently act within 10-minute windows
  RETURN QUERY
  WITH actions AS (
    -- Combine posts, journals, questions
    SELECT user_id, created_at, 'post' AS action_type FROM community_posts WHERE created_at > now() - interval '7 days'
    UNION ALL
    SELECT user_id, created_at, 'journal' FROM gratitude_journal WHERE created_at > now() - interval '7 days'
    UNION ALL
    SELECT user_id, created_at, 'question' FROM chat_questions WHERE created_at > now() - interval '7 days' AND is_rewarded = true
  ),
  time_buckets AS (
    -- Round to 10-minute windows
    SELECT 
      user_id,
      date_trunc('hour', created_at) + (floor(extract(minute from created_at) / 10) * interval '10 minutes') AS bucket,
      DATE(created_at) AS action_date
    FROM actions
  ),
  bucket_groups AS (
    SELECT 
      bucket,
      COUNT(DISTINCT user_id)::INTEGER AS u_count,
      array_agg(DISTINCT user_id) AS u_ids,
      COUNT(*)::INTEGER AS a_count
    FROM time_buckets
    GROUP BY bucket
    HAVING COUNT(DISTINCT user_id) >= 3
  ),
  -- Check if same user groups appear on multiple days
  recurring AS (
    SELECT 
      bg.bucket,
      bg.u_count,
      bg.u_ids,
      bg.a_count,
      (
        SELECT COUNT(DISTINCT bg2.bucket::DATE)
        FROM bucket_groups bg2
        WHERE bg2.u_ids && bg.u_ids  -- Overlapping user arrays
          AND bg2.bucket != bg.bucket
      )::INTEGER AS recurring_days
    FROM bucket_groups bg
  )
  SELECT 
    r.bucket,
    r.u_count,
    r.u_ids,
    r.a_count,
    r.recurring_days
  FROM recurring r
  WHERE r.recurring_days >= 2  -- Same group appears 3+ days
  ORDER BY r.recurring_days DESC, r.u_count DESC
  LIMIT 50;
END;
$function$;

-- =============================================
-- WALLET CLUSTER DETECTION
-- Phát hiện ví gom (collector wallets)
-- =============================================
CREATE OR REPLACE FUNCTION public.detect_wallet_clusters()
RETURNS TABLE(
  collector_wallet TEXT,
  sender_count INTEGER,
  sender_user_ids UUID[],
  total_amount BIGINT,
  token_types TEXT[],
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Find external wallets receiving from 3+ different platform users
  RETURN QUERY
  WITH outgoing AS (
    SELECT 
      cg.receiver_id,
      cg.sender_id,
      cg.amount,
      cg.gift_type,
      cg.created_at
    FROM coin_gifts cg
    WHERE cg.gift_type LIKE 'web3%'
      AND cg.receiver_id = '00000000-0000-0000-0000-000000000000' -- External wallet (not a platform user)
  ),
  -- Get receiver wallet addresses from tx_hash
  wallet_destinations AS (
    SELECT 
      cg.tx_hash,
      cg.sender_id,
      cg.amount,
      cg.gift_type,
      cg.created_at,
      -- The receiver wallet is embedded in on-chain data; 
      -- We use coin_withdrawals as proxy for actual wallet addresses
      COALESCE(
        (SELECT cw.wallet_address FROM coin_withdrawals cw WHERE cw.user_id = cg.sender_id ORDER BY cw.created_at DESC LIMIT 1),
        (SELECT uwa.wallet_address FROM user_wallet_addresses uwa WHERE uwa.user_id = cg.sender_id LIMIT 1)
      ) AS sender_wallet
    FROM coin_gifts cg
    WHERE cg.gift_type LIKE 'web3%'
  ),
  -- Alternative: Look at withdrawals going to same wallet
  withdrawal_clusters AS (
    SELECT 
      cw.wallet_address AS dest_wallet,
      COUNT(DISTINCT cw.user_id)::INTEGER AS s_count,
      array_agg(DISTINCT cw.user_id) AS s_user_ids,
      SUM(cw.amount)::BIGINT AS t_amount,
      array_agg(DISTINCT 'withdrawal') AS t_types,
      MIN(cw.created_at) AS f_seen,
      MAX(cw.created_at) AS l_seen
    FROM coin_withdrawals cw
    WHERE cw.status = 'completed'
    GROUP BY cw.wallet_address
    HAVING COUNT(DISTINCT cw.user_id) >= 3
  )
  SELECT 
    wc.dest_wallet,
    wc.s_count,
    wc.s_user_ids,
    wc.t_amount,
    wc.t_types,
    wc.f_seen,
    wc.l_seen
  FROM withdrawal_clusters wc
  ORDER BY wc.s_count DESC, wc.t_amount DESC;
END;
$function$;

-- =============================================
-- AUTO-RUN CROSS-ACCOUNT SCAN
-- Called by cron job, creates fraud alerts automatically
-- =============================================
CREATE OR REPLACE FUNCTION public.run_cross_account_scan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_content_results RECORD;
  v_timing_results RECORD;
  v_wallet_results RECORD;
  v_content_count INTEGER := 0;
  v_timing_count INTEGER := 0;
  v_wallet_count INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- 1. Cross-account content similarity
  FOR v_content_results IN SELECT * FROM detect_cross_account_content_similarity() LOOP
    -- Create fraud signal for each user in the group
    FOREACH v_user_id IN ARRAY v_content_results.user_ids LOOP
      INSERT INTO pplp_fraud_signals (actor_id, signal_type, severity, details, source)
      VALUES (
        v_user_id,
        'SPAM',
        4,
        jsonb_build_object(
          'type', 'cross_account_duplicate',
          'content_hash', v_content_results.content_hash,
          'user_count', v_content_results.user_count,
          'other_users', v_content_results.user_ids,
          'sample', v_content_results.sample_content
        ),
        'SYSTEM'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Create admin fraud alert
    INSERT INTO fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      v_content_results.user_ids[1],
      'cross_account_content',
      'critical',
      jsonb_build_object(
        'content_hash', v_content_results.content_hash,
        'user_count', v_content_results.user_count,
        'user_ids', v_content_results.user_ids,
        'sample', v_content_results.sample_content,
        'scan_type', 'automated_daily'
      )
    );
    v_content_count := v_content_count + 1;
  END LOOP;

  -- 2. Coordinated timing
  FOR v_timing_results IN SELECT * FROM detect_coordinated_timing() LOOP
    INSERT INTO fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      v_timing_results.user_ids[1],
      'coordinated_timing',
      CASE WHEN v_timing_results.pattern_days >= 5 THEN 'critical' ELSE 'high' END,
      jsonb_build_object(
        'time_window', v_timing_results.time_window,
        'user_count', v_timing_results.user_count,
        'user_ids', v_timing_results.user_ids,
        'action_count', v_timing_results.action_count,
        'pattern_days', v_timing_results.pattern_days,
        'scan_type', 'automated_daily'
      )
    );
    v_timing_count := v_timing_count + 1;
  END LOOP;

  -- 3. Wallet clusters
  FOR v_wallet_results IN SELECT * FROM detect_wallet_clusters() LOOP
    INSERT INTO fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      v_wallet_results.sender_user_ids[1],
      'wallet_cluster',
      CASE WHEN v_wallet_results.sender_count >= 5 THEN 'critical' ELSE 'high' END,
      jsonb_build_object(
        'collector_wallet', v_wallet_results.collector_wallet,
        'sender_count', v_wallet_results.sender_count,
        'sender_user_ids', v_wallet_results.sender_user_ids,
        'total_amount', v_wallet_results.total_amount,
        'scan_type', 'automated_daily'
      )
    );
    v_wallet_count := v_wallet_count + 1;
  END LOOP;

  -- 4. Auto-notify admins
  IF v_content_count + v_timing_count + v_wallet_count > 0 THEN
    -- Insert notification for all admins
    INSERT INTO notifications (user_id, type, title, content, metadata)
    SELECT 
      ur.user_id,
      'fraud_alert_critical',
      '🚨 Phát hiện hoạt động bất thường',
      'Hệ thống phát hiện ' || 
        CASE WHEN v_content_count > 0 THEN v_content_count || ' nhóm nội dung trùng, ' ELSE '' END ||
        CASE WHEN v_timing_count > 0 THEN v_timing_count || ' nhóm timing đồng bộ, ' ELSE '' END ||
        CASE WHEN v_wallet_count > 0 THEN v_wallet_count || ' cụm ví gom' ELSE '' END,
      jsonb_build_object(
        'content_alerts', v_content_count,
        'timing_alerts', v_timing_count,
        'wallet_alerts', v_wallet_count,
        'scan_time', now()
      )
    FROM user_roles ur
    WHERE ur.role = 'admin';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'content_duplicates', v_content_count,
    'timing_patterns', v_timing_count,
    'wallet_clusters', v_wallet_count,
    'scan_time', now()
  );
END;
$function$;
