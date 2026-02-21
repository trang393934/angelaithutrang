
-- Update the admin user management function to get wallet from user_wallet_addresses table
CREATE OR REPLACE FUNCTION public.get_admin_user_management_data()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, handle text, joined_at timestamp with time zone, post_count bigint, comment_count bigint, light_score bigint, popl_score numeric, positive_actions bigint, negative_actions bigint, camly_balance bigint, camly_lifetime_earned bigint, camly_lifetime_spent bigint, fun_money_received bigint, gift_internal_sent bigint, gift_internal_received bigint, gift_web3_sent bigint, gift_web3_received bigint, total_withdrawn bigint, withdrawal_count bigint, pplp_action_count bigint, pplp_minted_count bigint, wallet_address text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.handle,
    ula.agreed_at AS joined_at,
    COALESCE(posts.cnt, 0)::BIGINT AS post_count,
    COALESCE(comments.cnt, 0)::BIGINT AS comment_count,
    COALESCE(ult.total_points, 0)::BIGINT AS light_score,
    COALESCE(ult.popl_score, 0)::NUMERIC AS popl_score,
    COALESCE(ult.positive_actions, 0)::BIGINT AS positive_actions,
    COALESCE(ult.negative_actions, 0)::BIGINT AS negative_actions,
    COALESCE(ccb.balance, 0)::BIGINT AS camly_balance,
    COALESCE(ccb.lifetime_earned, 0)::BIGINT AS camly_lifetime_earned,
    COALESCE(ccb.lifetime_spent, 0)::BIGINT AS camly_lifetime_spent,
    COALESCE(fdl.total_fun, 0)::BIGINT AS fun_money_received,
    COALESCE(gis.total_sent, 0)::BIGINT AS gift_internal_sent,
    COALESCE(gir.total_received, 0)::BIGINT AS gift_internal_received,
    COALESCE(gws.total_sent, 0)::BIGINT AS gift_web3_sent,
    COALESCE(gwr.total_received, 0)::BIGINT AS gift_web3_received,
    COALESCE(wd.total_withdrawn, 0)::BIGINT AS total_withdrawn,
    COALESCE(wd.wd_count, 0)::BIGINT AS withdrawal_count,
    COALESCE(pa.action_count, 0)::BIGINT AS pplp_action_count,
    COALESCE(pa.minted_count, 0)::BIGINT AS pplp_minted_count,
    -- Priority: user_wallet_addresses > last withdrawal wallet
    COALESCE(uwa.wallet_address, wd.last_wallet) AS wallet_address
  FROM profiles p
  LEFT JOIN user_light_agreements ula ON ula.user_id = p.user_id
  LEFT JOIN user_light_totals ult ON ult.user_id = p.user_id
  LEFT JOIN camly_coin_balances ccb ON ccb.user_id = p.user_id
  -- Wallet from user_wallet_addresses (primary source)
  LEFT JOIN user_wallet_addresses uwa ON uwa.user_id = p.user_id
  -- Post count
  LEFT JOIN (
    SELECT cp.user_id, COUNT(*)::BIGINT AS cnt
    FROM community_posts cp GROUP BY cp.user_id
  ) posts ON posts.user_id = p.user_id
  -- Comment count
  LEFT JOIN (
    SELECT cc.user_id, COUNT(*)::BIGINT AS cnt
    FROM community_comments cc GROUP BY cc.user_id
  ) comments ON comments.user_id = p.user_id
  -- FUN Money received
  LEFT JOIN (
    SELECT fdl2.actor_id, SUM(fdl2.user_amount)::BIGINT AS total_fun
    FROM fun_distribution_logs fdl2 GROUP BY fdl2.actor_id
  ) fdl ON fdl.actor_id = p.user_id
  -- Internal gifts sent
  LEFT JOIN (
    SELECT cg.sender_id, SUM(cg.amount)::BIGINT AS total_sent
    FROM coin_gifts cg WHERE cg.gift_type != 'web3' GROUP BY cg.sender_id
  ) gis ON gis.sender_id = p.user_id
  -- Internal gifts received
  LEFT JOIN (
    SELECT cg.receiver_id, SUM(cg.amount)::BIGINT AS total_received
    FROM coin_gifts cg WHERE cg.gift_type != 'web3' GROUP BY cg.receiver_id
  ) gir ON gir.receiver_id = p.user_id
  -- Web3 gifts sent
  LEFT JOIN (
    SELECT cg.sender_id, SUM(cg.amount)::BIGINT AS total_sent
    FROM coin_gifts cg WHERE cg.gift_type = 'web3' GROUP BY cg.sender_id
  ) gws ON gws.sender_id = p.user_id
  -- Web3 gifts received
  LEFT JOIN (
    SELECT cg.receiver_id, SUM(cg.amount)::BIGINT AS total_received
    FROM coin_gifts cg WHERE cg.gift_type = 'web3' GROUP BY cg.receiver_id
  ) gwr ON gwr.receiver_id = p.user_id
  -- Withdrawals (completed)
  LEFT JOIN (
    SELECT cw.user_id, SUM(cw.amount)::BIGINT AS total_withdrawn, COUNT(*)::BIGINT AS wd_count,
           (ARRAY_AGG(cw.wallet_address ORDER BY cw.created_at DESC))[1] AS last_wallet
    FROM coin_withdrawals cw WHERE cw.status = 'completed' GROUP BY cw.user_id
  ) wd ON wd.user_id = p.user_id
  -- PPLP actions
  LEFT JOIN (
    SELECT pa2.actor_id, COUNT(*)::BIGINT AS action_count,
           COUNT(CASE WHEN pa2.status = 'minted' THEN 1 END)::BIGINT AS minted_count
    FROM pplp_actions pa2 GROUP BY pa2.actor_id
  ) pa ON pa.actor_id = p.user_id
  ORDER BY ula.agreed_at DESC NULLS LAST;
END;
$function$;
