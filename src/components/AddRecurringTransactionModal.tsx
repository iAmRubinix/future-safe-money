import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Repeat, Calendar } from "lucide-react";
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

interface AddRecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  recurringTransaction: Transaction | null;
}

const AddRecurringTransactionModal = ({ 
  isOpen, 
  onClose, 
  onTransactionAdded, 
  recurringTransaction 
}: AddRecurringTransactionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    expense_type: 'personal'
  });

  useEffect(() => {
    if (isOpen && user) {
      refreshCategories();
    }
  }, [isOpen, user, refreshCategories]);

  useEffect(() => {
    if (recurringTransaction) {
      setFormData({
        title: recurringTransaction.title,
        amount: recurringTransaction.amount.toString(),
        category: recurringTransaction.category,
        date: new Date().toISOString().split('T')[0], // Current date as default
        description: recurringTransaction.description || '',
        expense_type: recurringTransaction.expense_type || 'personal'
      });
    }
  }, [recurringTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recurringTransaction) return;

    setIsLoading(true);

    try {
      const transactionData = {
        user_id: user.id,
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        transaction_type: recurringTransaction.transaction_type,
        date: formData.date,
        description: formData.description.trim() || null,
        expense_type: recurringTransaction.transaction_type === 'expense' ? formData.expense_type : null,
        is_recurring: false // This will be a one-time transaction
      };

      console.log('Creating transaction with data:', transactionData);

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) throw error;

      toast({
        title: "Transazione creata!",
        description: `La transazione "${formData.title}" è stata creata come transazione una tantum`,
      });

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

  const handleClose = () => {
    setFormData({
      title: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      expense_type: 'personal'
    });
    onClose();
  };

  if (!recurringTransaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Aggiungi Transazione Ricorrente
          </DialogTitle>
          <DialogDescription>
            Crea una nuova transazione una tantum basata su questa transazione ricorrente.
            La transazione ricorrente originale rimarrà attiva. Puoi modificare i dettagli e la data prima di confermare.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Categoria"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
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

          {recurringTransaction.transaction_type === 'expense' && (
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Repeat className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Informazioni Transazione Ricorrente</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Periodo:</strong> {recurringTransaction.recurring_period === 'weekly' ? 'Settimanale' : 
                                           recurringTransaction.recurring_period === 'monthly' ? 'Mensile' : 
                                           recurringTransaction.recurring_period === 'quarterly' ? 'Trimestrale' : 
                                           recurringTransaction.recurring_period === 'yearly' ? 'Annuale' : recurringTransaction.recurring_period}</p>
              <p><strong>Tipo:</strong> {recurringTransaction.transaction_type === 'expense' ? 'Spesa' : 'Entrata'}</p>
              {recurringTransaction.expense_type && (
                <p><strong>Categoria spesa:</strong> {recurringTransaction.expense_type === 'personal' ? 'Personale' : 'Domestica'}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea Transazione Una Tantum
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecurringTransactionModal;
