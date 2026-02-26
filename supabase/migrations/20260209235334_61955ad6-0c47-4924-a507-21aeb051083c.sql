
-- =============================================
-- Phase 1: Profile Public Settings + View Events
-- =============================================

-- 1. Create profile_public_settings table
CREATE TABLE public.profile_public_settings (
  user_id UUID NOT NULL PRIMARY KEY,
  public_profile_enabled BOOLEAN NOT NULL DEFAULT true,
  allow_public_message BOOLEAN NOT NULL DEFAULT true,
  allow_public_transfer BOOLEAN NOT NULL DEFAULT true,
  allow_public_follow BOOLEAN NOT NULL DEFAULT true,
  show_friends_count BOOLEAN NOT NULL DEFAULT true,
  show_stats BOOLEAN NOT NULL DEFAULT true,
  show_modules BOOLEAN NOT NULL DEFAULT true,
  show_donation_button BOOLEAN NOT NULL DEFAULT false,
  enabled_modules JSONB DEFAULT '["fun_play","fun_academy","fun_market","fun_charity","fun_farm","fun_life","fun_invest"]'::jsonb,
  featured_items JSONB DEFAULT NULL,
  tagline TEXT DEFAULT NULL,
  badge_type TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.profile_public_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS: Anyone can read (public profile)
CREATE POLICY "Anyone can read public settings"
  ON public.profile_public_settings
  FOR SELECT
  USING (true);

-- 4. RLS: Owner can insert own settings
CREATE POLICY "Users can insert own settings"
  ON public.profile_public_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS: Owner can update own settings
CREATE POLICY "Users can update own settings"
  ON public.profile_public_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Auto-create trigger: when a profile is created, auto-create settings row
CREATE OR REPLACE FUNCTION public.auto_create_profile_public_settings()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profile_public_settings (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_profile_public_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_profile_public_settings();

-- 7. Updated_at trigger
CREATE TRIGGER update_profile_public_settings_updated_at
  BEFORE UPDATE ON public.profile_public_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Profile View Events (Analytics)
-- =============================================

CREATE TABLE public.profile_view_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID NOT NULL,
  viewer_user_id UUID DEFAULT NULL,
  event_type TEXT NOT NULL,
  referrer_handle TEXT DEFAULT NULL,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_view_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous viewers too)
CREATE POLICY "Anyone can insert view events"
  ON public.profile_view_events
  FOR INSERT
  WITH CHECK (true);

-- Only profile owner can read their events
CREATE POLICY "Profile owner can read own events"
  ON public.profile_view_events
  FOR SELECT
  USING (auth.uid() = profile_user_id);

-- Index for fast lookups
CREATE INDEX idx_profile_view_events_profile_user ON public.profile_view_events (profile_user_id, created_at DESC);
CREATE INDEX idx_profile_view_events_type ON public.profile_view_events (event_type);

-- Backfill: create settings for existing profiles
INSERT INTO public.profile_public_settings (user_id)
SELECT user_id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
