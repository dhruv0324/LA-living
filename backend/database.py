import os
from typing import AsyncGenerator, Optional, Dict, List, Any
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from supabase import create_client, Client
import asyncio
from functools import wraps

# Load environment variables from .env file
load_dotenv()

# Supabase connection detailsSUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mzclzcgzfpbghlbuiolk.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_ANON_KEY environment variable is required")

class Database:
    def __init__(self):
        self.client: Optional[Client] = None
    
    def connect(self):
        """Create Supabase client connection"""
        if not self.client:
            self.client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        return self.client
    
    def get_client(self) -> Client:
        """Get the Supabase client, creating it if necessary"""
        if not self.client:
            self.client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        return self.client

# Global database instance
database = Database()

def get_db() -> Client:
    """Dependency to get Supabase client"""
    return database.get_client()

# Utility functions to make async operations easier with Supabase
def async_supabase_operation(func):
    """Decorator to handle async operations with Supabase"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, func, *args, **kwargs)
    return wrapper

class SupabaseRepository:
    """Base repository class for Supabase operations"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.client = get_db()
    
    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record"""
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                None, 
                lambda: self.client.table(self.table_name).insert(data).execute()
            )
            if result.data:
                return result.data[0]
            else:
                print(f"Supabase insert failed for {self.table_name}: {result}")
                raise Exception(f"Failed to create record in {self.table_name}: No data returned")
        except Exception as e:
            print(f"Exception in create for {self.table_name}: {str(e)}")
            print(f"Data being inserted: {data}")
            raise Exception(f"Failed to create record in {self.table_name}: {str(e)}")
    
    async def get_by_id(self, record_id: str, id_column: str = "id") -> Optional[Dict[str, Any]]:
        """Get a record by ID"""
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self.client.table(self.table_name).select("*").eq(id_column, record_id).execute()
        )
        if result.data:
            return result.data[0]
        return None
    
    async def get_all(self, filters: Optional[Dict[str, Any]] = None, 
                     limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all records with optional filters"""
        loop = asyncio.get_event_loop()
        
        def execute_query():
            query = self.client.table(self.table_name).select("*")
            
            if filters:
                for key, value in filters.items():
                    if value is not None:
                        query = query.eq(key, value)
            
            query = query.range(offset, offset + limit - 1)
            return query.execute()
        
        result = await loop.run_in_executor(None, execute_query)
        return result.data or []
    
    async def get_filtered(self, filters: Dict[str, Any], limit: int = 100) -> List[Dict[str, Any]]:
        """Get records with multiple filters efficiently"""
        return await self.get_all(filters=filters, limit=limit)
    
    async def update(self, record_id: str, data: Dict[str, Any], 
                    id_column: str = "id") -> Dict[str, Any]:
        """Update a record"""
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self.client.table(self.table_name).update(data).eq(id_column, record_id).execute()
        )
        if result.data:
            return result.data[0]
        raise Exception(f"Failed to update record in {self.table_name}")
    
    async def delete(self, record_id: str, id_column: str = "id") -> bool:
        """Delete a record"""
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self.client.table(self.table_name).delete().eq(id_column, record_id).execute()
        )
        return len(result.data) > 0

    async def execute_rpc(self, function_name: str, params: Dict[str, Any] = None) -> Any:
        """Execute a Supabase RPC function"""
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self.client.rpc(function_name, params or {}).execute()
        )
        return result.data

# Repository instances for each table
users_repo = SupabaseRepository("users")
accounts_repo = SupabaseRepository("accounts") 
expenses_repo = SupabaseRepository("expenses")
budgets_repo = SupabaseRepository("budgets")
loans_repo = SupabaseRepository("loans")
loan_disbursements_repo = SupabaseRepository("loan_disbursements")
income_repo = SupabaseRepository("income")
debts_repo = SupabaseRepository("debts")

# Helper functions for account balance management
async def adjust_account_balance(account_id: str, amount: float, operation: str = "subtract"):
    """Adjust account balance by adding or subtracting amount"""
    if not account_id:
        return
    
    account = await accounts_repo.get_by_id(account_id, "account_id")
    if not account:
        return
    
    current_balance = float(account["balance"])
    
    if operation == "add":
        new_balance = current_balance + amount
    else:  # subtract
        new_balance = current_balance - amount
    
    await accounts_repo.update(
        account_id,
        {"balance": new_balance},
        "account_id"
    )

async def handle_expense_balance_changes(old_expense: dict, new_expense_data: dict):
    """Handle account balance adjustments when expense is updated"""
    old_account_id = old_expense.get("account_id")
    new_account_id = new_expense_data.get("account_id")
    old_amount = float(old_expense.get("amount", 0))
    new_amount = float(new_expense_data.get("amount", 0))
    
    # Case 1: Only amount changed (same payment method)
    if old_account_id == new_account_id and old_account_id:
        amount_difference = new_amount - old_amount
        if amount_difference != 0:
            # If new amount is higher, subtract the difference
            # If new amount is lower, add the difference back
            operation = "subtract" if amount_difference > 0 else "add"
            await adjust_account_balance(old_account_id, abs(amount_difference), operation)
    
    # Case 2: Only payment method changed (same amount) OR Case 3: Both changed
    elif old_account_id != new_account_id:
        # Refund the old account
        if old_account_id:
            await adjust_account_balance(old_account_id, old_amount, "add")
        
        # Charge the new account
        if new_account_id:
            await adjust_account_balance(new_account_id, new_amount, "subtract")

# Helper functions for income balance management
async def handle_income_balance_changes(old_income: dict, new_income_data: dict):
    """Handle account balance adjustments when income is updated"""
    old_account_id = old_income.get("account_id")
    new_account_id = new_income_data.get("account_id")
    old_amount = float(old_income.get("amount", 0))
    new_amount = float(new_income_data.get("amount", 0))
    
    # Case 1: Only amount changed (same account)
    if old_account_id == new_account_id and old_account_id:
        amount_difference = new_amount - old_amount
        if amount_difference != 0:
            # If new amount is higher, add the difference
            # If new amount is lower, subtract the difference
            operation = "add" if amount_difference > 0 else "subtract"
            await adjust_account_balance(old_account_id, abs(amount_difference), operation)
    
    # Case 2: Only account changed (same amount) OR Case 3: Both changed
    elif old_account_id != new_account_id:
        # Remove from old account
        if old_account_id:
            await adjust_account_balance(old_account_id, old_amount, "subtract")
        
        # Add to new account
        if new_account_id:
            await adjust_account_balance(new_account_id, new_amount, "add") 