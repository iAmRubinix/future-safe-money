import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface UserCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
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

export const useCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setCategories(data || []);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Errore nel caricamento delle categorie');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addCategory = async (category: Omit<UserCategory, 'id' | 'is_default'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_categories')
        .insert({
          user_id: user.id,
          name: category.name,
          color: category.color,
          icon: category.icon
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setLastUpdate(Date.now());
      return data;
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<UserCategory>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      setLastUpdate(Date.now());
      return data;
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  const initializeDefaultCategories = async () => {
    if (!user) return;

    try {
      const categoriesToInsert = defaultCategories.map(cat => ({
        user_id: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        is_default: true
      }));

      const { data, error } = await supabase
        .from('user_categories')
        .insert(categoriesToInsert)
        .select();

      if (error) throw error;

      setCategories(data || []);
      setLastUpdate(Date.now());
      return data;
    } catch (err) {
      console.error('Error initializing categories:', err);
      throw err;
    }
  };

  const getCategoryNames = useCallback(() => {
    return categories.map(cat => cat.name);
  }, [categories]);

  const refreshCategories = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user, fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    lastUpdate,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    initializeDefaultCategories,
    getCategoryNames,
    refreshCategories
  };
};
