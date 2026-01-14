from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from collections import defaultdict
import os
import json
import logging
import re
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables - try multiple paths
# Try backend/.env first (relative to this file)
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    # Try current working directory
    load_dotenv()
    # Also try backend/.env from current directory
    if os.path.exists("backend/.env"):
        load_dotenv(dotenv_path="backend/.env")

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Groq configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "qwen/qwen3-32b"

# Log API key status (without exposing the key)
if GROQ_API_KEY:
    logger.info("GROQ_API_KEY is set (length: {})".format(len(GROQ_API_KEY)))
else:
    logger.warning("GROQ_API_KEY is NOT set")

# Initialize Groq client lazily
groq_client = None

def get_groq_client():
    """Get or create Groq client"""
    global groq_client
    if groq_client is None:
        if not GROQ_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="GROQ_API_KEY environment variable is not set. Please set it in your .env file."
            )
        groq_client = Groq(api_key=GROQ_API_KEY)
    return groq_client

class ChatMessage(BaseModel):
    user_id: UUID
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str

def clean_response_text(text: str) -> str:
    """
    Clean the response text by removing reasoning tags and formatting issues.
    Removes various reasoning-related tags and their content.
    Also cleans up excessive whitespace and triple quotes.
    """
    if not text:
        return text
    
    # Remove <think> tags and their content (Groq specific)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove <think> tags and their content
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove <reasoning> tags and their content
    text = re.sub(r'<reasoning>.*?</reasoning>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove triple quotes if they appear at the start/end
    text = re.sub(r'^"""\s*', '', text)
    text = re.sub(r'\s*"""$', '', text)
    
    # Clean up excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)  # Replace 3+ newlines with 2
    text = text.strip()
    
    return text

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(message: ChatMessage):
    """
    Chat with financial assistant
    1. Fetch user's financial data
    2. Contextualize it
    3. Send to Groq
    4. Return response
    """
    try:
        logger.info(f"Received chat request from user: {message.user_id}")
        
        # Verify API key is set
        if not GROQ_API_KEY:
            logger.error("GROQ_API_KEY is not set")
            raise HTTPException(
                status_code=500,
                detail="AI assistant is not configured. Please set GROQ_API_KEY in environment variables."
            )
        
        # Contextualize the financial data
        logger.info("Contextualizing financial data...")
        financial_context = await contextualize_financial_data(str(message.user_id))
        logger.info(f"Financial context generated (length: {len(financial_context)})")
        
        # Build system prompt
        system_prompt = f"""You are a helpful financial planning assistant for a personal finance tracking application.

Here is the user's financial data (already processed and aggregated):

{financial_context}

You can help with:
1. Forecasting future trends based on current spending patterns
2. Financial goal planning and recommendations
3. Answering questions about their finances
4. Suggesting budgets based on historical data
5. Providing financial insights and recommendations

Be concise, helpful, and use the actual financial data provided. If you don't have specific data, say so. Format numbers as currency when appropriate."""
        
        # Get Groq client
        client = get_groq_client()
        
        # Call Groq API
        try:
            logger.info(f"Calling Groq API with model: {GROQ_MODEL}")
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message.message}
                ],
                temperature=0.6,
                max_completion_tokens=4096,
                top_p=0.95,
                stream=False,
                stop=None
            )
            logger.info(f"Groq API response received")
        except Exception as groq_error:
            logger.error(f"Groq API error: {str(groq_error)}", exc_info=True)
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to get response from AI: {str(groq_error)}"
            )
        
        # Extract response text
        try:
            if not completion or not hasattr(completion, 'choices') or len(completion.choices) == 0:
                logger.error("Groq API returned empty or invalid response")
                raise HTTPException(
                    status_code=500,
                    detail="AI returned an empty response. Please try again."
                )
            
            response_text = completion.choices[0].message.content
            if not response_text:
                logger.error("Groq API returned empty content")
                raise HTTPException(
                    status_code=500,
                    detail="AI returned an empty response. Please try again."
                )
            
            # Clean the response text to remove reasoning tags and formatting issues
            response_text = clean_response_text(response_text)
            
            logger.info(f"Successfully got response from Groq (length: {len(response_text)})")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error extracting response from Groq completion: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error processing AI response: {str(e)}"
            )
        
        return ChatResponse(
            response=response_text,
            conversation_id=message.conversation_id or "default"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat_with_assistant: {str(e)}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/chat/stream")
async def chat_with_assistant_stream(message: ChatMessage):
    """
    Stream chat responses from financial assistant
    """
    try:
        # Contextualize the financial data
        financial_context = await contextualize_financial_data(str(message.user_id))
        
        # Build system prompt
        system_prompt = f"""You are a helpful financial planning assistant for a personal finance tracking application.

Here is the user's financial data (already processed and aggregated):

{financial_context}

You can help with:
1. Forecasting future trends based on current spending patterns
2. Financial goal planning and recommendations
3. Answering questions about their finances
4. Suggesting budgets based on historical data
5. Providing financial insights and recommendations

Be concise, helpful, and use the actual financial data provided. If you don't have specific data, say so. Format numbers as currency when appropriate."""
        
        # Get Groq client
        client = get_groq_client()
        
        # Call Groq API with streaming
        try:
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message.message}
                ],
                temperature=0.6,
                max_completion_tokens=4096,
                top_p=0.95,
                stream=True,
                stop=None
            )
        except Exception as groq_error:
            logger.error(f"Groq API streaming error: {str(groq_error)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to get streaming response from AI: {str(groq_error)}"
            )
        
        async def generate():
            try:
                for chunk in completion:
                    if chunk.choices and len(chunk.choices) > 0:
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            yield f"data: {json.dumps({'content': delta.content})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def contextualize_financial_data(user_id: str) -> str:
    """
    Transform raw database data into meaningful context for LLM
    """
    from database import (
        accounts_repo, expenses_repo, income_repo, 
        budgets_repo, loans_repo, debts_repo
    )
    
    # Fetch data
    accounts = await accounts_repo.get_filtered({"user_id": user_id})
    all_expenses = await expenses_repo.get_filtered({"user_id": user_id}, limit=1000)
    all_income = await income_repo.get_filtered({"user_id": user_id}, limit=1000)
    budgets = await budgets_repo.get_filtered({"user_id": user_id})
    loans = await loans_repo.get_filtered({"user_id": user_id})
    
    # Get debts directly by user_id
    debts = await debts_repo.get_filtered({"user_id": user_id}, limit=1000)
    
    # Filter recent data (last 6 months)
    six_months_ago = (datetime.now() - timedelta(days=180)).date()
    
    recent_expenses = []
    for exp in all_expenses:
        if exp.get("expense_date"):
            try:
                exp_date = datetime.fromisoformat(exp["expense_date"]).date()
                if exp_date >= six_months_ago:
                    recent_expenses.append(exp)
            except:
                pass
    
    recent_income = []
    for inc in all_income:
        if inc.get("income_date"):
            try:
                inc_date = datetime.fromisoformat(inc["income_date"]).date()
                if inc_date >= six_months_ago:
                    recent_income.append(inc)
            except:
                pass
    
    # Build context parts
    context_parts = []
    
    # Accounts
    total_balance = sum(float(acc.get("balance", 0)) for acc in accounts)
    context_parts.append(format_accounts_context(accounts, total_balance))
    
    # Expenses
    expense_context = aggregate_expenses(recent_expenses)
    context_parts.append(expense_context)
    
    # Income
    income_context = aggregate_income(recent_income)
    context_parts.append(income_context)
    
    # Budgets
    budget_context = analyze_budgets(budgets, recent_expenses)
    context_parts.append(budget_context)
    
    # Loans
    loans_context = summarize_loans(loans)
    context_parts.append(loans_context)
    
    # Debts
    debts_context = summarize_debts(debts)
    context_parts.append(debts_context)
    
    # Financial Health
    health_metrics = calculate_financial_health(
        total_balance, recent_expenses, recent_income, budgets, loans, debts
    )
    context_parts.append(health_metrics)
    
    return "\n\n".join(context_parts)

