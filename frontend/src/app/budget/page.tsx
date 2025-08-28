'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
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
  Alert,
  LinearProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Savings as SavingsIcon,
  Edit as EditIcon,
  Add as AddIcon,
  MonetizationOn as MoneyIcon,
  CreditCard as LoanIcon,
  Assessment as BudgetIcon,
} from '@mui/icons-material';

import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { 
  budgetApi, 
  Budget, 
  expenseApi, 
  BudgetSummary,
  accountApi,
  Account,
  loanApi,
  Loan
} from '../../lib/api';
import { format } from 'date-fns';

const BudgetPage = () => {
  const { user } = useAuth();
  
  // State management
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal states
  const [openBudgetModal, setOpenBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form data
  const [budgetFormData, setBudgetFormData] = useState({
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  // Load data
  useEffect(() => {
    if (user?.id) {
      loadBudgetData();
      loadAccounts();
      loadLoans();
    }
  }, [selectedMonth, selectedYear, user?.id]);

  const loadBudgetData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Try to get budget for selected month/year
      try {
        const budgetResponse = await budgetApi.getForMonth(user.id, selectedMonth, selectedYear);
        setCurrentBudget(budgetResponse.data);
      } catch (error) {
        // No budget exists for this month
        setCurrentBudget(null);
      }

      // Get budget summary (expenses vs budget)
      try {
        const summaryResponse = await expenseApi.getBudgetSummary(user.id, selectedMonth, selectedYear);
        setBudgetSummary(summaryResponse.data);
      } catch (error) {
        setBudgetSummary(null);
      }
    } catch (error) {
      showNotification('Failed to load budget data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const response = await accountApi.getAll(user.id);
      setAccounts(response.data);
    } catch (error) {
      showNotification('Failed to load accounts', 'error');
    }
  };

  const loadLoans = async () => {
    if (!user?.id) return;
    
    try {
      const response = await loanApi.getAll(user.id);
      setLoans(response.data);
    } catch (error) {
      showNotification('Failed to load loans', 'error');
    }
  };

  // Calculate financial overview
  const totalAccountBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance.toString()), 0);
  const totalLoanRemaining = loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_amount?.toString() || '0'), 0);
  const budgetAmount = currentBudget?.amount || 0;
  const expensesThisMonth = budgetSummary?.total_expenses || 0;
  const remainingBudget = budgetAmount - expensesThisMonth;
  const budgetUsagePercentage = budgetAmount > 0 ? (expensesThisMonth / budgetAmount) * 100 : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Handle budget creation/update
  const handleBudgetSubmit = async () => {
    if (!user?.id) {
      showNotification('User not authenticated', 'error');
      return;
    }
    
    try {
      const budgetData = {
        user_id: user.id,
        month: budgetFormData.month,
        year: budgetFormData.year,
        amount: parseFloat(budgetFormData.amount),
      };

      if (editingBudget) {
        await budgetApi.update(editingBudget.budget_id, budgetData);
        showNotification('Budget updated successfully', 'success');
      } else {
        await budgetApi.create(budgetData);
        showNotification('Budget created successfully', 'success');
      }

      setOpenBudgetModal(false);
      resetBudgetForm();
      loadBudgetData();
    } catch (error) {
      showNotification('Failed to save budget', 'error');
    }
  };

  const resetBudgetForm = () => {
    setBudgetFormData({
      amount: '',
      month: selectedMonth,
      year: selectedYear,
    });
    setEditingBudget(null);
  };

  const openEditBudgetModal = () => {
    if (currentBudget) {
      setBudgetFormData({
        amount: currentBudget.amount.toString(),
        month: currentBudget.month,
        year: currentBudget.year,
      });
      setEditingBudget(currentBudget);
    } else {
      setBudgetFormData({
        amount: '',
        month: selectedMonth,
        year: selectedYear,
      });
      setEditingBudget(null);
    }
    setOpenBudgetModal(true);
  };

  const getBudgetStatusColor = () => {
    if (budgetUsagePercentage <= 50) return 'success';
    if (budgetUsagePercentage <= 80) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Loading budget data...</Typography>
        </Box>
      </Layout>
    );
  }

    // Don't render if user is not available
  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">
              Budget Management
            </Typography>
            <Button
              variant="contained"
              startIcon={currentBudget ? <EditIcon /> : <AddIcon />}
              onClick={openEditBudgetModal}
            >
              {currentBudget ? 'Edit Budget' : 'Set Budget'}
            </Button>
          </Box>

          {/* Month/Year Selector */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">Viewing:</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value as number)}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {format(new Date(2024, i, 1), 'MMMM')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value as number)}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 3 + i;
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Financial Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Total Account Balance */}
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalanceIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {formatCurrency(totalAccountBalance)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Available Funds
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Budget Status */}
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BudgetIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {formatCurrency(budgetAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Budget
                      </Typography>
                      {budgetAmount > 0 && (
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(budgetUsagePercentage, 100)}
                          color={getBudgetStatusColor()}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Expenses This Month */}
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingDownIcon color="error" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="error">
                        {formatCurrency(expensesThisMonth)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Spent This Month
                      </Typography>
                      {budgetAmount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {budgetUsagePercentage.toFixed(1)}% of budget
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Remaining Budget or Loans */}
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  {budgetAmount > 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <SavingsIcon 
                        color={remainingBudget >= 0 ? "success" : "error"} 
                        sx={{ fontSize: 40 }} 
                      />
                      <Box>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          color={remainingBudget >= 0 ? "success.main" : "error.main"}
                        >
                          {formatCurrency(remainingBudget)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {remainingBudget >= 0 ? 'Remaining Budget' : 'Over Budget'}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LoanIcon color="warning" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h5" fontWeight="bold" color="warning.main">
                          {formatCurrency(totalLoanRemaining)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Outstanding Loans
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Budget Status Details */}
          {currentBudget && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget Details for {format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Budget Amount</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(budgetAmount)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Spent</Typography>
                      <Typography variant="body1" color="error">
                        {formatCurrency(expensesThisMonth)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" fontWeight="bold">Remaining</Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        color={remainingBudget >= 0 ? "success.main" : "error.main"}
                      >
                        {formatCurrency(remainingBudget)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Budget Usage
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(budgetUsagePercentage, 100)}
                      color={getBudgetStatusColor()}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">
                        {budgetUsagePercentage.toFixed(1)}% used
                      </Typography>
                      {budgetUsagePercentage > 100 && (
                        <Chip 
                          label="Over Budget!" 
                          color="error" 
                          size="small" 
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* No Budget Set */}
          {!currentBudget && (
            <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
              <BudgetIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Budget Set for {format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Set a budget to track your spending and manage your finances better.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={openEditBudgetModal}
              >
                Set Your First Budget
              </Button>
            </Paper>
          )}

          {/* Account Summary */}
          {accounts.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Methods Overview
              </Typography>
              <Grid container spacing={2}>
                {accounts.map((account) => (
                  <Grid item xs={12} sm={6} md={4} key={account.account_id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">
                            {account.account_name}
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={parseFloat(account.balance.toString()) >= 0 ? "success.main" : "error.main"}
                          >
                            {formatCurrency(parseFloat(account.balance.toString()))}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Loans Summary */}
          {loans.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Outstanding Loans
              </Typography>
              <Grid container spacing={2}>
                {loans.map((loan) => (
                  <Grid item xs={12} sm={6} md={4} key={loan.loan_id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {loan.loan_name || 'Loan'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Total Amount:</Typography>
                          <Typography variant="body2">
                            {formatCurrency(parseFloat(loan.total_amount.toString()))}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Remaining:</Typography>
                          <Typography variant="body2" color="warning.main">
                            {formatCurrency(parseFloat(loan.remaining_amount?.toString() || '0'))}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={((parseFloat(loan.total_amount.toString()) - parseFloat(loan.remaining_amount?.toString() || '0')) / parseFloat(loan.total_amount.toString())) * 100}
                          color="info"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Box>

        {/* Budget Modal */}
        <Dialog open={openBudgetModal} onClose={() => setOpenBudgetModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingBudget ? 'Edit Budget' : 'Set Budget'} for {format(new Date(budgetFormData.year, budgetFormData.month - 1, 1), 'MMMM yyyy')}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={budgetFormData.month}
                    label="Month"
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, month: e.target.value as number })}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {format(new Date(2024, i, 1), 'MMMM')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={budgetFormData.year}
                    label="Year"
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, year: e.target.value as number })}
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 3 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Budget Amount"
                  type="number"
                  value={budgetFormData.amount}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, amount: e.target.value })}
                  InputProps={{
                    startAdornment: <Typography>$</Typography>,
                  }}
                  helperText="Enter your monthly budget amount"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBudgetModal(false)}>Cancel</Button>
            <Button onClick={handleBudgetSubmit} variant="contained">
              {editingBudget ? 'Update Budget' : 'Set Budget'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
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
    </ProtectedRoute>
  );
};

export default BudgetPage; 