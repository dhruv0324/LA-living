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
  LinearProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  TableView as TableIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  CreditCard as CreditCardIcon,
  School as SchoolIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import TagSelector from '../../components/TagSelector';
import { loanApi, loanDisbursementApi, accountApi, Loan, LoanDisbursement, Account, Tag } from '../../lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import EmptyState from '../../components/EmptyState';

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function LoansPage() {
  const { user } = useAuth();
  
  // State management
  const [loans, setLoans] = useState<Loan[]>([]);
  const [disbursements, setDisbursements] = useState<LoanDisbursement[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [disbursementType, setDisbursementType] = useState<'personal' | 'external'>('personal');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [openLoanModal, setOpenLoanModal] = useState(false);
  const [openDisbursementModal, setOpenDisbursementModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editingDisbursement, setEditingDisbursement] = useState<LoanDisbursement | null>(null);

  // Form data
  const [loanFormData, setLoanFormData] = useState({
    loan_name: '',
    total_amount: '',
    taken_amount: '',
  });

  const [disbursementFormData, setDisbursementFormData] = useState({
    amount: '',
    category: '',
    notes: '',
    disbursement_date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
  });

  // Tag state for disbursements
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
      loadLoans();
      loadAccounts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedLoan && user?.id) {
      loadDisbursements();
    }
  }, [selectedLoan, selectedMonth, selectedYear, user?.id]);

  const loadLoans = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await loanApi.getAll(user.id);
      setLoans(response.data || []);
      
      // Auto-select first loan if available
      if (response.data && response.data.length > 0 && !selectedLoan) {
        setSelectedLoan(response.data[0]);
      }
    } catch (error) {
      showNotification('Failed to load loans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDisbursements = async () => {
    if (!selectedLoan || !user?.id) return;
    
    try {
      const response = await loanDisbursementApi.getAll(selectedLoan.loan_id);
      
      // Handle both old and new response formats
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        // New format with pagination info
        setDisbursements(response.data.data || []);
        setTotalCount(response.data.total || 0);
      } else {
        // Old format - direct array
        setDisbursements(response.data || []);
        setTotalCount(response.data ? response.data.length : 0);
      }
    } catch (error) {
      showNotification('Failed to load disbursements', 'error');
    }
  };

  const loadAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const response = await accountApi.getAll(user.id);
      setAccounts(response.data || []);
    } catch (error) {
      showNotification('Failed to load payment methods', 'error');
    }
  };

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  if (loans.length === 0 && !loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <AccountBalanceIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              No Loans Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You haven't added any loans yet. Add your first loan to start tracking disbursements.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenLoanModal(true)}
              size="large"
            >
              Add Your First Loan
            </Button>
          </Box>

          {/* Add Loan Modal for Empty State */}
          <Dialog open={openLoanModal} onClose={() => setOpenLoanModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Loan</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Loan Name"
                    value={loanFormData.loan_name}
                    onChange={(e) => setLoanFormData({ ...loanFormData, loan_name: e.target.value })}
                    placeholder="e.g., Student Loan, Personal Loan"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Loan Amount"
                    type="number"
                    value={loanFormData.total_amount}
                    onChange={(e) => setLoanFormData({ ...loanFormData, total_amount: e.target.value })}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Already Taken Amount"
                    type="number"
                    value={loanFormData.taken_amount}
                    onChange={(e) => setLoanFormData({ ...loanFormData, taken_amount: e.target.value })}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Amount already received (optional)"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenLoanModal(false);
                setEditingLoan(null);
                setLoanFormData({
                  loan_name: '',
                  total_amount: '',
                  taken_amount: '',
                });
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle add loan
                setOpenLoanModal(false);
              }} variant="contained">
                Add Loan
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notification Snackbar for Empty State */}
          <Snackbar
            open={notification.open}
            autoHideDuration={4000}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
              {notification.message}
            </Alert>
          </Snackbar>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Loan Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenLoanModal(true)}
            >
              Add Loan
            </Button>
          </Box>

          {/* Loan Selection */}
          {loans.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select Loan
              </Typography>
              <Grid container spacing={2}>
                {loans.map((loan) => (
                  <Grid item xs={12} md={6} lg={4} key={loan.loan_id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedLoan?.loan_id === loan.loan_id ? 2 : 1,
                        borderColor: selectedLoan?.loan_id === loan.loan_id ? 'primary.main' : 'divider',
                      }}
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6">
                              {loan.loan_name || 'Unnamed Loan'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total: ${formatCurrency(loan.total_amount)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              // Handle edit
                            }}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={0} // Calculate progress
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          0% utilized
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Loan Details & Disbursements */}
          {selectedLoan && (
            <>
              {/* Loan Summary */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccountBalanceIcon color="primary" />
                        <Box>
                          <Typography variant="h6" color="primary">
                            ${formatCurrency(selectedLoan.total_amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Loan
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
                        <TrendingUpIcon color="info" />
                        <Box>
                          <Typography variant="h6" color="info.main">
                            ${formatCurrency(0)} {/* Calculate total disbursed */}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Disbursed
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
                        <CreditCardIcon color="success" />
                        <Box>
                          <Typography variant="h6" color="success.main">
                            ${formatCurrency(selectedLoan.total_amount)} {/* Calculate remaining */}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Remaining
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
                          Progress
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={0} // Calculate progress
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            0%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Disbursements Section */}
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    Disbursements - {selectedLoan.loan_name || 'Unnamed Loan'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Month/Year Navigation */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton onClick={() => {}} size="small">
                        <ChevronLeftIcon />
                      </IconButton>
                      <Typography variant="body1" sx={{ minWidth: 140, textAlign: 'center' }}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Typography>
                      <IconButton onClick={() => {}} size="small">
                        <ChevronRightIcon />
                      </IconButton>
                    </Box>

                    {/* View Mode Toggle */}
                    <ToggleButtonGroup
                      value={viewMode}
                      exclusive
                      onChange={(_, newMode) => newMode && setViewMode(newMode)}
                      size="small"
                    >
                      <ToggleButton value="table">
                        <TableIcon />
                      </ToggleButton>
                      <ToggleButton value="calendar">
                        <CalendarIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>

                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenDisbursementModal(true)}
                    >
                      Add Disbursement
                    </Button>
                  </Box>
                </Box>

                {/* Table View */}
                {viewMode === 'table' && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {disbursements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <EmptyState
                                title="No Disbursements Found"
                                description="Start tracking your loan disbursements by adding the first one."
                                actionLabel="Add Disbursement"
                                onAction={() => setOpenDisbursementModal(true)}
                                icon={<AddIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                              />
                            </TableCell>
                          </TableRow>
                        ) : (
                          disbursements.map((entry) => (
                            <TableRow key={entry.disbursement_id}>
                              <TableCell>
                                {entry.disbursement_date && format(new Date(entry.disbursement_date), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  ${formatCurrency(entry.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {entry.tag_name && (
                                  <Chip 
                                    label={entry.tag_name} 
                                    size="small" 
                                    variant="outlined"
                                    color="primary"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label="Personal" 
                                  size="small"
                                  color="success"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {entry.notes || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => {
                                        // Handle edit
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => {
                                        // Handle delete
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Calendar View */}
                {viewMode === 'calendar' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Calendar view coming soon...
                    </Typography>
                  </Box>
                )}
              </Paper>
            </>
          )}

          {/* Add Loan Modal */}
          <Dialog open={openLoanModal} onClose={() => setOpenLoanModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingLoan ? 'Edit Loan' : 'Add New Loan'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Loan Name"
                    value={loanFormData.loan_name}
                    onChange={(e) => setLoanFormData({ ...loanFormData, loan_name: e.target.value })}
                    placeholder="e.g., Student Loan, Personal Loan"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Loan Amount"
                    type="number"
                    value={loanFormData.total_amount}
                    onChange={(e) => setLoanFormData({ ...loanFormData, total_amount: e.target.value })}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Already Taken Amount"
                    type="number"
                    value={loanFormData.taken_amount}
                    onChange={(e) => setLoanFormData({ ...loanFormData, taken_amount: e.target.value })}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Amount already received (optional)"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenLoanModal(false);
                setEditingLoan(null);
                setLoanFormData({
                  loan_name: '',
                  total_amount: '',
                  taken_amount: '',
                });
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Handle save
                  setOpenLoanModal(false);
                }} 
                variant="contained"
              >
                {editingLoan ? 'Update' : 'Add'} Loan
              </Button>
            </DialogActions>
          </Dialog>

          {/* Add/Edit Disbursement Modal */}
          <Dialog open={openDisbursementModal} onClose={() => setOpenDisbursementModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{editingDisbursement ? 'Edit Disbursement' : 'Add Disbursement'}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Disbursement Type
                  </Typography>
                  <ToggleButtonGroup
                    value={disbursementType}
                    exclusive
                    onChange={(_, newType) => newType && setDisbursementType(newType)}
                    fullWidth
                  >
                    <ToggleButton value="personal">
                      <CreditCardIcon sx={{ mr: 1 }} />
                      Personal (Add to Account)
                    </ToggleButton>
                    <ToggleButton value="external">
                      <SchoolIcon sx={{ mr: 1 }} />
                      External (Direct Payment)
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={disbursementFormData.amount}
                    onChange={(e) => setDisbursementFormData({ ...disbursementFormData, amount: e.target.value })}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={disbursementFormData.disbursement_date}
                    onChange={(e) => setDisbursementFormData({ ...disbursementFormData, disbursement_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={disbursementFormData.category}
                      label="Category"
                      onChange={(e) => setDisbursementFormData({ ...disbursementFormData, category: e.target.value })}
                    >
                      <MenuItem value="">Select Category</MenuItem>
                      <MenuItem value="Personal">Personal</MenuItem>
                      <MenuItem value="Emergency">Emergency</MenuItem>
                      <MenuItem value="Investment">Investment</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {disbursementType === 'personal' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={disbursementFormData.account_id}
                        label="Payment Method"
                        onChange={(e) => setDisbursementFormData({ ...disbursementFormData, account_id: e.target.value })}
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
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={disbursementFormData.notes}
                    onChange={(e) => setDisbursementFormData({ ...disbursementFormData, notes: e.target.value })}
                    placeholder="Purpose of disbursement, additional details..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenDisbursementModal(false);
                setEditingDisbursement(null);
                setDisbursementFormData({
                  amount: '',
                  category: '',
                  notes: '',
                  disbursement_date: format(new Date(), 'yyyy-MM-dd'),
                  account_id: '',
                });
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Handle save
                  setOpenDisbursementModal(false);
                }} 
                variant="contained"
              >
                {editingDisbursement ? 'Update Disbursement' : 'Add Disbursement'}
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