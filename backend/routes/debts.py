from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from datetime import date

from database import SupabaseRepository, adjust_account_balance
from models import Debt, DebtCreate
from routes.tags import get_or_create_debt_repayment_tag

router = APIRouter()
debts_repo = SupabaseRepository("debts")
people_repo = SupabaseRepository("people")
expenses_repo = SupabaseRepository("expenses")
income_repo = SupabaseRepository("income")
accounts_repo = SupabaseRepository("accounts")

@router.post("/", response_model=Debt)
async def create_debt(debt: DebtCreate, account_id: Optional[str] = Query(None)):
    """Create a new debt record"""
    try:
        # Verify person exists
        person = await people_repo.get_by_id(str(debt.person_id), "person_id")
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        
        # For OwedToMe debts, account_id is required
        if debt.type == "OwedToMe" and not account_id:
            raise HTTPException(status_code=400, detail="Account is required for 'Owed to Me' debts")
        
        # Handle tag_id based on debt type
        tag_id = None
        if debt.type == "OwedToMe":
            # For debtors (people who owe me), automatically create/use "Debt Settlement" tag
            # We need the user_id to create the tag, but it's not in the debt model
            # Let's get it from the person record
            tag_id = await get_or_create_debt_repayment_tag(person["user_id"])
        elif debt.type == "IOwe" and debt.tag_id:
            # For creditors (people I owe), use the provided expense tag
            tag_id = str(debt.tag_id)
        
        debt_data = {
            "user_id": str(person["user_id"]),
            "person_id": str(debt.person_id),
            "amount": float(debt.amount),
            "type": debt.type,
            "notes": debt.notes or "",
            "is_settled": debt.is_settled,
            "place": debt.place,
            "tag_id": tag_id,
            "account_id": account_id if debt.type == "OwedToMe" else None
        }
        
        # Add debt_date if provided
        if debt.debt_date:
            if hasattr(debt.debt_date, 'strftime'):
                debt_data["debt_date"] = debt.debt_date.strftime('%Y-%m-%d')
            else:
                debt_data["debt_date"] = str(debt.debt_date)
        
        result = await debts_repo.create(debt_data)
        
        # For OwedToMe debts, deduct amount from the account
        if debt.type == "OwedToMe" and account_id:
            await adjust_account_balance(account_id, float(debt.amount), "subtract")
        
        return Debt(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[dict])
