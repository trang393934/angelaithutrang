
-- Create project fund table to store donated coins
CREATE TABLE public.project_fund (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balance bigint NOT NULL DEFAULT 0,
  total_received bigint NOT NULL DEFAULT 0,
  total_distributed bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert the initial fund record
INSERT INTO public.project_fund (id, balance, total_received, total_distributed)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0, 0);

-- Enable RLS
ALTER TABLE public.project_fund ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view fund balance"
ON public.project_fund FOR SELECT
USING (true);

CREATE POLICY "Only system can update fund"
ON public.project_fund FOR UPDATE
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_project_fund_updated_at
BEFORE UPDATE ON public.project_fund
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: Add existing donations to the fund
UPDATE public.project_fund
SET 
  balance = (SELECT COALESCE(SUM(amount), 0) FROM project_donations),
  total_received = (SELECT COALESCE(SUM(amount), 0) FROM project_donations)
WHERE id = '00000000-0000-0000-0000-000000000001';
