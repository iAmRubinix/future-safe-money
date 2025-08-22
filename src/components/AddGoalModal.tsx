import { useState } from "react";
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

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalAdded: () => void;
}

const goalCategories = [
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

const AddGoalModal = ({ isOpen, onClose, onGoalAdded }: AddGoalModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    category: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          target_amount: parseFloat(formData.target_amount),
          current_amount: formData.current_amount ? parseFloat(formData.current_amount) : 0,
          target_date: formData.target_date,
          category: formData.category
        });

      if (error) throw error;

      toast({
        title: "Obiettivo creato!",
        description: `Obiettivo "${formData.title}" aggiunto con successo`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        target_amount: '',
        current_amount: '',
        target_date: '',
        category: ''
      });
      
      onGoalAdded();
      onClose();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Non è stato possibile creare l'obiettivo",
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
          <DialogTitle>Nuovo Obiettivo Finanziario</DialogTitle>
          <DialogDescription>
            Crea un nuovo obiettivo per raggiungere i tuoi traguardi finanziari
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {goalCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-date">Data obiettivo</Label>
            <Input
              id="target-date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
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
              Crea Obiettivo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalModal;