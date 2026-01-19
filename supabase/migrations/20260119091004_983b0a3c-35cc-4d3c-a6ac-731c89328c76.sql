
-- =============================================
-- CAMLY COIN REWARD SYSTEM
-- =============================================

-- 1. Camly Coin Balances
CREATE TABLE public.camly_coin_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance BIGINT NOT NULL DEFAULT 0,
  lifetime_earned BIGINT NOT NULL DEFAULT 0,
  lifetime_spent BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.camly_coin_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own balance" ON public.camly_coin_balances
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own balance" ON public.camly_coin_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "System can update balances" ON public.camly_coin_balances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all balances" ON public.camly_coin_balances
  FOR ALL USING (is_admin());

-- 2. Camly Coin Transactions
CREATE TYPE coin_transaction_type AS ENUM (
  'chat_reward',
  'gratitude_reward', 
  'journal_reward',
  'engagement_reward',
  'referral_bonus',
  'challenge_reward',
  'spending',
  'admin_adjustment'
);

CREATE TABLE public.camly_coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  transaction_type coin_transaction_type NOT NULL,
  description TEXT,
  purity_score NUMERIC(3,2), -- 0.00 to 1.00
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.camly_coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.camly_coin_transactions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "System can insert transactions" ON public.camly_coin_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage all transactions" ON public.camly_coin_transactions
  FOR ALL USING (is_admin());

-- 3. Daily Reward Tracking (for caps)
CREATE TABLE public.daily_reward_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_rewarded INTEGER NOT NULL DEFAULT 0,
  journals_rewarded INTEGER NOT NULL DEFAULT 0,
  question_hashes TEXT[] DEFAULT '{}', -- Store hashes of rewarded questions to detect duplicates
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_date)
);

ALTER TABLE public.daily_reward_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracking" ON public.daily_reward_tracking
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "System can manage tracking" ON public.daily_reward_tracking
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- 4. Chat Questions Log (for duplicate detection and engagement)
CREATE TABLE public.chat_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_hash TEXT NOT NULL, -- MD5 or similar hash for duplicate detection
  purity_score NUMERIC(3,2), -- AI-analyzed purity score
  reward_amount BIGINT DEFAULT 0,
  is_rewarded BOOLEAN DEFAULT false,
  is_spam BOOLEAN DEFAULT false,
  is_greeting BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  ai_response_preview TEXT, -- First 200 chars of AI response
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own questions" ON public.chat_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view questions for engagement" ON public.chat_questions
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert their own questions" ON public.chat_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "System can update questions" ON public.chat_questions
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage all questions" ON public.chat_questions
  FOR ALL USING (is_admin());

-- 5. Question Likes (for engagement rewards)
CREATE TABLE public.question_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.chat_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.question_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their likes" ON public.question_likes FOR ALL USING (auth.uid() = user_id);

-- 6. Gratitude Journal (evening entries after 8pm)
CREATE TABLE public.gratitude_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journal_type TEXT NOT NULL CHECK (journal_type IN ('gratitude', 'confession')),
  content TEXT NOT NULL,
  content_length INTEGER NOT NULL,
  purity_score NUMERIC(3,2),
  reward_amount BIGINT DEFAULT 0,
  is_rewarded BOOLEAN DEFAULT false,
  journal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gratitude_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journals" ON public.gratitude_journal
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own journals" ON public.gratitude_journal
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update journals" ON public.gratitude_journal
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage all journals" ON public.gratitude_journal
  FOR ALL USING (is_admin());

-- 7. User Rate Limiting (anti-abuse)
CREATE TABLE public.user_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  questions_last_hour INTEGER DEFAULT 0,
  last_question_at TIMESTAMP WITH TIME ZONE,
  is_temp_banned BOOLEAN DEFAULT false,
  temp_ban_until TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  suspicious_activity_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" ON public.user_rate_limits
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "System can manage rate limits" ON public.user_rate_limits
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- 8. Function to add Camly coins
CREATE OR REPLACE FUNCTION public.add_camly_coins(
  _user_id UUID,
  _amount BIGINT,
  _transaction_type coin_transaction_type,
  _description TEXT DEFAULT NULL,
  _purity_score NUMERIC DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  -- Insert or update balance
  INSERT INTO public.camly_coin_balances (user_id, balance, lifetime_earned)
  VALUES (_user_id, _amount, _amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = camly_coin_balances.balance + _amount,
    lifetime_earned = camly_coin_balances.lifetime_earned + _amount,
    updated_at = now()
  RETURNING balance INTO new_balance;
  
  -- Record transaction
  INSERT INTO public.camly_coin_transactions (
    user_id, amount, transaction_type, description, purity_score, metadata
  ) VALUES (
    _user_id, _amount, _transaction_type, _description, _purity_score, _metadata
  );
  
  RETURN new_balance;
END;
$$;

-- 9. Function to get remaining daily rewards
CREATE OR REPLACE FUNCTION public.get_daily_reward_status(_user_id UUID)
RETURNS TABLE(
  questions_rewarded INTEGER,
  questions_remaining INTEGER,
  journals_rewarded INTEGER,
  journals_remaining INTEGER,
  can_write_journal BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tracking RECORD;
  _current_hour INTEGER;
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
  
  RETURN QUERY SELECT
    _tracking.questions_rewarded,
    GREATEST(0, 10 - _tracking.questions_rewarded)::INTEGER,
    _tracking.journals_rewarded,
    GREATEST(0, 3 - _tracking.journals_rewarded)::INTEGER,
    (_current_hour >= 20)::BOOLEAN; -- Can write journal after 8pm
END;
$$;

-- 10. Update triggers
CREATE TRIGGER update_camly_coin_balances_updated_at
  BEFORE UPDATE ON public.camly_coin_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reward_tracking_updated_at
  BEFORE UPDATE ON public.daily_reward_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_rate_limits_updated_at
  BEFORE UPDATE ON public.user_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Indexes for performance
CREATE INDEX idx_camly_coin_transactions_user_date ON public.camly_coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_chat_questions_user_date ON public.chat_questions(user_id, created_at DESC);
CREATE INDEX idx_chat_questions_hash ON public.chat_questions(question_hash);
CREATE INDEX idx_gratitude_journal_user_date ON public.gratitude_journal(user_id, journal_date);
CREATE INDEX idx_daily_reward_tracking_user_date ON public.daily_reward_tracking(user_id, reward_date);
