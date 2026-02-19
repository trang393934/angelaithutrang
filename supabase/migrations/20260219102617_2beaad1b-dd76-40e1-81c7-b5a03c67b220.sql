
-- Tạo bảng system_settings để kiểm soát các cờ hệ thống
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kích hoạt RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi user đã đăng nhập đọc được (cần để frontend check mint_paused)
CREATE POLICY "Authenticated can read system_settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Chỉ admin mới ghi được
CREATE POLICY "Admins can update system_settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system_settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system_settings"
ON public.system_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert cờ tạm dừng mint ngay lập tức
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'mint_system',
  '{"paused": true, "paused_reason": "Tạm dừng để kiểm tra an ninh hệ thống - Phát hiện hành vi sybil farming"}',
  'Cài đặt hệ thống mint FUN Money'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();
