from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

# User Models
class UserBase(BaseModel):
    name: str
    username: str
    email: str

class UserCreate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Account Models
class AccountBase(BaseModel):
    account_name: str
    balance: Decimal

class AccountCreate(AccountBase):
    user_id: UUID

class Account(AccountBase):
    account_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Expense Models
class ExpenseBase(BaseModel):
    amount: Decimal
    place: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    expense_date: Optional[date] = None
    tag_id: Optional[UUID] = None

class ExpenseCreate(ExpenseBase):
    user_id: UUID
    account_id: Optional[UUID] = None

class Expense(ExpenseBase):
    expense_id: UUID
    user_id: UUID
    account_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Budget Models
class BudgetBase(BaseModel):
    month: int
    year: int
    amount: Decimal

class BudgetCreate(BudgetBase):
    user_id: UUID

class Budget(BudgetBase):
    budget_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Loan Models
class LoanBase(BaseModel):
    total_amount: Decimal
    taken_amount: Optional[Decimal] = Decimal('0')
    loan_name: Optional[str] = None

class LoanCreate(LoanBase):
    user_id: UUID

class Loan(LoanBase):
    loan_id: UUID
    user_id: UUID
    remaining_amount: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

# Loan Disbursement Models
class LoanDisbursementBase(BaseModel):
    amount: Decimal
    notes: Optional[str] = None
    disbursement_date: Optional[date] = None
    tag_id: Optional[UUID] = None

class LoanDisbursementCreate(LoanDisbursementBase):
    loan_id: UUID
    user_id: UUID

class LoanDisbursement(LoanDisbursementBase):
    disbursement_id: UUID
    loan_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Income Models
class IncomeBase(BaseModel):
    amount: Decimal
    notes: Optional[str] = None
    income_date: Optional[date] = None
    tag_id: Optional[UUID] = None

class IncomeCreate(IncomeBase):
    user_id: UUID
    account_id: UUID

class Income(IncomeBase):
    income_id: UUID
    user_id: UUID
    account_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# People Models
class PersonBase(BaseModel):
    name: str

class PersonCreate(PersonBase):
    user_id: UUID

class Person(PersonBase):
    person_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Debt Models
class DebtBase(BaseModel):
    person_id: UUID
    amount: Decimal
    type: Literal['OwedToMe', 'IOwe']
    notes: Optional[str] = None
    is_settled: bool = False
    debt_date: Optional[date] = None
    place: Optional[str] = None
    tag_id: Optional[UUID] = None

class DebtCreate(DebtBase):
    pass

class Debt(DebtBase):
    debt_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Response Models with additional data
class ExpenseWithAccount(Expense):
    account_name: Optional[str] = None

class ExpenseWithAccountAndTag(ExpenseWithAccount):
    tag_name: Optional[str] = None

class IncomeWithAccount(Income):
    account_name: Optional[str] = None

class IncomeWithAccountAndTag(IncomeWithAccount):
    tag_name: Optional[str] = None

class DebtWithTag(Debt):
    tag_name: Optional[str] = None

class LoanDisbursementWithTag(LoanDisbursement):
    tag_name: Optional[str] = None

class BudgetSummary(BaseModel):
    budget: Optional[Budget] = None
    total_expenses: Decimal
    remaining_budget: Decimal
    month: int
    year: int

class LoanSummary(BaseModel):
    loan: Optional[Loan] = None
    disbursements: list[LoanDisbursement]
    total_disbursed: Decimal

# Tag Models
class TagBase(BaseModel):
    name: str
    type: Literal["Expense", "Income", "InternalLoan", "ExternalLoan"]

class TagCreate(TagBase):
    user_id: UUID

class Tag(TagBase):
    tag_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True 