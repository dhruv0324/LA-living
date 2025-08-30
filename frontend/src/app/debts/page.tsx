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
  Tabs,
  Tab,
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
  Cancel as CancelIcon,
  AccountBalance as AccountIcon,
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

interface SectionMembership {
  person_id: string;
  type: 'owed_to_me' | 'i_owe';
}

export default function DebtsPage() {
  const { user } = useAuth();
  
  // State management
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  // Modal states
  const [openPersonModal, setOpenPersonModal] = useState(false);
  const [openDebtModal, setOpenDebtModal] = useState(false);
  const [openSettleModal, setOpenSettleModal] = useState(false);
  const [openSelectPersonModal, setOpenSelectPersonModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [settlingDebt, setSettlingDebt] = useState<Debt | null>(null);
  const [settlingPerson, setSettlingPerson] = useState<Person | null>(null);
  const [settlingPersonType, setSettlingPersonType] = useState<'OwedToMe' | 'IOwe' | null>(null);
  const [selectingForSection, setSelectingForSection] = useState<'OwedToMe' | 'IOwe' | null>(null);

  // Section membership tracking (persisted in localStorage)
  const [debtorPeople, setDebtorPeople] = useState<string[]>([]);
  const [creditorPeople, setCreditorPeople] = useState<string[]>([]);

  // Search and performance
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllPeople, setShowAllPeople] = useState(false);
  const PEOPLE_DISPLAY_LIMIT = 20;

  // Form data
  const [personFormData, setPersonFormData] = useState({
    name: '',
  });

  const [debtFormData, setDebtFormData] = useState({
    person_id: '',
    amount: '',
    type: 'OwedToMe' as 'OwedToMe' | 'IOwe',
    notes: '',
    category: '',
    place: '',
    debt_date: new Date().toISOString().split('T')[0], // Default to today
  });

  // Tag state (only used for creditors/IOwe debts)
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

  // localStorage functions for section membership
  const loadSectionMemberships = async () => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      const debtors = localStorage.getItem(`debtors_${user?.id}`);
      const creditors = localStorage.getItem(`creditors_${user?.id}`);
      
      if (debtors) {
        setDebtorPeople(JSON.parse(debtors));
      }
      if (creditors) {
        setCreditorPeople(JSON.parse(creditors));
      }
    } catch (error) {
      console.error('Error loading section memberships:', error);
    }
  };

  const saveSectionMemberships = async () => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(`debtors_${user?.id}`, JSON.stringify(debtorPeople));
      localStorage.setItem(`creditors_${user?.id}`, JSON.stringify(creditorPeople));
    } catch (error) {
      console.error('Error saving section memberships:', error);
    }
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
      const response = await debtApi.getAll({ user_id: user.id });
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
            loadSectionMemberships()
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

  // Save section memberships when they change
  useEffect(() => {
    if (sectionsLoaded) {
      saveSectionMemberships();
    }
  }, [debtorPeople, creditorPeople, sectionsLoaded]);

  // Set mounted flag after initial load
  useEffect(() => {
    setMounted(true);
  }, []);

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

            {/* Instructions Card */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', border: '1px solid #2196F3' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  💡 How Debts Work
                </Typography>
                
                {/* Workflow */}
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  📋 Workflow:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  1. Add a person to your contacts first<br />
                  2.Add debts under their name as either creditor or debtor
                </Typography>

                {/* Creditor vs Debtor */}
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  👥 Understanding Roles:
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>•</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <strong>Creditors:</strong> People who are supposed to receive money from you
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>•</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <strong>Debtors:</strong> People who owe you money
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Net Settlement */}
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  💰 Settlement Options:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Settle debts individually or use net settlement for simplicity. All settled records are automatically registered in your income/expenses for easy tracking.
                </Typography>
              </CardContent>
            </Card>

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
                onClick={() => setOpenPersonModal(true)}
                sx={{
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                  },
                }}
              >
                Add Person
              </Button>
              <Button
                variant="outlined"
                startIcon={<MoneyIcon />}
                onClick={() => setOpenDebtModal(true)}
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
          ) : people.length === 0 && debts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                No Debt Data Available
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start by adding your first contact and debt entry to begin tracking money owed to you or money you owe to others.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenPersonModal(true)}
                size="large"
              >
                Add Your First Contact
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* People Section */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        👥 People ({people.length})
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setShowAllPeople(!showAllPeople)}
                        sx={{ minWidth: 'auto' }}
                      >
                        {showAllPeople ? 'Show Less' : 'Show All'}
                      </Button>
                    </Box>

                    {people.length === 0 ? (
                      <EmptyState
                        title="No People Added"
                        description="Start by adding people you owe money to or who owe you money."
                        actionLabel="Add Person"
                        onAction={() => setOpenPersonModal(true)}
                        icon={<PersonIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    ) : (
                      <>
                        {/* Search */}
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

                        {/* People List */}
                        <List>
                          {(showAllPeople ? people : people.slice(0, PEOPLE_DISPLAY_LIMIT))
                            .filter(person => 
                              person.name.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((person) => (
                              <ListItem
                                key={person.person_id}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  mb: 1,
                                  backgroundColor: 'background.paper',
                                }}
                              >
                                <ListItemText
                                  primary={person.name}
                                  secondary={
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                      {debtorPeople.includes(person.person_id) && (
                                        <Chip
                                          label="Owed to Me"
                                          size="small"
                                          color="success"
                                          variant="outlined"
                                        />
                                      )}
                                      {creditorPeople.includes(person.person_id) && (
                                        <Chip
                                          label="I Owe"
                                          size="small"
                                          color="error"
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Edit Person">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setEditingPerson(person);
                                          setOpenPersonModal(true);
                                        }}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Person">
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
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                        </List>

                        {people.length > PEOPLE_DISPLAY_LIMIT && !showAllPeople && (
                          <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Showing {PEOPLE_DISPLAY_LIMIT} of {people.length} people
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Debts Section */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      💸 Debts ({debts.length})
                    </Typography>

                    {debts.length === 0 ? (
                      <EmptyState
                        title="No Debts Recorded"
                        description="Start tracking money owed to you or money you owe to others."
                        actionLabel="Add Debt"
                        onAction={() => setOpenDebtModal(true)}
                        icon={<MoneyIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                      />
                    ) : (
                      <List>
                        {debts.map((debt) => (
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
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    ${formatCurrency(debt.amount)}
                                  </Typography>
                                  <Chip
                                    label={debt.type === 'OwedToMe' ? 'Owed to Me' : 'I Owe'}
                                    size="small"
                                    color={debt.type === 'OwedToMe' ? 'success' : 'error'}
                                    variant="outlined"
                                  />
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
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Settle Debt">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      setSettlingDebt(debt);
                                      setOpenSettleModal(true);
                                    }}
                                  >
                                    <CheckIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit Debt">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingDebt(debt);
                                      setOpenDebtModal(true);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Debt">
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
          <Dialog open={openPersonModal} onClose={() => setOpenPersonModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingPerson ? 'Edit Person' : 'Add New Person'}
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Name"
                value={personFormData.name}
                onChange={(e) => setPersonFormData({ ...personFormData, name: e.target.value })}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenPersonModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => {
                // Handle save
                setOpenPersonModal(false);
              }}>
                {editingPerson ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Debt Modal */}
          <Dialog open={openDebtModal} onClose={() => setOpenDebtModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingDebt ? 'Edit Debt' : 'Add New Debt'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={debtFormData.type}
                      onChange={(e) => setDebtFormData({ ...debtFormData, type: e.target.value as 'OwedToMe' | 'IOwe' })}
                      label="Type"
                    >
                      <MenuItem value="OwedToMe">Owed to Me</MenuItem>
                      <MenuItem value="IOwe">I Owe</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
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
              <Button onClick={() => setOpenDebtModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => {
                // Handle save
                setOpenDebtModal(false);
              }}>
                {editingDebt ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Settlement Modal */}
          <Dialog open={openSettleModal} onClose={() => setOpenSettleModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Settle Debt</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
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
              <Button onClick={() => setOpenSettleModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => {
                // Handle settlement
                setOpenSettleModal(false);
              }}>
                Settle
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
