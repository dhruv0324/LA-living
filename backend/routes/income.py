from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import date
from uuid import UUID

from database import SupabaseRepository, adjust_account_balance
from models import Income, IncomeCreate, IncomeWithAccount, IncomeWithAccountAndTag

router = APIRouter()
income_repo = SupabaseRepository("income")
tags_repo = SupabaseRepository("tags")

@router.post("/", response_model=Income)
async def create_income(income: IncomeCreate):
    """Create a new income entry and update account balance if account_id provided"""
    try:
        income_date = income.income_date or date.today()
        
        income_data = {
            "user_id": str(income.user_id),
            "account_id": str(income.account_id),
            "amount": float(income.amount),
            "notes": income.notes or "",
            "income_date": income_date.strftime('%Y-%m-%d'),
            "tag_id": str(income.tag_id) if income.tag_id else None,
        }
        
        result = await income_repo.create(income_data)
        
        # Update account balance
        await adjust_account_balance(str(income.account_id), float(income.amount), "add")
        
        return Income(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[IncomeWithAccountAndTag])
async def get_income(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tag_name: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get user's income with optional filters"""
    try:
        filters = {"user_id": str(user_id)}
        
        # Get income records (get all for proper filtering and counting)
        income_records = await income_repo.get_filtered(filters, 10000)  # High limit to get all
        
        # Apply additional filters in Python
        filtered_records = income_records
        
        # Filter by tag name if provided
        if tag_name:
            # Get all tags for this user first
            user_tags = await tags_repo.get_filtered({"user_id": str(user_id)}, limit=1000)
            # Find tags that match the search
            matching_tag_ids = [tag["tag_id"] for tag in user_tags if tag_name.lower() in tag.get("name", "").lower()]
            # Filter income by matching tag IDs
            filtered_records = [r for r in filtered_records if r.get("tag_id") in matching_tag_ids]
        
        if start_date:
            filtered_records = [r for r in filtered_records if r.get('income_date') and r['income_date'] >= start_date.strftime('%Y-%m-%d')]
        
        if end_date:
            filtered_records = [r for r in filtered_records if r.get('income_date') and r['income_date'] <= end_date.strftime('%Y-%m-%d')]
        
        # Sort by income_date descending
        filtered_records.sort(key=lambda x: x.get('income_date', ''), reverse=True)
        
        # Get total count before pagination
        total_count = len(filtered_records)
        
        # Apply skip and limit
        paginated_records = filtered_records[skip:skip + limit]
        
        # Enrich with account names and tag names
        from database import accounts_repo
        result = []
        for record in paginated_records:
            income_data = dict(record)
            
            # Add account name
            if income_data.get('account_id'):
                account = await accounts_repo.get_by_id(income_data['account_id'], "account_id")
                income_data['account_name'] = account.get('account_name') if account else None
            else:
                income_data['account_name'] = None
            
            # Add tag name
            if income_data.get('tag_id'):
                try:
                    tag = await tags_repo.get_by_id(income_data['tag_id'], "tag_id")
                    income_data['tag_name'] = tag['name'] if tag else None
                except:
                    income_data['tag_name'] = None
            else:
                income_data['tag_name'] = None
            
            result.append(IncomeWithAccountAndTag(**income_data))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{income_id}", response_model=IncomeWithAccountAndTag)
async def get_income_entry(income_id: UUID):
    """Get a specific income entry"""
    try:
        income_data = await income_repo.get_by_id(str(income_id), "income_id")
        if not income_data:
            raise HTTPException(status_code=404, detail="Income entry not found")
        
        # Enrich with account name and tag name
        if income_data.get('account_id'):
            from database import accounts_repo
            account = await accounts_repo.get_by_id(income_data['account_id'], "account_id")
            income_data['account_name'] = account.get('account_name') if account else None
        else:
            income_data['account_name'] = None
        
        # Add tag name
        if income_data.get('tag_id'):
            try:
                tag = await tags_repo.get_by_id(income_data['tag_id'], "tag_id")
                income_data['tag_name'] = tag['name'] if tag else None
            except:
                income_data['tag_name'] = None
        else:
            income_data['tag_name'] = None
        
        return IncomeWithAccountAndTag(**income_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{income_id}", response_model=Income)
async def update_income(income_id: UUID, income_update: IncomeCreate):
    """Update an income entry and handle account balance changes"""
    try:
        # Get the existing income entry
        old_income = await income_repo.get_by_id(str(income_id), "income_id")
        if not old_income:
            raise HTTPException(status_code=404, detail="Income entry not found")
        
        income_date = income_update.income_date or date.today()
        
        # Prepare update data
        update_data = {
            "amount": float(income_update.amount),
            "notes": income_update.notes or "",
            "income_date": income_date.strftime('%Y-%m-%d'),
            "account_id": str(income_update.account_id),
            "tag_id": str(income_update.tag_id) if income_update.tag_id else None,
        }
        
        # Handle balance changes
        from database import handle_income_balance_changes
        await handle_income_balance_changes(old_income, update_data)
        
        # Update the income entry
        result = await income_repo.update(str(income_id), update_data, "income_id")
        
        return Income(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{income_id}")
async def delete_income(income_id: UUID):
    """Delete an income entry and refund account balance"""
    try:
        # Get the existing income entry
        income_data = await income_repo.get_by_id(str(income_id), "income_id")
        if not income_data:
            raise HTTPException(status_code=404, detail="Income entry not found")
        
        # Refund the account balance
        await adjust_account_balance(
            income_data['account_id'], 
            float(income_data['amount']), 
            "subtract"  # Remove the income from account
        )
        
        # Delete the income entry
        success = await income_repo.delete(str(income_id), "income_id")
        if not success:
            raise HTTPException(status_code=404, detail="Income entry not found")
        
        return {"message": "Income entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/summary/monthly")
async def get_monthly_income_summary(
    user_id: UUID,
    year: int = Query(..., ge=2020),
    month: Optional[int] = Query(None, ge=1, le=12),
):
    """Get monthly income summary"""
    try:
        # Get all income records for the user
        filters = {"user_id": str(user_id)}
        income_records = await income_repo.get_filtered(filters, 1000)  # Get more records for summary
        
        # Filter by year and optionally month
        filtered_records = []
        for record in income_records:
            income_date = record.get('income_date')
            if income_date:
                try:
                    from datetime import datetime
                    date_obj = datetime.strptime(income_date, '%Y-%m-%d')
                    if date_obj.year == year:
                        if month is None or date_obj.month == month:
                            filtered_records.append(record)
                except ValueError:
                    continue
        
        if month:
            # Specific month - group by source
            source_summary = {}
            for record in filtered_records:
                source = record.get('source') or 'Unknown'
                amount = float(record.get('amount', 0))
                
                if source not in source_summary:
                    source_summary[source] = {'source': source, 'count': 0, 'total_amount': 0}
                
                source_summary[source]['count'] += 1
                source_summary[source]['total_amount'] += amount
            
            # Sort by total_amount descending
            results = sorted(source_summary.values(), key=lambda x: x['total_amount'], reverse=True)
        else:
            # Entire year - group by month
            month_summary = {}
            for record in filtered_records:
                income_date = record.get('income_date')
                if income_date:
                    try:
                        from datetime import datetime
                        date_obj = datetime.strptime(income_date, '%Y-%m-%d')
                        month_num = date_obj.month
                        amount = float(record.get('amount', 0))
                        
                        if month_num not in month_summary:
                            month_summary[month_num] = {'month': month_num, 'total_amount': 0}
                        
                        month_summary[month_num]['total_amount'] += amount
                    except ValueError:
                        continue
            
            # Sort by month
            results = sorted(month_summary.values(), key=lambda x: x['month'])
        
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 