from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, accounts, expenses, budgets, loans, loan_disbursements, income, debts, people, tags
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Expense Tracker API", version="1.0.0")

# CORS middleware - Updated for production deployment with explicit domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://la-living-frontend.vercel.app",  # Main Vercel domain
        "https://la-living-frontend-git-frontend-ve-b04208-dhruv-sandus-projects.vercel.app",  # Previous Vercel domain
        "https://la-living-frontend-92peotcel-dhruv-sandus-projects.vercel.app",  # Current Vercel domain
        "https://*.vercel.app",   # All Vercel domains (preview + production)
        "https://*.onrender.com", # All Render domains (if needed)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log CORS configuration on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Expense Tracker API")
    logger.info("CORS origins configured for:")
    logger.info("  - Local development: http://localhost:3000")
    logger.info("  - Main Vercel: https://la-living-frontend.vercel.app")
    logger.info("  - Previous Vercel: https://la-living-frontend-git-frontend-ve-b04208-dhruv-sandus-projects.vercel.app")
    logger.info("  - Current Vercel: https://la-living-frontend-92peotcel-dhruv-sandus-projects.vercel.app")
    logger.info("  - All Vercel domains: https://*.vercel.app")
    logger.info("  - All Render domains: https://*.onrender.com")

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

@app.get("/cors-debug")
async def cors_debug():
    """Debug endpoint to check CORS configuration"""
    from fastapi import Request
    return {
        "message": "CORS Debug Info",
        "cors_origins": [
            "http://localhost:3000",
            "https://la-living-frontend.vercel.app",
            "https://la-living-frontend-git-frontend-ve-b04208-dhruv-sandus-projects.vercel.app",
            "https://*.vercel.app",
            "https://*.onrender.com"
        ],
        "note": "Check Render logs to see if CORS origins are being logged on startup"
    }

@app.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify connectivity"""
    return {
        "message": "Backend is working!",
        "timestamp": "2025-08-30T17:30:00Z",
        "status": "healthy",
        "cors_working": True
    } 