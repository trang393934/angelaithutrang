
-- Phase 1: Expand Camly Coin System

-- 1.1 Add new transaction types to enum
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'daily_login';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'bounty_reward';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'build_idea';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'content_share';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'knowledge_upload';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'feedback_reward';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'vision_reward';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'community_support';

-- 1.2 Create daily_login_tracking table
CREATE TABLE public.daily_login_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_count INTEGER NOT NULL DEFAULT 1,
  coins_earned INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

ALTER TABLE public.daily_login_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login tracking"
ON public.daily_login_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage login tracking"
ON public.daily_login_tracking FOR ALL
USING (auth.uid() = user_id OR is_admin());

-- 1.3 Create bounty_tasks table
CREATE TABLE public.bounty_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_amount INTEGER NOT NULL DEFAULT 1000,
  difficulty_level TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  max_completions INTEGER,
  current_completions INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
  category TEXT,
  requirements TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bounty_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bounty tasks"
ON public.bounty_tasks FOR SELECT
USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage bounty tasks"
ON public.bounty_tasks FOR ALL
USING (is_admin());

-- 1.4 Create bounty_submissions table
CREATE TABLE public.bounty_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.bounty_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submission_content TEXT NOT NULL,
  submission_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_needed')),
  reward_earned INTEGER DEFAULT 0,
  admin_feedback TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bounty_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions"
ON public.bounty_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions"
ON public.bounty_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all submissions"
ON public.bounty_submissions FOR ALL
USING (is_admin());

-- 1.5 Create build_ideas table
CREATE TABLE public.build_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  votes_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  is_rewarded BOOLEAN DEFAULT false,
  reward_amount INTEGER DEFAULT 0,
  admin_feedback TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.build_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved ideas"
ON public.build_ideas FOR SELECT
USING (status = 'approved' OR status = 'implemented' OR auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create ideas"
ON public.build_ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending ideas"
ON public.build_ideas FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all ideas"
ON public.build_ideas FOR ALL
USING (is_admin());

-- 1.6 Create idea_votes table
CREATE TABLE public.idea_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.build_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
ON public.idea_votes FOR SELECT
USING (true);

CREATE POLICY "Users can manage their votes"
ON public.idea_votes FOR ALL
USING (auth.uid() = user_id);

-- 1.7 Create content_shares table
CREATE TABLE public.content_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('facebook', 'twitter', 'linkedin', 'telegram', 'other')),
  content_type TEXT NOT NULL CHECK (content_type IN ('question', 'idea', 'knowledge', 'app', 'other')),
  content_id UUID,
  share_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  coins_earned INTEGER DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shares"
ON public.content_shares FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares"
ON public.content_shares FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update shares"
ON public.content_shares FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage all shares"
ON public.content_shares FOR ALL
USING (is_admin());

-- 1.8 Create user_feedback table
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'improvement', 'praise', 'other')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_length INTEGER NOT NULL DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_helpful BOOLEAN DEFAULT false,
  is_rewarded BOOLEAN DEFAULT false,
  coins_earned INTEGER DEFAULT 0,
  admin_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'in_progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
ON public.user_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
ON public.user_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback"
ON public.user_feedback FOR ALL
USING (is_admin());

-- 1.9 Create vision_boards table
CREATE TABLE public.vision_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goals JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_first_board BOOLEAN DEFAULT false,
  is_rewarded BOOLEAN DEFAULT false,
  reward_amount INTEGER DEFAULT 0,
  completed_goals_count INTEGER DEFAULT 0,
  total_goals_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vision_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vision boards"
ON public.vision_boards FOR SELECT
USING (auth.uid() = user_id OR (is_public = true));

CREATE POLICY "Users can create vision boards"
ON public.vision_boards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their vision boards"
ON public.vision_boards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their vision boards"
ON public.vision_boards FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vision boards"
ON public.vision_boards FOR ALL
USING (is_admin());

-- 1.10 Create community_helps table
CREATE TABLE public.community_helps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_id UUID NOT NULL,
  helped_user_id UUID NOT NULL,
  question_id UUID REFERENCES public.chat_questions(id) ON DELETE SET NULL,
  help_type TEXT NOT NULL CHECK (help_type IN ('answer', 'guidance', 'resource', 'other')),
  help_content TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_rewarded BOOLEAN DEFAULT false,
  coins_earned INTEGER DEFAULT 0,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_helps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own helps"
ON public.community_helps FOR SELECT
USING (auth.uid() = helper_id OR auth.uid() = helped_user_id);

CREATE POLICY "Users can create help records"
ON public.community_helps FOR INSERT
WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Helped users can verify"
ON public.community_helps FOR UPDATE
USING (auth.uid() = helped_user_id OR is_admin());

CREATE POLICY "Admins can manage all helps"
ON public.community_helps FOR ALL
USING (is_admin());

-- 1.11 Extend daily_reward_tracking table with new columns
ALTER TABLE public.daily_reward_tracking
ADD COLUMN IF NOT EXISTS logins_rewarded INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_rewarded INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS feedbacks_rewarded INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ideas_submitted INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS community_helps_rewarded INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_uploads INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coins_today BIGINT NOT NULL DEFAULT 0;

