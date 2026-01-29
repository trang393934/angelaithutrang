-- =============================================
-- FUN PROFILE PHASE 1 - DATABASE SCHEMA
-- =============================================

-- Module 1: Soul Tags for Profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS soul_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS popl_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS popl_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS popl_badge_level TEXT DEFAULT 'newcomer';

-- Module 3: Rename/Enhance Pure Love Score (using existing light_points as base)
-- Add additional columns to user_light_totals for PoPL Score
ALTER TABLE public.user_light_totals
ADD COLUMN IF NOT EXISTS popl_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS positive_actions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS negative_actions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_score_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to calculate PoPL Score
CREATE OR REPLACE FUNCTION public.update_popl_score(_user_id UUID, _action_type TEXT, _is_positive BOOLEAN)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_score NUMERIC;
  _adjustment NUMERIC;
BEGIN
  -- Get current score
  SELECT COALESCE(popl_score, 50) INTO _current_score
  FROM user_light_totals WHERE user_id = _user_id;
  
  -- Calculate adjustment based on action type
  IF _is_positive THEN
    _adjustment := CASE _action_type
      WHEN 'help_community' THEN 5
      WHEN 'share_content' THEN 2
      WHEN 'quality_post' THEN 3
      WHEN 'donate' THEN 10
      WHEN 'quality_question' THEN 2
      ELSE 1
    END;
  ELSE
    _adjustment := CASE _action_type
      WHEN 'toxic' THEN -10
      WHEN 'scam' THEN -50
      WHEN 'ego_attack' THEN -5
      WHEN 'spam' THEN -3
      ELSE -1
    END;
  END IF;
  
  -- Update score (bounded 0-100)
  UPDATE user_light_totals
  SET 
    popl_score = GREATEST(0, LEAST(100, COALESCE(popl_score, 50) + _adjustment)),
    positive_actions = CASE WHEN _is_positive THEN positive_actions + 1 ELSE positive_actions END,
    negative_actions = CASE WHEN NOT _is_positive THEN negative_actions + 1 ELSE negative_actions END,
    last_score_update = NOW()
  WHERE user_id = _user_id
  RETURNING popl_score INTO _current_score;
  
  -- Insert if not exists
  IF NOT FOUND THEN
    INSERT INTO user_light_totals (user_id, popl_score, positive_actions, negative_actions)
    VALUES (_user_id, GREATEST(0, LEAST(100, 50 + _adjustment)), 
            CASE WHEN _is_positive THEN 1 ELSE 0 END,
            CASE WHEN NOT _is_positive THEN 1 ELSE 0 END)
    RETURNING popl_score INTO _current_score;
  END IF;
  
  RETURN _current_score;
END;
$$;

-- Module 6: Community Circles
CREATE TABLE IF NOT EXISTS public.community_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✨',
  color TEXT DEFAULT '#FFB800',
  circle_type TEXT NOT NULL DEFAULT 'public', -- public, private, invite_only
  created_by UUID NOT NULL,
  max_members INTEGER DEFAULT 1000,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.community_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- admin, moderator, member
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  invited_by UUID,
  UNIQUE(circle_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

-- Policies for community_circles
CREATE POLICY "Anyone can view public circles"
  ON public.community_circles FOR SELECT
  USING (circle_type = 'public' OR is_admin() OR 
         EXISTS (SELECT 1 FROM circle_members WHERE circle_id = id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can create circles"
  ON public.community_circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle admins can update their circles"
  ON public.community_circles FOR UPDATE
  USING (auth.uid() = created_by OR is_admin());

CREATE POLICY "Circle admins can delete their circles"
  ON public.community_circles FOR DELETE
  USING (auth.uid() = created_by OR is_admin());

-- Policies for circle_members
CREATE POLICY "Circle members can view members"
  ON public.circle_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM circle_members cm WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM community_circles c WHERE c.id = circle_id AND c.circle_type = 'public'));

CREATE POLICY "Users can join public circles"
  ON public.circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id AND 
              EXISTS (SELECT 1 FROM community_circles c WHERE c.id = circle_id AND c.circle_type = 'public'));

CREATE POLICY "Users can leave circles"
  ON public.circle_members FOR DELETE
  USING (auth.uid() = user_id OR 
         EXISTS (SELECT 1 FROM circle_members cm WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() AND cm.role = 'admin'));

-- Create default official circles
INSERT INTO public.community_circles (name, description, icon, color, circle_type, created_by, is_official)
SELECT 'Angel AI Circle', 'Những người đồng hành cùng Angel AI trên hành trình thức tỉnh', '👼', '#FFD700', 'public', 
       (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1), TRUE
WHERE NOT EXISTS (SELECT 1 FROM community_circles WHERE name = 'Angel AI Circle');

INSERT INTO public.community_circles (name, description, icon, color, circle_type, created_by, is_official)
SELECT 'Founder Circle', 'Nhóm những người sáng lập và đóng góp ban đầu cho FUN Ecosystem', '🌟', '#8B5CF6', 'invite_only',
       (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1), TRUE
WHERE NOT EXISTS (SELECT 1 FROM community_circles WHERE name = 'Founder Circle');

INSERT INTO public.community_circles (name, description, icon, color, circle_type, created_by, is_official)
SELECT 'FUN Charity Circle', 'Cộng đồng những trái tim yêu thương và sẻ chia', '💝', '#EC4899', 'public',
       (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1), TRUE
WHERE NOT EXISTS (SELECT 1 FROM community_circles WHERE name = 'FUN Charity Circle');

INSERT INTO public.community_circles (name, description, icon, color, circle_type, created_by, is_official)
SELECT 'Cosmic Coach Circle', 'Nhóm các coach và mentor trong hệ sinh thái ánh sáng', '🔮', '#0EA5E9', 'invite_only',
       (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1), TRUE
WHERE NOT EXISTS (SELECT 1 FROM community_circles WHERE name = 'Cosmic Coach Circle');