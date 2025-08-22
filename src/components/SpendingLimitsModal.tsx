import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";

interface SpendingLimit {
  id: string;
  category: string;
  monthly_limit: number;
  current_spent?: number;
}

interface SpendingLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLimitsUpdated: () => void;
}

const SpendingLimitsModal = ({ isOpen, onClose, onLimitsUpdated }: SpendingLimitsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCategoryNames, isLoading: categoriesLoading, refreshCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [newLimit, setNewLimit] = useState({
    category: '',
    monthly_limit: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchSpendingLimits();
      // Refresh categories when modal opens to ensure we have the latest data
      refreshCategories();
    }
  }, [isOpen, user, refreshCategories]);

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

  const addSpendingLimit = async () => {
    if (!user || !newLimit.category || !newLimit.monthly_limit) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('spending_limits')
        .upsert({
          user_id: user.id,
          category: newLimit.category,
          monthly_limit: parseFloat(newLimit.monthly_limit)
        });

      if (error) throw error;

      toast({
        title: "Limite aggiunto!",
        description: `Limite di €${newLimit.monthly_limit} per ${newLimit.category} impostato con successo`,
      });

      setNewLimit({ category: '', monthly_limit: '' });
      fetchSpendingLimits();
      onLimitsUpdated();
    } catch (error) {
      console.error('Error adding spending limit:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiungere il limite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSpendingLimit = async (limitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('spending_limits')
        .delete()
        .eq('id', limitId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Limite rimosso!",
        description: "Limite di spesa rimosso con successo",
      });

      fetchSpendingLimits();
      onLimitsUpdated();
    } catch (error) {
      console.error('Error deleting spending limit:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile rimuovere il limite",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get available categories for limits
  const getAvailableCategories = () => {
    const userCategoryNames = getCategoryNames();
    return userCategoryNames.length > 0 ? userCategoryNames : [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Limiti di Spesa per Categoria</DialogTitle>
          <DialogDescription>
            Imposta limiti mensili per controllare le tue spese per categoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new limit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aggiungi Nuovo Limite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={newLimit.category} 
                    onValueChange={(value) => setNewLimit(prev => ({ ...prev, category: value }))}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? "Caricamento categorie..." : "Seleziona categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableCategories()
                        .filter(cat => !spendingLimits.find(limit => limit.category === cat))
                        .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoriesLoading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Caricamento categorie personalizzate...
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="monthly-limit">Limite Mensile (€)</Label>
                  <Input
                    id="monthly-limit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newLimit.monthly_limit}
                    onChange={(e) => setNewLimit(prev => ({ ...prev, monthly_limit: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={addSpendingLimit}
                    disabled={isLoading || !newLimit.category || !newLimit.monthly_limit || categoriesLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Plus className="h-4 w-4" />
                    Aggiungi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Limiti Attuali</h3>
            {spendingLimits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessun limite impostato</p>
                <p className="text-sm">Aggiungi il tuo primo limite di spesa!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {spendingLimits.map((limit) => {
                  const percentage = getProgressPercentage(limit.current_spent || 0, limit.monthly_limit);
                  const progressColor = getProgressColor(percentage);
                  
                  return (
                    <Card key={limit.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{limit.category}</h4>
                            <p className="text-sm text-muted-foreground">
                              €{limit.current_spent?.toFixed(2) || '0.00'} / €{limit.monthly_limit.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              percentage >= 100 ? 'text-red-600' : 
                              percentage >= 80 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {percentage.toFixed(0)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSpendingLimit(limit.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${progressColor}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        {percentage >= 100 && (
                          <p className="text-xs text-red-600 mt-2">
                            ⚠️ Limite superato! Hai superato il limite mensile per questa categoria.
                          </p>
                        )}
                        {percentage >= 80 && percentage < 100 && (
                          <p className="text-xs text-yellow-600 mt-2">
                            ⚠️ Attenzione! Stai per raggiungere il limite mensile.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpendingLimitsModal;
