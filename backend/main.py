from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv
from pathlib import Path
import os

# Configure logging FIRST so we can log the .env loading process
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file BEFORE importing routes
# Try multiple paths to find .env file
env_paths = [
    Path(__file__).parent / ".env",  # backend/.env (relative to main.py)
    Path.cwd() / ".env",  # Current working directory
    Path.cwd() / "backend" / ".env",  # backend/.env from project root
]

logger.info(f"Looking for .env file. Current working directory: {Path.cwd()}")
logger.info(f"main.py location: {Path(__file__).parent}")

loaded = False
for env_path in env_paths:
    exists = env_path.exists()
    logger.info(f"Checking: {env_path} (exists: {exists})")
    if exists:
        load_dotenv(dotenv_path=env_path, override=True)
        logger.info(f"Loaded .env from: {env_path}")
        # Verify GROQ_API_KEY was loaded
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            logger.info(f"GROQ_API_KEY loaded successfully (length: {len(groq_key)})")
        else:
            logger.warning(f"GROQ_API_KEY not found in .env file at {env_path}")
        loaded = True
        break

if not loaded:
    # Fallback to default load_dotenv behavior
    logger.warning("No .env file found in expected locations, trying default load_dotenv()")
    load_dotenv(override=True)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        logger.info(f"GROQ_API_KEY loaded from default location (length: {len(groq_key)})")
    else:
        logger.error("GROQ_API_KEY still not found after default load_dotenv()")

# Import routes AFTER loading environment variables
from routes import users, accounts, expenses, budgets, loans, loan_disbursements, income, debts, people, tags, assistant

app = FastAPI(title="Expense Tracker API", version="1.0.0")

# CORS middleware - Allow all Vercel domains for production flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
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
    logger.info("CORS configured for Vercel and Render domains")
    # Check if GROQ_API_KEY is loaded
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        logger.info(f"GROQ_API_KEY is loaded (length: {len(groq_key)})")
    else:
        logger.warning("GROQ_API_KEY is NOT loaded - AI assistant will not work")

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
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])

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