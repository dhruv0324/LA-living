from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

from database import expenses_repo, accounts_repo, budgets_repo, get_db, adjust_account_balance, handle_expense_balance_changes, SupabaseRepository
from models import (
    Expense, ExpenseCreate, ExpenseWithAccount, ExpenseWithAccountAndTag,
    BudgetSummary, Budget
)

router = APIRouter()

# Initialize tags repository
tags_repo = SupabaseRepository("tags")

@router.post("/", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    """Create a new expense and update account balance if account_id provided"""
    try:
        # Prepare expense data
        expense_date = expense.expense_date or date.today()
        
        # Handle date conversion properly
        if isinstance(expense_date, str):
            try:
                expense_date = datetime.fromisoformat(expense_date.replace('Z', '')).date()
            except:
                expense_date = date.today()
        
        expense_data = {
            "user_id": str(expense.user_id),
            "account_id": str(expense.account_id) if expense.account_id else None,
            "amount": float(expense.amount),
            "place": expense.place or "",
            "payment_method": expense.payment_method or "",
            "notes": expense.notes or "",
            "expense_date": expense_date.strftime('%Y-%m-%d'),
            "tag_id": str(expense.tag_id) if expense.tag_id else None
        }
        
        # Insert expense
        result = await expenses_repo.create(expense_data)
        
        # Update account balance if account_id provided
        if expense.account_id:
            await adjust_account_balance(
                str(expense.account_id), 
                float(expense.amount), 
                "subtract"
            )
        
        return Expense(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ExpenseWithAccountAndTag])
async def get_expenses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tag_name: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get user's expenses with optional filters"""
    try:
        # Build filters
        filters = {"user_id": str(user_id)}
        
        # Get expenses using improved filtering
        expenses = await expenses_repo.get_filtered(filters, limit=1000)  # Get more than needed
        
        # Filter by tag name if provided
        if tag_name:
            # Get all tags for this user first
            user_tags = await tags_repo.get_filtered({"user_id": str(user_id)}, limit=1000)
            # Find tags that match the search
            matching_tag_ids = [tag["tag_id"] for tag in user_tags if tag_name.lower() in tag.get("name", "").lower()]
            # Filter expenses by matching tag IDs
            expenses = [exp for exp in expenses if exp.get("tag_id") in matching_tag_ids]
        
        # Filter by date if provided
        if start_date or end_date:
            filtered_expenses = []
            for expense in expenses:
                expense_date_str = expense.get("expense_date")
                if expense_date_str:
                    try:
                        expense_date = datetime.fromisoformat(expense_date_str).date()
                        if start_date and expense_date < start_date:
                            continue
                        if end_date and expense_date > end_date:
                            continue
                    except ValueError:
                        continue
                filtered_expenses.append(expense)
            expenses = filtered_expenses
        
        # Get total count
        total_count = len(expenses)
        
        # Apply pagination
        if skip:
            expenses = expenses[skip:]
        if limit:
            expenses = expenses[:limit]
        
        # Add account names and tag names
        result = []
        for expense in expenses:
            expense_data = expense.copy()
            
            # Add account name
            if expense.get("account_id"):
                try:
                    account = await accounts_repo.get_by_id(expense["account_id"], "account_id")
                    expense_data["account_name"] = account["account_name"] if account else None
                except:
                    expense_data["account_name"] = None
            else:
                expense_data["account_name"] = None
            
            # Add tag name
            if expense.get("tag_id"):
                try:
                    tag = await tags_repo.get_by_id(expense["tag_id"], "tag_id")
                    expense_data["tag_name"] = tag["name"] if tag else None
                except:
                    expense_data["tag_name"] = None
            else:
                expense_data["tag_name"] = None
            
            result.append(ExpenseWithAccountAndTag(**expense_data))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/budget-summary", response_model=BudgetSummary)
async def get_budget_summary(
    user_id: UUID,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
):
    """Get budget summary for a specific month/year"""
    try:
        # Get budget for the specific month/year using proper filtering
        budget_filters = {
            "user_id": str(user_id),
            "month": month,
            "year": year
        }
        budgets = await budgets_repo.get_filtered(budget_filters, limit=1)
        
        budget_obj = None
        budget_amount = Decimal('0')
        
        if budgets:
            budget_obj = Budget(**budgets[0])
            budget_amount = Decimal(str(budgets[0]["amount"]))
        
        # Calculate total expenses for the month
        # Get expenses for the user (we'll filter by date in memory since date filtering is complex)
        expense_filters = {"user_id": str(user_id)}
        user_expenses = await expenses_repo.get_filtered(expense_filters, limit=1000)
        
        total_expenses = Decimal('0')
        for expense in user_expenses:
            if expense.get("expense_date"):
                expense_date = datetime.fromisoformat(expense["expense_date"]).date()
                if expense_date.month == month and expense_date.year == year:
                    total_expenses += Decimal(str(expense["amount"]))
        
        remaining_budget = budget_amount - total_expenses
        
        return BudgetSummary(
            budget=budget_obj,
            total_expenses=total_expenses,
            remaining_budget=remaining_budget,
            month=month,
            year=year
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{expense_id}", response_model=ExpenseWithAccountAndTag)
async def get_expense(expense_id: UUID):
    """Get a specific expense"""
    try:
        expense = await expenses_repo.get_by_id(str(expense_id), "expense_id")
        
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Add account name and tag name
        expense_data = expense.copy()
        
        # Add account name if account_id exists
        if expense.get("account_id"):
            account = await accounts_repo.get_by_id(expense["account_id"], "account_id")
            expense_data["account_name"] = account["account_name"] if account else None
        else:
            expense_data["account_name"] = None
        
        # Add tag name if tag_id exists
        if expense.get("tag_id"):
            tag = await tags_repo.get_by_id(expense["tag_id"], "tag_id")
            expense_data["tag_name"] = tag["name"] if tag else None
        else:
            expense_data["tag_name"] = None
        
        return ExpenseWithAccountAndTag(**expense_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: UUID,
    expense_update: ExpenseCreate,
):
    """Update an expense and handle account balance adjustments"""
    try:
        # Get the current expense data before updating
        old_expense = await expenses_repo.get_by_id(str(expense_id), "expense_id")
        
        if not old_expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Prepare new expense data
        update_data = {
            "amount": float(expense_update.amount),
            "place": expense_update.place,
            "payment_method": expense_update.payment_method,
            "notes": expense_update.notes,
            "expense_date": (expense_update.expense_date or date.today()).isoformat(),
            "account_id": str(expense_update.account_id) if expense_update.account_id else None,
            "tag_id": str(expense_update.tag_id) if expense_update.tag_id else None
        }
        
        # Handle balance adjustments for the three scenarios
        await handle_expense_balance_changes(old_expense, update_data)
        
        # Update the expense
        result = await expenses_repo.update(str(expense_id), update_data, "expense_id")
        
        if not result:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        return Expense(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{expense_id}")
async def delete_expense(expense_id: UUID):
    """Delete an expense and refund the amount to the original payment method"""
    try:
        # Get the expense before deleting to refund the account
        expense = await expenses_repo.get_by_id(str(expense_id), "expense_id")
        
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Refund the amount to the original payment method
        if expense.get("account_id"):
            await adjust_account_balance(
                expense["account_id"], 
                float(expense["amount"]), 
                "add"
            )
        
        # Delete the expense
        success = await expenses_repo.delete(str(expense_id), "expense_id")
        
        if not success:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        return {"message": "Expense deleted successfully and amount refunded"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 