-- Thêm cột celebrated_at để theo dõi đã hiển thị celebration chưa
ALTER TABLE coin_withdrawals 
ADD COLUMN IF NOT EXISTS celebrated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Thêm RLS policy cho user update celebrated_at
CREATE POLICY "Users can update celebrated_at on their withdrawals" 
ON coin_withdrawals FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);