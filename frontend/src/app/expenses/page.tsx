'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tabs,
  Tab,
  TablePagination,
  Alert,
  Snackbar,
  Autocomplete,
  CssBaseline,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon,
  TableChart as TableChartIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { expenseApi, accountApi, budgetApi, Expense, Account, BudgetSummary, Tag } from '@/lib/api';
import Layout from '@/components/Layout';
import TagSelector from '@/components/TagSelector';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import EmptyState from '@/components/EmptyState';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`expenses-tabpanel-${index}`}
      aria-labelledby={`expenses-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ExpensesPage = () => {
  // Utility function to safely format currency
  const formatCurrency = (amount: any): string => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount || '0');
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  // Check if amount exceeds selected account balance (smarter for edits)
  const isAmountValid = () => {
    if (!formData.account_id || !formData.amount) return true;
    const selectedAccount = accounts.find(acc => acc.account_id === formData.account_id);
    if (!selectedAccount) return true;
    
    const expenseAmount = parseFloat(formData.amount);
    let accountBalance = parseFloat(selectedAccount.balance.toString());
    
    // For edits, calculate effective balance considering the original expense
    if (editingExpense) {
      const originalAmount = parseFloat(editingExpense.amount.toString());
      const originalAccountId = editingExpense.account_id;
      
      // If editing the same account, add back the original amount to available balance
      if (originalAccountId === formData.account_id) {
        accountBalance += originalAmount;
      }
      // If switching accounts, the current balance is what's available
    }
    
    return expenseAmount <= accountBalance;
  };

  const getAmountErrorMessage = () => {
    if (!formData.account_id || !formData.amount) return '';
    const selectedAccount = accounts.find(acc => acc.account_id === formData.account_id);
    if (!selectedAccount) return '';
    
    const expenseAmount = parseFloat(formData.amount);
    let accountBalance = parseFloat(selectedAccount.balance.toString());
    let effectiveBalance = accountBalance;
    
    // For edits, calculate effective balance considering the original expense
    if (editingExpense) {
      const originalAmount = parseFloat(editingExpense.amount.toString());
      const originalAccountId = editingExpense.account_id;
      
      // If editing the same account, add back the original amount to available balance
      if (originalAccountId === formData.account_id) {
        effectiveBalance = accountBalance + originalAmount;
      }
    }
    
    if (expenseAmount > effectiveBalance) {
      return `Insufficient funds! Available: $${formatCurrency(effectiveBalance)}`;
    }
    return '';
  };

  // State management - get user from auth context
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [totalCount, setTotalCount] = useState(0);
  
  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    place: '',
    account_id: '',
    notes: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // Tag state
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  
  // No filters - just month/year selection via selectedMonth
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Predefined categories and payment methods
  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Groceries',
    'Gas',
    'Other',
  ];

  // Payment methods are now accounts - no need for separate array

  // Load data on component mount and when month/user changes
  useEffect(() => {
    if (user?.id) {
      loadExpenses();
      loadAccounts();
      loadBudgetSummary();
    }
  }, [selectedMonth, user?.id]);

  const loadExpenses = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Filter by selected month/year only
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      const params: any = {
        user_id: user.id,
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        start_date: format(monthStart, 'yyyy-MM-dd'),
        end_date: format(monthEnd, 'yyyy-MM-dd'),
      };

      const response = await expenseApi.getAll(params);
      
      // Handle both old and new response formats
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        // New format with pagination info
        setExpenses(response.data.data);
        setTotalCount(response.data.total);
      } else {
        // Old format - direct array
        setExpenses(response.data);
        setTotalCount(response.data.length);
      }
    } catch (error) {
      showNotification('Failed to load expenses', 'error');
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

  const loadBudgetSummary = async () => {
    if (!user?.id) return;
    
    try {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();
      const response = await expenseApi.getBudgetSummary(user.id, month, year);
      setBudgetSummary(response.data);
    } catch (error) {
      console.error('Failed to load budget summary:', error);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      showNotification('User not authenticated', 'error');
      return;
    }
    
    try {
      // Get payment method from selected account
      const selectedAccount = accounts.find(acc => acc.account_id === formData.account_id);
      const expenseAmount = parseFloat(formData.amount);
      
      // Validation: Check if expense amount exceeds account balance (smart validation for edits)
      if (selectedAccount) {
        let accountBalance = parseFloat(selectedAccount.balance.toString());
        let effectiveBalance = accountBalance;
        
        // For edits, calculate effective balance considering the original expense
        if (editingExpense) {
          const originalAmount = parseFloat(editingExpense.amount.toString());
          const originalAccountId = editingExpense.account_id;
          
          // If editing the same account, add back the original amount to available balance
          if (originalAccountId === formData.account_id) {
            effectiveBalance = accountBalance + originalAmount;
          }
        }
        
        if (expenseAmount > effectiveBalance) {
          showNotification(
            `Insufficient funds! Available balance: $${formatCurrency(effectiveBalance)}`, 
            'error'
          );
          return;
        }
      }
      
      const expenseData = {
        user_id: user.id,
        amount: expenseAmount,
        place: formData.place,
        payment_method: selectedAccount?.account_name || '',
        account_id: formData.account_id || undefined,
        notes: formData.notes,
        expense_date: formData.expense_date,
        tag_id: selectedTag?.tag_id || undefined,
      };

      if (editingExpense) {
        await expenseApi.update(editingExpense.expense_id, expenseData);
        showNotification('Expense updated successfully', 'success');
      } else {
        await expenseApi.create(expenseData);
        showNotification('Expense added successfully', 'success');
      }

      setOpenModal(false);
      setEditingExpense(null);
      resetForm();
      
      // Reload all data to reflect updated balances
      await loadExpenses();
      await loadAccounts();
      await loadBudgetSummary();
      
    } catch (error) {
      showNotification('Failed to save expense', 'error');
    }
  };

  const handleEdit = (expense: Expense) => {
    if (!user?.id) return;
    
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.tag_name || '',
      place: expense.place || '',
      account_id: expense.account_id || '',
      notes: expense.notes || '',
      expense_date: expense.expense_date || format(new Date(), 'yyyy-MM-dd'),
    });
    setSelectedTag(expense.tag_id && expense.tag_name ? {
      tag_id: expense.tag_id,
      name: expense.tag_name,
      type: 'Expense' as const,
      user_id: user.id,
      created_at: '',
    } : null);
    setOpenModal(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseApi.delete(expenseId);
        showNotification('Expense deleted successfully', 'success');
        loadExpenses();
        loadBudgetSummary();
      } catch (error) {
        showNotification('Failed to delete expense', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: '',
      place: '',
      account_id: '',
      notes: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
    });
    setSelectedTag(null);
  };

  // Calendar view helpers
  const getExpensesForDate = (date: Date) => {
    return expenses.filter(expense => 
      expense.expense_date && isSameDay(parseISO(expense.expense_date), date)
    );
  };

  const getTotalForDate = (date: Date) => {
    return getExpensesForDate(date).reduce((sum, expense) => {
      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const renderCalendarView = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <Box>
        {/* Calendar for selected month - navigation handled by main month selector */}

        <Grid container spacing={1}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Grid item xs={12/7} key={day}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
                <Typography variant="subtitle2">{day}</Typography>
              </Paper>
            </Grid>
          ))}
          
          {calendarDays.map(date => {
            const dayExpenses = getExpensesForDate(date);
            const totalAmount = getTotalForDate(date) || 0;
            const isCurrentMonth = isSameMonth(date, selectedMonth);
            
            return (
              <Grid item xs={12/7} key={date.toISOString()}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    minHeight: 80, 
                    cursor: 'pointer',
                    opacity: isCurrentMonth ? 1 : 0.3,
                    '&:hover': { bgcolor: 'grey.50' }
                  }}
                  onClick={() => {
                    if (dayExpenses.length > 0) {
                      // Could open a detailed view of expenses for this day
                      // TODO: Implement detailed expense view for specific dates
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: isCurrentMonth ? 'text.primary' : 'text.disabled'
                    }}
                  >
                    {format(date, 'd')}
                  </Typography>
                  {totalAmount > 0 && (
                    <Chip 
                      label={`$${(typeof totalAmount === 'number' ? totalAmount : 0).toFixed(2)}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  )}
                  {dayExpenses.length > 0 && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      {dayExpenses.length} expense{dayExpenses.length !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <CssBaseline />
      <Layout>
                <Container maxWidth="xl">
  
          
          <Box sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
            color: 'white',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  💸 Expense Tracking
                </Typography>
                <Typography variant="subtitle1" sx={{ 
                  opacity: 0.9,
                  fontWeight: 400
                }}>
                  Monitor your spending and stay on budget
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenModal(true)}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                Add Expense
              </Button>
            </Box>
            
            {/* Month/Year Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} 
                size="small"
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6" sx={{ 
                minWidth: 180, 
                textAlign: 'center',
                fontWeight: 600,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                py: 1,
                px: 2,
              }}>
                {format(selectedMonth, 'MMMM yyyy')}
              </Typography>
              <IconButton 
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} 
                size="small"
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingDownIcon color="error" />
                    <Box>
                      <Typography variant="h6" color="error">
                        ${formatCurrency(expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Expenses
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AddIcon color="info" />
                    <Box>
                      <Typography variant="h6" color="info.main">
                        {expenses.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expense Entries
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalanceIcon color="warning" />
                    <Box>
                      <Typography variant="h6" color="warning.main">
                        ${formatCurrency(expenses.length > 0 ? expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) / expenses.length : 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Expense
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Budget Status
                    </Typography>
                    {budgetSummary ? (
                      <Box>
                        <Typography variant="h6" color={parseFloat(String(budgetSummary.remaining_budget || '0')) >= 0 ? 'success.main' : 'error.main'}>
                          ${formatCurrency(Math.abs(budgetSummary.remaining_budget || 0))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {parseFloat(String(budgetSummary.remaining_budget || '0')) >= 0 ? 'Remaining' : 'Over Budget'}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No budget set
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs for Table and Calendar View */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab icon={<TableChartIcon />} label="Table View" />
              <Tab icon={<CalendarMonthIcon />} label="Calendar View" />
            </Tabs>
          </Paper>

          {/* Table View */}
          {tabValue === 0 && (
            <Paper sx={{ mb: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Place</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Loading expenses...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No expenses found for {format(selectedMonth, 'MMMM yyyy')}
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenModal(true)}
                            sx={{ mt: 2 }}
                          >
                            Add Your First Expense
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses
                        .sort((a, b) => parseISO(b.expense_date || '1970-01-01').getTime() - parseISO(a.expense_date || '1970-01-01').getTime())
                        .map((expense) => (
                          <TableRow key={expense.expense_id}>
                            <TableCell>
                              {expense.expense_date ? format(parseISO(expense.expense_date), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error" fontWeight="bold">
                                -${formatCurrency(expense.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {expense.tag_name && (
                                <Chip label={expense.tag_name} size="small" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {expense.place || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {expense.payment_method || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {expense.notes || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(expense)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(expense.expense_id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </TableContainer>
            </Paper>
          )}

          {/* Calendar View */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderCalendarView()}
            </Paper>
          )}

        {/* Add/Edit Expense Modal */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  error={!isAmountValid()}
                  helperText={getAmountErrorMessage()}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    expense_date: e.target.value 
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TagSelector
                  userId={user.id}
                  tagType="Expense"
                  selectedTagId={selectedTag?.tag_id}
                  selectedTagName={selectedTag?.name}
                  onTagSelect={setSelectedTag}
                  label="Category"
                  placeholder="Select or create a category"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Place"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={formData.account_id}
                    label="Payment Method"
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  >
                    <MenuItem value="">Select Payment Method</MenuItem>
                    {accounts.map(account => {
                      const balance = parseFloat(account.balance.toString());
                      const isLowBalance = balance < 50; // Flag accounts with less than $50
                      return (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{account.account_name}</span>
                            <span style={{ color: isLowBalance ? '#d32f2f' : 'inherit' }}>
                              ${formatCurrency(account.balance)}
                            </span>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenModal(false);
              setEditingExpense(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!isAmountValid()}
            >
              {editingExpense ? 'Update' : 'Add'} Expense
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
            {notification.message}
          </Alert>
                 </Snackbar>
                 </Container>
      </Layout>
    </ProtectedRoute>
  );
 };
 
 export default ExpensesPage; 