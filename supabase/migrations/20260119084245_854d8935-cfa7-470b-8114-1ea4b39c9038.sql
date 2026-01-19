-- Create enum for user energy status
CREATE TYPE public.energy_level AS ENUM ('very_high', 'high', 'neutral', 'low', 'very_low');

-- Create enum for user approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected', 'trial');

-- Create enum for suspension type
CREATE TYPE public.suspension_type AS ENUM ('temporary', 'permanent');

-- Onboarding responses table
CREATE TABLE public.onboarding_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
  energy_keywords TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_key)
);

-- User energy status tracking
CREATE TABLE public.user_energy_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  current_energy_level energy_level DEFAULT 'neutral',
  overall_sentiment_score NUMERIC(3,2) DEFAULT 0,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  positive_interactions_count INTEGER DEFAULT 0,
  negative_interactions_count INTEGER DEFAULT 0,
  light_shared_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Light points system
CREATE TABLE public.light_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT, -- 'gratitude', 'positive_post', 'helping_others', 'meditation', 'daily_checkin'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User total light points (cached for performance)
CREATE TABLE public.user_light_totals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Healing messages from Angel AI
CREATE TABLE public.healing_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_type TEXT NOT NULL, -- 'warning', 'encouragement', 'healing', 'celebration'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  triggered_by TEXT, -- what triggered this message
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User suspensions
CREATE TABLE public.user_suspensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suspension_type suspension_type NOT NULL,
  reason TEXT NOT NULL,
  healing_message TEXT,
  suspended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  suspended_until TIMESTAMP WITH TIME ZONE, -- null for permanent
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily gratitude entries
CREATE TABLE public.daily_gratitude (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gratitude_text TEXT NOT NULL,
  sentiment_score NUMERIC(3,2),
  light_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity log for behavior monitoring (admin only)
CREATE TABLE public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'post', 'comment', 'reaction', 'chat', 'login'
  content_preview TEXT,
  sentiment_score NUMERIC(3,2),
  energy_impact energy_level,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_energy_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.light_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_light_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healing_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_gratitude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_responses
CREATE POLICY "Users can insert their own responses"
ON public.onboarding_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own responses"
ON public.onboarding_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
ON public.onboarding_responses FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update responses"
ON public.onboarding_responses FOR UPDATE
USING (is_admin());

-- RLS Policies for user_energy_status
CREATE POLICY "Users can view their own status"
ON public.user_energy_status FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own status"
ON public.user_energy_status FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all status"
ON public.user_energy_status FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can manage all status"
ON public.user_energy_status FOR ALL
USING (is_admin());

-- RLS Policies for light_points
CREATE POLICY "Users can view their own points"
ON public.light_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert points"
ON public.light_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage points"
ON public.light_points FOR ALL
USING (is_admin());

-- RLS Policies for user_light_totals
CREATE POLICY "Users can view their own totals"
ON public.user_light_totals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own totals"
ON public.user_light_totals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own totals"
ON public.user_light_totals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all totals"
ON public.user_light_totals FOR ALL
USING (is_admin());

-- RLS Policies for healing_messages
CREATE POLICY "Users can view their own messages"
ON public.healing_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON public.healing_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages"
ON public.healing_messages FOR ALL
USING (is_admin());

-- RLS Policies for user_suspensions
CREATE POLICY "Users can view their own suspensions"
ON public.user_suspensions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage suspensions"
ON public.user_suspensions FOR ALL
USING (is_admin());

-- RLS Policies for daily_gratitude
CREATE POLICY "Users can manage their own gratitude"
ON public.daily_gratitude FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gratitude"
ON public.daily_gratitude FOR SELECT
USING (is_admin());

-- RLS Policies for user_activity_log
CREATE POLICY "Users can insert their own activity"
ON public.user_activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
ON public.user_activity_log FOR SELECT
USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_user_energy_status_updated_at
BEFORE UPDATE ON public.user_energy_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_light_totals_updated_at
BEFORE UPDATE ON public.user_light_totals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to add light points and update totals
CREATE OR REPLACE FUNCTION public.add_light_points(
  _user_id UUID,
  _points INTEGER,
  _reason TEXT,
  _source_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the points record
  INSERT INTO public.light_points (user_id, points, reason, source_type)
  VALUES (_user_id, _points, _reason, _source_type);
  
  -- Update or insert the totals
  INSERT INTO public.user_light_totals (user_id, total_points, lifetime_points)
  VALUES (_user_id, _points, _points)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = user_light_totals.total_points + _points,
    lifetime_points = user_light_totals.lifetime_points + _points,
    updated_at = now();
END;
$$;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_suspensions
    WHERE user_id = _user_id
      AND lifted_at IS NULL
      AND (suspended_until IS NULL OR suspended_until > now())
  )
$$;

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_energy_status
    WHERE user_id = _user_id
      AND approval_status IN ('approved', 'trial')
  )
$$;