-- 1.12 Create function to get extended daily reward status
CREATE OR REPLACE FUNCTION public.get_extended_daily_reward_status(_user_id uuid)
RETURNS TABLE(
  questions_rewarded integer,
  questions_remaining integer,
  journals_rewarded integer,
  journals_remaining integer,
  can_write_journal boolean,
  logins_rewarded integer,
  shares_rewarded integer,
  shares_remaining integer,
  feedbacks_rewarded integer,
  feedbacks_remaining integer,
  ideas_submitted integer,
  ideas_remaining integer,
  community_helps_rewarded integer,
  community_helps_remaining integer,
  knowledge_uploads integer,
  knowledge_uploads_remaining integer,
  total_coins_today bigint,
  current_streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tracking RECORD;
  _current_hour INTEGER;
  _streak INTEGER;
BEGIN
  -- Get current hour in Vietnam timezone (UTC+7)
  _current_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'));
  
  -- Get or create today's tracking
  SELECT * INTO _tracking
  FROM public.daily_reward_tracking
  WHERE user_id = _user_id AND reward_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.daily_reward_tracking (user_id, reward_date)
    VALUES (_user_id, CURRENT_DATE)
    RETURNING * INTO _tracking;
  END IF;
  
  -- Get current login streak
  SELECT COALESCE(streak_count, 0) INTO _streak
  FROM public.daily_login_tracking
  WHERE user_id = _user_id AND login_date = CURRENT_DATE;
  
  IF _streak IS NULL THEN
    _streak := 0;
  END IF;
  
  RETURN QUERY SELECT
    _tracking.questions_rewarded,
    GREATEST(0, 10 - _tracking.questions_rewarded)::INTEGER,
    _tracking.journals_rewarded,
    GREATEST(0, 3 - _tracking.journals_rewarded)::INTEGER,
    (_current_hour >= 20)::BOOLEAN,
    _tracking.logins_rewarded,
    _tracking.shares_rewarded,
    GREATEST(0, 3 - _tracking.shares_rewarded)::INTEGER,
    _tracking.feedbacks_rewarded,
    GREATEST(0, 2 - _tracking.feedbacks_rewarded)::INTEGER,
    _tracking.ideas_submitted,
    GREATEST(0, 2 - _tracking.ideas_submitted)::INTEGER,
    _tracking.community_helps_rewarded,
    GREATEST(0, 5 - _tracking.community_helps_rewarded)::INTEGER,
    _tracking.knowledge_uploads,
    GREATEST(0, 2 - _tracking.knowledge_uploads)::INTEGER,
    _tracking.total_coins_today,
    _streak;
END;
$function$;

-- 1.13 Create function to process daily login reward
CREATE OR REPLACE FUNCTION public.process_daily_login(_user_id uuid)
RETURNS TABLE(
  already_logged_in boolean,
  streak_count integer,
  coins_earned integer,
  is_streak_bonus boolean,
  new_balance bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _existing RECORD;
  _yesterday_login RECORD;
  _new_streak INTEGER;
  _reward INTEGER;
  _is_bonus BOOLEAN;
  _balance BIGINT;
BEGIN
  -- Check if already logged in today
  SELECT * INTO _existing
  FROM public.daily_login_tracking
  WHERE user_id = _user_id AND login_date = CURRENT_DATE;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, _existing.streak_count, 0, false, 
      (SELECT balance FROM public.camly_coin_balances WHERE user_id = _user_id);
    RETURN;
  END IF;
  
  -- Check yesterday's login for streak
  SELECT * INTO _yesterday_login
  FROM public.daily_login_tracking
  WHERE user_id = _user_id AND login_date = CURRENT_DATE - INTERVAL '1 day';
  
  IF FOUND THEN
    _new_streak := _yesterday_login.streak_count + 1;
  ELSE
    _new_streak := 1;
  END IF;
  
  -- Calculate reward based on streak
  -- Day 1-6: 100 coins
  -- Day 7: 1000 coins bonus (then reset counting for next week bonus)
  IF _new_streak >= 7 AND (_new_streak % 7) = 0 THEN
    _reward := 1000;
    _is_bonus := true;
  ELSE
    _reward := 100;
    _is_bonus := false;
  END IF;
  
  -- Insert login record
  INSERT INTO public.daily_login_tracking (user_id, login_date, streak_count, coins_earned)
  VALUES (_user_id, CURRENT_DATE, _new_streak, _reward);
  
  -- Update daily tracking
  UPDATE public.daily_reward_tracking
  SET logins_rewarded = logins_rewarded + 1,
      total_coins_today = total_coins_today + _reward,
      updated_at = now()
  WHERE user_id = _user_id AND reward_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.daily_reward_tracking (user_id, reward_date, logins_rewarded, total_coins_today)
    VALUES (_user_id, CURRENT_DATE, 1, _reward);
  END IF;
  
  -- Add coins
  _balance := add_camly_coins(
    _user_id, 
    _reward, 
    'daily_login', 
    CASE WHEN _is_bonus THEN 'Streak 7 ngày bonus!' ELSE 'Đăng nhập hàng ngày (ngày ' || _new_streak || ')' END,
    NULL,
    jsonb_build_object('streak', _new_streak, 'is_bonus', _is_bonus)
  );
  
  RETURN QUERY SELECT false, _new_streak, _reward, _is_bonus, _balance;
END;
$function$;

-- 1.14 Create triggers for updated_at
CREATE TRIGGER update_bounty_tasks_updated_at
BEFORE UPDATE ON public.bounty_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bounty_submissions_updated_at
BEFORE UPDATE ON public.bounty_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_build_ideas_updated_at
BEFORE UPDATE ON public.build_ideas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vision_boards_updated_at
BEFORE UPDATE ON public.vision_boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.15 Create trigger to update votes count on build_ideas
CREATE OR REPLACE FUNCTION public.update_idea_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.build_ideas
    SET votes_count = votes_count + 1
    WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.build_ideas
    SET votes_count = votes_count - 1
    WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER update_idea_votes_count_trigger
AFTER INSERT OR DELETE ON public.idea_votes
FOR EACH ROW EXECUTE FUNCTION public.update_idea_votes_count();
