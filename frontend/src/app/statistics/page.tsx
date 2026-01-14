'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarMonthIcon,
  FilterList as FilterListIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { 
  expenseApi, 
  incomeApi, 
  accountApi, 
  budgetApi, 
  loanApi, 
  debtApi,
  loanDisbursementApi,
  tagApi,
  Expense, 
  Income, 
  Account, 
  Budget,
  Loan,
  Debt,
  LoanDisbursement,
  Tag
} from '@/lib/api';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, startOfYear, endOfYear } from 'date-fns';
import EmptyState from '@/components/EmptyState';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface OverviewStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  actualSavings: number;
  totalLoans: number;
  totalDebts: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

const StatisticsPage = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netWorth: 0,
    actualSavings: 0,
    totalLoans: 0,
    totalDebts: 0,
  });

  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loanDisbursements, setLoanDisbursements] = useState<LoanDisbursement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Filter states
  const [dateRange, setDateRange] = useState('6months');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currentDate = new Date();

  useEffect(() => {
    if (user?.id) {
      loadStatisticsData();
    }
  }, [user?.id, dateRange, startDate, endDate]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '1month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case '6months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case '1year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { 
          start: startDate ? new Date(startDate) : startOfMonth(subMonths(now, 5)),
          end: endDate ? new Date(endDate) : endOfMonth(now)
        };
      default:
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
    }
  };

  const loadStatisticsData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();
      
      // Load all data in parallel
      const [
        accountsResponse,
        expensesResponse,
        incomeResponse,
        loansResponse,
        debtsResponse,
        budgetsResponse,
      ] = await Promise.all([
        accountApi.getAll(user.id),
        expenseApi.getAll({
          user_id: user.id,
          skip: 0,
          limit: 1000,
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0]
        }),
        incomeApi.getAll({
          user_id: user.id,
          skip: 0,
          limit: 1000,
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0]
        }),
        loanApi.getAll(user.id),
        debtApi.getAll({ user_id: user.id }),
        budgetApi.getAll(user.id, end.getFullYear()),
      ]);

      const accountsData = accountsResponse.data || [];
      const expensesData = expensesResponse.data || [];
      const incomeData = incomeResponse.data || [];
      const loansData = loansResponse.data || [];
      const debtsData = debtsResponse.data || [];
      const budgetsData = budgetsResponse.data || [];

      setAccounts(accountsData);
      setLoans(loansData);
      setDebts(debtsData);
      setBudgets(budgetsData);
      setExpenses(expensesData);

      // Load loan disbursements for all loans
      const disbursementPromises = loansData.map((loan: Loan) =>
        loanDisbursementApi.getAll(loan.loan_id).catch(() => ({ data: [] }))
      );
      const disbursementResponses = await Promise.all(disbursementPromises);
      const allDisbursements = disbursementResponses.flatMap(res => res.data || []);
      setLoanDisbursements(allDisbursements);

      // Calculate overview stats
      const totalBalance = accountsData.reduce((sum: number, account: Account) => 
        sum + parseFloat(account.balance.toString()), 0
      );

      const totalExpenses = expensesData.reduce((sum: number, expense: Expense) => 
        sum + parseFloat(expense.amount.toString()), 0
      );

      const totalIncome = incomeData.reduce((sum: number, income: Income) => 
        sum + parseFloat(income.amount.toString()), 0
      );

      const totalLoans = loansData.reduce((sum: number, loan: Loan) => 
        sum + parseFloat(loan.remaining_amount?.toString() || '0'), 0
      );

      const totalDebts = debtsData
        .filter((debt: Debt) => !debt.is_settled)
        .reduce((sum: number, debt: Debt) => sum + parseFloat(debt.amount.toString()), 0);

      const netWorth = totalBalance - totalLoans - totalDebts;
      const actualSavings = totalIncome - totalExpenses;

      setOverviewStats({
        totalBalance,
        totalIncome,
        totalExpenses,
        netWorth,
        actualSavings,
        totalLoans,
        totalDebts,
      });

      // Calculate monthly trends
      const monthlyData = calculateMonthlyTrends(expensesData, incomeData);
      setMonthlyTrends(monthlyData);

      // Calculate category breakdowns
      const expenseCats = calculateCategoryBreakdown(expensesData, 'expense');
      const incomeCats = calculateCategoryBreakdown(incomeData, 'income');
      setExpenseCategories(expenseCats);
      setIncomeCategories(incomeCats);

    } catch (error) {
      console.error('Failed to load statistics data:', error);
      setError('Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTrends = (expenses: Expense[], income: Income[]): MonthlyData[] => {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    
    // Process expenses
    expenses.forEach(expense => {
      const month = format(parseISO(expense.expense_date || ''), 'MMM yyyy');
      const current = monthlyMap.get(month) || { income: 0, expenses: 0 };
      current.expenses += parseFloat(expense.amount.toString());
      monthlyMap.set(month, current);
    });

    // Process income
    income.forEach(inc => {
      const month = format(parseISO(inc.income_date || ''), 'MMM yyyy');
      const current = monthlyMap.get(month) || { income: 0, expenses: 0 };
      current.income += parseFloat(inc.amount.toString());
      monthlyMap.set(month, current);
    });

    // Convert to array and sort
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const calculateCategoryBreakdown = (data: (Expense | Income)[], type: 'expense' | 'income'): CategoryData[] => {
    const categoryMap = new Map<string, number>();
    
    data.forEach(item => {
      const category = item.tag_name || 'Uncategorized';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + parseFloat(item.amount.toString()));
    });

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    return Array.from(categoryMap.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories
  };

  const calculateBudgetVsExpenses = (budgets: Budget[], expenses: Expense[]) => {
    const monthlyBudgetMap = new Map<string, number>();
    const monthlyExpenseMap = new Map<string, number>();

    // Process budgets
    budgets.forEach(budget => {
      const monthKey = `${budget.year}-${String(budget.month).padStart(2, '0')}`;
      monthlyBudgetMap.set(monthKey, parseFloat(budget.amount.toString()));
    });

    // Process expenses by month
    expenses.forEach(expense => {
      if (expense.expense_date) {
        const date = parseISO(expense.expense_date);
        const monthKey = format(date, 'yyyy-MM');
        const current = monthlyExpenseMap.get(monthKey) || 0;
        monthlyExpenseMap.set(monthKey, current + parseFloat(expense.amount.toString()));
      }
    });

    // Get all unique months
    const allMonths = Array.from(new Set([...monthlyBudgetMap.keys(), ...monthlyExpenseMap.keys()]))
      .sort()
      .slice(-6); // Last 6 months

    return {
      labels: allMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return format(date, 'MMM yyyy');
      }),
      datasets: [
        {
          label: 'Budget',
          data: allMonths.map(month => monthlyBudgetMap.get(month) || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
        {
          label: 'Expenses',
          data: allMonths.map(month => monthlyExpenseMap.get(month) || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Chart configurations
  const timelineChartData = {
    labels: monthlyTrends.map(data => data.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends.map(data => data.income),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: monthlyTrends.map(data => data.expenses),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const budgetVsExpensesData = calculateBudgetVsExpenses(budgets, expenses);

  const expenseCategoryChartData = {
    labels: expenseCategories.map(cat => cat.name),
    datasets: [{
      data: expenseCategories.map(cat => cat.amount),
      backgroundColor: expenseCategories.map(cat => cat.color),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const incomeCategoryChartData = {
    labels: incomeCategories.map(cat => cat.name),
    datasets: [{
      data: incomeCategories.map(cat => cat.amount),
      backgroundColor: incomeCategories.map(cat => cat.color),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const accountBalanceChartData = {
    labels: accounts.map(acc => acc.account_name),
    datasets: [{
      label: 'Balance',
      data: accounts.map(acc => parseFloat(acc.balance.toString())),
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
      borderColor: 'rgba(153, 102, 255, 1)',
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
              📈 Financial Statistics
            </Typography>
            <Typography variant="subtitle1" sx={{ 
              opacity: 0.9,
              fontWeight: 400
            }}>
              Comprehensive analysis and insights into your financial data
            </Typography>
          </Box>

          {/* Date Range Filter */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <FilterListIcon color="primary" />
                <Typography variant="h6">Filters</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateRange}
                    label="Date Range"
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <MenuItem value="1month">Last Month</MenuItem>
                    <MenuItem value="3months">Last 3 Months</MenuItem>
                    <MenuItem value="6months">Last 6 Months</MenuItem>
                    <MenuItem value="1year">This Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
                {dateRange === 'custom' && (
                  <>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      size="small"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Overview Charts - Always Visible */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Financial Overview
          </Typography>
          
          <Grid container spacing={3} mb={4}>
            {/* Budget vs Expenses */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Budget vs Expenses
                  </Typography>
                  <Box height={300}>
                    {budgetVsExpensesData.labels.length > 0 ? (
                      <Bar data={budgetVsExpensesData} options={chartOptions} />
                    ) : (
                      <EmptyState
                        title="No Budget Data"
                        description="Set up budgets to track your spending."
                        icon={<BarChartIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Expense Categories */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PieChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Expense Categories
                  </Typography>
                  <Box height={300}>
                    {expenseCategories.length > 0 ? (
                      <Pie data={expenseCategoryChartData} options={pieChartOptions} />
                    ) : (
                      <EmptyState
                        title="No Expense Data"
                        description="Add some expenses to see category breakdown."
                        icon={<PieChartIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Income Sources */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PieChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Income Sources
                  </Typography>
                  <Box height={300}>
                    {incomeCategories.length > 0 ? (
                      <Pie data={incomeCategoryChartData} options={pieChartOptions} />
                    ) : (
                      <EmptyState
                        title="No Income Data"
                        description="Add some income to see source breakdown."
                        icon={<PieChartIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Account Balances */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Account Balances
                  </Typography>
                  <Box height={300}>
                    {accounts.length > 0 ? (
                      <Bar data={accountBalanceChartData} options={chartOptions} />
                    ) : (
                      <EmptyState
                        title="No Accounts"
                        description="Add some payment methods to see balance distribution."
                        icon={<AccountBalanceIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Key Metrics Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="success.main">
                  {formatCurrency(overviewStats.totalIncome)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Income
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrendingDownIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="error.main">
                  {formatCurrency(overviewStats.totalExpenses)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Expenses
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <AssessmentIcon 
                  color={overviewStats.actualSavings >= 0 ? "success" : "error"} 
                  sx={{ fontSize: 40, mb: 1 }} 
                />
                <Typography 
                  variant="h6" 
                  color={overviewStats.actualSavings >= 0 ? "success.main" : "error.main"}
                >
                  {formatCurrency(overviewStats.actualSavings)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actual Savings
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <AccountBalanceIcon 
                  color={overviewStats.netWorth >= 0 ? "success" : "error"} 
                  sx={{ fontSize: 40, mb: 1 }} 
                />
                <Typography 
                  variant="h6" 
                  color={overviewStats.netWorth >= 0 ? "success.main" : "error.main"}
                >
                  {formatCurrency(overviewStats.netWorth)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Net Worth
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Detailed Sections - Dropdowns */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Detailed Analysis
          </Typography>

          {/* Income & Expense Timeline */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <TrendingUpIcon sx={{ mr: 2, color: 'success.main' }} />
              <Typography variant="h6">Income & Expense Timeline</Typography>
              <Chip 
                label="Trend Analysis" 
                color="primary" 
                size="small" 
                sx={{ ml: 2 }} 
              />
            </AccordionSummary>
            <AccordionDetails>
              <Box height={400}>
                {monthlyTrends.length > 0 ? (
                  <Line data={timelineChartData} options={chartOptions} />
                ) : (
                  <EmptyState
                    title="No Timeline Data"
                    description="Add some income and expenses to see trends over time."
                    icon={<TrendingUpIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                  />
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Debts Section */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <PeopleIcon sx={{ mr: 2, color: 'warning.main' }} />
              <Typography variant="h6">Debt Analysis</Typography>
              <Chip 
                label={formatCurrency(overviewStats.totalDebts)} 
                color="warning" 
                size="small" 
                sx={{ ml: 2 }} 
              />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Debt Status
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Unsettled Debts
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {formatCurrency(overviewStats.totalDebts)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Number of Debt Entries
                      </Typography>
                      <Typography variant="h6">
                        {debts.filter(debt => !debt.is_settled).length}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Debt Summary
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Owed to Me:</Typography>
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(
                          debts
                            .filter(debt => debt.type === 'OwedToMe' && !debt.is_settled)
                            .reduce((sum, debt) => sum + parseFloat(debt.amount.toString()), 0)
                        )}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">I Owe:</Typography>
                      <Typography variant="body2" color="error.main">
                        {formatCurrency(
                          debts
                            .filter(debt => debt.type === 'IOwe' && !debt.is_settled)
                            .reduce((sum, debt) => sum + parseFloat(debt.amount.toString()), 0)
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Loans Section */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ReceiptIcon sx={{ mr: 2, color: 'warning.main' }} />
              <Typography variant="h6">Loan Analysis</Typography>
              <Chip 
                label={formatCurrency(overviewStats.totalLoans)} 
                color="warning" 
                size="small" 
                sx={{ ml: 2 }} 
              />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Loan Overview
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Loan Amount
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(
                          loans.reduce((sum, loan) => 
                            sum + parseFloat(loan.total_amount?.toString() || '0'), 0
                          )
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Remaining Amount
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(overviewStats.totalLoans)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Number of Active Loans
                      </Typography>
                      <Typography variant="h6">
                        {loans.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Disbursements
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {loanDisbursements.length}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Loan Details
                  </Typography>
                  <Stack spacing={2}>
                    {loans.map((loan, index) => {
                      const loanDisbursementsForLoan = loanDisbursements.filter(
                        d => d.loan_id === loan.loan_id
                      );
                      return (
                        <Box key={loan.loan_id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {loan.loan_name || `Loan ${index + 1}`}
                          </Typography>
                          <Stack spacing={0.5}>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(parseFloat(loan.total_amount?.toString() || '0'))}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Remaining:</Typography>
                              <Typography variant="body2" color="error.main" fontWeight="medium">
                                {formatCurrency(parseFloat(loan.remaining_amount?.toString() || '0'))}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Disbursements:</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {loanDisbursementsForLoan.length}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                    {loans.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No active loans
                      </Typography>
                    )}
                  </Stack>
                </Grid>
                {loanDisbursements.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Disbursements Over Time
                    </Typography>
                    <Box height={300}>
                      {(() => {
                        const disbursementMap = new Map<string, number>();
                        loanDisbursements.forEach(disbursement => {
                          if (disbursement.disbursement_date) {
                            const month = format(parseISO(disbursement.disbursement_date), 'MMM yyyy');
                            const current = disbursementMap.get(month) || 0;
                            disbursementMap.set(month, current + parseFloat(disbursement.amount.toString()));
                          }
                        });
                        const sortedMonths = Array.from(disbursementMap.entries())
                          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
                        
                        const disbursementChartData = {
                          labels: sortedMonths.map(([month]) => month),
                          datasets: [{
                            label: 'Disbursement Amount',
                            data: sortedMonths.map(([, amount]) => amount),
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                          }],
                        };
                        
                        return <Line data={disbursementChartData} options={chartOptions} />;
                      })()}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
};

export default StatisticsPage; 