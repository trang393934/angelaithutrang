-- Fix search_path for PPLP functions
CREATE OR REPLACE FUNCTION public.calculate_light_score(
  _s NUMERIC, _t NUMERIC, _h NUMERIC, _c NUMERIC, _u NUMERIC
) RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT ROUND((_s * 0.25) + (_t * 0.20) + (_h * 0.20) + (_c * 0.20) + (_u * 0.15), 2)
$$;

CREATE OR REPLACE FUNCTION public.calculate_pplp_reward(
  _base_reward BIGINT, _q NUMERIC, _i NUMERIC, _k NUMERIC
) RETURNS BIGINT
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT ROUND(_base_reward * _q * _i * _k)::BIGINT
$$;