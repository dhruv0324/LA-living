# Personal Finance Tracker

A comprehensive personal finance management application built with modern web technologies. Track expenses, manage budgets, monitor loans, handle debts, and gain insights into your financial health with an intuitive dashboard and AI-powered financial assistant.

## Features

### Core Functionality
- **Dashboard**: Comprehensive financial overview with real-time statistics and insights
- **Expense Tracking**: Categorize and monitor spending with automatic budget calculations
- **Income Management**: Record and categorize income sources with detailed tracking
- **Wallet Management**: Track multiple accounts (bank, cash, credit cards) with automatic balance updates
- **Budget Planning**: Set monthly budgets and monitor spending progress with visual indicators
- **Statistics & Analytics**: Visual charts and insights into your financial patterns, trends, and health

### Advanced Features
- **AI Financial Assistant**: Get personalized financial insights, forecasts, budget suggestions, and Q&A powered by Groq AI
- **Debt Management**: Track money owed to you and money you owe to others with settlement tracking
- **Loan Tracking**: Manage loans with disbursement monitoring and utilization tracking
- **Tag System**: Flexible categorization system for expenses and income
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Secure Authentication**: Supabase-powered user management with email/password

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Material-UI (MUI) v6
- React Context for state management
- Recharts & Chart.js for data visualization
- Axios for HTTP requests
- react-markdown for content rendering

### Backend
- FastAPI (Python)
- Supabase (PostgreSQL)
- Pydantic for data validation
- Groq API for AI features

### Infrastructure
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Deployment: Render
- AI Service: Groq

## Project Structure

```
US living/
├── backend/                    # FastAPI backend
│   ├── routes/                 # API route handlers
│   │   ├── accounts.py        # Account (Wallet) management
│   │   ├── assistant.py        # AI financial assistant
│   │   ├── budgets.py         # Budget operations
│   │   ├── debts.py           # Debt tracking
│   │   ├── expenses.py        # Expense management
│   │   ├── income.py          # Income tracking
│   │   ├── loans.py           # Loan management
│   │   ├── loan_disbursements.py  # Loan disbursement tracking
│   │   ├── people.py          # People management for debts
│   │   ├── tags.py            # Tag/category management
│   │   └── users.py           # User operations
│   ├── models.py              # Pydantic data models
│   ├── database.py            # Database configuration
│   ├── main.py                # FastAPI app entry point
│   ├── start.py               # Production server script
│   └── requirements.txt       # Python dependencies
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   │   ├── ai-assistant/  # AI assistant page
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── budget/        # Budget management
│   │   │   ├── debts/         # Debt tracking
│   │   │   ├── expenses/      # Expense management
│   │   │   ├── income/         # Income tracking
│   │   │   ├── loans/         # Loan management
│   │   │   ├── payment-methods/ # Wallet management
│   │   │   ├── statistics/    # Analytics dashboard
│   │   │   └── page.tsx       # Dashboard
│   │   ├── components/        # Reusable React components
│   │   ├── contexts/          # React contexts (Auth)
│   │   ├── lib/               # Utility functions and API client
│   │   └── theme/             # UI theme configuration
│   ├── package.json           # Node.js dependencies
│   └── next.config.ts         # Next.js configuration
└── README.md                  # This file
```

## Database Schema

The application uses a comprehensive database schema with the following key tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | User accounts and authentication | `id`, `email`, `name`, `username` |
| **accounts** | Financial accounts (wallet) | `account_id`, `user_id`, `account_name`, `balance` |
| **expenses** | Expense records | `expense_id`, `user_id`, `account_id`, `amount`, `tag_id`, `place`, `expense_date` |
| **income** | Income records | `income_id`, `user_id`, `account_id`, `amount`, `source`, `tag_id`, `income_date` |
| **budgets** | Monthly budget limits | `budget_id`, `user_id`, `month`, `year`, `amount` |
| **loans** | Loan information | `loan_id`, `user_id`, `total_amount`, `taken_amount`, `remaining_amount`, `loan_name` |
| **loan_disbursements** | Loan disbursement records | `disbursement_id`, `loan_id`, `user_id`, `amount`, `tag_id`, `disbursement_date` |
| **debts** | Personal debt tracking | `debt_id`, `user_id`, `person_id`, `amount`, `type`, `account_id`, `is_settled` |
| **people** | People for debt tracking | `person_id`, `user_id`, `name` |
| **tags** | Categorization system | `tag_id`, `user_id`, `name`, `type` |

## Quick Start

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Supabase account
- Groq API key (for AI assistant feature)
- Git for version control

