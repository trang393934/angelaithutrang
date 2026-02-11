
-- ============================================
-- FUN Pool Configuration (wallet addresses for each fund tier)
-- ============================================
CREATE TABLE public.fun_pool_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_name TEXT NOT NULL UNIQUE,
  pool_label TEXT NOT NULL,
  wallet_address TEXT,
  retention_rate NUMERIC(6,4) NOT NULL DEFAULT 0.01,
  tier_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fun_pool_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pool config"
  ON public.fun_pool_config FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view active pool config"
  ON public.fun_pool_config FOR SELECT
  USING (is_active = true);

-- Insert default tiers (4-tier cascade)
INSERT INTO public.fun_pool_config (pool_name, pool_label, retention_rate, tier_order, description) VALUES
  ('genesis_community', 'Quỹ Genesis Cộng đồng', 0.0100, 1, 'guardianGov - Giữ 1% tổng mint'),
  ('fun_platform', 'Quỹ Nền tảng FUN', 0.0099, 2, 'Giữ 0.99% phần còn lại sau tầng 1'),
  ('fun_partners', 'Đối tác FUN', 0.0098, 3, 'Giữ 0.98% phần còn lại sau tầng 2');

-- ============================================
-- Distribution Logs (audit trail for every mint distribution)
-- ============================================
CREATE TABLE public.fun_distribution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mint_request_id UUID REFERENCES public.pplp_mint_requests(id),
  action_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  total_reward BIGINT NOT NULL,
  user_amount BIGINT NOT NULL,
  genesis_amount BIGINT NOT NULL DEFAULT 0,
  platform_amount BIGINT NOT NULL DEFAULT 0,
  partners_amount BIGINT NOT NULL DEFAULT 0,
  user_percentage NUMERIC(6,4) NOT NULL,
  genesis_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.0100,
  platform_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.0099,
  partners_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.0098,
  fund_processing_status TEXT NOT NULL DEFAULT 'pending',
  fund_processed_at TIMESTAMP WITH TIME ZONE,
  fund_tx_hashes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fun_distribution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage distribution logs"
  ON public.fun_distribution_logs FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view their own distribution logs"
  ON public.fun_distribution_logs FOR SELECT
  USING (auth.uid() = actor_id);

-- Index for efficient queries
CREATE INDEX idx_fun_distribution_logs_action ON public.fun_distribution_logs(action_id);
CREATE INDEX idx_fun_distribution_logs_status ON public.fun_distribution_logs(fund_processing_status);
