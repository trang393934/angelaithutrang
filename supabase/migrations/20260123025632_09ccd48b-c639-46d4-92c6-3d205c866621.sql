-- Add columns to track response recycling
ALTER TABLE chat_questions 
ADD COLUMN IF NOT EXISTS is_response_recycled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recycling_similarity_score NUMERIC;