### 1. Clone the Repository

```bash
git clone https://github.com/dhruv0324/LA-living.git
cd LA-living
```

### 2. Database Setup

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Get your database credentials from the project settings (Settings → API)
3. Run the setup SQL in your Supabase SQL editor to create the necessary tables

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your credentials
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# GROQ_API_KEY=your_groq_api_key

# Start the server
python start.py
```

The backend will be available at `http://localhost:8000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file with your credentials
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Deployment

The application is deployed on Render. Both frontend and backend services are configured via the `render.yaml` blueprint file in the repository root.

### Environment Variables

**Backend Service:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

**Frontend Service:**
- `NEXT_PUBLIC_API_URL` (should point to your backend service URL)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Usage Guide

### Getting Started

1. Sign Up/Login: Create an account or sign in with existing credentials
2. Setup Wallet: Add your bank accounts, credit cards, and cash accounts
3. Set Budget: Create monthly budgets for different spending categories
4. Start Tracking: Begin recording your income and expenses
5. Monitor Progress: Use the dashboard to track your financial health
6. Use AI Assistant: Get insights, forecasts, and recommendations about your finances

### Key Features

**Dashboard**
- Financial overview with total balance, monthly income/expenses, and savings
- Budget progress visualization
- Quick actions to add income/expenses
- Recent transactions display

**Expenses Management**
- Record spending with categories, locations, payment methods, and notes
- Link expenses to specific accounts
- Automatic budget calculation and alerts
- Search and filter by date, category, or amount
- Calendar view for date-based visualization

**Income Management**
- Record income with sources, accounts, and categories
- Link income to specific accounts
- Search and filter functionality
- Calendar view

**Wallet Management**
- Manage multiple accounts (bank accounts, credit cards, cash)
- Real-time balance updates based on transactions
- Account history for all income/expenses

**Debt Tracking**
- Add and manage people you have financial relationships with
- Track money owed to you (OwedToMe) and money you owe (IOwe)
- Settle individual debts or all debts with a person
- OwedToMe debts deduct from accounts; settlements transfer between accounts
- Settled debts automatically appear in income/expenses

**Loan Management**
- Create loans with total amount and name
- Track individual loan disbursements with categories
- Monitor loan utilization
- Automatic calculation of remaining loan amount

**AI Financial Assistant**
- Get personalized insights about your spending patterns
- Predict future expenses and income trends
- Receive AI-powered budget recommendations
- Ask questions about your financial data
- Get help with financial goal planning

**Statistics & Analytics**
- Financial overview: Net worth, savings rate, and financial health metrics
- Income & Expense Trends: Timeline visualization of income and expenses
- Budget Analysis: Budget vs. actual spending comparison
- Loan Analysis: Detailed loan information including disbursements over time
- Category Analysis: Top spending categories and income sources

## API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs` (development) or `https://your-backend-url.onrender.com/docs` (production)
- **ReDoc**: `http://localhost:8000/redoc` (development) or `https://your-backend-url.onrender.com/redoc` (production)

## Development

### Backend Development

The backend uses FastAPI with modern Python patterns:
- Async/Await for better performance
- Pydantic Models for automatic data validation and serialization
- Repository Pattern for clean separation of data access logic
- Type Hints for full type safety

### Frontend Development

The frontend leverages Next.js 15 features:
- App Router for modern file-based routing
- Server Components for optimized rendering performance
- TypeScript for full type safety across the application
- Material-UI for professional, accessible UI components
- React Context for global state management

### API Development

- RESTful design with clean, predictable API endpoints
- OpenAPI Documentation auto-generated
- Consistent error handling
- Request/response validation with Pydantic

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify your Supabase credentials in `.env` file
- Check if your IP is whitelisted in Supabase
- Ensure the database is running

**Frontend Build Issues**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility (requires 18+)
- Verify environment variables are set correctly

**Authentication Problems**
- Confirm Supabase project settings
- Check redirect URLs configuration in Supabase dashboard
- Verify email templates setup

**AI Assistant Not Working**
- Verify `GROQ_API_KEY` is set in backend environment variables
- Check backend logs for API key loading messages
- Ensure Groq API key is valid and has credits

**CORS Errors**
- Verify backend CORS configuration includes your frontend domain
- Check that `NEXT_PUBLIC_API_URL` is set correctly in frontend
- Ensure backend is running and accessible

## License

This project is licensed under the MIT License.

## Acknowledgments

- Supabase for the database and auth platform
- FastAPI for the Python web framework
- Next.js for the React framework
- Material-UI for the component library
- Groq for the AI inference API
