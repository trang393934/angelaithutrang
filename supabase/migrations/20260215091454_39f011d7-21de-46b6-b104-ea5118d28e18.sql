CREATE OR REPLACE FUNCTION public.get_daily_ai_usage(_user_id uuid)
 RETURNS TABLE(usage_type text, usage_count integer, daily_limit integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.usage_type,
    COALESCE(a.usage_count, 0) AS usage_count,
    CASE t.usage_type
      WHEN 'generate_image' THEN 5
      WHEN 'edit_image' THEN 5
      ELSE NULL::INTEGER
    END AS daily_limit
  FROM (
    VALUES ('chat'), ('generate_image'), ('analyze_image'), ('edit_image')
  ) AS t(usage_type)
  LEFT JOIN public.ai_usage_tracking a 
    ON a.user_id = _user_id 
    AND a.usage_type = t.usage_type 
    AND a.usage_date = CURRENT_DATE;
END;
$function$;