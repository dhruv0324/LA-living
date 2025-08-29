import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types

export interface Account {
  account_id: string;
  user_id: string;
  account_name: string;
  balance: number;
  created_at: string;
}

export interface Tag {
  tag_id: string;
  user_id: string;
  name: string;
  type: 'Expense' | 'Income' | 'InternalLoan' | 'ExternalLoan';
  created_at: string;
}

export interface Expense {
  expense_id: string;
  user_id: string;
  account_id?: string;
  amount: number;
  place?: string;
  payment_method?: string;
  notes?: string;
  expense_date?: string;
  tag_id?: string;
  created_at: string;
  account_name?: string;
  tag_name?: string;
}

export interface Budget {
  budget_id: string;
  user_id: string;
  month: number;
  year: number;
  amount: number;
  created_at: string;
}

export interface BudgetSummary {
  budget?: Budget;
  total_expenses: number;
  remaining_budget: number;
  month: number;
  year: number;
}

export interface Person {
  person_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Debt {
  debt_id: string;
  person_id: string;
  amount: number;
  type: 'OwedToMe' | 'IOwe';
  notes?: string;
  is_settled: boolean;
  debt_date?: string;
  place?: string;
  tag_id?: string;
  created_at: string;
  person_name?: string; // Added by backend when fetching with person info
  tag_name?: string;
}

export interface Loan {
  loan_id: string;
  user_id: string;
  total_amount: number;
  taken_amount: number;
  remaining_amount: number;
  loan_name?: string;
  created_at: string;
}

export interface LoanDisbursement {
  disbursement_id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  notes?: string;
  disbursement_date?: string;
  tag_id?: string;
  created_at: string;
  tag_name?: string;
}

export interface Income {
  income_id: string;
  user_id: string;
  account_id?: string;
  amount: number;
  notes?: string;
  income_date?: string;
  tag_id?: string;
  created_at: string;
  account_name?: string;
  tag_name?: string;
}

// API Functions

export const accountApi = {
  create: (data: { user_id: string; account_name: string; balance: number }) =>
    api.post('/api/accounts/', data),
  getAll: (userId: string) => api.get(`/api/accounts/?user_id=${userId}`),
  getById: (accountId: string) => api.get(`/api/accounts/${accountId}`),
  update: (accountId: string, data: { account_name: string; balance: number }) =>
    api.put(`/api/accounts/${accountId}`, data),
  delete: (accountId: string) => api.delete(`/api/accounts/${accountId}`),
  getTotalBalance: (userId: string) => api.get(`/api/accounts/user/${userId}/total-balance`),
};

export const expenseApi = {
  create: (data: Omit<Expense, 'expense_id' | 'created_at' | 'account_name'>) =>
    api.post('/api/expenses/', data),
  getAll: (params: {
    user_id: string;
    skip?: number;
    limit?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get('/api/expenses/', { params }),
  getById: (expenseId: string) => api.get(`/api/expenses/${expenseId}`),
  update: (expenseId: string, data: Omit<Expense, 'expense_id' | 'created_at' | 'account_name'>) =>
    api.put(`/api/expenses/${expenseId}`, data),
  delete: (expenseId: string) => api.delete(`/api/expenses/${expenseId}`),
  getBudgetSummary: (userId: string, month: number, year: number) =>
    api.get(`/api/expenses/budget-summary?user_id=${userId}&month=${month}&year=${year}`),
};

export const budgetApi = {
  create: (data: { user_id: string; month: number; year: number; amount: number }) =>
    api.post('/api/budgets/', data),
  getAll: (userId: string, year?: number) =>
    api.get(`/api/budgets/?user_id=${userId}${year ? `&year=${year}` : ''}`),
  getById: (budgetId: string) => api.get(`/api/budgets/${budgetId}`),
  getForMonth: (userId: string, month: number, year: number) =>
    api.get(`/api/budgets/user/${userId}/month?month=${month}&year=${year}`),
  update: (budgetId: string, data: { user_id: string; month: number; year: number; amount: number }) =>
    api.put(`/api/budgets/${budgetId}`, data),
  delete: (budgetId: string) => api.delete(`/api/budgets/${budgetId}`),
};

export const peopleApi = {
  create: (data: { user_id: string; name: string }) =>
    api.post('/api/people/', data),
  getAll: (userId: string) => api.get(`/api/people/?user_id=${userId}`),
  getById: (personId: string) => api.get(`/api/people/${personId}`),
  update: (personId: string, data: { user_id: string; name: string }) =>
    api.put(`/api/people/${personId}`, data),
  delete: (personId: string) => api.delete(`/api/people/${personId}`),
};

export const debtApi = {
  create: (data: Omit<Debt, 'debt_id' | 'created_at' | 'person_name'>) =>
    api.post('/api/debts/', data),
  getAll: (params: { user_id: string; type?: string; is_settled?: boolean }) =>
    api.get('/api/debts/', { params }),
  getById: (debtId: string) => api.get(`/api/debts/${debtId}`),
  settle: (debtId: string, accountId: string) => 
    api.post(`/api/debts/${debtId}/settle`, null, { params: { account_id: accountId } }),
  settleByType: (personId: string, accountId: string, debtType: 'OwedToMe' | 'IOwe') => 
    api.post(`/api/debts/settle-by-type/${personId}`, null, { params: { account_id: accountId, debt_type: debtType } }),
  settleNet: (personId: string, accountId: string) => 
    api.post(`/api/debts/settle-net/${personId}`, null, { params: { account_id: accountId } }),
  update: (debtId: string, data: Omit<Debt, 'debt_id' | 'created_at' | 'person_name'>) =>
    api.put(`/api/debts/${debtId}`, data),
  delete: (debtId: string) => api.delete(`/api/debts/${debtId}`),
  getSummary: (userId: string) => api.get(`/api/debts/summary/${userId}`),
};

export const loanApi = {
  create: (data: { user_id: string; total_amount: number; taken_amount?: number; loan_name?: string }) =>
    api.post('/api/loans/', data),
  getAll: (userId: string) => api.get(`/api/loans/?user_id=${userId}`),
  getById: (loanId: string) => api.get(`/api/loans/${loanId}`),
  getSummary: (loanId: string) => api.get(`/api/loans/${loanId}/summary`),
  update: (loanId: string, data: { user_id: string; total_amount: number; taken_amount?: number; loan_name?: string }) =>
    api.put(`/api/loans/${loanId}`, data),
  delete: (loanId: string) => api.delete(`/api/loans/${loanId}`),
};

export const loanDisbursementApi = {
  create: (data: Omit<LoanDisbursement, 'disbursement_id' | 'created_at'> & { account_id?: string }) =>
    api.post(`/api/loans/${data.loan_id}/disbursements`, data, { params: data.account_id ? { account_id: data.account_id } : {} }),
  getAll: (loanId: string) => api.get(`/api/loans/${loanId}/disbursements`),
  getById: (disbursementId: string) => api.get(`/api/loan-disbursements/${disbursementId}`),
  update: (disbursementId: string, data: Omit<LoanDisbursement, 'disbursement_id' | 'created_at'>) =>
    api.put(`/api/loans/disbursements/${disbursementId}`, data),
  delete: (disbursementId: string) => api.delete(`/api/loans/disbursements/${disbursementId}`),
};

export const incomeApi = {
  create: (data: Omit<Income, 'income_id' | 'created_at' | 'account_name'>) =>
    api.post('/api/income/', data),
  getAll: (params: {
    user_id: string;
    skip?: number;
    limit?: number;
    source?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get('/api/income/', { params }),
  getById: (incomeId: string) => api.get(`/api/income/${incomeId}`),
  update: (incomeId: string, data: Omit<Income, 'income_id' | 'created_at' | 'account_name'>) =>
    api.put(`/api/income/${incomeId}`, data),
  delete: (incomeId: string) => api.delete(`/api/income/${incomeId}`),
  getMonthlySummary: (userId: string, year: number, month?: number) =>
    api.get(`/api/income/summary/monthly?user_id=${userId}&year=${year}${month ? `&month=${month}` : ''}`),
};

export const tagApi = {
  create: (data: { user_id: string; name: string; type: 'Expense' | 'Income' | 'InternalLoan' | 'ExternalLoan' }) =>
    api.post('/api/tags/', data),
  getAll: (userId: string, type?: string, search?: string) => {
    let url = `/api/tags/?user_id=${userId}`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${search}`;
    return api.get(url);
  },
  getById: (tagId: string) => api.get(`/api/tags/${tagId}`),
  update: (tagId: string, data: { user_id: string; name: string; type: 'Expense' | 'Income' | 'InternalLoan' | 'ExternalLoan' }) =>
    api.put(`/api/tags/${tagId}`, data),
  delete: (tagId: string) => api.delete(`/api/tags/${tagId}`),
  search: (userId: string, query: string, type?: string, limit?: number) => {
    let url = `/api/tags/search/${userId}?q=${encodeURIComponent(query)}`;
    if (type) url += `&type=${type}`;
    if (limit) url += `&limit=${limit}`;
    return api.get(url);
  },
  getTypes: (userId: string) => api.get(`/api/tags/types/${userId}`),
};

export default api; 