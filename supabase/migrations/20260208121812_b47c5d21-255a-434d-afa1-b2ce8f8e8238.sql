
-- Enable realtime for camly_coin_balances so profile pages update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.camly_coin_balances;
