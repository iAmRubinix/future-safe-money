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

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  transaction_type: string;
  date: string;
  description?: string;
  goal_id?: string;
  is_recurring?: boolean;
  recurring_period?: string;
  expense_type?: string;
}

interface SpendingLimit {
  id: string;
  category: string;
  monthly_limit: number;
  current_spent?: number;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionUpdated: () => void;
  transaction: Transaction | null;
}

const EditTransactionModal = ({ isOpen, onClose, onTransactionUpdated, transaction }: EditTransactionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories, getCategoryNames, isLoading: categoriesLoading, refreshCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: '',
    description: '',
    expense_type: 'personal',
    transaction_type: 'expense'
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState('monthly');

  useEffect(() => {
    if (isOpen && user) {
      fetchSpendingLimits();
      refreshCategories();
    }
  }, [isOpen, user, refreshCategories]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title,
        amount: transaction.amount.toString(),
        category: transaction.category,
        date: transaction.date,
        description: transaction.description || '',
        expense_type: transaction.expense_type || 'personal',
        transaction_type: transaction.transaction_type || 'expense'
      });
      setIsRecurring(transaction.is_recurring || false);
      setRecurringPeriod(transaction.recurring_period || 'monthly');
    }
  }, [transaction]);

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

  // Get available categories (user categories or fallback)
  const availableCategories = categories.length > 0 ? getCategoryNames() : [
    "Alimentari", "Trasporti", "Intrattenimento", "Bollette", "Salute", 
    "Shopping", "Ristoranti", "Casa", "Viaggi", "Altro"
  ];

  const getLimitWarning = (category: string, amount: number) => {
    const limit = spendingLimits.find(l => l.category === category);
    if (!limit) return null;

    const currentSpent = (limit.current_spent || 0) + Number(amount);
    const percentage = (currentSpent / limit.monthly_limit) * 100;

    if (percentage >= 100) {
      return {
        type: 'exceeded',
        message: `Limite superato! Hai speso €${currentSpent.toFixed(2)} su €${limit.monthly_limit.toFixed(2)}`
      };
    } else if (percentage >= 80) {
      return {
        type: 'near',
        message: `Attenzione! Hai speso l'${percentage.toFixed(0)}% del limite (€${currentSpent.toFixed(2)} su €${limit.monthly_limit.toFixed(2)})`
      };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          title: formData.title.trim(),
          amount: Number(formData.amount),
          category: formData.category,
          date: formData.date,
          description: formData.description.trim() || null,
          expense_type: formData.transaction_type === 'expense' ? formData.expense_type : null,
          is_recurring: isRecurring,
          recurring_period: isRecurring ? recurringPeriod : null
        })
        .eq('id', transaction.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Transazione aggiornata!",
        description: `La transazione "${formData.title}" è stata modificata con successo`,
      });

      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiornare la transazione",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      amount: '',
      category: '',
      date: '',
      description: '',
      expense_type: 'personal',
      transaction_type: 'expense'
    });
    setIsRecurring(false);
    setRecurringPeriod('monthly');
    onClose();
  };

  if (!transaction) return null;

  const limitWarning = formData.transaction_type === 'expense' && formData.category && formData.amount 
    ? getLimitWarning(formData.category, Number(formData.amount))
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Modifica Transazione
            {transaction.is_recurring && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Ricorrente
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Modifica i dettagli della transazione. Le modifiche si applicheranno solo a questa istanza.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Dettagli</TabsTrigger>
              <TabsTrigger value="recurring">Ricorrenza</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Es. Spesa supermercato"
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
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? "Caricamento..." : "Seleziona categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione (opzionale)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Aggiungi una descrizione..."
                />
              </div>

              {formData.transaction_type === 'expense' && (
                <div className="space-y-2">
                  <Label htmlFor="expense_type">Tipo di Spesa</Label>
                  <Select
                    value={formData.expense_type}
                    onValueChange={(value) => setFormData({ ...formData, expense_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personale</SelectItem>
                      <SelectItem value="household">Domestica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {limitWarning && (
                <Alert className={limitWarning.type === 'exceeded' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className={limitWarning.type === 'exceeded' ? 'text-red-800' : 'text-yellow-800'}>
                    {limitWarning.message}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="recurring" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="recurring">Transazione ricorrente</Label>
              </div>

              {isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurring_period">Periodo di ricorrenza</Label>
                  <Select
                    value={recurringPeriod}
                    onValueChange={setRecurringPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Settimanale</SelectItem>
                      <SelectItem value="monthly">Mensile</SelectItem>
                      <SelectItem value="quarterly">Trimestrale</SelectItem>
                      <SelectItem value="yearly">Annuale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aggiorna Transazione
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
