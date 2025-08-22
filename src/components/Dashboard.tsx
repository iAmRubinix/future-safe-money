import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, Target, Plus, LogOut, Wallet, AlertCircle, Trash2, Repeat, Home, User, Edit, Settings, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AddTransactionModal from "./AddTransactionModal";
import AddGoalModal from "./AddGoalModal";
import EditGoalModal from "./EditGoalModal";
import EditTransactionModal from "./EditTransactionModal";
import AddRecurringTransactionModal from "./AddRecurringTransactionModal";
import SpendingLimitsModal from "./SpendingLimitsModal";
import CategoriesModal from "./CategoriesModal";
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
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  expense_type?: string; // Added for personal/household distinction
}

interface FinancialGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  is_completed: boolean;
  description?: string;
}

interface SpendingLimit {
  id: string;
  category: string;
  monthly_limit: number;
  current_spent?: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isAddRecurringTransactionOpen, setIsAddRecurringTransactionOpen] = useState(false);
  const [isSpendingLimitsOpen, setIsSpendingLimitsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [addingRecurringTransaction, setAddingRecurringTransaction] = useState<Transaction | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [monthlyPersonalSpent, setMonthlyPersonalSpent] = useState(0);
  const [monthlyHouseholdSpent, setMonthlyHouseholdSpent] = useState(0);
  const [categoriesUpdateTrigger, setCategoriesUpdateTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchTransactions();
    fetchGoals();
    fetchSpendingLimits();
  }, [user, navigate]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data);
      
      // Calculate monthly spent (current month expenses)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyExpenses = data
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.transaction_type === 'expense' && 
                 !t.is_recurring && // Exclude recurring transactions
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Calculate personal vs household expenses
      const personalExpenses = data
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.transaction_type === 'expense' && 
                 !t.is_recurring && // Exclude recurring transactions
                 (t.expense_type === 'personal' || !t.expense_type) && // Fallback for existing transactions
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const householdExpenses = data
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.transaction_type === 'expense' && 
                 !t.is_recurring && // Exclude recurring transactions
                 t.expense_type === 'household' &&
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      setMonthlySpent(monthlyExpenses);
      setMonthlyPersonalSpent(personalExpenses);
      setMonthlyHouseholdSpent(householdExpenses);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('target_date', { ascending: true });

    if (!error && data) {
      setGoals(data);
      
      // Calculate monthly budget from goals
      const totalBudget = data
        .filter(g => !g.is_completed)
        .reduce((sum, g) => sum + Number(g.target_amount), 0);
      setMonthlyBudget(totalBudget);
    }
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const remainingBudget = monthlyBudget - monthlySpent;
  const budgetPercentage = monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0;

  // Simple prediction: based on current spending rate
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const dailySpendingRate = monthlySpent / currentDay;
  const predictedMonthlySpending = dailySpendingRate * daysInMonth;

  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', user.id);

    if (!error) {
      // Remove the transaction from local state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      
      // Recalculate monthly spent
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyExpenses = updatedTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.transaction_type === 'expense' && 
                 !t.is_recurring && // Exclude recurring transactions
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Calculate personal vs household expenses
      const personalExpenses = updatedTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.transaction_type === 'expense' && 
                 !t.is_recurring && // Exclude recurring transactions
                 (t.expense_type === 'personal' || !t.expense_type) && // Fallback for existing transactions
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const householdExpenses = updatedTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.transaction_type === 'expense' && 
                 !t.is_recurring && // Exclude recurring transactions
                 t.expense_type === 'household' &&
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      setMonthlySpent(monthlyExpenses);
      setMonthlyPersonalSpent(personalExpenses);
      setMonthlyHouseholdSpent(householdExpenses);
    } else {
      console.error('Error deleting transaction:', error);
    }
  };

  const getRecurringPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly': return 'Settimanale';
      case 'monthly': return 'Mensile';
      case 'quarterly': return 'Trimestrale';
      case 'yearly': return 'Annuale';
      default: return period;
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (!error) {
      // Remove the goal from local state
      setGoals(prev => prev.filter(g => g.id !== goalId));
      
      // Recalculate monthly budget
      const updatedGoals = goals.filter(g => g.id !== goalId);
      const totalBudget = updatedGoals
        .filter(g => !g.is_completed)
        .reduce((sum, g) => sum + Number(g.target_amount), 0);
      setMonthlyBudget(totalBudget);
    } else {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setIsEditGoalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const handleAddRecurringTransaction = (transaction: Transaction) => {
    setAddingRecurringTransaction(transaction);
    setIsAddRecurringTransactionOpen(true);
  };

  const handleGoalUpdated = () => {
    fetchGoals();
  };

  const handleTransactionUpdated = () => {
    fetchTransactions();
  };

  const updateGoalProgress = async (goalId: string, increment: number) => {
    if (!user) return;
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const newAmount = Math.min(goal.current_amount + increment, goal.target_amount);
    
    const { error } = await supabase
      .from('financial_goals')
      .update({
        current_amount: newAmount,
        is_completed: newAmount >= goal.target_amount
      })
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (!error) {
      // Update local state
      setGoals(prev => prev.map(g => 
        g.id === goalId 
          ? { ...g, current_amount: newAmount, is_completed: newAmount >= g.target_amount }
          : g
      ));
      
      // Recalculate monthly budget
      const updatedGoals = goals.map(g => 
        g.id === goalId 
          ? { ...g, current_amount: newAmount, is_completed: newAmount >= g.target_amount }
          : g
      );
      const totalBudget = updatedGoals
        .filter(g => !g.is_completed)
        .reduce((sum, g) => sum + Number(g.target_amount), 0);
      setMonthlyBudget(totalBudget);
    } else {
      console.error('Error updating goal progress:', error);
    }
  };

  const getLimitWarning = () => {
    const exceededLimits = spendingLimits.filter(limit => 
      (limit.current_spent || 0) >= limit.monthly_limit
    );
    
    const nearLimits = spendingLimits.filter(limit => {
      const percentage = ((limit.current_spent || 0) / limit.monthly_limit) * 100;
      return percentage >= 80 && percentage < 100;
    });

    return { exceededLimits, nearLimits };
  };

  const { exceededLimits, nearLimits } = getLimitWarning();

  const handleCategoriesUpdated = () => {
    // Trigger a re-render of components that use categories
    setCategoriesUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-gradient-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <PiggyBank className="h-8 w-8 text-primary mr-2" />
              <span className="font-bold text-xl text-foreground">MoneyWise</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Ciao, {user?.user_metadata?.first_name || user?.email}
              </span>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            La Tua Dashboard Finanziaria
          </h1>
          <p className="text-muted-foreground">
            Controlla i tuoi progressi e le previsioni per i prossimi mesi
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Mensile</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">€{monthlyBudget.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {budgetPercentage.toFixed(1)}% utilizzato
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spese Totali</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">€{monthlySpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {monthlySpent > 0 ? `€${dailySpendingRate.toFixed(2)}/giorno` : 'Nessuna spesa'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spese Personali</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">€{monthlyPersonalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {monthlySpent > 0 ? `${((monthlyPersonalSpent / monthlySpent) * 100).toFixed(1)}% del totale` : 'Nessuna spesa'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spese Domestiche</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">€{monthlyHouseholdSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {monthlySpent > 0 ? `${((monthlyHouseholdSpent / monthlySpent) * 100).toFixed(1)}% del totale` : 'Nessuna spesa'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Previsione Fine Mese */}
        <Card className="shadow-card mb-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Previsione Fine Mese</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${predictedMonthlySpending > monthlyBudget ? 'text-destructive' : 'text-primary'}`}>
                €{predictedMonthlySpending.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {predictedMonthlySpending > monthlyBudget ? 'Sopra budget!' : 'Nei limiti'}
              </p>
            </CardContent>
          </Card>

        {/* Spending Limits Warnings */}
        {(exceededLimits.length > 0 || nearLimits.length > 0) && (
          <Card className="shadow-card mb-8 border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Avvisi Limiti di Spesa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exceededLimits.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Limiti Superati:</h4>
                  <div className="space-y-2">
                    {exceededLimits.map((limit) => (
                      <div key={limit.id} className="flex justify-between items-center p-2 bg-red-100 rounded">
                        <span className="text-sm font-medium">{limit.category}</span>
                        <span className="text-sm text-red-700">
                          €{limit.current_spent?.toFixed(2)} / €{limit.monthly_limit.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {nearLimits.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Limiti Quasi Raggiunti:</h4>
                  <div className="space-y-2">
                    {nearLimits.map((limit) => {
                      const percentage = ((limit.current_spent || 0) / limit.monthly_limit) * 100;
                      return (
                        <div key={limit.id} className="flex justify-between items-center p-2 bg-yellow-100 rounded">
                          <span className="text-sm font-medium">{limit.category}</span>
                          <span className="text-sm text-yellow-700">
                            {percentage.toFixed(0)}% - €{limit.current_spent?.toFixed(2)} / €{limit.monthly_limit.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
        </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSpendingLimitsOpen(true)}
                className="mt-2"
              >
                <Settings className="h-4 w-4 mr-2" />
                Gestisci Limiti
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            variant="hero" 
            onClick={() => setIsAddTransactionOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Spesa
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setIsAddGoalOpen(true)}
            className="flex items-center"
          >
            <Target className="h-4 w-4 mr-2" />
            Nuovo Obiettivo
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/statistics")}
            className="flex items-center"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Statistiche
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsSpendingLimitsOpen(true)}
            className="flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Limiti di Spesa
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsCategoriesOpen(true)}
            className="flex items-center"
          >
            <Tag className="h-4 w-4 mr-2" />
            Categorie
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Personal Transactions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Spese Personali
              </CardTitle>
              <CardDescription>
                Le tue spese personali del mese corrente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.filter(t => 
                t.transaction_type === 'expense' && 
                (t.expense_type === 'personal' || !t.expense_type) && 
                !t.is_recurring
              ).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna spesa personale</p>
                  <p className="text-sm">Aggiungi le tue spese personali!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions
                    .filter(t => 
                      t.transaction_type === 'expense' && 
                      (t.expense_type === 'personal' || !t.expense_type) && 
                      !t.is_recurring
                    )
                    .slice(0, 10)
                    .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border-l-4 border-blue-500">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{transaction.title}</p>
                          {!transaction.expense_type && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Storica
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                        {transaction.description && (
                          <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                      <div className="text-right">
                          <p className="font-medium text-destructive">
                            -€{Number(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('it-IT')}
                        </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTransaction(transaction)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
                                Sei sicuro di voler eliminare la spesa personale "{transaction.title}"? 
                                Questa azione non può essere annullata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTransaction(transaction.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {transactions.filter(t => 
                    t.transaction_type === 'expense' && 
                    (t.expense_type === 'personal' || !t.expense_type) && 
                    !t.is_recurring
                  ).length > 10 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrate 10 di {transactions.filter(t => 
                          t.transaction_type === 'expense' && 
                          (t.expense_type === 'personal' || !t.expense_type) && 
                          !t.is_recurring
                        ).length} spese personali
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Household Transactions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Spese Domestiche
              </CardTitle>
              <CardDescription>
                Spese in comune con il convivente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'household').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna spesa domestica</p>
                  <p className="text-sm">Aggiungi le spese in comune!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions
                    .filter(t => t.transaction_type === 'expense' && t.expense_type === 'household' && !t.is_recurring)
                    .slice(0, 10)
                    .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border-l-4 border-green-500">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{transaction.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                        {transaction.description && (
                          <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium text-destructive">
                            -€{Number(transaction.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTransaction(transaction)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
                                Sei sicuro di voler eliminare la spesa domestica "{transaction.title}"? 
                                Questa azione non può essere annullata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTransaction(transaction.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'household' && !t.is_recurring).length > 10 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrate 10 di {transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'household' && !t.is_recurring).length} spese domestiche
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recurring Transactions */}
        <Card className="shadow-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Transazioni Ricorrenti
            </CardTitle>
            <CardDescription>
              Le tue transazioni ricorrenti attive
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.filter(t => t.is_recurring).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Repeat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessuna transazione ricorrente</p>
                <p className="text-sm">Aggiungi transazioni ricorrenti per automatizzare i tuoi pagamenti!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Personal Recurring */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personali
                  </h4>
                  <div className="space-y-3">
                    {transactions
                      .filter(t => t.is_recurring && (t.expense_type === 'personal' || !t.expense_type))
                      .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border-l-4 border-primary">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm">{transaction.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Repeat className="h-3 w-3" />
                              <span>{getRecurringPeriodLabel(transaction.recurring_period || '')}</span>
                            </div>
                            {!transaction.expense_type && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Storica
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{transaction.category}</p>
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className={`font-medium text-sm ${transaction.transaction_type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
                              {transaction.transaction_type === 'expense' ? '-' : '+'}€{Number(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddRecurringTransaction(transaction)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600"
                            title="Crea transazione una tantum"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare la transazione ricorrente "{transaction.title}"? 
                                  Questa azione eliminerà solo questa istanza della transazione ricorrente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTransaction(transaction.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Household Recurring */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Domestiche
                  </h4>
                  <div className="space-y-3">
                    {transactions
                      .filter(t => t.is_recurring && t.expense_type === 'household')
                      .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border-l-4 border-primary">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm">{transaction.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Repeat className="h-3 w-3" />
                              <span>{getRecurringPeriodLabel(transaction.recurring_period || '')}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{transaction.category}</p>
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className={`font-medium text-sm ${transaction.transaction_type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
                              {transaction.transaction_type === 'expense' ? '-' : '+'}€{Number(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddRecurringTransaction(transaction)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600"
                            title="Crea transazione una tantum"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare la transazione ricorrente "{transaction.title}"? 
                                  Questa azione eliminerà solo questa istanza della transazione ricorrente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTransaction(transaction.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Goals */}
        <Card className="shadow-card mt-8">
          <CardHeader>
            <CardTitle>I Tuoi Obiettivi</CardTitle>
            <CardDescription>
              Progresso verso i tuoi obiettivi finanziari
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun obiettivo ancora</p>
                  <p className="text-sm">Definisci i tuoi primi obiettivi finanziari!</p>
                </div>
              ) : (
                <div className="space-y-4">
                {goals.slice(0, 10).map((goal) => {
                    const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                    return (
                      <div key={goal.id} className="p-4 rounded-lg bg-accent/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{goal.title}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGoal(goal)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                                  Sei sicuro di voler eliminare l'obiettivo "{goal.title}"? 
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteGoal(goal.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div 
                          className={`h-2 rounded-full transition-smooth ${goal.is_completed ? 'bg-green-500' : 'bg-gradient-primary'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>€{Number(goal.current_amount).toFixed(2)}</span>
                          <span>€{Number(goal.target_amount).toFixed(2)}</span>
                        </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">{goal.category}</span>
                        <span className="text-xs text-muted-foreground">
                          Scadenza: {new Date(goal.target_date).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      {!goal.is_completed && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateGoalProgress(goal.id, 10)}
                            className="flex-1"
                          >
                            +€10
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateGoalProgress(goal.id, 50)}
                            className="flex-1"
                          >
                            +€50
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateGoalProgress(goal.id, 100)}
                            className="flex-1"
                          >
                            +€100
                          </Button>
                        </div>
                      )}
                      </div>
                    );
                  })}
                {goals.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrati 10 di {goals.length} obiettivi
                    </p>
                  </div>
                )}
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onTransactionAdded={fetchTransactions}
        key={`transaction-modal-${categoriesUpdateTrigger}`}
      />
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onGoalAdded={fetchGoals}
        key={`goal-modal-${categoriesUpdateTrigger}`}
      />
      <EditGoalModal
        isOpen={isEditGoalOpen}
        onClose={() => {
          setIsEditGoalOpen(false);
          setEditingGoal(null);
        }}
        onGoalUpdated={handleGoalUpdated}
        goal={editingGoal}
        key={`edit-goal-modal-${categoriesUpdateTrigger}`}
      />
      <EditTransactionModal
        isOpen={isEditTransactionOpen}
        onClose={() => {
          setIsEditTransactionOpen(false);
          setEditingTransaction(null);
        }}
        onTransactionUpdated={handleTransactionUpdated}
        transaction={editingTransaction}
        key={`edit-transaction-modal-${categoriesUpdateTrigger}`}
      />
      <AddRecurringTransactionModal
        isOpen={isAddRecurringTransactionOpen}
        onClose={() => {
          setIsAddRecurringTransactionOpen(false);
          setAddingRecurringTransaction(null);
        }}
        onTransactionAdded={handleTransactionUpdated}
        recurringTransaction={addingRecurringTransaction}
        key={`add-recurring-transaction-modal-${categoriesUpdateTrigger}`}
      />
      <SpendingLimitsModal
        isOpen={isSpendingLimitsOpen}
        onClose={() => setIsSpendingLimitsOpen(false)}
        onLimitsUpdated={fetchSpendingLimits}
        key={`spending-limits-modal-${categoriesUpdateTrigger}`}
      />
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        onCategoriesUpdated={handleCategoriesUpdated}
      />
    </div>
  );
};

export default Dashboard;