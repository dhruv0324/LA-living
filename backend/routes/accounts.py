from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from uuid import UUID
from supabase import Client

from database import get_db, accounts_repo
from models import Account, AccountCreate, AccountBase

router = APIRouter()

@router.post("/", response_model=Account)
async def create_account(
    account: AccountCreate,
    db: Client = Depends(get_db)
):
    """Create a new account"""
    try:
        account_data = {
            "user_id": str(account.user_id),
            "account_name": account.account_name,
            "balance": float(account.balance)
        }
        result = await accounts_repo.create(account_data)
        return Account(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[Account])
async def get_accounts(
    user_id: UUID,
    db: Client = Depends(get_db)
):
    """Get all accounts for a user"""
    try:
        # Use Supabase filtering
        results = await accounts_repo.get_all()
        # Filter by user_id
        user_accounts = [account for account in results if account.get("user_id") == str(user_id)]
        return [Account(**account) for account in user_accounts]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{account_id}", response_model=Account)
async def get_account(
    account_id: UUID,
    db: Client = Depends(get_db)
):
    """Get a specific account"""
    try:
        result = await accounts_repo.get_by_id(str(account_id), "account_id")
        if not result:
            raise HTTPException(status_code=404, detail="Account not found")
        return Account(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{account_id}", response_model=Account)
async def update_account(
    account_id: UUID,
    account_update: AccountBase,
    db: Client = Depends(get_db)
):
    """Update an account"""
    try:
        update_data = {
            "account_name": account_update.account_name,
            "balance": float(account_update.balance)
        }
        result = await accounts_repo.update(str(account_id), update_data, "account_id")
        if not result:
            raise HTTPException(status_code=404, detail="Account not found")
        return Account(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{account_id}")
async def delete_account(
    account_id: UUID,
    db: Client = Depends(get_db)
):
    """Delete an account"""
    try:
        result = await accounts_repo.delete(str(account_id), "account_id")
        if not result:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/{user_id}/total-balance")
async def get_total_balance(
    user_id: UUID,
    db: Client = Depends(get_db)
):
    """Get total balance across all accounts for a user"""
    try:
        results = await accounts_repo.get_all()
        user_accounts = [account for account in results if account.get("user_id") == str(user_id)]
        total_balance = sum(float(account.get("balance", 0)) for account in user_accounts)
        return {"total_balance": total_balance}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 