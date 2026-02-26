ALTER TABLE public.camly_coin_transactions DROP CONSTRAINT check_reasonable_amounts;

ALTER TABLE public.camly_coin_transactions ADD CONSTRAINT check_reasonable_amounts CHECK (amount >= -300000000 AND amount <= 500000000);