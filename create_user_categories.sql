-- Create user_categories table
CREATE TABLE IF NOT EXISTS public.user_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'tag',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Add RLS policies
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own categories
CREATE POLICY "Users can view their own categories" ON public.user_categories
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own categories
CREATE POLICY "Users can insert their own categories" ON public.user_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own categories
CREATE POLICY "Users can update their own categories" ON public.user_categories
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own categories
CREATE POLICY "Users can delete their own categories" ON public.user_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_categories_updated_at
  BEFORE UPDATE ON public.user_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.user_categories TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
