from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from supabase import Client

from database import get_db, budgets_repo
from models import Budget, BudgetCreate

router = APIRouter()

@router.post("/", response_model=Budget)
async def create_budget(
    budget: BudgetCreate,
    db: Client = Depends(get_db)
):
    """Create a new budget for a month/year"""
    try:
        budget_data = {
            "user_id": str(budget.user_id),
            "month": budget.month,
            "year": budget.year,
            "amount": float(budget.amount)
        }
        result = await budgets_repo.create(budget_data)
        return Budget(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[Budget])
async def get_budgets(
    user_id: UUID,
    year: Optional[int] = Query(None, ge=2020),
    db: Client = Depends(get_db)
):
    """Get budgets for a user"""
    try:
        results = await budgets_repo.get_all()
        # Filter by user_id and optionally by year
        user_budgets = [budget for budget in results if budget.get("user_id") == str(user_id)]
        if year:
            user_budgets = [budget for budget in user_budgets if budget.get("year") == year]
        
        # Sort by year desc, month desc
        user_budgets.sort(key=lambda x: (x.get("year", 0), x.get("month", 0)), reverse=True)
        return [Budget(**budget) for budget in user_budgets]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{budget_id}", response_model=Budget)
async def get_budget(
    budget_id: UUID,
    db: Client = Depends(get_db)
):
    """Get a specific budget"""
    try:
        result = await budgets_repo.get_by_id(str(budget_id), "budget_id")
        if not result:
            raise HTTPException(status_code=404, detail="Budget not found")
        return Budget(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/{user_id}/month", response_model=Budget)
async def get_budget_for_month(
    user_id: UUID,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: Client = Depends(get_db)
):
    """Get budget for a specific month/year"""
    try:
        results = await budgets_repo.get_all()
        # Filter by user_id, month, and year
        budget = next((b for b in results if b.get("user_id") == str(user_id) and b.get("month") == month and b.get("year") == year), None)
        
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found for this month/year")
        
        return Budget(**budget)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{budget_id}", response_model=Budget)
async def update_budget(
    budget_id: UUID,
    budget_update: BudgetCreate,
    db: Client = Depends(get_db)
):
    """Update a budget"""
    try:
        update_data = {
            "month": budget_update.month,
            "year": budget_update.year,
            "amount": float(budget_update.amount)
        }
        result = await budgets_repo.update(str(budget_id), update_data, "budget_id")
        if not result:
            raise HTTPException(status_code=404, detail="Budget not found")
        return Budget(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: UUID,
    db: Client = Depends(get_db)
):
    """Delete a budget"""
    try:
        result = await budgets_repo.delete(str(budget_id), "budget_id")
        if not result:
            raise HTTPException(status_code=404, detail="Budget not found")
        return {"message": "Budget deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 