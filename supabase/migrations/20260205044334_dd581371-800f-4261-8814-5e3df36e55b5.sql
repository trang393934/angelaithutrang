-- Sửa constraint cho multiplier_i từ >= 1.0 thành >= 0.5
ALTER TABLE pplp_scores DROP CONSTRAINT IF EXISTS pplp_scores_multiplier_i_check;
ALTER TABLE pplp_scores ADD CONSTRAINT pplp_scores_multiplier_i_check 
  CHECK (multiplier_i >= 0.5 AND multiplier_i <= 5.0);