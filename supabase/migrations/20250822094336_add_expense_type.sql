-- Add expense_type column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN expense_type VARCHAR(20) DEFAULT 'personal' CHECK (expense_type IN ('personal', 'household'));

-- Add comment to explain the column
COMMENT ON COLUMN public.transactions.expense_type IS 'Type of expense: personal or household for better expense management in shared living situations';

-- Update existing transactions to be personal by default
UPDATE public.transactions SET expense_type = 'personal' WHERE expense_type IS NULL;
