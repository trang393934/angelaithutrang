-- Create function to auto-create user_energy_status when profile is created
CREATE OR REPLACE FUNCTION public.auto_create_user_energy_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_energy_status (
    user_id,
    approval_status,
    current_energy_level,
    overall_sentiment_score,
    positive_interactions_count,
    negative_interactions_count
  ) VALUES (
    NEW.user_id,
    'pending',
    'neutral',
    0,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_auto_create_user_energy_status ON public.profiles;
CREATE TRIGGER trigger_auto_create_user_energy_status
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_energy_status();

-- Also create user_energy_status for existing profiles that don't have it
INSERT INTO public.user_energy_status (user_id, approval_status, current_energy_level, overall_sentiment_score, positive_interactions_count, negative_interactions_count)
SELECT p.user_id, 'pending', 'neutral', 0, 0, 0
FROM public.profiles p
LEFT JOIN public.user_energy_status ues ON ues.user_id = p.user_id
WHERE ues.id IS NULL;