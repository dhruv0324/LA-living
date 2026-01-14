'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
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
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  LinearProgress,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  AccountBalance as AccountIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

import Layout from '@/components/Layout';
import TagSelector from '@/components/TagSelector';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { 
  peopleApi, 
  Person, 
  debtApi, 
  Debt, 
  accountApi, 
  Account, 
  Tag 
} from '@/lib/api';
import EmptyState from '@/components/EmptyState';

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

interface DebtSummary {
  total_owed_to_me: number;
  total_i_owe: number;
  net_balance: number;
  people_count: number;
  debts_count: number;
}

export default function DebtsPage() {
  const { user } = useAuth();
  
  // State management
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [openPersonModal, setOpenPersonModal] = useState(false);
  const [openDebtModal, setOpenDebtModal] = useState(false);
  const [openSettleModal, setOpenSettleModal] = useState(false);
  const [openSettleAllModal, setOpenSettleAllModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [settlingDebt, setSettlingDebt] = useState<Debt | null>(null);
  const [settlingPerson, setSettlingPerson] = useState<Person | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Form data
  const [personFormData, setPersonFormData] = useState({
    name: '',
  });

  const [debtFormData, setDebtFormData] = useState({
    person_id: '',
    amount: '',
    type: 'OwedToMe' as 'OwedToMe' | 'IOwe',
    notes: '',
    place: '',
    debt_date: new Date().toISOString().split('T')[0],
    account_id: '',
  });

  // Tag state (required for IOwe debts)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const [settlementData, setSettlementData] = useState({
    account_id: '',
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

  // Data loading functions
  const loadPeople = async () => {
    if (!user?.id) return;
    
    try {
      const response = await peopleApi.getAll(user.id);
      setPeople(response.data || []);
    } catch (error) {
      console.error('Failed to load people:', error);
      showNotification('Failed to load people', 'error');
    }
  };

  const loadDebts = async () => {
    if (!user?.id) return;
    
    try {
      const response = await debtApi.getAll({ user_id: user.id, is_settled: false });
      setDebts(response.data || []);
    } catch (error) {
      console.error('Failed to load debts:', error);
      showNotification('Failed to load debts', 'error');
    }
  };

  const loadAccounts = async () => {
    if (!user?.id) return;
    
    try {
      const response = await accountApi.getAll(user.id);
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      showNotification('Failed to load accounts', 'error');
    }
  };

  const loadDebtSummary = async () => {
    if (!user?.id) return;
    
    try {
      const response = await debtApi.getSummary(user.id);
      setDebtSummary(response.data);
    } catch (error) {
      console.error('Failed to load debt summary:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user?.id) {
      const loadAllData = async () => {
        try {
          setLoading(true);
          await Promise.all([
            loadPeople(),
            loadDebts(),
            loadAccounts(),
            loadDebtSummary(),
          ]);
        } catch (error) {
          console.error('Failed to load data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [user?.id]);

  // Calculate totals for each person
  const getPersonDebts = (personId: string) => {
    return debts.filter(debt => debt.person_id === personId);
  };

  const getPersonTotal = (personId: string, type: 'OwedToMe' | 'IOwe') => {
    const personDebts = getPersonDebts(personId);
    return personDebts
      .filter(debt => debt.type === type)
      .reduce((sum, debt) => sum + parseFloat(debt.amount.toString()), 0);
  };

  // Filter debts by type
  const debtorDebts = debts.filter(debt => debt.type === 'OwedToMe' && !debt.is_settled);
  const creditorDebts = debts.filter(debt => debt.type === 'IOwe' && !debt.is_settled);

  // Filter people by search
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle person operations
  const handleAddPerson = async () => {
    try {
      if (!personFormData.name.trim()) {
        showNotification('Please enter a name', 'error');
        return;
      }

      if (editingPerson) {
        await peopleApi.update(editingPerson.person_id, {
          user_id: user!.id,
          name: personFormData.name.trim(),
        });
        showNotification('Person updated successfully!', 'success');
      } else {
        await peopleApi.create({
          user_id: user!.id,
          name: personFormData.name.trim(),
        });
        showNotification('Person added successfully!', 'success');
      }

      setPersonFormData({ name: '' });
      setEditingPerson(null);
      setOpenPersonModal(false);
      await loadPeople();
    } catch (error) {
      console.error('Failed to save person:', error);
      showNotification('Failed to save person', 'error');
    }
  };

  const handleDeletePerson = async (person: Person) => {
    if (window.confirm(`Are you sure you want to delete "${person.name}" and all their debt records? This action cannot be undone.`)) {
      try {
        await peopleApi.delete(person.person_id);
        showNotification('Person and all debts deleted successfully!', 'success');
        await Promise.all([loadPeople(), loadDebts(), loadDebtSummary()]);
      } catch (error) {
        console.error('Failed to delete person:', error);
        showNotification('Failed to delete person', 'error');
      }
    }
  };

  const handleSettleAllForPerson = async () => {
    if (!settlingPerson || !settlementData.account_id) {
      showNotification('Please select a payment method', 'error');
      return;
    }

    try {
      const response = await debtApi.settleNet(settlingPerson.person_id, settlementData.account_id);
      showNotification(response.data.message || 'All debts settled successfully!', 'success');
      setOpenSettleAllModal(false);
      setSettlingPerson(null);
      setSettlementData({ account_id: '' });
      await Promise.all([loadDebts(), loadDebtSummary(), loadAccounts()]);
    } catch (error: any) {
      console.error('Failed to settle debts:', error);
      showNotification(error.response?.data?.detail || 'Failed to settle debts', 'error');
    }
  };

  // Handle debt operations
  const handleAddDebt = async () => {
    try {
      if (!debtFormData.person_id) {
        showNotification('Please select a person', 'error');
        return;
      }

      if (!debtFormData.amount || parseFloat(debtFormData.amount) <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
      }

      // For OwedToMe debts, require account
      if (debtFormData.type === 'OwedToMe') {
        if (!debtFormData.account_id) {
          showNotification('Please select an account for this debt', 'error');
          return;
        }
      }

      // For IOwe debts, require tag and place
      if (debtFormData.type === 'IOwe') {
        if (!selectedTag) {
          showNotification('Please select a category (tag) for this debt', 'error');
          return;
        }
        if (!debtFormData.place?.trim()) {
          showNotification('Please enter a place for this debt', 'error');
          return;
        }
      }

      const debtData: any = {
        person_id: debtFormData.person_id,
        amount: parseFloat(debtFormData.amount),
        type: debtFormData.type,
        notes: debtFormData.notes,
        debt_date: debtFormData.debt_date,
        place: debtFormData.place || undefined,
        tag_id: selectedTag?.tag_id,
        is_settled: false,
      };

      // Add account_id for OwedToMe debts
      if (debtFormData.type === 'OwedToMe' && debtFormData.account_id) {
        debtData.account_id = debtFormData.account_id;
      }

      if (editingDebt) {
        // For updates, include account_id if it's OwedToMe
        if (debtFormData.type === 'OwedToMe' && debtFormData.account_id) {
          debtData.account_id = debtFormData.account_id;
        }
        await debtApi.update(editingDebt.debt_id, debtData);
        showNotification('Debt updated successfully!', 'success');
      } else {
        await debtApi.create(debtData);
        showNotification('Debt added successfully!', 'success');
      }

      setDebtFormData({
        person_id: '',
        amount: '',
        type: 'OwedToMe',
        notes: '',
        place: '',
        debt_date: new Date().toISOString().split('T')[0],
        account_id: '',
      });
      setSelectedTag(null);
      setEditingDebt(null);
      setOpenDebtModal(false);
      await Promise.all([loadDebts(), loadDebtSummary(), loadAccounts()]);
    } catch (error) {
      console.error('Failed to save debt:', error);
      showNotification('Failed to save debt', 'error');
    }
  };

  const handleDeleteDebt = async (debt: Debt) => {
    if (window.confirm(`Are you sure you want to delete this debt record?`)) {
      try {
        await debtApi.delete(debt.debt_id);
        showNotification('Debt deleted successfully!', 'success');
        await Promise.all([loadDebts(), loadDebtSummary()]);
      } catch (error) {
        console.error('Failed to delete debt:', error);
        showNotification('Failed to delete debt', 'error');
      }
    }
  };

  const handleSettleDebt = async () => {
    if (!settlingDebt || !settlementData.account_id) {
      showNotification('Please select a payment method', 'error');
      return;
    }

    try {
      await debtApi.settle(settlingDebt.debt_id, settlementData.account_id);
      showNotification('Debt settled successfully!', 'success');
      setOpenSettleModal(false);
      setSettlingDebt(null);
      setSettlementData({ account_id: '' });
      await Promise.all([loadDebts(), loadDebtSummary(), loadAccounts()]);
    } catch (error: any) {
      console.error('Failed to settle debt:', error);
      showNotification(error.response?.data?.detail || 'Failed to settle debt', 'error');
    }
  };

  const openEditDebtModal = (debt: Debt) => {
    setEditingDebt(debt);
    setDebtFormData({
      person_id: debt.person_id,
      amount: debt.amount.toString(),
      type: debt.type,
      notes: debt.notes || '',
      place: debt.place || '',
      debt_date: debt.debt_date || new Date().toISOString().split('T')[0],
      account_id: (debt as any).account_id || '',
    });
    // Set tag if it exists
    if (debt.tag_id && debt.tag_name) {
      setSelectedTag({
        tag_id: debt.tag_id,
        name: debt.tag_name,
        type: debt.type === 'IOwe' ? 'Expense' : 'Income',
        user_id: user!.id,
        created_at: '',
      });
    } else {
      setSelectedTag(null);
    }
    setOpenDebtModal(true);
  };

  const openEditPersonModal = (person: Person) => {
    setEditingPerson(person);
    setPersonFormData({ name: person.name });
    setOpenPersonModal(true);
  };

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 600 }}>
              💰 Debt Management
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              Track money owed to you and money you owe to others
            </Typography>

            {/* Summary Cards */}
            {debtSummary && (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        ${formatCurrency(debtSummary.total_owed_to_me)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Owed to Me
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        ${formatCurrency(debtSummary.total_i_owe)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        I Owe
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: debtSummary.net_balance >= 0 
                      ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
                      : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        ${formatCurrency(Math.abs(debtSummary.net_balance))}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {debtSummary.net_balance >= 0 ? 'Net Balance' : 'Net Debt'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {debtSummary.people_count}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        People Involved
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingPerson(null);
                  setPersonFormData({ name: '' });
                  setOpenPersonModal(true);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                  },
                }}
              >
                Add Friend
              </Button>
              <Button
                variant="outlined"
                startIcon={<MoneyIcon />}
                onClick={() => {
                  setEditingDebt(null);
                  setDebtFormData({
                    person_id: '',
                    amount: '',
                    type: 'OwedToMe',
                    notes: '',
                    place: '',
                    debt_date: new Date().toISOString().split('T')[0],
                    account_id: '',
                  });
                  setSelectedTag(null);
                  setOpenDebtModal(true);
                }}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                  },
                }}
              >
                Add Debt
              </Button>
            </Box>
          </Box>

          {/* Content */}
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Loading debt information...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* People Section */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        👥 Friends ({people.length})
                      </Typography>
                    </Box>

                    {people.length === 0 ? (
                      <EmptyState
                        title="No Friends Added"
                        description="Start by adding friends you owe money to or who owe you money."
                        actionLabel="Add Friend"
                        onAction={() => {
                          setEditingPerson(null);
                          setPersonFormData({ name: '' });
                          setOpenPersonModal(true);
                        }}
                        icon={<PersonIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Search people..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mb: 2 }}
                        />

                        <List>
                          {filteredPeople.map((person) => {
                            const owedToMe = getPersonTotal(person.person_id, 'OwedToMe');
                            const iOwe = getPersonTotal(person.person_id, 'IOwe');
                            const hasDebts = owedToMe > 0 || iOwe > 0;

                            return (
                              <ListItem
                                key={person.person_id}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 2,
                                  mb: 2,
                                  p: 2,
                                  backgroundColor: 'background.paper',
                                  flexDirection: 'column',
                                  alignItems: 'stretch',
                                  minHeight: 120,
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', mb: 1.5 }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                                      {person.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      {owedToMe > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                                            Owed to you: ${formatCurrency(owedToMe)}
                                          </Typography>
                                        </Box>
                                      )}
                                      {iOwe > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <TrendingDownIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                                            You owe: ${formatCurrency(iOwe)}
                                          </Typography>
                                        </Box>
                                      )}
                                      {!hasDebts && (
                                        <Typography variant="body2" color="text.secondary">
                                          No debts
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                                  {hasDebts && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      onClick={() => {
                                        setSettlingPerson(person);
                                        setOpenSettleAllModal(true);
                                      }}
                                      sx={{ minWidth: 80 }}
                                    >
                                      Settle All
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => openEditPersonModal(person)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleDeletePerson(person)}
                                  >
                                    Delete
                                  </Button>
                                </Box>
                              </ListItem>
                            );
                          })}
                        </List>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Debtors Section (Owed to Me) */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      💚 Debtors - Owed to Me ({debtorDebts.length})
                    </Typography>

                    {debtorDebts.length === 0 ? (
                      <EmptyState
                        title="No Debts Owed to You"
                        description="When people owe you money, it will appear here."
                        actionLabel="Add Debt"
                        onAction={() => {
                          setEditingDebt(null);
                          setDebtFormData({
                            person_id: '',
                            amount: '',
                            type: 'OwedToMe',
                            notes: '',
                            place: '',
                            debt_date: new Date().toISOString().split('T')[0],
                            account_id: '',
                          });
                          setSelectedTag(null);
                          setOpenDebtModal(true);
                        }}
                        icon={<TrendingUpIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    ) : (
                      <List>
                        {debtorDebts.map((debt) => (
                          <ListItem
                            key={debt.debt_id}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              backgroundColor: 'background.paper',
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
                                    ${formatCurrency(debt.amount)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {people.find(p => p.person_id === debt.person_id)?.name || 'Unknown Person'}
                                  </Typography>
                                  {debt.notes && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                      {debt.notes}
                                    </Typography>
                                  )}
                                  {debt.debt_date && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {format(parseISO(debt.debt_date), 'MMM dd, yyyy')}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => {
                                    setSettlingDebt(debt);
                                    setOpenSettleModal(true);
                                  }}
                                  sx={{ minWidth: 80, mb: 0.5 }}
                                >
                                  Settle
                                </Button>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Edit Debt">
                                    <IconButton
                                      size="small"
                                      onClick={() => openEditDebtModal(debt)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Debt">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteDebt(debt)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Creditors Section (I Owe) */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      🔴 Creditors - I Owe ({creditorDebts.length})
                    </Typography>

                    {creditorDebts.length === 0 ? (
                      <EmptyState
                        title="No Debts You Owe"
                        description="When you owe money to others, it will appear here."
                        actionLabel="Add Debt"
                        onAction={() => {
                          setEditingDebt(null);
                          setDebtFormData({
                            person_id: '',
                            amount: '',
                            type: 'IOwe',
                            notes: '',
                            place: '',
                            debt_date: new Date().toISOString().split('T')[0],
                            account_id: '',
                          });
                          setSelectedTag(null);
                          setOpenDebtModal(true);
                        }}
                        icon={<TrendingDownIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    ) : (
                      <List>
                        {creditorDebts.map((debt) => (
                          <ListItem
                            key={debt.debt_id}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              backgroundColor: 'background.paper',
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'error.main' }}>
                                    ${formatCurrency(debt.amount)}
                                  </Typography>
                                  {debt.tag_name && (
                                    <Chip label={debt.tag_name} size="small" variant="outlined" />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {people.find(p => p.person_id === debt.person_id)?.name || 'Unknown Person'}
                                  </Typography>
                                  {debt.place && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                      Place: {debt.place}
                                    </Typography>
                                  )}
                                  {debt.notes && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                      {debt.notes}
                                    </Typography>
                                  )}
                                  {debt.debt_date && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {format(parseISO(debt.debt_date), 'MMM dd, yyyy')}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => {
                                    setSettlingDebt(debt);
                                    setOpenSettleModal(true);
                                  }}
                                  sx={{ minWidth: 80, mb: 0.5 }}
                                >
                                  Settle
                                </Button>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Edit Debt">
                                    <IconButton
                                      size="small"
                                      onClick={() => openEditDebtModal(debt)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Debt">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteDebt(debt)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Person Modal */}
          <Dialog open={openPersonModal} onClose={() => {
            setOpenPersonModal(false);
            setEditingPerson(null);
            setPersonFormData({ name: '' });
          }} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingPerson ? 'Edit Friend' : 'Add New Friend'}
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Name"
                value={personFormData.name}
                onChange={(e) => setPersonFormData({ ...personFormData, name: e.target.value })}
                sx={{ mt: 2 }}
                autoFocus
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenPersonModal(false);
                setEditingPerson(null);
                setPersonFormData({ name: '' });
              }}>Cancel</Button>
              <Button variant="contained" onClick={handleAddPerson}>
                {editingPerson ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Debt Modal */}
          <Dialog open={openDebtModal} onClose={() => {
            setOpenDebtModal(false);
            setEditingDebt(null);
            setDebtFormData({
              person_id: '',
              amount: '',
              type: 'OwedToMe',
              notes: '',
              place: '',
              debt_date: new Date().toISOString().split('T')[0],
            });
            setSelectedTag(null);
          }} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingDebt ? 'Edit Debt' : 'Add New Debt'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Person</InputLabel>
                    <Select
                      value={debtFormData.person_id}
                      onChange={(e) => setDebtFormData({ ...debtFormData, person_id: e.target.value })}
                      label="Person"
                    >
                      {people.map((person) => (
                        <MenuItem key={person.person_id} value={person.person_id}>
                          {person.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={debtFormData.amount}
                    onChange={(e) => setDebtFormData({ ...debtFormData, amount: e.target.value })}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={debtFormData.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'OwedToMe' | 'IOwe';
                        setDebtFormData({ ...debtFormData, type: newType, account_id: newType === 'OwedToMe' ? debtFormData.account_id : '' });
                        // Clear tag when switching types
                        if (newType === 'OwedToMe') {
                          setSelectedTag(null);
                        }
                      }}
                      label="Type"
                    >
                      <MenuItem value="OwedToMe">Owed to Me</MenuItem>
                      <MenuItem value="IOwe">I Owe</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {debtFormData.type === 'OwedToMe' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Account</InputLabel>
                      <Select
                        value={debtFormData.account_id}
                        onChange={(e) => setDebtFormData({ ...debtFormData, account_id: e.target.value })}
                        label="Account"
                      >
                        <MenuItem value="">Select Account</MenuItem>
                        {accounts.map((account) => (
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
                {debtFormData.type === 'IOwe' && (
                  <>
                    <Grid item xs={12}>
                      <TagSelector
                        userId={user.id}
                        tagType="Expense"
                        selectedTagId={selectedTag?.tag_id}
                        selectedTagName={selectedTag?.name}
                        onTagSelect={setSelectedTag}
                        label="Category"
                        placeholder="Select or create a category"
                        required
                        size="medium"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Place"
                        value={debtFormData.place}
                        onChange={(e) => setDebtFormData({ ...debtFormData, place: e.target.value })}
                        required
                        placeholder="Where is this debt from?"
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={debtFormData.notes}
                    onChange={(e) => setDebtFormData({ ...debtFormData, notes: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={debtFormData.debt_date}
                    onChange={(e) => setDebtFormData({ ...debtFormData, debt_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenDebtModal(false);
                setEditingDebt(null);
                setDebtFormData({
                  person_id: '',
                  amount: '',
                  type: 'OwedToMe',
                  notes: '',
                  place: '',
                  debt_date: new Date().toISOString().split('T')[0],
                  account_id: '',
                });
                setSelectedTag(null);
              }}>Cancel</Button>
              <Button variant="contained" onClick={handleAddDebt}>
                {editingDebt ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Settlement Modal */}
          <Dialog open={openSettleModal} onClose={() => {
            setOpenSettleModal(false);
            setSettlingDebt(null);
            setSettlementData({ account_id: '' });
          }} maxWidth="sm" fullWidth>
            <DialogTitle>Settle Debt</DialogTitle>
            <DialogContent>
              {settlingDebt && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Settling ${formatCurrency(settlingDebt.amount)} with {people.find(p => p.person_id === settlingDebt.person_id)?.name || 'Unknown'}
                  </Typography>
                </Box>
              )}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={settlementData.account_id}
                      onChange={(e) => setSettlementData({ ...settlementData, account_id: e.target.value })}
                      label="Payment Method"
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          {account.account_name} (${formatCurrency(account.balance)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenSettleModal(false);
                setSettlingDebt(null);
                setSettlementData({ account_id: '' });
              }}>Cancel</Button>
              <Button variant="contained" onClick={handleSettleDebt}>
                Settle
              </Button>
            </DialogActions>
          </Dialog>

          {/* Settle All Modal */}
          <Dialog open={openSettleAllModal} onClose={() => {
            setOpenSettleAllModal(false);
            setSettlingPerson(null);
            setSettlementData({ account_id: '' });
          }} maxWidth="sm" fullWidth>
            <DialogTitle>Settle All Debts</DialogTitle>
            <DialogContent>
              {settlingPerson && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Settling all debts with {settlingPerson.name}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Owed to you: ${formatCurrency(getPersonTotal(settlingPerson.person_id, 'OwedToMe'))}
                    </Typography>
                    <Typography variant="body2">
                      You owe: ${formatCurrency(getPersonTotal(settlingPerson.person_id, 'IOwe'))}
                    </Typography>
                  </Box>
                </Box>
              )}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={settlementData.account_id}
                      onChange={(e) => setSettlementData({ ...settlementData, account_id: e.target.value })}
                      label="Payment Method"
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          {account.account_name} (${formatCurrency(account.balance)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenSettleAllModal(false);
                setSettlingPerson(null);
                setSettlementData({ account_id: '' });
              }}>Cancel</Button>
              <Button variant="contained" onClick={handleSettleAllForPerson}>
                Settle All
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notifications */}
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
        </Container>
      </Layout>
    </ProtectedRoute>
  );
}