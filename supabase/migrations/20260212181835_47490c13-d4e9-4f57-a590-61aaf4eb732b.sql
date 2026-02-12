
-- Cho phép mọi user đã đăng nhập xem các giao dịch rút thưởng đã hoàn thành
CREATE POLICY "Anyone can view completed withdrawals"
  ON public.coin_withdrawals
  FOR SELECT
  USING (status = 'completed');

-- Cho phép mọi user đã đăng nhập xem các lì xì đã hoàn thành
CREATE POLICY "Anyone can view completed lixi claims"
  ON public.lixi_claims
  FOR SELECT
  USING (status = 'completed');