async def get_debts(user_id: UUID, type: Optional[str] = Query(None), is_settled: Optional[bool] = Query(None)):
    """Get debts for a user with person information"""
    try:
        # Get all debts for the user directly
        debts_filters = {"user_id": str(user_id)}
        if type:
            debts_filters["type"] = type
        if is_settled is not None:
            debts_filters["is_settled"] = is_settled
        
        debts_results = await debts_repo.get_filtered(debts_filters, 1000)
        
        # Get all people for the user to enrich debt data with person names
        people_filters = {"user_id": str(user_id)}
        people_results = await people_repo.get_filtered(people_filters, 1000)
        people_dict = {p['person_id']: p for p in people_results}
        
        # Combine debt and person information
        enriched_debts = []
        for debt in debts_results:
            person = people_dict.get(debt['person_id'])
            if person:
                enriched_debt = {
                    **debt,
                    "person_name": person['name']
                }
                enriched_debts.append(enriched_debt)
        
        # Sort by created_at descending
        enriched_debts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return enriched_debts
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{debt_id}", response_model=dict)
async def get_debt(debt_id: UUID):
    """Get a specific debt with person information"""
    try:
        debt = await debts_repo.get_by_id(str(debt_id), "debt_id")
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        person = await people_repo.get_by_id(debt['person_id'], "person_id")
        if not person:
            raise HTTPException(status_code=404, detail="Associated person not found")
        
        return {
            **debt,
            "person_name": person['name']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{debt_id}", response_model=Debt)
async def update_debt(debt_id: UUID, debt_update: DebtCreate, account_id: Optional[str] = Query(None)):
    """Update a debt record"""
    try:
        # Get original debt for balance adjustments
        original_debt = await debts_repo.get_by_id(str(debt_id), "debt_id")
        if not original_debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        # Verify person exists
        person = await people_repo.get_by_id(str(debt_update.person_id), "person_id")
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        
        # For OwedToMe debts, account_id is required
        if debt_update.type == "OwedToMe" and not account_id:
            raise HTTPException(status_code=400, detail="Account is required for 'Owed to Me' debts")
        
        # Handle balance adjustments for OwedToMe debts
        if original_debt.get('type') == 'OwedToMe' and not original_debt.get('is_settled'):
            original_amount = float(original_debt.get('amount', 0))
            original_account_id = original_debt.get('account_id')
            
            # If updating to OwedToMe, handle balance changes
            if debt_update.type == 'OwedToMe':
                new_amount = float(debt_update.amount)
                new_account_id = account_id
                
                # If account changed, refund old account and deduct from new account
                if original_account_id and new_account_id and original_account_id != new_account_id:
                    await adjust_account_balance(original_account_id, original_amount, "add")
                    await adjust_account_balance(new_account_id, new_amount, "subtract")
                # If only amount changed and same account
                elif original_account_id and new_account_id and original_account_id == new_account_id:
                    amount_diff = new_amount - original_amount
                    if amount_diff != 0:
                        await adjust_account_balance(original_account_id, abs(amount_diff), "subtract" if amount_diff > 0 else "add")
                # If account was added (original was None)
                elif not original_account_id and new_account_id:
                    await adjust_account_balance(new_account_id, new_amount, "subtract")
            # If changing from OwedToMe to IOwe, refund the account
            elif original_debt.get('type') == 'OwedToMe' and debt_update.type == 'IOwe' and original_account_id:
                await adjust_account_balance(original_account_id, original_amount, "add")
        # If changing from IOwe to OwedToMe, deduct from account
        elif original_debt.get('type') == 'IOwe' and debt_update.type == 'OwedToMe' and account_id:
            new_amount = float(debt_update.amount)
            await adjust_account_balance(account_id, new_amount, "subtract")
        
        # Handle tag_id based on debt type
        tag_id = None
        if debt_update.type == "OwedToMe":
            # For debtors (people who owe me), automatically create/use "Debt Settlement" tag
            tag_id = await get_or_create_debt_repayment_tag(person["user_id"])
        elif debt_update.type == "IOwe" and debt_update.tag_id:
            # For creditors (people I owe), use the provided expense tag
            tag_id = str(debt_update.tag_id)
        
        # Preserve user_id from original debt (shouldn't change)
        user_id = original_debt.get("user_id") or person["user_id"]
        
        update_data = {
            "user_id": str(user_id),
            "person_id": str(debt_update.person_id),
            "amount": float(debt_update.amount),
            "type": debt_update.type,
            "notes": debt_update.notes or "",
            "is_settled": debt_update.is_settled,
            "place": debt_update.place or "",
            "tag_id": tag_id,
            "account_id": account_id if debt_update.type == "OwedToMe" else None
        }
        
        # Add debt_date if provided
        if debt_update.debt_date:
            if hasattr(debt_update.debt_date, 'strftime'):
                update_data["debt_date"] = debt_update.debt_date.strftime('%Y-%m-%d')
            else:
                update_data["debt_date"] = str(debt_update.debt_date)
        
        result = await debts_repo.update(str(debt_id), update_data, "debt_id")
        return Debt(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{debt_id}")
async def delete_debt(debt_id: UUID):
    """Delete a debt record"""
    try:
        # Get debt details before deleting
        debt = await debts_repo.get_by_id(str(debt_id), "debt_id")
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        # For OwedToMe debts, add amount back to the account
        if debt.get('type') == 'OwedToMe' and debt.get('account_id') and not debt.get('is_settled'):
            await adjust_account_balance(debt['account_id'], float(debt['amount']), "add")
        
        success = await debts_repo.delete(str(debt_id), "debt_id")
        if not success:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        return {"message": "Debt deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{debt_id}/settle")
async def settle_debt(debt_id: UUID, account_id: str = Query(...)):
    """Settle a debt by creating corresponding income or expense"""
    try:
        # Get debt details
        debt = await debts_repo.get_by_id(str(debt_id), "debt_id")
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        if debt['is_settled']:
            raise HTTPException(status_code=400, detail="Debt is already settled")
        
        # Get person details
        person = await people_repo.get_by_id(debt['person_id'], "person_id")
        if not person:
            raise HTTPException(status_code=404, detail="Associated person not found")
        
        # Get user_id from person
        user_id = person['user_id']
        amount = float(debt['amount'])
        
        # Use debt_date if available, otherwise use today's date
        settlement_date = debt.get('debt_date')
        if settlement_date:
            # Convert to string if it's a date object or datetime
            if hasattr(settlement_date, 'strftime'):
                settlement_date = settlement_date.strftime('%Y-%m-%d')
            elif isinstance(settlement_date, str):
                # Handle string dates - ensure proper format
                try:
                    from datetime import datetime
                    parsed_date = datetime.strptime(settlement_date, '%Y-%m-%d')
                    settlement_date = parsed_date.strftime('%Y-%m-%d')
                except ValueError:
                    # If parsing fails, use today's date
                    settlement_date = date.today().strftime('%Y-%m-%d')
            else:
                settlement_date = date.today().strftime('%Y-%m-%d')
        else:
            settlement_date = date.today().strftime('%Y-%m-%d')
        
        if debt['type'] == 'OwedToMe':
            # Transfer money from original account to settlement account
            # No income entry is created - it's just a transfer between accounts
            original_account_id = debt.get('account_id')
            
            if original_account_id:
                # Subtract from original account (if it exists)
                # Note: The amount was already deducted when debt was created
                # So we just need to add to the settlement account
                await adjust_account_balance(account_id, amount, "add")
            else:
                # If no original account, just add to settlement account
                await adjust_account_balance(account_id, amount, "add")
            
        elif debt['type'] == 'IOwe':
            # Get account name for payment_method field
            account = await accounts_repo.get_by_id(account_id, "account_id")
            payment_method_name = account['account_name'] if account else "Unknown Account"
            
            # Create expense record
            expense_data = {
                "user_id": user_id,
                "account_id": account_id,
                "amount": amount,
                "place": debt.get('place') or f"Settlement to {person['name']}",
                "payment_method": payment_method_name,
                "notes": debt.get('notes', ''),
                "expense_date": settlement_date,
                "tag_id": debt.get('tag_id')  # Use tag_id from debt record
            }
            await expenses_repo.create(expense_data)
            
            # Subtract money from account
            await adjust_account_balance(account_id, amount, "subtract")
        
        # Mark debt as settled
        await debts_repo.update(str(debt_id), {"is_settled": True}, "debt_id")
        
        return {"message": f"Debt settled successfully{' and recorded as expense' if debt['type'] == 'IOwe' else ''}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/settle-by-type/{person_id}")
async def settle_debts_by_type(person_id: UUID, account_id: str = Query(...), debt_type: str = Query(...)):
    """Settle all unsettled debts of a specific type for a person as separate records"""
    try:
        # Validate debt_type
        if debt_type not in ['OwedToMe', 'IOwe']:
            raise HTTPException(status_code=400, detail="Invalid debt type. Must be 'OwedToMe' or 'IOwe'")
        
        # Get person details
        person = await people_repo.get_by_id(str(person_id), "person_id")
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        
        # Get all unsettled debts of the specified type for this person
        debts_filters = {"person_id": str(person_id), "is_settled": False, "type": debt_type}
        unsettled_debts = await debts_repo.get_filtered(debts_filters, 1000)
        
        if not unsettled_debts:
            raise HTTPException(status_code=400, detail=f"No unsettled {debt_type} debts found for this person")
        
        user_id = person['user_id']
        records_created = []
        
        # Process each debt separately
        for debt in unsettled_debts:
            amount = float(debt['amount'])
            
            # Use debt_date if available, otherwise use today's date
            settlement_date = debt.get('debt_date')
            if settlement_date:
                if hasattr(settlement_date, 'strftime'):
                    settlement_date = settlement_date.strftime('%Y-%m-%d')
                elif isinstance(settlement_date, str):
                    try:
                        from datetime import datetime
                        parsed_date = datetime.strptime(settlement_date, '%Y-%m-%d')
                        settlement_date = parsed_date.strftime('%Y-%m-%d')
                    except ValueError:
                        settlement_date = date.today().strftime('%Y-%m-%d')
                else:
                    settlement_date = date.today().strftime('%Y-%m-%d')
            else:
                settlement_date = date.today().strftime('%Y-%m-%d')
            
            if debt_type == 'OwedToMe':
                # Transfer money from original account to settlement account
                # No income entry is created - it's just a transfer between accounts
                original_account_id = debt.get('account_id')
                
                if original_account_id:
                    # Add to settlement account (amount was already deducted when debt was created)
                    await adjust_account_balance(account_id, amount, "add")
                else:
                    # If no original account, just add to settlement account
                    await adjust_account_balance(account_id, amount, "add")
                records_created.append(f"Transfer: ${amount}")
                
            elif debt_type == 'IOwe':
                # Get account name for payment_method field
                account = await accounts_repo.get_by_id(account_id, "account_id")
                payment_method_name = account['account_name'] if account else "Unknown Account"
                
                # Create separate expense record for each debt
                expense_data = {
                    "user_id": user_id,
                    "account_id": account_id,
                    "amount": amount,
                    "place": debt.get('place') or f"Settlement to {person['name']}",
                    "payment_method": payment_method_name,
                    "notes": debt.get('notes', ''),
                    "expense_date": settlement_date,
                    "tag_id": debt.get('tag_id')  # Use tag_id from debt record
                }
                await expenses_repo.create(expense_data)
                await adjust_account_balance(account_id, amount, "subtract")
                records_created.append(f"Expense: ${amount}")
            
            # Mark this debt as settled
            await debts_repo.update(debt['debt_id'], {"is_settled": True}, "debt_id")
        
        total_amount = sum(float(debt['amount']) for debt in unsettled_debts)
        record_type = "transfers" if debt_type == 'OwedToMe' else "expense records"
        
        return {
            "message": f"Settled {len(unsettled_debts)} {debt_type} debts with {person['name']} as separate {record_type}",
            "total_amount": total_amount,
            "records_created": len(records_created),
            "debt_type": debt_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/settle-net/{person_id}")
async def settle_net_debts_for_person(person_id: UUID, account_id: str = Query(...)):
    """Settle net amount for all unsettled debts with a person"""
    try:
        # Get person details
        person = await people_repo.get_by_id(str(person_id), "person_id")
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        
        # Get all unsettled debts for this person
        debts_filters = {"person_id": str(person_id), "is_settled": False}
        unsettled_debts = await debts_repo.get_filtered(debts_filters, 1000)
        
        if not unsettled_debts:
            raise HTTPException(status_code=400, detail="No unsettled debts found for this person")
        
        user_id = person['user_id']
        total_owed_to_me = 0
        total_i_owe = 0
        
        # Calculate totals
        for debt in unsettled_debts:
            amount = float(debt['amount'])
            if debt['type'] == 'OwedToMe':
                total_owed_to_me += amount
            elif debt['type'] == 'IOwe':
                total_i_owe += amount
        
        # Create separate records for each debt (like settle-by-type but for all types)
        records_created = []
        
        for debt in unsettled_debts:
            amount = float(debt['amount'])
            
            # Use today's date for net settlement
            settlement_date = date.today().strftime('%Y-%m-%d')
            
            if debt['type'] == 'OwedToMe':
                # Transfer money from original account to settlement account
                # No income entry is created - it's just a transfer between accounts
                original_account_id = debt.get('account_id')
                
                if original_account_id:
                    # Add to settlement account (amount was already deducted when debt was created)
                    await adjust_account_balance(account_id, amount, "add")
                else:
                    # If no original account, just add to settlement account
                    await adjust_account_balance(account_id, amount, "add")
                records_created.append(f"Transfer: ${amount}")
                
            elif debt['type'] == 'IOwe':
                # Get account name for payment_method field
                account = await accounts_repo.get_by_id(account_id, "account_id")
                payment_method_name = account['account_name'] if account else "Unknown Account"
                
                # Create separate expense record for each debt
                expense_data = {
                    "user_id": user_id,
                    "account_id": account_id,
                    "amount": amount,
                    "place": debt.get('place') or f"Settlement to {person['name']}",
                    "payment_method": payment_method_name,
                    "notes": debt.get('notes', ''),
                    "expense_date": settlement_date,
                    "tag_id": debt.get('tag_id')  # Use tag_id from debt record
                }
                await expenses_repo.create(expense_data)
                await adjust_account_balance(account_id, amount, "subtract")
                records_created.append(f"Expense: ${amount}")
            
            # Mark this debt as settled
            await debts_repo.update(debt['debt_id'], {"is_settled": True}, "debt_id")
        
        # Calculate net amount for display purposes
        net_amount = total_owed_to_me - total_i_owe
        
        record_type = "transfers and expense records" if (total_owed_to_me > 0 and total_i_owe > 0) else ("transfers" if total_owed_to_me > 0 else "expense records")
        
        return {
            "message": f"Net settlement with {person['name']} completed - created {len(records_created)} separate {record_type}",
            "net_amount": abs(net_amount),
            "records_created": len(records_created),
            "debts_settled": len(unsettled_debts),
            "details": records_created
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/summary/{user_id}")
async def get_debt_summary(user_id: UUID):
    """Get debt summary for a user"""
    try:
        # Get all unsettled debts for the user directly
        debts_filters = {"user_id": str(user_id), "is_settled": False}
        all_debts = await debts_repo.get_filtered(debts_filters, 1000)
        
        # Get all people for the user to get person names
        people_filters = {"user_id": str(user_id)}
        people_results = await people_repo.get_filtered(people_filters, 1000)
        people_dict = {p['person_id']: p for p in people_results}
        
        summary = {
            "total_owed_to_me": 0,
            "total_i_owe": 0,
            "net_balance": 0,
            "people_count": len(people_results),
            "debts_count": len(all_debts),
            "net_settlements": []
        }
        
        # Group debts by person and calculate totals
        person_totals = {}
        for debt in all_debts:
            person_id = debt['person_id']
            if person_id not in person_totals:
                person_totals[person_id] = {"owed_to_me": 0, "i_owe": 0}
            
            if debt['type'] == 'OwedToMe':
                person_totals[person_id]["owed_to_me"] += float(debt['amount'])
            elif debt['type'] == 'IOwe':
                person_totals[person_id]["i_owe"] += float(debt['amount'])
        
        # Calculate totals and net settlements
        for person_id, totals in person_totals.items():
            person = people_dict.get(person_id)
            if person:
                person_owed_to_me = totals["owed_to_me"]
                person_i_owe = totals["i_owe"]
                
                summary["total_owed_to_me"] += person_owed_to_me
                summary["total_i_owe"] += person_i_owe
                
                # Calculate net for this person
                net_amount = person_owed_to_me - person_i_owe
                if net_amount != 0:
                    summary["net_settlements"].append({
                        "person_id": person_id,
                        "person_name": person['name'],
                        "net_amount": net_amount,
                        "type": "owed_to_me" if net_amount > 0 else "i_owe"
                    })
        
        # Calculate net balance: owed to me - i owe
        summary["net_balance"] = summary["total_owed_to_me"] - summary["total_i_owe"]
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 