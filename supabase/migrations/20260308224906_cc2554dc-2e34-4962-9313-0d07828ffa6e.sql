
-- Add choice_balance column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN choice_balance integer NOT NULL DEFAULT 0;

-- Create choice_transactions table
CREATE TABLE public.choice_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast lookups by user
CREATE INDEX idx_choice_transactions_user_id ON public.choice_transactions(user_id);

-- Create unique index to prevent duplicate rewards (user + type combo)
CREATE UNIQUE INDEX idx_choice_transactions_unique_reward ON public.choice_transactions(user_id, type, reason);

-- Enable RLS on choice_transactions
ALTER TABLE public.choice_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for choice_transactions
CREATE POLICY "Anyone can read transactions" ON public.choice_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transactions" ON public.choice_transactions FOR INSERT WITH CHECK (true);
