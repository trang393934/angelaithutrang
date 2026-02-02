-- Add columns to project_donations table for manual crypto donations
ALTER TABLE public.project_donations 
ADD COLUMN IF NOT EXISTS donation_type text NOT NULL DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS tx_hash text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed';

-- Add check constraint for donation_type
ALTER TABLE public.project_donations 
ADD CONSTRAINT project_donations_donation_type_check 
CHECK (donation_type IN ('internal', 'crypto_connected', 'crypto_manual'));

-- Add check constraint for status
ALTER TABLE public.project_donations 
ADD CONSTRAINT project_donations_status_check 
CHECK (status IN ('confirmed', 'pending_verification'));

-- Add index on donation_type for filtering
CREATE INDEX IF NOT EXISTS idx_project_donations_donation_type ON public.project_donations(donation_type);

-- Add index on status for admin verification workflow
CREATE INDEX IF NOT EXISTS idx_project_donations_status ON public.project_donations(status);