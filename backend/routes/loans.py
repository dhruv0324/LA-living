from fastapi import APIRouter, HTTPException
from typing import List
from uuid import UUID
from decimal import Decimal
from datetime import date

from database import SupabaseRepository, adjust_account_balance
from models import Loan, LoanCreate, LoanSummary, LoanDisbursement, LoanDisbursementCreate

router = APIRouter()
loans_repo = SupabaseRepository("loans")
disbursements_repo = SupabaseRepository("loan_disbursements")

@router.post("/", response_model=Loan)
async def create_loan(loan: LoanCreate):
    """Create a new loan"""
    try:
        loan_data = {
            "user_id": str(loan.user_id),
            "total_amount": float(loan.total_amount),
            "taken_amount": float(loan.taken_amount or Decimal('0')),
            "loan_name": loan.loan_name or "",
        }
        
        result = await loans_repo.create(loan_data)
        return Loan(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[Loan])
async def get_loans(user_id: UUID):
    """Get all loans for a user"""
    try:
        filters = {"user_id": str(user_id)}
        results = await loans_repo.get_filtered(filters, 100)
        
        # Sort by created_at descending
        results.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return [Loan(**result) for result in results]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{loan_id}", response_model=Loan)
async def get_loan(loan_id: UUID):
    """Get a specific loan"""
    try:
        result = await loans_repo.get_by_id(str(loan_id), "loan_id")
        if not result:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        return Loan(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{loan_id}/summary", response_model=LoanSummary)
async def get_loan_summary(loan_id: UUID):
    """Get loan summary with disbursements"""
    try:
        # Get loan details
        loan_result = await loans_repo.get_by_id(str(loan_id), "loan_id")
        if not loan_result:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Get disbursements
        disbursement_filters = {"loan_id": str(loan_id)}
        disbursements_results = await disbursements_repo.get_filtered(disbursement_filters, 1000)
        
        # Sort by disbursement_date descending
        disbursements_results.sort(key=lambda x: x.get('disbursement_date', ''), reverse=True)
        
        # Calculate total disbursed (including taken amount)
        disbursement_total = sum(float(d.get('amount', 0)) for d in disbursements_results)
        taken_amount = float(loan_result.get('taken_amount', 0))
        total_disbursed = disbursement_total + taken_amount
        
        loan = Loan(**loan_result)
        disbursements = [LoanDisbursement(**result) for result in disbursements_results]
        
        return LoanSummary(
            loan=loan,
            disbursements=disbursements,
            total_disbursed=Decimal(str(total_disbursed))
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{loan_id}", response_model=Loan)
async def update_loan(loan_id: UUID, loan_update: LoanCreate):
    """Update a loan"""
    try:
        update_data = {
            "total_amount": float(loan_update.total_amount),
            "taken_amount": float(loan_update.taken_amount or Decimal('0')),
            "loan_name": loan_update.loan_name or "",
        }
        
        result = await loans_repo.update(str(loan_id), update_data, "loan_id")
        return Loan(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{loan_id}")
async def delete_loan(loan_id: UUID):
    """Delete a loan"""
    try:
        success = await loans_repo.delete(str(loan_id), "loan_id")
        if not success:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        return {"message": "Loan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Disbursement Routes
@router.post("/{loan_id}/disbursements", response_model=LoanDisbursement)
async def create_disbursement(loan_id: UUID, disbursement: LoanDisbursementCreate, account_id: str = None):
    """Create a new loan disbursement"""
    try:
        # Validate loan exists
        loan = await loans_repo.get_by_id(str(loan_id), "loan_id")
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Check if disbursement would exceed loan limit
        current_disbursements = await disbursements_repo.get_filtered({"loan_id": str(loan_id)}, 1000)
        disbursement_total = sum(float(d.get('amount', 0)) for d in current_disbursements)
        taken_amount = float(loan.get('taken_amount', 0))
        total_disbursed = disbursement_total + taken_amount
        new_total = total_disbursed + float(disbursement.amount)
        
        if new_total > float(loan['total_amount']):
            remaining = float(loan['total_amount']) - total_disbursed
            raise HTTPException(
                status_code=400, 
                detail=f"Disbursement amount exceeds remaining loan limit. Remaining: ${remaining:.2f}"
            )
        
        disbursement_date = disbursement.disbursement_date or date.today()
        
        disbursement_data = {
            "loan_id": str(loan_id),
            "user_id": str(disbursement.user_id),
            "amount": float(disbursement.amount),
            "category": disbursement.category or "",
            "notes": disbursement.notes or "",
            "disbursement_date": disbursement_date.strftime('%Y-%m-%d'),
        }
        
        result = await disbursements_repo.create(disbursement_data)
        
        # Update account balance for personal disbursements
        if account_id and disbursement.category in ['Personal', 'Other']:
            await adjust_account_balance(account_id, float(disbursement.amount), "add")
        
        return LoanDisbursement(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{loan_id}/disbursements", response_model=List[LoanDisbursement])
async def get_disbursements(loan_id: UUID):
    """Get all disbursements for a loan"""
    try:
        filters = {"loan_id": str(loan_id)}
        results = await disbursements_repo.get_filtered(filters, 1000)
        
        # Sort by disbursement_date descending
        results.sort(key=lambda x: x.get('disbursement_date', ''), reverse=True)
        
        return [LoanDisbursement(**result) for result in results]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/disbursements/{disbursement_id}", response_model=LoanDisbursement)
async def update_disbursement(disbursement_id: UUID, disbursement_update: LoanDisbursementCreate):
    """Update a loan disbursement with balance adjustments"""
    try:
        # Get the original disbursement
        original_disbursement = await disbursements_repo.get_by_id(str(disbursement_id), "disbursement_id")
        if not original_disbursement:
            raise HTTPException(status_code=404, detail="Disbursement not found")
        
        # Get loan details for validation
        loan = await loans_repo.get_by_id(original_disbursement['loan_id'], "loan_id")
        if not loan:
            raise HTTPException(status_code=404, detail="Associated loan not found")
        
        # Check if the new amount would exceed loan limit
        current_disbursements = await disbursements_repo.get_filtered({"loan_id": original_disbursement['loan_id']}, 1000)
        disbursement_total = sum(float(d.get('amount', 0)) for d in current_disbursements if d['disbursement_id'] != str(disbursement_id))
        taken_amount = float(loan.get('taken_amount', 0))
        total_without_this = disbursement_total + taken_amount
        new_total = total_without_this + float(disbursement_update.amount)
        
        if new_total > float(loan['total_amount']):
            remaining = float(loan['total_amount']) - total_without_this
            raise HTTPException(
                status_code=400, 
                detail=f"Updated amount exceeds remaining loan limit. Remaining: ${remaining:.2f}"
            )
        
        # Handle balance adjustments based on category changes
        original_amount = float(original_disbursement.get('amount', 0))
        original_category = original_disbursement.get('category', '')
        new_amount = float(disbursement_update.amount)
        new_category = disbursement_update.category or ''
        
        personal_categories = ['Personal', 'Emergency', 'Investment', 'Other']
        original_was_personal = original_category in personal_categories
        new_is_personal = new_category in personal_categories
        
        # For now, we'll handle the balance adjustments on the frontend
        # since we don't store which account was originally credited
        
        disbursement_date = disbursement_update.disbursement_date or date.today()
        
        update_data = {
            "amount": float(disbursement_update.amount),
            "category": disbursement_update.category or "",
            "notes": disbursement_update.notes or "",
            "disbursement_date": disbursement_date.strftime('%Y-%m-%d'),
        }
        
        result = await disbursements_repo.update(str(disbursement_id), update_data, "disbursement_id")
        return LoanDisbursement(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/disbursements/{disbursement_id}")
async def delete_disbursement(disbursement_id: UUID):
    """Delete a loan disbursement"""
    try:
        # Get disbursement details for potential account refund
        disbursement = await disbursements_repo.get_by_id(str(disbursement_id), "disbursement_id")
        if not disbursement:
            raise HTTPException(status_code=404, detail="Disbursement not found")
        
        # Note: We don't automatically refund accounts on disbursement deletion
        # as we don't track which account was credited
        
        success = await disbursements_repo.delete(str(disbursement_id), "disbursement_id")
        if not success:
            raise HTTPException(status_code=404, detail="Disbursement not found")
        
        return {"message": "Disbursement deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 