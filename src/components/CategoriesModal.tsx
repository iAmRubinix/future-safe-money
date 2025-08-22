import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit, Tag, ShoppingCart, Car, Gamepad2, Zap, Heart, CreditCard, Utensils, Home, Plane, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

const defaultCategories = [
  { name: "Alimentari", icon: "ShoppingCart", color: "#10B981" },
  { name: "Trasporti", icon: "Car", color: "#3B82F6" },
  { name: "Intrattenimento", icon: "Gamepad2", color: "#8B5CF6" },
  { name: "Bollette", icon: "Zap", color: "#F59E0B" },
  { name: "Salute", icon: "Heart", color: "#EF4444" },
  { name: "Shopping", icon: "CreditCard", color: "#EC4899" },
  { name: "Ristoranti", icon: "Utensils", color: "#F97316" },
  { name: "Casa", icon: "Home", color: "#06B6D4" },
  { name: "Viaggi", icon: "Plane", color: "#84CC16" },
  { name: "Altro", icon: "Tag", color: "#6B7280" }
];

const iconOptions = [
  { value: "Tag", label: "Tag", icon: Tag },
  { value: "ShoppingCart", label: "Shopping", icon: ShoppingCart },
  { value: "Car", label: "Auto", icon: Car },
  { value: "Gamepad2", label: "Gaming", icon: Gamepad2 },
  { value: "Zap", label: "Elettricità", icon: Zap },
  { value: "Heart", label: "Salute", icon: Heart },
  { value: "CreditCard", label: "Carta", icon: CreditCard },
  { value: "Utensils", label: "Cibo", icon: Utensils },
  { value: "Home", label: "Casa", icon: Home },
  { value: "Plane", label: "Viaggio", icon: Plane },
  { value: "Settings", label: "Impostazioni", icon: Settings }
];

const colorOptions = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", 
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6", "#6366F1", 
  "#8B5CF6", "#A855F7", "#EC4899", "#F43F5E", "#6B7280"
];

const CategoriesModal = ({ isOpen, onClose, onCategoriesUpdated }: CategoriesModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'Tag'
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchUserCategories();
    }
  }, [isOpen, user]);

  const fetchUserCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setUserCategories(data || []);
    } catch (error) {
      console.error('Error fetching user categories:', error);
    }
  };

  const addCategory = async () => {
    if (!user || !newCategory.name.trim()) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_categories')
        .insert({
          user_id: user.id,
          name: newCategory.name.trim(),
          color: newCategory.color,
          icon: newCategory.icon
        });

      if (error) throw error;

      toast({
        title: "Categoria aggiunta!",
        description: `Categoria "${newCategory.name}" creata con successo`,
      });

      setNewCategory({ name: '', color: '#3B82F6', icon: 'Tag' });
      fetchUserCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiungere la categoria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async () => {
    if (!user || !editingCategory) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_categories')
        .update({
          name: editingCategory.name,
          color: editingCategory.color,
          icon: editingCategory.icon
        })
        .eq('id', editingCategory.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Categoria aggiornata!",
        description: `Categoria "${editingCategory.name}" modificata con successo`,
      });

      setEditingCategory(null);
      fetchUserCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiornare la categoria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Categoria rimossa!",
        description: `Categoria "${categoryName}" eliminata con successo`,
      });

      fetchUserCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile rimuovere la categoria",
        variant: "destructive",
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.value === iconName);
    return iconOption ? iconOption.icon : Tag;
  };

  const initializeDefaultCategories = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const categoriesToInsert = defaultCategories.map(cat => ({
        user_id: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        is_default: true
      }));

      const { error } = await supabase
        .from('user_categories')
        .insert(categoriesToInsert);

      if (error) throw error;

      toast({
        title: "Categorie inizializzate!",
        description: "Le categorie predefinite sono state aggiunte",
      });

      fetchUserCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error initializing categories:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile inizializzare le categorie",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestione Categorie</DialogTitle>
          <DialogDescription>
            Crea e gestisci le tue categorie di spesa personalizzate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Initialize default categories */}
          {userCategories.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categorie Predefinite</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Non hai ancora categorie personalizzate. Vuoi inizializzare con le categorie predefinite?
                </p>
                <Button 
                  onClick={initializeDefaultCategories}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Plus className="h-4 w-4" />
                  Inizializza Categorie Predefinite
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Add new category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aggiungi Nuova Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category-name">Nome</Label>
                  <Input
                    id="category-name"
                    placeholder="es. Hobby"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category-icon">Icona</Label>
                  <Select 
                    value={newCategory.icon} 
                    onValueChange={(value) => setNewCategory(prev => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category-color">Colore</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.slice(0, 8).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button 
                onClick={addCategory}
                disabled={isLoading || !newCategory.name.trim()}
                className="mt-4 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Plus className="h-4 w-4" />
                Aggiungi Categoria
              </Button>
            </CardContent>
          </Card>

          {/* Existing categories */}
          {userCategories.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Le Tue Categorie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCategories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  
                  return (
                    <Card key={category.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: category.color }}
                            >
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">{category.name}</h4>
                              {category.is_default && (
                                <p className="text-xs text-muted-foreground">Predefinita</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCategory(category)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!category.is_default && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Sei sicuro di voler eliminare la categoria "{category.name}"? 
                                      Questa azione non può essere annullata.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCategory(category.id, category.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Elimina
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Edit Category Modal */}
        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifica Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-icon">Icona</Label>
                  <Select 
                    value={editingCategory.icon} 
                    onValueChange={(value) => setEditingCategory(prev => prev ? { ...prev, icon: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-color">Colore</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.slice(0, 8).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          editingCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditingCategory(prev => prev ? { ...prev, color } : null)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingCategory(null)}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button 
                    onClick={updateCategory}
                    disabled={isLoading || !editingCategory.name.trim()}
                    className="flex-1"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salva Modifiche
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoriesModal;