def format_accounts_context(accounts: list, total_balance: float) -> str:
    """Format accounts summary"""
    if not accounts:
        return "ACCOUNTS: No accounts set up."
    
    account_list = "\n".join([
        f"  - {acc.get('account_name')}: ${float(acc.get('balance', 0)):.2f}"
        for acc in accounts
    ])
    
    return f"""ACCOUNTS (Total Balance: ${total_balance:.2f}):
{account_list}"""

def aggregate_expenses(expenses: list) -> str:
    """Aggregate expenses by category and time period"""
    if not expenses:
        return "EXPENSES: No expenses recorded in the last 6 months."
    
    total_expenses = sum(float(exp.get("amount", 0)) for exp in expenses)
    
    # Group by category
    category_totals = defaultdict(float)
    category_counts = defaultdict(int)
    
    for exp in expenses:
        category = exp.get("tag_name") or "Uncategorized"
        amount = float(exp.get("amount", 0))
        category_totals[category] += amount
        category_counts[category] += 1
    
    # Group by month
    monthly_totals = defaultdict(float)
    for exp in expenses:
        if exp.get("expense_date"):
            try:
                exp_date = datetime.fromisoformat(exp["expense_date"]).date()
                month_key = exp_date.strftime("%Y-%m")
                monthly_totals[month_key] += float(exp.get("amount", 0))
            except:
                pass
    
    # Format top categories
    top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    category_summary = "\n".join([
        f"  - {cat}: ${amount:.2f} ({category_counts[cat]} transactions)"
        for cat, amount in top_categories
    ])
    
    # Format monthly trends
    sorted_months = sorted(monthly_totals.items())
    monthly_summary = "\n".join([
        f"  - {month}: ${amount:.2f}"
        for month, amount in sorted_months
    ])
    
    avg_monthly = total_expenses / max(len(monthly_totals), 1)
    
    return f"""EXPENSES (Last 6 Months):
- Total Spent: ${total_expenses:.2f}
- Average Monthly: ${avg_monthly:.2f}
- Transaction Count: {len(expenses)}

Top Categories:
{category_summary}

Monthly Trend:
{monthly_summary}"""

