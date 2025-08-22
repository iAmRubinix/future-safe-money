-- Create spending_limits table
CREATE TABLE IF NOT EXISTS public.spending_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Add RLS policies
ALTER TABLE public.spending_limits ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own spending limits
CREATE POLICY "Users can view their own spending limits" ON public.spending_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own spending limits
CREATE POLICY "Users can insert their own spending limits" ON public.spending_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own spending limits
CREATE POLICY "Users can update their own spending limits" ON public.spending_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own spending limits
CREATE POLICY "Users can delete their own spending limits" ON public.spending_limits
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_spending_limits_updated_at
  BEFORE UPDATE ON public.spending_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
