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

# Only log .env loading in development (when RENDER env var is not set)
is_production = os.getenv("RENDER") is not None

if not is_production:
    logger.info(f"Looking for .env file. Current working directory: {Path.cwd()}")

loaded = False
for env_path in env_paths:
    exists = env_path.exists()
    if exists:
        load_dotenv(dotenv_path=env_path, override=True)
        if not is_production:
            logger.info(f"Loaded .env from: {env_path}")
        loaded = True
        break

if not loaded:
    # Fallback to default load_dotenv behavior
    load_dotenv(override=True)

# Import routes AFTER loading environment variables
from routes import users, accounts, expenses, budgets, loans, loan_disbursements, income, debts, people, tags, assistant

app = FastAPI(title="Expense Tracker API", version="1.0.0")

# CORS middleware - Allow Render and localhost for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://*.onrender.com", # All Render domains (frontend + backend)
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
    # Check if GROQ_API_KEY is loaded (only log in production if missing)
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
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
