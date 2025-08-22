import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Repeat, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCategories } from "@/hooks/useCategories";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

const recurringPeriods = [
  { value: "weekly", label: "Settimanale" },
  { value: "monthly", label: "Mensile" },
  { value: "quarterly", label: "Trimestrale" },
  { value: "yearly", label: "Annuale" }
];

// Fallback categories in case user categories are not loaded
const fallbackCategories = [
  "Alimentari",
  "Trasporti",
  "Intrattenimento",
  "Bollette",
  "Salute",
  "Shopping",
  "Ristoranti",
  "Casa",
  "Viaggi",
  "Altro"
];

interface SpendingLimit {
  id: string;
  category: string;
  monthly_limit: number;
  current_spent?: number;
}

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded }: AddTransactionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories, getCategoryNames, isLoading: categoriesLoading, refreshCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [isRecurring, setIsRecurring] = useState(false);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    expense_type: 'personal'
  });
  const [recurringPeriod, setRecurringPeriod] = useState('monthly');

  useEffect(() => {
    if (isOpen && user) {
      fetchSpendingLimits();
      // Refresh categories when modal opens to ensure we have the latest data
      refreshCategories();
    }
  }, [isOpen, user, refreshCategories]);

  // Get available categories (user categories or fallback)
  const getAvailableCategories = () => {
    const userCategoryNames = getCategoryNames();
    return userCategoryNames.length > 0 ? userCategoryNames : fallbackCategories;
  };

  const fetchSpendingLimits = async () => {
    if (!user) return;

    try {
      const { data: limits, error: limitsError } = await supabase
        .from('spending_limits')
        .select('*')
        .eq('user_id', user.id);

      if (limitsError) throw limitsError;

      // Get current month spending for each category
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense')
        .eq('is_recurring', false) // Exclude recurring transactions
        .gte('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
        .lt('date', `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`);

      if (transactionsError) throw transactionsError;

      // Calculate current spending per category
      const categorySpending = transactions.reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

      // Combine limits with current spending
      const limitsWithSpending = limits.map(limit => ({
        ...limit,
        current_spent: categorySpending[limit.category] || 0
      }));

      setSpendingLimits(limitsWithSpending);
    } catch (error) {
      console.error('Error fetching spending limits:', error);
    }
  };

  const getLimitWarning = () => {
    if (transactionType !== 'expense' || !formData.category || !formData.amount) return null;
    
    const limit = spendingLimits.find(l => l.category === formData.category);
    if (!limit) return null;

    const currentAmount = parseFloat(formData.amount) || 0;
    const newTotal = (limit.current_spent || 0) + currentAmount;
    const percentage = (newTotal / limit.monthly_limit) * 100;

    if (percentage > 100) {
      return {
        type: 'exceeded',
        message: `⚠️ Attenzione! Con questa spesa supererai il limite mensile di €${limit.monthly_limit.toFixed(2)} per ${formData.category}. Nuovo totale: €${newTotal.toFixed(2)}`,
        percentage
      };
    } else if (percentage >= 80) {
      return {
        type: 'warning',
        message: `⚠️ Attenzione! Con questa spesa raggiungerai l'${percentage.toFixed(0)}% del limite mensile per ${formData.category}.`,
        percentage
      };
    }

    return null;
  };

  const limitWarning = getLimitWarning();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      const transactionData = {
        user_id: user.id,
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        transaction_type: transactionType,
        date: formData.date,
        description: formData.description || null,
        is_recurring: isRecurring,
        recurring_period: isRecurring ? recurringPeriod : null
      };

      // Add expense_type only for expenses
      if (transactionType === 'expense') {
        (transactionData as any).expense_type = formData.expense_type;
      }

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) throw error;

      toast({
        title: "Transazione aggiunta!",
        description: `${transactionType === 'expense' ? 'Spesa' : 'Entrata'} di €${formData.amount} ${isRecurring ? 'ricorrente' : ''} registrata con successo`,
      });

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        expense_type: 'personal'
      });
      setIsRecurring(false);
      setRecurringPeriod('monthly');
      
      onTransactionAdded();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiungere la transazione",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aggiungi Transazione</DialogTitle>
          <DialogDescription>
            Registra una nuova spesa o entrata per tenere traccia delle tue finanze
          </DialogDescription>
        </DialogHeader>

        <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as 'expense' | 'income')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Spesa</TabsTrigger>
            <TabsTrigger value="income">Entrata</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Descrizione</Label>
              <Input
                id="title"
                placeholder={transactionType === 'expense' ? 'es. Spesa supermercato' : 'es. Stipendio'}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoriesLoading ? "Caricamento categorie..." : "Seleziona una categoria"} />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoriesLoading && (
                <p className="text-xs text-muted-foreground">
                  Caricamento categorie personalizzate...
                </p>
              )}
            </div>

            {limitWarning && (
              <Alert className={limitWarning.type === 'exceeded' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className={limitWarning.type === 'exceeded' ? 'text-red-800' : 'text-yellow-800'}>
                  {limitWarning.message}
                </AlertDescription>
              </Alert>
            )}

            {transactionType === 'expense' && (
              <div className="space-y-2">
                <Label htmlFor="expense-type">Tipo di Spesa</Label>
                <Select 
                  value={formData.expense_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, expense_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tipo di spesa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personale</SelectItem>
                    <SelectItem value="household">Domestica (in comune)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Input
                id="description"
                placeholder="Aggiungi una descrizione dettagliata..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="recurring" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Transazione ricorrente
              </Label>
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="recurring-period">Frequenza</Label>
                <Select 
                  value={recurringPeriod} 
                  onValueChange={setRecurringPeriod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona la frequenza" />
                  </SelectTrigger>
                  <SelectContent>
                    {recurringPeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annulla
              </Button>
              <Button 
                type="submit" 
                variant="hero" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {transactionType === 'expense' ? 'Aggiungi Spesa' : 'Aggiungi Entrata'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionModal;