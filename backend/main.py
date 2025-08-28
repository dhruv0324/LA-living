from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, accounts, expenses, budgets, loans, loan_disbursements, income, debts, people, tags

app = FastAPI(title="Expense Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["accounts"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["budgets"])
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(loan_disbursements.router, prefix="/api/loan-disbursements", tags=["loan_disbursements"])
app.include_router(income.router, prefix="/api/income", tags=["income"])
app.include_router(debts.router, prefix="/api/debts", tags=["debts"])
app.include_router(people.router, prefix="/api/people", tags=["people"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])

@app.get("/")
async def root():
    return {"message": "Expense Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 