
-- 1. user_light_totals: Cho phép xem PoPL Score của bất kỳ ai
CREATE POLICY "Public can view PoPL scores"
  ON public.user_light_totals FOR SELECT
  USING (true);

-- 2. pplp_actions: Cho phép xem trạng thái action (cho FUN Money Stats)
CREATE POLICY "Public can view action status"
  ON public.pplp_actions FOR SELECT
  USING (true);

-- 3. pplp_scores: Cho phép xem điểm thưởng (cho FUN Money Stats)
CREATE POLICY "Public can view scores"
  ON public.pplp_scores FOR SELECT
  USING (true);
