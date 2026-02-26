
-- ============================================================
-- BƯỚC 1: Tạo bảng sybil_pattern_registry
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sybil_pattern_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'email_suffix', 'email_prefix', 'wallet_cluster', 'registration_burst'
  pattern_value TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  flagged_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pattern_type, pattern_value)
);

ALTER TABLE public.sybil_pattern_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage sybil patterns"
ON public.sybil_pattern_registry
FOR ALL
USING (public.is_admin());

-- ============================================================
-- BƯỚC 2: Tạo bảng fraud_alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'email_pattern', 'bulk_registration', 'wallet_cluster', 'withdrawal_spike'
  matched_pattern TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT, -- 'banned', 'ignored', 'pending'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage fraud alerts"
ON public.fraud_alerts
FOR ALL
USING (public.is_admin());

-- Index để tìm kiếm nhanh
CREATE INDEX idx_fraud_alerts_user_id ON public.fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_is_reviewed ON public.fraud_alerts(is_reviewed);
CREATE INDEX idx_fraud_alerts_created_at ON public.fraud_alerts(created_at DESC);
CREATE INDEX idx_sybil_pattern_type ON public.sybil_pattern_registry(pattern_type);

-- ============================================================
-- BƯỚC 3: Function auto_fraud_check để trigger khi đăng ký
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_fraud_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_pattern RECORD;
  v_alert_count INTEGER;
  v_recent_registrations INTEGER;
BEGIN
  -- Lấy email của user mới đăng ký
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Kiểm tra email với các pattern trong sybil_pattern_registry
  FOR v_pattern IN
    SELECT * FROM public.sybil_pattern_registry WHERE is_active = true
  LOOP
    IF v_email ILIKE '%' || v_pattern.pattern_value || '%' THEN
      -- Tạo fraud alert
      INSERT INTO public.fraud_alerts (
        user_id, alert_type, matched_pattern, severity, details
      ) VALUES (
        NEW.user_id,
        'email_pattern',
        v_pattern.pattern_value,
        v_pattern.severity,
        jsonb_build_object(
          'email', v_email,
          'pattern_type', v_pattern.pattern_type,
          'pattern_id', v_pattern.id
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  -- Kiểm tra bulk registration: >3 tài khoản trong 2 giờ
  SELECT COUNT(*) INTO v_recent_registrations
  FROM public.user_light_agreements
  WHERE agreed_at > now() - INTERVAL '2 hours'
    AND user_id != NEW.user_id;
  
  IF v_recent_registrations >= 3 THEN
    -- Kiểm tra email prefix tương tự (5 ký tự đầu)
    SELECT COUNT(*) INTO v_alert_count
    FROM auth.users au
    JOIN public.user_light_agreements ula ON ula.user_id = au.id
    WHERE ula.agreed_at > now() - INTERVAL '2 hours'
      AND au.id != NEW.user_id
      AND SUBSTRING(au.email, 1, 5) = SUBSTRING(v_email, 1, 5);
    
    IF v_alert_count >= 2 THEN
      INSERT INTO public.fraud_alerts (
        user_id, alert_type, severity, details
      ) VALUES (
        NEW.user_id,
        'bulk_registration',
        'high',
        jsonb_build_object(
          'email', v_email,
          'similar_accounts_2h', v_alert_count,
          'email_prefix', SUBSTRING(v_email, 1, 5)
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger trên user_light_agreements (khi user hoàn tất đăng ký)
DROP TRIGGER IF EXISTS check_fraud_on_registration ON public.user_light_agreements;
CREATE TRIGGER check_fraud_on_registration
AFTER INSERT ON public.user_light_agreements
FOR EACH ROW
EXECUTE FUNCTION public.auto_fraud_check();

-- ============================================================
-- BƯỚC 4: Seed dữ liệu - Các pattern đã biết từ cuộc điều tra
-- ============================================================
INSERT INTO public.sybil_pattern_registry (pattern_type, pattern_value, severity, description) VALUES
('email_suffix', '270818', 'critical', 'Nhóm sybil 270818 - 4 tài khoản phát hiện 2026-02-18'),
('email_suffix', '11136', 'critical', 'Nhóm sybil 11136 - 4 tài khoản phát hiện 2026-02-18'),
('email_suffix', '442', 'critical', 'Nhóm sybil 442 - ví tổng 0x0CFc02... phát hiện 2026-02-18'),
('email_suffix', '4334', 'critical', 'Nhóm sybil 442/4334 - liên kết ví tổng phát hiện 2026-02-18'),
('email_suffix', '68682', 'critical', 'Nhóm sybil 68682 - ví tổng 0xAdF1E1... phát hiện 2026-02-18'),
('email_prefix', 'bachp', 'critical', 'Nhóm sybil bachp* - 7 tài khoản phát hiện 2026-02-18'),
('email_prefix', 'bachn', 'critical', 'Nhóm sybil bachn* - liên kết nhóm bachp phát hiện 2026-02-18')
ON CONFLICT (pattern_type, pattern_value) DO NOTHING;
