from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import date
from uuid import UUID
from decimal import Decimal

from database import SupabaseRepository, adjust_account_balance
from models import LoanDisbursement, LoanDisbursementCreate, LoanDisbursementWithTag

router = APIRouter()

# Initialize repositories
loan_disbursements_repo = SupabaseRepository("loan_disbursements")
loans_repo = SupabaseRepository("loans")
tags_repo = SupabaseRepository("tags")

@router.post("/", response_model=LoanDisbursement)
async def create_loan_disbursement(disbursement: LoanDisbursementCreate):
    """Create a new loan disbursement and update loan taken_amount"""
    try:
        # Prepare disbursement data
        disbursement_date = disbursement.disbursement_date or date.today()
        
        disbursement_data = {
            "loan_id": str(disbursement.loan_id),
            "user_id": str(disbursement.user_id),
            "amount": float(disbursement.amount),
            "notes": disbursement.notes or "",
            "disbursement_date": disbursement_date.strftime('%Y-%m-%d'),
            "tag_id": str(disbursement.tag_id) if disbursement.tag_id else None
        }
        
        # Create disbursement
        result = await loan_disbursements_repo.create(disbursement_data)
        
        # Update loan taken_amount
        loan = await loans_repo.get_by_id(str(disbursement.loan_id), "loan_id")
        if loan:
            new_taken_amount = float(loan.get("taken_amount", 0)) + float(disbursement.amount)
            await loans_repo.update(str(disbursement.loan_id), {"taken_amount": new_taken_amount}, "loan_id")
        
        return LoanDisbursement(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[LoanDisbursementWithTag])
async def get_loan_disbursements(
    user_id: UUID,
    loan_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get loan disbursements for a user"""
    try:
        # Build filters
        filters = {"user_id": str(user_id)}
        if loan_id:
            filters["loan_id"] = str(loan_id)
        
        # Get disbursements
        disbursements = await loan_disbursements_repo.get_filtered(filters, limit=1000)
        
        # Sort by date
        disbursements.sort(key=lambda x: (x.get('disbursement_date', ''), x.get('created_at', '')), reverse=True)
        
        # Apply pagination
        paginated_disbursements = disbursements[skip:skip + limit]
        
        # Enrich with tag names
        result = []
        for disbursement in paginated_disbursements:
            disbursement_data = disbursement.copy()
            
            # Add tag name
            if disbursement.get('tag_id'):
                try:
                    tag = await tags_repo.get_by_id(disbursement['tag_id'], "tag_id")
                    disbursement_data['tag_name'] = tag['name'] if tag else None
                except:
                    disbursement_data['tag_name'] = None
            else:
                disbursement_data['tag_name'] = None
            
            result.append(LoanDisbursementWithTag(**disbursement_data))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{disbursement_id}", response_model=LoanDisbursementWithTag)
async def get_loan_disbursement(disbursement_id: UUID):
    """Get a specific loan disbursement"""
    try:
        disbursement = await loan_disbursements_repo.get_by_id(str(disbursement_id), "disbursement_id")
        
        if not disbursement:
            raise HTTPException(status_code=404, detail="Loan disbursement not found")
        
        # Add tag name
        disbursement_data = disbursement.copy()
        if disbursement.get('tag_id'):
            try:
                tag = await tags_repo.get_by_id(disbursement['tag_id'], "tag_id")
                disbursement_data['tag_name'] = tag['name'] if tag else None
            except:
                disbursement_data['tag_name'] = None
        else:
            disbursement_data['tag_name'] = None
        
        return LoanDisbursementWithTag(**disbursement_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{disbursement_id}", response_model=LoanDisbursement)
async def update_loan_disbursement(
    disbursement_id: UUID,
    disbursement_update: LoanDisbursementCreate
):
    """Update a loan disbursement"""
    try:
        update_data = {
            "amount": float(disbursement_update.amount),
            "notes": disbursement_update.notes or "",
            "disbursement_date": (disbursement_update.disbursement_date or date.today()).strftime('%Y-%m-%d'),
            "tag_id": str(disbursement_update.tag_id) if disbursement_update.tag_id else None
        }
        
        result = await loan_disbursements_repo.update(str(disbursement_id), update_data, "disbursement_id")
        
        if not result:
            raise HTTPException(status_code=404, detail="Loan disbursement not found")
        
        return LoanDisbursement(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{disbursement_id}")
async def delete_loan_disbursement(disbursement_id: UUID):
    """Delete a loan disbursement"""
    try:
        # Get disbursement details before deleting
        disbursement = await loan_disbursements_repo.get_by_id(str(disbursement_id), "disbursement_id")
        
        if not disbursement:
            raise HTTPException(status_code=404, detail="Loan disbursement not found")
        
        # Delete disbursement
        await loan_disbursements_repo.delete(str(disbursement_id), "disbursement_id")
        
        # Update loan taken_amount
        loan = await loans_repo.get_by_id(disbursement['loan_id'], "loan_id")
        if loan:
            new_taken_amount = float(loan.get("taken_amount", 0)) - float(disbursement['amount'])
            await loans_repo.update(disbursement['loan_id'], {"taken_amount": max(0, new_taken_amount)}, "loan_id")
        
        return {"message": "Loan disbursement deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 