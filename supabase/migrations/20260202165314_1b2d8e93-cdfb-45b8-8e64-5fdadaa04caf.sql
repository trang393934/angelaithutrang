-- Add project_reward transaction type for fund distributions
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'project_reward';