def aggregate_income(income: list) -> str:
    """Aggregate income by source and time period"""
    if not income:
        return "INCOME: No income recorded in the last 6 months."
    
    total_income = sum(float(inc.get("amount", 0)) for inc in income)
    
    # Group by source
    source_totals = defaultdict(float)
    for inc in income:
        source = inc.get("tag_name") or "Unknown"
        source_totals[source] += float(inc.get("amount", 0))
    
    # Monthly income
    monthly_income = defaultdict(float)
    for inc in income:
        if inc.get("income_date"):
            try:
                inc_date = datetime.fromisoformat(inc["income_date"]).date()
                month_key = inc_date.strftime("%Y-%m")
                monthly_income[month_key] += float(inc.get("amount", 0))
            except:
                pass
    
    # Top sources
    top_sources = sorted(source_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    source_summary = "\n".join([
        f"  - {source}: ${amount:.2f}"
        for source, amount in top_sources
    ])
    
    # Monthly trend
    sorted_months = sorted(monthly_income.items())
    monthly_summary = "\n".join([
        f"  - {month}: ${amount:.2f}"
        for month, amount in sorted_months
    ])
    
    avg_monthly = total_income / max(len(monthly_income), 1)
    
    return f"""INCOME (Last 6 Months):
- Total Income: ${total_income:.2f}
- Average Monthly: ${avg_monthly:.2f}
- Transaction Count: {len(income)}

Top Sources:
{source_summary}

Monthly Trend:
{monthly_summary}"""

def analyze_budgets(budgets: list, expenses: list) -> str:
    """Analyze budget vs actual spending"""
    if not budgets:
        return "BUDGETS: No budgets set."
    
    current_month = datetime.now()
    current_budget = None
    
    # Find current month's budget
    for budget in budgets:
        if budget.get("month") == current_month.month and budget.get("year") == current_month.year:
            current_budget = budget
            break
    
    if not current_budget:
        budget_summary = "\n".join([
            f"  - {budget.get('month')}/{budget.get('year')}: ${float(budget.get('amount', 0)):.2f}"
            for budget in budgets
        ])
        return f"""BUDGETS:
{budget_summary}

No budget set for current month."""
    
    # Calculate current month expenses
    current_month_expenses = [
        exp for exp in expenses
        if exp.get("expense_date") and
        datetime.fromisoformat(exp["expense_date"]).date().month == current_month.month and
        datetime.fromisoformat(exp["expense_date"]).date().year == current_month.year
    ]
    
    total_spent = sum(float(exp.get("amount", 0)) for exp in current_month_expenses)
    budget_amount = float(current_budget.get("amount", 0))
    remaining = budget_amount - total_spent
    percentage_used = (total_spent / budget_amount * 100) if budget_amount > 0 else 0
    
    status = "✅ On Track" if percentage_used <= 70 else "⚠️ Watch" if percentage_used <= 90 else "❌ Over Budget"
    
    return f"""BUDGETS:
- Current Month ({current_month.month}/{current_month.year}): ${budget_amount:.2f}
- Spent So Far: ${total_spent:.2f}
- Remaining: ${remaining:.2f}
- Usage: {percentage_used:.1f}%
- Status: {status}"""

def summarize_loans(loans: list) -> str:
    """Summarize loans"""
    if not loans:
        return "LOANS: No loans recorded."
    
    total_remaining = sum(float(loan.get("remaining_amount", 0)) for loan in loans)
    total_amount = sum(float(loan.get("total_amount", 0)) for loan in loans)
    
    loans_list = "\n".join([
        f"  - {loan.get('loan_name', 'Loan')}: ${float(loan.get('remaining_amount', 0)):.2f} remaining of ${float(loan.get('total_amount', 0)):.2f}"
        for loan in loans
    ])
    
    utilization = (total_amount - total_remaining) / total_amount * 100 if total_amount > 0 else 0
    
    return f"""LOANS:
- Total Loan Amount: ${total_amount:.2f}
- Total Remaining: ${total_remaining:.2f}
- Utilization: {utilization:.1f}%

Loans:
{loans_list}"""

def summarize_debts(debts: list) -> str:
    """Summarize debts"""
    unsettled_debts = [d for d in debts if not d.get("is_settled", False)]
    
    if not unsettled_debts:
        return "DEBTS: No unsettled debts."
    
    owed_to_me = sum(float(d.get("amount", 0)) for d in unsettled_debts if d.get("type") == "OwedToMe")
    i_owe = sum(float(d.get("amount", 0)) for d in unsettled_debts if d.get("type") == "IOwe")
    net_balance = owed_to_me - i_owe
    
    return f"""DEBTS:
- Owed to User: ${owed_to_me:.2f}
- User Owes: ${i_owe:.2f}
- Net Balance: ${net_balance:.2f}
- Unsettled Count: {len(unsettled_debts)}"""

def calculate_financial_health(
    total_balance: float,
    expenses: list,
    income: list,
    budgets: list,
    loans: list,
    debts: list
) -> str:
    """Calculate overall financial health metrics"""
    
    # Calculate savings rate
    total_expenses = sum(float(exp.get("amount", 0)) for exp in expenses)
    total_income = sum(float(inc.get("amount", 0)) for inc in income)
    savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0
    
    # Calculate net worth
    total_loans = sum(float(loan.get("remaining_amount", 0)) for loan in loans)
    unsettled_debts = [d for d in debts if not d.get("is_settled", False)]
    total_debts_owed = sum(float(d.get("amount", 0)) for d in unsettled_debts if d.get("type") == "IOwe")
    net_worth = total_balance - total_loans - total_debts_owed
    
    # Monthly averages (last 6 months)
    monthly_expenses = total_expenses / 6 if len(expenses) > 0 else 0
    monthly_income = total_income / 6 if len(income) > 0 else 0
    monthly_savings = monthly_income - monthly_expenses
    
    return f"""FINANCIAL HEALTH SUMMARY:
- Net Worth: ${net_worth:.2f}
- Savings Rate: {savings_rate:.1f}%
- Average Monthly Income: ${monthly_income:.2f}
- Average Monthly Expenses: ${monthly_expenses:.2f}
- Average Monthly Savings: ${monthly_savings:.2f}"""

