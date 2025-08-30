'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferIcon,
  AccountBalance,
} from '@mui/icons-material';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { accountApi, Account } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

const PaymentMethodsPage = () => {
  const { user } = useAuth();
  
  // State management
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form data
  const [addFormData, setAddFormData] = useState({
    account_name: '',
    balance: '',
  });

  const [editFormData, setEditFormData] = useState({
    balance: '',
  });

  const [transferFormData, setTransferFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
  });

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

  // Utility function to safely format currency
  const formatCurrency = (amount: any): string => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount || '0');
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  // Load accounts
  const loadAccounts = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await accountApi.getAll(user.id);
      setAccounts(response.data || []);
    } catch (error) {
      showNotification('Failed to load payment methods', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAccounts();
    }
  }, [user?.id]);

  // Reset forms
  const resetAddForm = () => {
    setAddFormData({
      account_name: '',
      balance: '',
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      balance: '',
    });
  };

  const resetTransferForm = () => {
    setTransferFormData({
      fromAccountId: '',
      toAccountId: '',
      amount: '',
    });
  };

  // Handle add payment method
  const handleAddSubmit = async () => {
    if (!user?.id) return;
    
    try {
      if (!addFormData.account_name.trim() || !addFormData.balance) {
        showNotification('Please fill in all fields', 'error');
        return;
      }

      const balance = parseFloat(addFormData.balance);
      if (isNaN(balance) || balance < 0) {
        showNotification('Please enter a valid balance amount', 'error');
        return;
      }

      await accountApi.create({
        user_id: user.id,
        account_name: addFormData.account_name.trim(),
        balance: balance,
      });

      showNotification('Payment method added successfully', 'success');
      setOpenAddModal(false);
      resetAddForm();
      loadAccounts();
    } catch (error) {
      showNotification('Failed to add payment method', 'error');
    }
  };

  // Handle edit balance
  const handleEditSubmit = async () => {
    if (!user?.id) return;
    
    try {
      if (!editingAccount || !editFormData.balance) {
        showNotification('Please enter a valid balance', 'error');
        return;
      }

      const balance = parseFloat(editFormData.balance);
      if (isNaN(balance) || balance < 0) {
        showNotification('Please enter a valid balance amount', 'error');
        return;
      }

      await accountApi.update(editingAccount.account_id, {
        ...editingAccount,
        balance: balance,
      });

      showNotification('Balance updated successfully', 'success');
      setOpenEditModal(false);
      setEditingAccount(null);
      resetEditForm();
      loadAccounts();
    } catch (error) {
      showNotification('Failed to update balance', 'error');
    }
  };

  // Handle delete payment method
  const handleDelete = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete "${account.account_name}"? This action cannot be undone.`)) {
      try {
        await accountApi.delete(account.account_id);
        showNotification('Payment method deleted successfully', 'success');
        loadAccounts();
      } catch (error) {
        showNotification('Failed to delete payment method', 'error');
      }
    }
  };

  // Handle transfer between accounts
  const handleTransferSubmit = async () => {
    if (!user?.id) return;
    
    try {
      const { fromAccountId, toAccountId, amount } = transferFormData;

      if (!fromAccountId || !toAccountId || !amount) {
        showNotification('Please fill in all transfer fields', 'error');
        return;
      }

      if (fromAccountId === toAccountId) {
        showNotification('Cannot transfer to the same account', 'error');
        return;
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        showNotification('Please enter a valid transfer amount', 'error');
        return;
      }

      // Check if source account has sufficient funds
      const fromAccount = accounts.find(acc => acc.account_id === fromAccountId);
      if (!fromAccount) {
        showNotification('Source account not found', 'error');
        return;
      }

      const fromBalance = parseFloat(fromAccount.balance.toString());
      if (transferAmount > fromBalance) {
        showNotification(
          `Insufficient funds! Available: $${formatCurrency(fromBalance)}`, 
          'error'
        );
        return;
      }

      // Get destination account
      const toAccount = accounts.find(acc => acc.account_id === toAccountId);
      if (!toAccount) {
        showNotification('Destination account not found', 'error');
        return;
      }

      // Perform transfer by updating both accounts
      const newFromBalance = fromBalance - transferAmount;
      const newToBalance = parseFloat(toAccount.balance.toString()) + transferAmount;

      // Update source account
      await accountApi.update(fromAccountId, {
        ...fromAccount,
        balance: newFromBalance,
      });

      // Update destination account
      await accountApi.update(toAccountId, {
        ...toAccount,
        balance: newToBalance,
      });

      showNotification(
        `Successfully transferred $${formatCurrency(transferAmount)} from ${fromAccount.account_name} to ${toAccount.account_name}`, 
        'success'
      );
      setOpenTransferModal(false);
      resetTransferForm();
      loadAccounts();
    } catch (error) {
      showNotification('Failed to transfer funds', 'error');
    }
  };

  // Open edit modal
  const openEditBalance = (account: Account) => {
    setEditingAccount(account);
    setEditFormData({
      balance: account.balance.toString(),
    });
    setOpenEditModal(true);
  };

  // Filter accounts based on search term
  const getFilteredAccounts = () => {
    if (!searchTerm) return accounts;
    return accounts.filter(account => 
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => 
    sum + parseFloat(account.balance.toString()), 0
  );

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading payment methods...
            </Typography>
          </Box>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Payment Methods
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<TransferIcon />}
                onClick={() => setOpenTransferModal(true)}
                sx={{ mr: 1 }}
                disabled={accounts.length < 2}
              >
                Transfer
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddModal(true)}
              >
                Add Payment Method
              </Button>
            </Box>
          </Box>

          {/* Summary Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Total Balance
                    </Typography>
                    <Typography variant="h4" color="primary">
                      ${formatCurrency(totalBalance)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      Payment Methods
                    </Typography>
                    <Typography variant="h4">
                      {accounts.length}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      Average Balance
                    </Typography>
                    <Typography variant="h4">
                      ${accounts.length > 0 ? formatCurrency(totalBalance / accounts.length) : '0.00'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Search Bar */}
          {accounts.length > 3 && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search payment methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>🔍</Typography>
                }}
              />
            </Box>
          )}

          {/* Payment Methods Table */}
          {getFilteredAccounts().length === 0 ? (
            <EmptyState
              title={searchTerm ? "No Payment Methods Found" : "No Payment Methods Added"}
              description={searchTerm ? "No payment methods match your search." : "Add your first payment method to get started."}
              actionLabel="Add Payment Method"
              onAction={() => setOpenAddModal(true)}
              icon={<AccountBalance sx={{ fontSize: 40, color: 'grey.400' }} />}
            />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="right">Type</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredAccounts().map((account) => (
                    <TableRow key={account.account_id}>
                      <TableCell>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {account.account_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`$${formatCurrency(account.balance)}`}
                          color={parseFloat(account.balance.toString()) < 50 ? 'error' : 'success'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" textTransform="capitalize">
                          Payment Method
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => openEditBalance(account)}
                          title="Edit Balance"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(account)}
                          color="error"
                          title="Delete Payment Method"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Add Payment Method Modal */}
          <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Payment Method</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payment Method Name"
                    placeholder="e.g., Chase Credit Card, Cash, Savings Account"
                    value={addFormData.account_name}
                    onChange={(e) => setAddFormData({ ...addFormData, account_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Initial Balance"
                    type="number"
                    placeholder="0.00"
                    value={addFormData.balance}
                    onChange={(e) => setAddFormData({ ...addFormData, balance: e.target.value })}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenAddModal(false);
                resetAddForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddSubmit} variant="contained">
                Add Payment Method
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Balance Modal */}
          <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Edit Balance - {editingAccount?.account_name}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Balance"
                    type="number"
                    value={editFormData.balance}
                    onChange={(e) => setEditFormData({ ...editFormData, balance: e.target.value })}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={`Current balance: $${editingAccount ? formatCurrency(editingAccount.balance) : '0.00'}`}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenEditModal(false);
                setEditingAccount(null);
                resetEditForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} variant="contained">
                Update Balance
              </Button>
            </DialogActions>
          </Dialog>

          {/* Transfer Modal */}
          <Dialog open={openTransferModal} onClose={() => setOpenTransferModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Transfer Between Payment Methods</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>From Account</InputLabel>
                    <Select
                      value={transferFormData.fromAccountId}
                      label="From Account"
                      onChange={(e) => setTransferFormData({ ...transferFormData, fromAccountId: e.target.value })}
                    >
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
                  <FormControl fullWidth required>
                    <InputLabel>To Account</InputLabel>
                    <Select
                      value={transferFormData.toAccountId}
                      label="To Account"
                      onChange={(e) => setTransferFormData({ ...transferFormData, toAccountId: e.target.value })}
                    >
                      {accounts
                        .filter(account => account.account_id !== transferFormData.fromAccountId)
                        .map(account => (
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
                    label="Transfer Amount"
                    type="number"
                    value={transferFormData.amount}
                    onChange={(e) => setTransferFormData({ ...transferFormData, amount: e.target.value })}
                    required
                    inputProps={{ min: 0.01, step: 0.01 }}
                    helperText={
                      transferFormData.fromAccountId ? 
                      `Available: $${formatCurrency(accounts.find(acc => acc.account_id === transferFormData.fromAccountId)?.balance || 0)}` : 
                      'Select source account first'
                    }
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenTransferModal(false);
                resetTransferForm();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransferSubmit} 
                variant="contained"
                disabled={!transferFormData.fromAccountId || !transferFormData.toAccountId || !transferFormData.amount}
              >
                Transfer Funds
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
};

export default PaymentMethodsPage;