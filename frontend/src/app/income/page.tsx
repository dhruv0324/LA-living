'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Chip,
  Fab,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  TableView as TableIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

import Layout from '../../components/Layout';
import TagSelector from '../../components/TagSelector';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { incomeApi, Income, accountApi, Account, Tag } from '../../lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function IncomePage() {
  const { user } = useAuth();
  
  // State management
  const [income, setIncome] = useState<Income[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  // Form data
  const [incomeFormData, setIncomeFormData] = useState({
    amount: '',
    source: '',
    notes: '',
    income_date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
  });

  // Tag state
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

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
      loadIncome();
      loadAccounts();
    }
  }, [selectedMonth, selectedYear, page, rowsPerPage, user?.id]);

  const loadIncome = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await incomeApi.getAll({
        user_id: user.id,
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      });
      
      // Handle both old and new response formats
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        // New format with pagination info
        setIncome(response.data.data);
        setTotalCount(response.data.total);
      } else {
        // Old format - direct array
        setIncome(response.data);
        setTotalCount(response.data.length);
      }
    } catch (error) {
      showNotification('Failed to load income entries', 'error');
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

  // Income form handlers
         const handleAddIncome = async () => {
    if (!user?.id) return;
    
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

                     await incomeApi.create({
        user_id: user.id,
        amount: amount,
        notes: incomeFormData.notes,
        income_date: incomeFormData.income_date,
        account_id: incomeFormData.account_id,
        tag_id: selectedTag?.tag_id,
      });

      showNotification('Income added successfully!', 'success');
      setOpenAddModal(false);
      resetForm();
      loadIncome();
      loadAccounts(); // Refresh account balances
    } catch (error) {
      showNotification('Failed to add income', 'error');
    }
  };

     const handleEditIncome = async () => {
     try {
       if (!editingIncome) return;

       const amount = parseFloat(incomeFormData.amount);
       if (isNaN(amount) || amount <= 0) {
         showNotification('Please enter a valid amount', 'error');
         return;
       }

       if (!incomeFormData.account_id) {
         showNotification('Please select a payment method', 'error');
         return;
       }

             await incomeApi.update(editingIncome.income_id, {
                 user_id: editingIncome.user_id,
        amount: amount,
        notes: incomeFormData.notes,
        income_date: incomeFormData.income_date,
        account_id: incomeFormData.account_id,
        tag_id: selectedTag?.tag_id,
      });

      showNotification('Income updated successfully!', 'success');
      setOpenEditModal(false);
      setEditingIncome(null);
      resetForm();
      loadIncome();
      loadAccounts(); // Refresh account balances
    } catch (error) {
      showNotification('Failed to update income', 'error');
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        await incomeApi.delete(incomeId);
        showNotification('Income deleted successfully!', 'success');
        loadIncome();
        loadAccounts(); // Refresh account balances
      } catch (error) {
        showNotification('Failed to delete income', 'error');
      }
    }
  };

  const resetForm = () => {
    setIncomeFormData({
      amount: '',
      source: '',
      notes: '',
      income_date: format(new Date(), 'yyyy-MM-dd'),
      account_id: '',
    });
    setSelectedTag(null);
  };

  const openEditIncomeModal = (incomeEntry: Income) => {
    if (!user?.id) return;
    
    setEditingIncome(incomeEntry);
    setIncomeFormData({
      amount: incomeEntry.amount.toString(),
      source: incomeEntry.tag_name || '',
      notes: incomeEntry.notes || '',
      income_date: incomeEntry.income_date || format(new Date(), 'yyyy-MM-dd'),
      account_id: incomeEntry.account_id || '',
    });
    setSelectedTag(incomeEntry.tag_id && incomeEntry.tag_name ? {
      tag_id: incomeEntry.tag_id,
      name: incomeEntry.tag_name,
      type: 'Income' as const,
      user_id: user.id,
      created_at: '',
    } : null);
    setOpenEditModal(true);
  };

  // Filter income by selected month/year
  const filteredIncome = income.filter(entry => {
    if (!entry.income_date) return false;
    const entryDate = parseISO(entry.income_date);
    return entryDate.getMonth() + 1 === selectedMonth && entryDate.getFullYear() === selectedYear;
  });

  // Calculate summary
  const totalIncome = filteredIncome.reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0);
  const incomeCount = filteredIncome.length;
  const averageIncome = incomeCount > 0 ? totalIncome / incomeCount : 0;

  // Source breakdown
  const sourceBreakdown = filteredIncome.reduce((acc, entry) => {
    const source = entry.tag_name || 'Unknown';
    acc[source] = (acc[source] || 0) + parseFloat(entry.amount.toString());
    return acc;
  }, {} as Record<string, number>);

  // Calendar view helpers
  const currentDate = new Date(selectedYear, selectedMonth - 1, 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getIncomeForDate = (date: Date) => {
    return filteredIncome.filter(entry => 
                  entry.income_date && isSameDay(parseISO(entry.income_date), date)
    );
  };

  const sources = [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Rental',
    'Bonus',
    'Gift',
    'Loan Disbursement',
    'Other',
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigation functions
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box>
          {/* Header */}
          <Box sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: 'white',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  💰 Income Tracking
                </Typography>
                <Typography variant="subtitle1" sx={{ 
                  opacity: 0.9,
                  fontWeight: 400
                }}>
                  Monitor your earnings and financial growth
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddModal(true)}
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
                Add Income
              </Button>
            </Box>
            
            {/* Month/Year Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={goToPreviousMonth} 
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
                {monthNames[selectedMonth - 1]} {selectedYear}
              </Typography>
              <IconButton 
                onClick={goToNextMonth} 
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

          {/* Controls Section */}
          <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Month/Year Dropdowns */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Filter by:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Month"
                    onChange={(e) => setSelectedMonth(e.target.value as number)}
                  >
                    {monthNames.map((month, index) => (
                      <MenuItem key={index} value={index + 1}>
                        {month}
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
                    {Array.from({ length: 10 }, (_, i) => selectedYear - 5 + i).map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* View Mode Toggle */}
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  startIcon={<TableIcon />}
                  onClick={() => setViewMode('table')}
                  sx={{ borderRadius: 2 }}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                  startIcon={<CalendarIcon />}
                  onClick={() => setViewMode('calendar')}
                  sx={{ borderRadius: 2 }}
                >
                  Calendar
                </Button>
              </Box>
            </Box>
          </Card>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUpIcon color="primary" />
                    <Box>
                      <Typography variant="h6" color="primary">
                        ${formatCurrency(totalIncome)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Income
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
                    <AddIcon color="success" />
                    <Box>
                      <Typography variant="h6" color="success.main">
                        {incomeCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Income Entries
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
                    <AccountBalanceIcon color="info" />
                    <Box>
                      <Typography variant="h6" color="info">
                        ${formatCurrency(averageIncome)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Income
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
                      Top Source
                    </Typography>
                    {Object.keys(sourceBreakdown).length > 0 ? (
                      <Box>
                        <Typography variant="h6" color="primary">
                          {Object.entries(sourceBreakdown).sort(([,a], [,b]) => b - a)[0][0]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${formatCurrency(Object.entries(sourceBreakdown).sort(([,a], [,b]) => b - a)[0][1])}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Table View */}
          {viewMode === 'table' && (
            <Paper sx={{ mb: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Source</TableCell>
                                             <TableCell>Payment Method</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredIncome.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No income entries found for {monthNames[selectedMonth - 1]} {selectedYear}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIncome
                        .sort((a, b) => parseISO(b.income_date || '1970-01-01').getTime() - parseISO(a.income_date || '1970-01-01').getTime())
                        .map((entry) => (
                          <TableRow key={entry.income_id}>
                            <TableCell>
                              {entry.income_date && format(parseISO(entry.income_date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="primary" fontWeight="bold">
                                +${formatCurrency(entry.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {entry.tag_name && (
                                <Chip label={entry.tag_name} size="small" variant="outlined" />
                              )}
                            </TableCell>
                                                         <TableCell>
                               <Typography variant="body2">
                                 {entry.account_name || 'No payment method'}
                               </Typography>
                             </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {entry.notes || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => openEditIncomeModal(entry)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteIncome(entry.income_id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
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
          {viewMode === 'calendar' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {monthNames[selectedMonth - 1]} {selectedYear}
              </Typography>
              <Grid container spacing={1}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Grid item xs={12/7} key={day}>
                    <Box sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>
                      {day}
                    </Box>
                  </Grid>
                ))}
                
                {/* Empty cells for days before month starts */}
                {Array.from({ length: monthStart.getDay() }, (_, i) => (
                  <Grid item xs={12/7} key={`empty-${i}`}>
                    <Box sx={{ height: 100, p: 1 }} />
                  </Grid>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map(day => {
                  const dayIncome = getIncomeForDate(day);
                  const totalDayIncome = dayIncome.reduce((sum, entry) => 
                    sum + parseFloat(entry.amount.toString()), 0
                  );
                  
                  return (
                    <Grid item xs={12/7} key={day.toISOString()}>
                      <Box
                        sx={{
                          height: 100,
                          p: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: isSameMonth(day, currentDate) ? 'background.paper' : 'action.hover',
                          cursor: dayIncome.length > 0 ? 'pointer' : 'default',
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {format(day, 'd')}
                        </Typography>
                        {dayIncome.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="primary" fontWeight="bold">
                              +${formatCurrency(totalDayIncome)}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {dayIncome.length} {dayIncome.length === 1 ? 'entry' : 'entries'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          )}

          {/* Floating Action Button */}
          <Fab
            color="primary"
            aria-label="add income"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setOpenAddModal(true)}
          >
            <AddIcon />
          </Fab>

          {/* Add Income Modal */}
          <Dialog open={openAddModal} onClose={() => {
            setOpenAddModal(false);
            setSelectedTag(null);
          }} maxWidth="sm" fullWidth>
            <DialogTitle>Add Income</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={incomeFormData.amount}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
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
                <Grid item xs={12} sm={6}>
                  <TagSelector
                    userId={user.id}
                    tagType="Income"
                    selectedTagId={selectedTag?.tag_id}
                    selectedTagName={selectedTag?.name}
                    onTagSelect={setSelectedTag}
                    label="Source"
                    placeholder="Select or create a source"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={incomeFormData.account_id}
                      label="Payment Method"
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, account_id: e.target.value })}
                    >
                      <MenuItem value="">Select Payment Method</MenuItem>
                      {accounts.map(account => (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{account.account_name}</span>
                            <span>${formatCurrency(account.balance)}</span>
                          </Box>
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
                    rows={3}
                    value={incomeFormData.notes}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenAddModal(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddIncome} variant="contained">
                Add Income
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Income Modal */}
          <Dialog open={openEditModal} onClose={() => {
            setOpenEditModal(false);
            setSelectedTag(null);
          }} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Income</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={incomeFormData.amount}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
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
                <Grid item xs={12} sm={6}>
                  <TagSelector
                    userId={user.id}
                    tagType="Income"
                    selectedTagId={selectedTag?.tag_id}
                    selectedTagName={selectedTag?.name}
                    onTagSelect={setSelectedTag}
                    label="Source"
                    placeholder="Select or create a source"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={incomeFormData.account_id}
                      label="Payment Method"
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, account_id: e.target.value })}
                    >
                      <MenuItem value="">Select Payment Method</MenuItem>
                      {accounts.map(account => (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{account.account_name}</span>
                            <span>${formatCurrency(account.balance)}</span>
                          </Box>
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
                    rows={3}
                    value={incomeFormData.notes}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenEditModal(false);
                setEditingIncome(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditIncome} variant="contained">
                Update Income
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
        </Box>
      </Layout>
    </ProtectedRoute>
  );
} 