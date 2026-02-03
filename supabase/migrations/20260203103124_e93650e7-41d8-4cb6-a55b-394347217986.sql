-- Add pplp_reward to coin_transaction_type enum
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'pplp_reward';