import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  is_completed: boolean;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalUpdated: () => void;
  goal: FinancialGoal | null;
}

// Fallback categories for goals
const fallbackGoalCategories = [
  "Risparmio",
  "Emergenza",
  "Vacanze",
  "Casa",
  "Auto",
  "Investimenti",
  "Educazione",
  "Pensione",
  "Altro"
];

const EditGoalModal = ({ isOpen, onClose, onGoalUpdated, goal }: EditGoalModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCategoryNames, isLoading: categoriesLoading, refreshCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    category: ''
  });

  // Refresh categories when modal opens
  useEffect(() => {
    if (isOpen && user) {
      refreshCategories();
    }
  }, [isOpen, user, refreshCategories]);

  // Get available categories (user categories or fallback)
  const getAvailableCategories = () => {
    const userCategoryNames = getCategoryNames();
    return userCategoryNames.length > 0 ? userCategoryNames : fallbackGoalCategories;
  };

  // Populate form when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        target_date: goal.target_date,
        category: goal.category
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !goal) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('financial_goals')
        .update({
          title: formData.title,
          description: formData.description || null,
          target_amount: parseFloat(formData.target_amount),
          current_amount: parseFloat(formData.current_amount),
          target_date: formData.target_date,
          category: formData.category,
          is_completed: parseFloat(formData.current_amount) >= parseFloat(formData.target_amount)
        })
        .eq('id', goal.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Obiettivo aggiornato!",
        description: `Obiettivo "${formData.title}" modificato con successo`,
      });
      
      onGoalUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiornare l'obiettivo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!goal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Obiettivo</DialogTitle>
          <DialogDescription>
            Modifica i dettagli del tuo obiettivo finanziario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Nome dell'obiettivo</Label>
            <Input
              id="goal-title"
              placeholder="es. Vacanze estive 2024"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Descrizione (opzionale)</Label>
            <Textarea
              id="goal-description"
              placeholder="Aggiungi una descrizione per il tuo obiettivo..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-amount">Obiettivo (€)</Label>
              <Input
                id="target-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000.00"
                value={formData.target_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-amount">Già risparmiato (€)</Label>
              <Input
                id="current-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.current_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-category">Categoria</Label>
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

          <div className="space-y-2">
            <Label htmlFor="target-date">Data obiettivo</Label>
            <Input
              id="target-date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
            />
          </div>

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
              Salva Modifiche
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGoalModal;
