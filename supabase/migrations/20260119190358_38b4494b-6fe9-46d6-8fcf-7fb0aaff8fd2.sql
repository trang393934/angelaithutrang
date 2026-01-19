-- Create early adopter rewards table
CREATE TABLE public.early_adopter_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_questions_count INTEGER NOT NULL DEFAULT 0,
  is_rewarded BOOLEAN NOT NULL DEFAULT false,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  reward_amount INTEGER NOT NULL DEFAULT 20000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.early_adopter_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own early adopter status"
ON public.early_adopter_rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage early adopter rewards"
ON public.early_adopter_rewards FOR ALL
USING (auth.uid() = user_id OR is_admin());

-- Create index for fast lookup
CREATE INDEX idx_early_adopter_user_id ON public.early_adopter_rewards(user_id);
CREATE INDEX idx_early_adopter_registered ON public.early_adopter_rewards(registered_at);

-- Function to check if user is in first 100
CREATE OR REPLACE FUNCTION public.get_early_adopter_rank(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT rank INTO user_rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY registered_at ASC) as rank
    FROM public.early_adopter_rewards
  ) ranked
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process early adopter reward
CREATE OR REPLACE FUNCTION public.process_early_adopter_reward(p_user_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  coins_awarded INTEGER,
  user_rank INTEGER
) AS $$
DECLARE
  v_rank INTEGER;
  v_record RECORD;
  v_new_balance BIGINT;
BEGIN
  -- Get user's early adopter record
  SELECT * INTO v_record FROM public.early_adopter_rewards WHERE user_id = p_user_id;
  
  -- If no record, user not eligible
  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, 'User not registered for early adopter program'::TEXT, 0, 0;
    RETURN;
  END IF;
  
  -- If already rewarded
  IF v_record.is_rewarded THEN
    RETURN QUERY SELECT false, 'Already received early adopter reward'::TEXT, 0, 0;
    RETURN;
  END IF;
  
  -- Check if has 10+ valid questions
  IF v_record.valid_questions_count < 10 THEN
    RETURN QUERY SELECT false, 'Need 10 valid questions'::TEXT, 0, 0;
    RETURN;
  END IF;
  
  -- Get user rank
  v_rank := public.get_early_adopter_rank(p_user_id);
  
  -- Check if in first 100
  IF v_rank > 100 THEN
    RETURN QUERY SELECT false, 'Not in first 100 users'::TEXT, 0, v_rank;
    RETURN;
  END IF;
  
  -- Award the coins
  v_new_balance := public.add_camly_coins(
    p_user_id,
    20000,
    'early_adopter',
    'Phần thưởng Early Adopter - Top 100 người dùng đầu tiên',
    NULL,
    NULL
  );
  
  -- Mark as rewarded
  UPDATE public.early_adopter_rewards
  SET is_rewarded = true, rewarded_at = now(), updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT true, 'Congratulations! Early adopter reward claimed!'::TEXT, 20000, v_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment valid questions count
CREATE OR REPLACE FUNCTION public.increment_early_adopter_questions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE public.early_adopter_rewards
  SET valid_questions_count = valid_questions_count + 1, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING valid_questions_count INTO v_new_count;
  
  RETURN COALESCE(v_new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to register user for early adopter (called on signup)
CREATE OR REPLACE FUNCTION public.register_early_adopter(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.early_adopter_rewards (user_id, registered_at)
  VALUES (p_user_id, now())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: auto-register on profile creation
CREATE OR REPLACE FUNCTION public.auto_register_early_adopter()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.register_early_adopter(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_register_early_adopter
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_register_early_adopter();