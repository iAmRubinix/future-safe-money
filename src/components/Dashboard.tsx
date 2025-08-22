import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, Target, Plus, LogOut, Wallet, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AddTransactionModal from "./AddTransactionModal";
import AddGoalModal from "./AddGoalModal";

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
}

interface FinancialGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  is_completed: boolean;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchTransactions();
    fetchGoals();
  }, [user, navigate]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTransactions(data);
      
      // Calculate monthly spent (current month expenses)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyExpenses = data
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.transaction_type === 'expense' && 
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      setMonthlySpent(monthlyExpenses);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Speso Questo Mese</CardTitle>
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
        </div>

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
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Transazioni Recenti</CardTitle>
              <CardDescription>
                Le tue ultime 10 transazioni
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna transazione ancora</p>
                  <p className="text-sm">Inizia aggiungendo la tua prima spesa!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div>
                        <p className="font-medium text-foreground">{transaction.title}</p>
                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.transaction_type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
                          {transaction.transaction_type === 'expense' ? '-' : '+'}€{Number(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Goals */}
          <Card className="shadow-card">
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
                  {goals.slice(0, 5).map((goal) => {
                    const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                    return (
                      <div key={goal.id} className="p-4 rounded-lg bg-accent/30">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-foreground">{goal.title}</h4>
                          <span className="text-sm text-muted-foreground">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-smooth" 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>€{Number(goal.current_amount).toFixed(2)}</span>
                          <span>€{Number(goal.target_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onTransactionAdded={fetchTransactions}
      />
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onGoalAdded={fetchGoals}
      />
    </div>
  );
};

export default Dashboard;