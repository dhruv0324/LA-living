'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
  Savings as SavingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarMonth as CalendarMonthIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import Layout from '../components/Layout';
import TagSelector from '../components/TagSelector';
import { 
  expenseApi, 
  incomeApi, 
  accountApi, 
  budgetApi, 
  loanApi, 
  debtApi,
  peopleApi,
  Expense, 
  Income, 
  Account, 
  Budget,
  Loan,
  Debt,
  Person,
  Tag
} from '../lib/api';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

// DEFAULT_USER_ID removed - now using authenticated user ID

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBudget: number;
  budgetUsed: number;
  budgetRemaining: number;
  totalLoans: number;
  totalDebts: number;
  netWorth: number;
  savingsRate: number;
  transactionCount: number;
}

interface RecentTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  tag: string;
  date: string;
}

const Dashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/landing');
    }
  }, [user, authLoading, router]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyBudget: 0,
    budgetUsed: 0,
    budgetRemaining: 0,
    totalLoans: 0,
    totalDebts: 0,
    netWorth: 0,
    savingsRate: 0,
    transactionCount: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openIncomeModal, setOpenIncomeModal] = useState(false);
  
  // Form states
  const [expenseFormData, setExpenseFormData] = useState({
    amount: '',
    place: '',
    notes: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
  });

  const [incomeFormData, setIncomeFormData] = useState({
    amount: '',
    notes: '',
    income_date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
  });

  // Tag states
  const [selectedExpenseTag, setSelectedExpenseTag] = useState<Tag | null>(null);
  const [selectedIncomeTag, setSelectedIncomeTag] = useState<Tag | null>(null);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const showNotification = (message: string, severity: 'success' | 'error' = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user?.id) {
        setLoading(false);
        return;
      }



      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Load all data in parallel with individual error handling
      const results = await Promise.allSettled([
        accountApi.getAll(user.id),
        expenseApi.getAll({
          user_id: user.id,
          skip: 0,
          limit: 50,
          start_date: monthStart.toISOString().split('T')[0],
          end_date: monthEnd.toISOString().split('T')[0]
        }),
        incomeApi.getAll({
          user_id: user.id,
          skip: 0,
          limit: 50,
          start_date: monthStart.toISOString().split('T')[0],
          end_date: monthEnd.toISOString().split('T')[0]
        }),
        budgetApi.getForMonth(user.id, currentDate.getMonth() + 1, currentDate.getFullYear()),
        loanApi.getAll(user.id),
        debtApi.getAll({ user_id: user.id }),
      ]);

      // Extract data or use empty arrays/null for failed requests
      const accountsResponse = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
      const expensesResponse = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
      const incomeResponse = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
      const budgetResponse = results[3].status === 'fulfilled' ? results[3].value : { data: null };
      const loansResponse = results[4].status === 'fulfilled' ? results[4].value : { data: [] };
      const debtsResponse = results[5].status === 'fulfilled' ? results[5].value : { data: [] };

      // Handle any failures gracefully
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['accounts', 'expenses', 'income', 'budget', 'loans', 'debts'];
          // Silently handle failures - user will see empty data instead of errors
        }
      });

      const accountsData = accountsResponse.data;
      const expensesData = expensesResponse.data;
      const incomeData = incomeResponse.data;
      const budgetData = budgetResponse.data;
      const loansData = loansResponse.data;
      const debtsData = debtsResponse.data;

      setAccounts(accountsData);
      setLoans(loansData);
      setDebts(debtsData);

      // Calculate stats
      const totalBalance = accountsData.reduce((sum: number, account: Account) => 
        sum + parseFloat(account.balance.toString()), 0
      );

      const monthlyExpenses = expensesData.reduce((sum: number, expense: Expense) => 
        sum + parseFloat(expense.amount.toString()), 0
      );

      const monthlyIncome = incomeData.reduce((sum: number, income: Income) => 
        sum + parseFloat(income.amount.toString()), 0
      );

      const monthlyBudget = budgetData?.amount ? parseFloat(budgetData.amount.toString()) : 0;
      const budgetUsed = monthlyBudget > 0 ? (monthlyExpenses / monthlyBudget) * 100 : 0;
      const budgetRemaining = monthlyBudget - monthlyExpenses;

      const totalLoans = loansData.reduce((sum: number, loan: Loan) => 
        sum + parseFloat(loan.remaining_amount?.toString() || '0'), 0
      );

      const totalDebts = debtsData
        .filter((debt: Debt) => !debt.is_settled)
        .reduce((sum: number, debt: Debt) => sum + parseFloat(debt.amount.toString()), 0);

      const netWorth = totalBalance - totalLoans - totalDebts;
      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
      const transactionCount = expensesData.length + incomeData.length;

      setStats({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlyBudget,
        budgetUsed,
        budgetRemaining,
        totalLoans,
        totalDebts,
        netWorth,
        savingsRate,
        transactionCount,
      });

      // Prepare recent transactions
      const recentExpenses: RecentTransaction[] = expensesData
        .slice(0, 5)
        .map((expense: Expense) => ({
          id: expense.expense_id,
          type: 'expense' as const,
          amount: parseFloat(expense.amount.toString()),
          description: expense.place || 'Expense',
          tag: expense.tag_name || 'Uncategorized',
          date: expense.expense_date || '',
        }));

      const recentIncomes: RecentTransaction[] = incomeData
        .slice(0, 5)
        .map((income: Income) => ({
          id: income.income_id,
          type: 'income' as const,
          amount: parseFloat(income.amount.toString()),
          description: income.notes || 'Income',
          tag: income.tag_name || 'Uncategorized',
          date: income.income_date || '',
        }));

      const allTransactions = [...recentExpenses, ...recentIncomes]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

      setRecentTransactions(allTransactions);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBudgetColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage <= 70) return 'success';
    if (percentage <= 90) return 'warning';
    return 'error';
  };

  const getSavingsColor = (rate: number): 'error' | 'warning' | 'success' => {
    if (rate < 10) return 'error';
    if (rate < 20) return 'warning';
    return 'success';
  };

  const handleQuickAction = (action: 'expense' | 'income') => {
    if (action === 'expense') {
      setOpenExpenseModal(true);
    } else {
      setOpenIncomeModal(true);
    }
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      amount: '',
      place: '',
      notes: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      account_id: '',
    });
    setSelectedExpenseTag(null);
  };

  const resetIncomeForm = () => {
    setIncomeFormData({
      amount: '',
      notes: '',
      income_date: format(new Date(), 'yyyy-MM-dd'),
      account_id: '',
    });
    setSelectedIncomeTag(null);
  };

  const handleSubmitExpense = async () => {
    try {
      const amount = parseFloat(expenseFormData.amount);
      if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
      }

      if (!expenseFormData.account_id) {
        showNotification('Please select a payment method', 'error');
        return;
      }

      if (!selectedExpenseTag) {
        showNotification('Please select or create a category', 'error');
        return;
      }

      // Check if account has sufficient balance
      const selectedAccount = accounts.find(acc => acc.account_id === expenseFormData.account_id);
      if (selectedAccount && parseFloat(selectedAccount.balance.toString()) < amount) {
        showNotification('Insufficient balance in selected payment method', 'error');
        return;
      }

      const expenseData = {
        user_id: user!.id,
        account_id: expenseFormData.account_id,
        amount: amount,
        place: expenseFormData.place,
        notes: expenseFormData.notes,
        expense_date: expenseFormData.expense_date,
        tag_id: selectedExpenseTag.tag_id,
      };

      await expenseApi.create(expenseData);
      showNotification('Expense added successfully!', 'success');
      setOpenExpenseModal(false);
      resetExpenseForm();
      loadDashboardData(); // Refresh data
    } catch (error) {
      showNotification('Failed to add expense', 'error');
    }
  };

  const handleSubmitIncome = async () => {
    try {
      const amount = parseFloat(incomeFormData.amount);
      if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
      }

      if (!incomeFormData.account_id) {
        showNotification('Please select a payment method', 'error');
        return;
      }

      if (!selectedIncomeTag) {
        showNotification('Please select or create a source', 'error');
        return;
      }

      const incomeData = {
        user_id: user!.id,
        account_id: incomeFormData.account_id,
        amount: amount,
        notes: incomeFormData.notes,
        income_date: incomeFormData.income_date,
        tag_id: selectedIncomeTag.tag_id,
      };

      await incomeApi.create(incomeData);
      showNotification('Income added successfully!', 'success');
      setOpenIncomeModal(false);
      resetIncomeForm();
      loadDashboardData(); // Refresh data
    } catch (error) {
      showNotification('Failed to add income', 'error');
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>
            Loading your financial data...
          </Typography>
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Unable to Load Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error}. Please try refreshing the page or contact support if the issue persists.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
          >
            Refresh Page
          </Button>
        </Box>
      </Layout>
    );
  }

  // Check if user has any data
  const hasAnyData = accounts.length > 0 || loans.length > 0 || debts.length > 0 || 
                     stats.monthlyIncome > 0 || stats.monthlyExpenses > 0;



  if (!hasAnyData && !loading) {
    return (
      <Layout>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}>
            <Typography variant="h2" sx={{ color: 'white' }}>
              🌴
            </Typography>
          </Box>
          <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
            Welcome to LA living $
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
            Your Financial Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Let's get you started! Follow these steps to set up your financial tracking system.
          </Typography>
          
          {/* Tutorial Steps */}
          <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center', maxWidth: 900, mx: 'auto' }}>
            {/* Step 1: Payment Methods */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                height: '100%',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    1
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Set Up Payment Methods
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Add your bank accounts, credit cards, and cash accounts to track your balances.
                </Typography>
              </Card>
            </Grid>

            {/* Step 2: Budget */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                height: '100%',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    2
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Set Your Budget
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Create monthly budgets to track your spending and stay on track financially.
                </Typography>
              </Card>
            </Grid>

            {/* Step 3: Loans (Optional) */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                border: 'none',
                height: '100%',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    3
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Add Loans (Optional)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  If you have loans, add them to track your debt and calculate your net worth.
                </Typography>
              </Card>
            </Grid>

            {/* Step 4: Start Tracking */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: 'white',
                border: 'none',
                height: '100%',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    4
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Start Tracking
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Begin recording your income and expenses to see your financial patterns.
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Additional Information */}
          <Card sx={{ mb: 4, maxWidth: 900, mx: 'auto' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                💡 Pro Tips
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <WarningIcon color="warning" />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Understanding Debts
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The Debts page tracks money you owe to others (not loans). Visit the Debts page for detailed instructions on how it works.
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <AssessmentIcon color="info" />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Check Your Statistics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Once you start using the app, visit the Statistics page regularly to see your financial trends and insights.
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
        <Box sx={{ flexGrow: 1 }}>
          {/* Header */}
          <Box sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
            color: 'white',
            textAlign: 'center',
          }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              🌴 LA living $
            </Typography>
            <Typography variant="subtitle1" sx={{ 
              opacity: 0.9,
              fontWeight: 400
            }}>
              {format(currentDate, 'MMMM yyyy')} • Your complete financial overview
            </Typography>
          </Box>

          {/* Quick Actions */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Card className="card-hover" sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => handleQuickAction('income')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      💰 Add Income
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Record money coming in
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card className="card-hover" sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => handleQuickAction('expense')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingDownIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      💸 Add Expense
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Track money going out
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Key Metrics Cards */}
          <Grid container spacing={3} mb={4}>
            {/* Total Balance */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className="card-hover" sx={{ 
                background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
                color: 'white',
                border: 'none',
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9 }} gutterBottom>
                        Total Balance
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatCurrency(stats.totalBalance)}
                      </Typography>
                    </Box>
                    <AccountBalanceIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Monthly Income */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className="card-hover" sx={{ 
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: 'white',
                border: 'none',
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9 }} gutterBottom>
                        Monthly Income
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatCurrency(stats.monthlyIncome)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Monthly Expenses */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className="card-hover" sx={{ 
                background: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
                color: 'white',
                border: 'none',
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9 }} gutterBottom>
                        Monthly Expenses
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatCurrency(stats.monthlyExpenses)}
                      </Typography>
                    </Box>
                    <TrendingDownIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Net Worth */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className="card-hover" sx={{ 
                background: stats.netWorth >= 0 
                  ? 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
                color: stats.netWorth >= 0 ? '#111827' : 'white',
                border: 'none',
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9 }} gutterBottom>
                        Net Worth
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatCurrency(stats.netWorth)}
                      </Typography>
                    </Box>
                    <MonetizationOnIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Budget and Savings Row */}
          <Grid container spacing={3} mb={4}>
            {/* Budget Progress */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Budget Progress
                  </Typography>
                  {stats.monthlyBudget > 0 ? (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          {formatCurrency(stats.monthlyExpenses)} of {formatCurrency(stats.monthlyBudget)}
                        </Typography>
                        <Typography variant="body2" color={getBudgetColor(stats.budgetUsed)}>
                          {stats.budgetUsed.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(stats.budgetUsed, 100)}
                        color={getBudgetColor(stats.budgetUsed)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {stats.budgetRemaining >= 0 
                          ? `${formatCurrency(stats.budgetRemaining)} remaining`
                          : `${formatCurrency(Math.abs(stats.budgetRemaining))} over budget`
                        }
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No budget set for this month
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Savings Rate */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Savings Rate
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography 
                      variant="h4" 
                      color={`${getSavingsColor(stats.savingsRate)}.main`}
                    >
                      {stats.savingsRate.toFixed(1)}%
                    </Typography>
                    <SavingsIcon 
                      color={getSavingsColor(stats.savingsRate)} 
                      sx={{ fontSize: 40 }} 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stats.savingsRate >= 20 ? 'Excellent!' : 
                     stats.savingsRate >= 10 ? 'Good progress' : 'Needs improvement'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Bottom Row */}
          <Grid container spacing={3}>
            {/* Recent Transactions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Transactions
                  </Typography>
                  {recentTransactions.length > 0 ? (
                    <List dense>
                      {recentTransactions.map((transaction) => (
                        <ListItem key={transaction.id}>
                          <ListItemIcon>
                            {transaction.type === 'income' ? (
                              <TrendingUpIcon color="success" />
                            ) : (
                              <TrendingDownIcon color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">
                                  {transaction.description}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                                  fontWeight="medium"
                                >
                                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Chip label={transaction.tag} size="small" variant="outlined" />
                                <Typography variant="caption" color="text.secondary">
                                  {format(parseISO(transaction.date), 'MMM dd')}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      No recent transactions
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Stats */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Overview
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <CreditCardIcon color="primary" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h6">
                          {accounts.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Payment Methods
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <ReceiptIcon color="warning" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h6" color="warning.main">
                          {formatCurrency(stats.totalLoans)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Loans
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <PeopleIcon color="warning" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h6" color="warning.main">
                          {formatCurrency(stats.totalDebts)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Unsettled Debts
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <CalendarMonthIcon color="info" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h6">
                          {stats.transactionCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Transactions This Month
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Add Expense Modal */}
        <Dialog 
          open={openExpenseModal} 
          onClose={() => {
            setOpenExpenseModal(false);
            resetExpenseForm();
          }}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              Add New Expense
              <IconButton 
                onClick={() => {
                  setOpenExpenseModal(false);
                  resetExpenseForm();
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={expenseFormData.expense_date}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, expense_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TagSelector
                  userId={user!.id}
                  tagType="Expense"
                  selectedTagId={selectedExpenseTag?.tag_id}
                  selectedTagName={selectedExpenseTag?.name}
                  onTagSelect={setSelectedExpenseTag}
                  label="Category"
                  placeholder="Select or create a category"
                  required
                  size="medium"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={expenseFormData.account_id}
                    label="Payment Method"
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, account_id: e.target.value })}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.account_id} value={account.account_id}>
                        {account.account_name} - {formatCurrency(parseFloat(account.balance.toString()))}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Place"
                  value={expenseFormData.place}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, place: e.target.value })}
                  placeholder="Where did you spend?"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={expenseFormData.notes}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenExpenseModal(false);
                resetExpenseForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitExpense} 
              variant="contained" 
              color="error"
              startIcon={<TrendingDownIcon />}
            >
              Add Expense
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Income Modal */}
        <Dialog 
          open={openIncomeModal} 
          onClose={() => {
            setOpenIncomeModal(false);
            resetIncomeForm();
          }}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              Add New Income
              <IconButton 
                onClick={() => {
                  setOpenIncomeModal(false);
                  resetIncomeForm();
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={incomeFormData.amount}
                  onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={incomeFormData.income_date}
                  onChange={(e) => setIncomeFormData({ ...incomeFormData, income_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TagSelector
                  userId={user!.id}
                  tagType="Income"
                  selectedTagId={selectedIncomeTag?.tag_id}
                  selectedTagName={selectedIncomeTag?.name}
                  onTagSelect={setSelectedIncomeTag}
                  label="Source"
                  placeholder="Select or create a source"
                  required
                  size="medium"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={incomeFormData.account_id}
                    label="Payment Method"
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, account_id: e.target.value })}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.account_id} value={account.account_id}>
                        {account.account_name} - {formatCurrency(parseFloat(account.balance.toString()))}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={incomeFormData.notes}
                  onChange={(e) => setIncomeFormData({ ...incomeFormData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenIncomeModal(false);
                resetIncomeForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitIncome} 
              variant="contained" 
              color="success"
              startIcon={<TrendingUpIcon />}
            >
              Add Income
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Layout>
  );
};

// Main page component that handles authentication routing
function MainPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, stay on dashboard
        return;
      } else {
        // User is not authenticated, redirect to landing
        router.push('/landing');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return null; // Will redirect
}

export default MainPage;
