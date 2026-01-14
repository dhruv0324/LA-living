# 💰 LA Living $ - Personal Finance Tracker

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Material-UI](https://img.shields.io/badge/Material--UI-6.0+-blue?style=for-the-badge&logo=mui)](https://mui.com/)

A comprehensive personal finance management application built with modern web technologies. Track expenses, manage budgets, monitor loans, handle debts, and gain insights into your financial health with an intuitive dashboard and AI-powered financial assistant.

## ✨ Features

### 🎯 Core Functionality
- **📊 Dashboard**: Comprehensive financial overview with real-time statistics and insights
- **💸 Expense Tracking**: Categorize and monitor spending with automatic budget calculations
- **💰 Income Management**: Record and categorize income sources with detailed tracking
- **🏦 Wallet Management**: Track multiple accounts (bank, cash, credit cards) with automatic balance updates
- **📈 Budget Planning**: Set monthly budgets and monitor spending progress with visual indicators
- **📊 Statistics & Analytics**: Visual charts and insights into your financial patterns, trends, and health

### 🔧 Advanced Features
- **🤖 AI Financial Assistant**: Get personalized financial insights, forecasts, budget suggestions, and Q&A powered by Groq AI
- **👥 Debt Management**: Track money owed to you and money you owe to others with settlement tracking
- **🏦 Loan Tracking**: Manage loans with disbursement monitoring and utilization tracking
- **🏷️ Tag System**: Flexible categorization system for expenses and income
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **🔐 Secure Authentication**: Supabase-powered user management with email/password
- **🌙 Modern UI**: Clean, intuitive interface built with Material-UI

## 🚀 Live Demo

- **Frontend**: Deployed on Render (Coming Soon)
- **Backend API**: Deployed on Render (Coming Soon)
- **API Documentation**: Available at `/docs` endpoint when backend is running

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v6
- **State Management**: React Context + Hooks
- **Charts**: Recharts & Chart.js
- **HTTP Client**: Axios
- **Markdown Rendering**: react-markdown

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase Python Client with custom repository pattern
- **Authentication**: Supabase Auth
- **Validation**: Pydantic models
- **AI Integration**: Groq API (qwen3-32b model)

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Render (Frontend + Backend)
- **AI Service**: Groq

## 📁 Project Structure

```
US living/
├── 📁 backend/                    # FastAPI backend
│   ├── 📁 routes/                 # API route handlers
│   │   ├── accounts.py            # Account (Wallet) management
│   │   ├── assistant.py           # AI financial assistant
│   │   ├── budgets.py             # Budget operations
│   │   ├── debts.py               # Debt tracking
│   │   ├── expenses.py            # Expense management
│   │   ├── income.py              # Income tracking
│   │   ├── loans.py               # Loan management
│   │   ├── loan_disbursements.py  # Loan disbursement tracking
│   │   ├── people.py              # People management for debts
│   │   ├── tags.py                # Tag/category management
│   │   └── users.py               # User operations
│   ├── 📄 models.py               # Pydantic data models
│   ├── 📄 database.py             # Database configuration
│   ├── 📄 main.py                 # FastAPI app entry point
│   ├── 📄 start.py                # Production server script
│   ├── 📄 requirements.txt        # Python dependencies
│   └── 📄 .env                    # Environment variables (not in git)
├── 📁 frontend/                   # Next.js frontend
│   ├── 📁 src/
│   │   ├── 📁 app/                # Next.js app directory
│   │   │   ├── 📁 ai-assistant/   # AI assistant page
│   │   │   ├── 📁 auth/           # Authentication pages
│   │   │   ├── 📁 budget/         # Budget management
│   │   │   ├── 📁 debts/          # Debt tracking
│   │   │   ├── 📁 expenses/       # Expense management
│   │   │   ├── 📁 income/         # Income tracking
│   │   │   ├── 📁 loans/          # Loan management
│   │   │   ├── 📁 payment-methods/ # Wallet management
│   │   │   ├── 📁 statistics/     # Analytics dashboard
│   │   │   └── 📄 page.tsx        # Dashboard
│   │   ├── 📁 components/         # Reusable React components
│   │   ├── 📁 contexts/           # React contexts (Auth)
│   │   ├── 📁 lib/                # Utility functions and API client
│   │   └── 📁 theme/              # UI theme configuration
│   ├── 📄 package.json            # Node.js dependencies
│   └── 📄 next.config.ts           # Next.js configuration
└── 📄 README.md                   # This file
```

## 🗄️ Database Schema

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

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **Supabase** account
- **Groq API** key (for AI assistant feature)
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/dhruv0324/LA-living.git
cd LA-living
```

### 2. Database Setup

1. **Create a Supabase project** at [https://supabase.com](https://supabase.com)
2. **Get your database credentials** from the project settings (Settings → API)
3. **Run the setup SQL** in your Supabase SQL editor (see SQL schema below)

### 3. Backend Setup

```bash
# Navigate to backend directory
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

# Create .env file
cp render-env-template.txt .env

# Edit .env with your credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# GROQ_API_KEY=your_groq_api_key

# Start the server
python start.py
```

The backend will be available at `http://localhost:8000`

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp vercel-env-template.txt .env.local

# Edit .env.local with your credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🚀 Deployment

### Deploy Both Services on Render

Both frontend and backend are deployed on Render for unified hosting.

#### Option 1: Using Render Blueprint (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Deploy via Render Blueprint**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository: `dhruv0324/LA-living`
   - Render will automatically detect the `render.yaml` file
   - Review the configuration and click "Apply"
   - Both services will be created automatically

3. **Set Environment Variables**:
   
   **For Backend Service (`expense-tracker-backend`):**
   - `SUPABASE_URL` = (your Supabase URL)
   - `SUPABASE_ANON_KEY` = (your Supabase anon key)
   - `GROQ_API_KEY` = (your Groq API key)
   - `PORT` = `8000` (optional, Render sets this automatically)
   
   **For Frontend Service (`expense-tracker-frontend`):**
   - `NEXT_PUBLIC_API_URL` = `https://expense-tracker-backend.onrender.com` (use your actual backend URL)
   - `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your Supabase anon key)
   - `NODE_ENV` = `production` (already set in render.yaml)
   - `PORT` = `3000` (optional, Render sets this automatically)

4. **Wait for Deployment**: Both services will deploy (5-10 minutes each)

#### Option 2: Manual Deployment

**Backend Deployment:**

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `dhruv0324/LA-living`
4. Configure:
   - **Name:** `expense-tracker-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python start.py`
   - **Branch:** `main`
5. Add Environment Variables (see above)
6. Select **Free** tier
7. Click "Create Web Service"

**Frontend Deployment:**

1. **Deploy Backend First**: Make sure your backend is deployed and running
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository: `dhruv0324/LA-living`
5. Configure:
   - **Name:** `expense-tracker-frontend`
   - **Root Directory:** `frontend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Branch:** `main`
6. Add Environment Variables (see above, use your backend URL for `NEXT_PUBLIC_API_URL`)
7. Select **Free** tier
8. Click "Create Web Service"

### Important Deployment Notes

- **Render Free Tier**: Services spin down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.
- **Environment Variables**: Never commit `.env` files. Always set them in Render dashboard.
- **CORS**: Already configured in `backend/main.py` for `*.onrender.com` domains.
- **Auto-deploy**: Both services will auto-deploy on push to `main` branch when connected to GitHub.
- **Service URLs**: Your services will be available at:
  - Backend: `https://expense-tracker-backend.onrender.com`
  - Frontend: `https://expense-tracker-frontend.onrender.com`

## 📖 Usage Guide

### Getting Started

1. **Sign Up/Login**: Create an account or sign in with existing credentials
2. **Setup Wallet**: Add your bank accounts, credit cards, and cash accounts
3. **Set Budget**: Create monthly budgets for different spending categories
4. **Start Tracking**: Begin recording your income and expenses
5. **Monitor Progress**: Use the dashboard to track your financial health
6. **Use AI Assistant**: Get insights, forecasts, and recommendations about your finances

### Key Features Walkthrough

#### 💰 Dashboard
- **Financial Overview**: See your total balance, monthly income/expenses, and savings
- **Budget Progress**: Visual representation of spending vs. budget
- **Quick Actions**: Add income/expenses directly from the dashboard
- **Recent Transactions**: Latest financial activities
- **Pro Tips**: Helpful tips for new users

#### 📊 Expenses Management
- **Add Expenses**: Record spending with categories, locations, payment methods, and notes
- **Payment Methods**: Link expenses to specific accounts (wallet)
- **Budget Tracking**: Automatic budget calculation and alerts
- **Search & Filter**: Find specific expenses by date, category, or amount
- **Calendar View**: View expenses by date in a calendar format

#### 💵 Income Management
- **Add Income**: Record income with sources, accounts, and categories
- **Account Tracking**: Link income to specific accounts
- **Search & Filter**: Find specific income records
- **Calendar View**: View income by date

#### 🏦 Wallet Management
- **Multiple Accounts**: Manage bank accounts, credit cards, and cash
- **Balance Tracking**: Real-time balance updates based on transactions
- **Account History**: View all income/expenses for each account

#### 👥 Debt Tracking
- **People Management**: Add and manage people you have financial relationships with
- **Debt Types**: Track money owed to you (OwedToMe) and money you owe (IOwe)
- **Settlement**: Settle individual debts or all debts with a person
- **Account Integration**: OwedToMe debts deduct from accounts; settlements transfer between accounts
- **Automatic Tracking**: Settled debts automatically appear in income/expenses

#### 🏦 Loan Management
- **Loan Creation**: Create loans with total amount and name
- **Disbursements**: Track individual loan disbursements with categories
- **Utilization Tracking**: Monitor how much of the loan has been used
- **Remaining Amount**: Automatic calculation of remaining loan amount

#### 🤖 AI Financial Assistant
- **Financial Insights**: Get personalized insights about your spending patterns
- **Forecasting**: Predict future expenses and income trends
- **Budget Suggestions**: Receive AI-powered budget recommendations
- **Q&A**: Ask questions about your financial data
- **Goal Planning**: Get help with financial goal planning

#### 📊 Statistics & Analytics
- **Financial Overview**: Net worth, savings rate, and financial health metrics
- **Income & Expense Trends**: Timeline visualization of income and expenses
- **Budget Analysis**: Budget vs. actual spending comparison
- **Loan Analysis**: Detailed loan information including disbursements over time
- **Category Analysis**: Top spending categories and income sources

## 🔧 Development

### Backend Development

The backend uses FastAPI with modern Python patterns:

- **Async/Await**: Full async support for better performance
- **Pydantic Models**: Automatic data validation and serialization
- **Repository Pattern**: Clean separation of data access logic
- **Type Hints**: Full TypeScript-like type safety
- **Environment Variables**: Secure configuration management

### Frontend Development

The frontend leverages Next.js 15 features:

- **App Router**: Modern file-based routing
- **Server Components**: Optimized rendering performance
- **TypeScript**: Full type safety across the application
- **Material-UI**: Professional, accessible UI components
- **React Context**: Global state management for authentication

### API Development

- **RESTful Design**: Clean, predictable API endpoints
- **OpenAPI Documentation**: Auto-generated API docs at `/docs`
- **Error Handling**: Consistent error responses
- **Validation**: Request/response validation with Pydantic
- **CORS**: Properly configured for production deployment

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs` (development) or `https://your-backend-url.onrender.com/docs` (production)
- **ReDoc**: `http://localhost:8000/redoc` (development) or `https://your-backend-url.onrender.com/redoc` (production)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify your Supabase credentials in `.env` file
   - Check if your IP is whitelisted in Supabase
   - Ensure the database is running

2. **Frontend Build Issues**:
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility (requires 18+)
   - Verify environment variables are set correctly

3. **Authentication Problems**:
   - Confirm Supabase project settings
   - Check redirect URLs configuration in Supabase dashboard
   - Verify email templates setup

4. **AI Assistant Not Working**:
   - Verify `GROQ_API_KEY` is set in backend environment variables
   - Check backend logs for API key loading messages
   - Ensure Groq API key is valid and has credits

5. **CORS Errors**:
   - Verify backend CORS configuration includes your frontend domain
   - Check that `NEXT_PUBLIC_API_URL` is set correctly in frontend
   - Ensure backend is running and accessible

### Getting Help

- **Check the logs** for detailed error messages
- **Review the API docs** for endpoint information
- **Create an issue** with detailed problem description
- **Check existing issues** for similar problems

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent database and auth platform
- **FastAPI** for the modern, fast Python web framework
- **Next.js** for the amazing React framework
- **Material-UI** for the beautiful component library
- **Groq** for the fast AI inference API
- **Open Source Community** for inspiration and tools

## 📞 Support

- **Documentation**: Check this README and API docs first
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

---

**Made with ❤️ for better financial management**

*Star this repository if you find it helpful!*
