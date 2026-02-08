
-- Add handle and handle_updated_at to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS handle text,
ADD COLUMN IF NOT EXISTS handle_updated_at timestamp with time zone;

-- Create unique index on handle (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_handle_unique ON public.profiles (lower(handle));

-- Create index for fast handle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle_lookup ON public.profiles (handle);

-- Create reserved handles table
CREATE TABLE IF NOT EXISTS public.reserved_handles (
  word text PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on reserved_handles
ALTER TABLE public.reserved_handles ENABLE ROW LEVEL SECURITY;

-- Anyone can read reserved handles (for validation)
CREATE POLICY "Anyone can view reserved handles"
ON public.reserved_handles
FOR SELECT
USING (true);

-- Only admins can manage reserved handles
CREATE POLICY "Admins can manage reserved handles"
ON public.reserved_handles
FOR ALL
USING (is_admin());

-- Insert reserved words
INSERT INTO public.reserved_handles (word) VALUES
  ('admin'), ('support'), ('api'), ('wallet'), ('billing'), ('ai'), ('fun'),
  ('help'), ('settings'), ('profile'), ('login'), ('signup'), ('auth'),
  ('angel'), ('angelai'), ('system'), ('moderator'), ('mod'), ('staff'),
  ('official'), ('funrich'), ('fun_rich'), ('camly'), ('bely'), ('root'),
  ('superadmin'), ('dashboard'), ('community'), ('chat'), ('messages'),
  ('notifications'), ('earn'), ('mint'), ('swap'), ('bounty'), ('knowledge'),
  ('vision'), ('ideas'), ('about'), ('docs'), ('receipt'), ('onboarding'),
  ('user'), ('users'), ('null'), ('undefined'), ('delete'), ('edit'),
  ('create'), ('new'), ('search'), ('explore'), ('trending'), ('popular'),
  ('home'), ('index'), ('test'), ('demo'), ('dev'), ('staging'),
  ('production'), ('www'), ('ftp'), ('mail'), ('email'), ('blog'),
  ('news'), ('shop'), ('store'), ('market'), ('play'), ('academy'),
  ('charity'), ('farm'), ('planet'), ('earth'), ('legal'), ('trading'),
  ('invest'), ('treasury'), ('father'), ('universe'), ('god'), ('light')
ON CONFLICT (word) DO NOTHING;

-- Create handle change audit log
CREATE TABLE IF NOT EXISTS public.handle_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  old_handle text,
  new_handle text NOT NULL,
  source text NOT NULL DEFAULT 'settings',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.handle_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit log
CREATE POLICY "Users can view their own handle history"
ON public.handle_audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert audit logs
CREATE POLICY "System can insert handle audit logs"
ON public.handle_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all handle audit logs"
ON public.handle_audit_log
FOR ALL
USING (is_admin());
