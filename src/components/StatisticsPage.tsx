import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, PieChart, BarChart3, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  transaction_type: string;
  date: string;
  description?: string;
  is_recurring?: boolean;
  expense_type?: string;
}

interface SpendingLimit {
  id: string;
  category: string;
  monthly_limit: number;
  current_spent?: number;
}

interface CategorySpending {
  category: string;
  total: number;
  percentage: number;
  limit?: number;
  limitPercentage?: number;
}

const StatisticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchData();
  }, [user, navigate, selectedPeriod]);

  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense')
        .eq('is_recurring', false)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch spending limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('spending_limits')
        .select('*')
        .eq('user_id', user.id);

      if (limitsError) throw limitsError;

      setTransactions(transactionsData || []);
      setSpendingLimits(limitsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      if (selectedPeriod === 'month') {
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      } else {
        return transactionDate.getFullYear() === currentYear;
      }
    });
  };

  const getCategorySpending = (): CategorySpending[] => {
    const filteredTransactions = getFilteredTransactions();
    const totalSpending = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    const categoryMap = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + Number(t.amount));
    });

    const categorySpending: CategorySpending[] = Array.from(categoryMap.entries()).map(([category, total]) => {
      const limit = spendingLimits.find(l => l.category === category);
      const limitPercentage = limit ? (total / limit.monthly_limit) * 100 : undefined;
      
      return {
        category,
        total,
        percentage: totalSpending > 0 ? (total / totalSpending) * 100 : 0,
        limit: limit?.monthly_limit,
        limitPercentage
      };
    });

    return categorySpending.sort((a, b) => b.total - a.total);
  };

  const getDailySpending = () => {
    const filteredTransactions = getFilteredTransactions();
    const dailyMap = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      const date = t.date;
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + Number(t.amount));
    });

    // Get date range
    const dates = Array.from(dailyMap.keys()).sort();
    if (dates.length === 0) return [];

    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    
    // Fill missing days with zero values
    const allDates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      allDates.push(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allDates.map(date => ({
      date,
      amount: dailyMap.get(date) || 0,
      formattedDate: new Date(date).toLocaleDateString('it-IT', { 
        day: 'numeric', 
        month: 'short' 
      })
    }));
  };

  const getPersonalVsHousehold = () => {
    const filteredTransactions = getFilteredTransactions();
    const personal = filteredTransactions
      .filter(t => t.expense_type === 'personal' || !t.expense_type)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const household = filteredTransactions
      .filter(t => t.expense_type === 'household')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const total = personal + household;
    
    return {
      personal: { amount: personal, percentage: total > 0 ? (personal / total) * 100 : 0 },
      household: { amount: household, percentage: total > 0 ? (household / total) * 100 : 0 },
      total
    };
  };

  const categorySpending = getCategorySpending();
  const dailySpending = getDailySpending();
  const personalVsHousehold = getPersonalVsHousehold();

  const getLimitColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getLimitBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-100';
    if (percentage >= 80) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-gradient-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alla Dashboard
              </Button>
              <TrendingUp className="h-8 w-8 text-primary mr-2" />
              <span className="font-bold text-xl text-foreground">Statistiche</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.user_metadata?.first_name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Le Tue Statistiche Finanziarie
          </h1>
          <p className="text-muted-foreground">
            Analizza l'andamento delle tue spese e la ripartizione per categorie
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <Select value={selectedPeriod} onValueChange={(value: 'month' | 'year') => setSelectedPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mese Corrente</SelectItem>
              <SelectItem value="year">Anno Corrente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spese Totali</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                €{personalVsHousehold.total.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPeriod === 'month' ? 'Questo mese' : 'Questo anno'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spese Personali</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                €{personalVsHousehold.personal.amount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {personalVsHousehold.personal.percentage.toFixed(1)}% del totale
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spese Domestiche</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                €{personalVsHousehold.household.amount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {personalVsHousehold.household.percentage.toFixed(1)}% del totale
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Ripartizione per Categorie
              </CardTitle>
              <CardDescription>
                Distribuzione delle spese per categoria con limiti di spesa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categorySpending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna spesa registrata</p>
                  <p className="text-sm">Aggiungi delle spese per vedere le statistiche!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categorySpending.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm text-muted-foreground">
                          €{category.total.toFixed(2)} ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      
                      {/* Progress bar for category percentage */}
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        ></div>
                      </div>

                      {/* Spending limit indicator */}
                      {category.limit && (
                        <div className={`p-2 rounded-lg ${getLimitBgColor(category.limitPercentage || 0)}`}>
                          <div className="flex justify-between items-center text-xs">
                            <span>Limite mensile: €{category.limit.toFixed(2)}</span>
                            <span className={`font-medium ${getLimitColor(category.limitPercentage || 0)}`}>
                              {category.limitPercentage?.toFixed(0)}%
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(category.limitPercentage || 0, 100)} 
                            className="mt-1"
                          />
                          {category.limitPercentage && category.limitPercentage >= 80 && (
                            <div className="flex items-center gap-1 mt-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              <span className={getLimitColor(category.limitPercentage)}>
                                {category.limitPercentage >= 100 ? 'Limite superato!' : 'Attenzione: limite quasi raggiunto'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Spending Trend */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Andamento Giornaliero
              </CardTitle>
              <CardDescription>
                Spese giornaliere nel periodo selezionato
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailySpending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna spesa registrata</p>
                  <p className="text-sm">Aggiungi delle spese per vedere l'andamento!</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="formattedDate" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      formatter={(value: any, name) => {
                        if (name === 'amount') {
                          return [`€${Number(value).toFixed(2)}`, 'Spesa giornaliera'];
                        }
                        return [value, ''];
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Personal vs Household Chart */}
        <Card className="shadow-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Ripartizione Personale vs Domestica
            </CardTitle>
            <CardDescription>
              Confronto tra spese personali e spese domestiche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Expenses */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Spese Personali</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Importo</span>
                    <span className="font-medium">€{personalVsHousehold.personal.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${personalVsHousehold.personal.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {personalVsHousehold.personal.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Household Expenses */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Spese Domestiche</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Importo</span>
                    <span className="font-medium">€{personalVsHousehold.household.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${personalVsHousehold.household.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {personalVsHousehold.household.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;
