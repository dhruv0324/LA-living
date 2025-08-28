# 💰 LA Living $ - Personal Finance Tracker

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.0+-blue?style=for-the-badge&logo=mui)](https://mui.com/)

A comprehensive personal finance management application built with modern web technologies. Track expenses, manage budgets, monitor loans, handle debts, and gain insights into your financial health with an intuitive dashboard.

## ✨ Features

### 🎯 Core Functionality
- **📊 Dashboard**: Comprehensive financial overview with real-time statistics
- **💸 Expense Tracking**: Categorize and monitor spending with automatic budget calculations
- **💰 Income Management**: Record and categorize income sources
- **🏦 Account Management**: Track multiple accounts with automatic balance updates
- **📈 Budget Planning**: Set monthly budgets and monitor spending progress
- **📊 Statistics & Analytics**: Visual charts and insights into your financial patterns

### 🔧 Advanced Features
- **👥 Debt Management**: Track money owed to you and money you owe to others
- **🏦 Loan Tracking**: Manage loans with disbursement monitoring
- **🏷️ Tag System**: Flexible categorization for expenses and income
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **🔐 Secure Authentication**: Supabase-powered user management
- **🌙 Dark/Light Theme**: Customizable interface themes

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel] (Coming Soon)
- **Backend API**: [Deployed on Railway] (Coming Soon)
- **API Documentation**: [Interactive Swagger Docs] (Coming Soon)

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Context + Hooks
- **Charts**: Recharts
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **ORM**: AsyncPG with custom repository pattern
- **Authentication**: Supabase Auth
- **Validation**: Pydantic models

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (Frontend) + Railway (Backend)

## 📁 Project Structure

```
US living/
├── 📁 backend/                    # FastAPI backend
│   ├── 📁 routes/                 # API route handlers
│   │   ├── accounts.py            # Account management
│   │   ├── budgets.py             # Budget operations
│   │   ├── debts.py               # Debt tracking
│   │   ├── expenses.py            # Expense management
│   │   ├── income.py              # Income tracking
│   │   ├── loans.py               # Loan management
│   │   └── users.py               # User operations
│   ├── 📄 models.py               # Pydantic data models
│   ├── 📄 database.py             # Database configuration
│   ├── 📄 main.py                 # FastAPI app entry point
│   ├── 📄 start.py                # Development server script
│   └── 📄 requirements.txt        # Python dependencies
├── 📁 frontend/                   # Next.js frontend
│   ├── 📁 src/
│   │   ├── 📁 app/                # Next.js app directory
│   │   │   ├── 📁 auth/           # Authentication pages
│   │   │   ├── 📁 budget/         # Budget management
│   │   │   ├── 📁 debts/          # Debt tracking
│   │   │   ├── 📁 expenses/       # Expense management
│   │   │   ├── 📁 income/         # Income tracking
│   │   │   ├── 📁 loans/          # Loan management
│   │   │   └── 📁 statistics/     # Analytics dashboard
│   │   ├── 📁 components/         # Reusable React components
│   │   ├── 📁 contexts/           # React contexts
│   │   ├── 📁 lib/                # Utility functions and API client
│   │   └── 📁 theme/              # UI theme configuration
│   ├── 📄 package.json            # Node.js dependencies
│   └── 📄 next.config.ts          # Next.js configuration
└── 📄 README.md                   # This file
```

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following key tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | User accounts and authentication | `id`, `email`, `name` |
| **accounts** | Financial accounts (bank, cash, etc.) | `account_id`, `user_id`, `balance` |
| **expenses** | Expense records | `expense_id`, `amount`, `category`, `date` |
| **income** | Income records | `income_id`, `amount`, `source`, `date` |
| **budgets** | Monthly budget limits | `budget_id`, `month`, `year`, `amount` |
| **loans** | Loan information | `loan_id`, `total_amount`, `remaining_amount` |
| **debts** | Personal debt tracking | `debt_id`, `person_name`, `amount`, `type` |
| **tags** | Categorization system | `tag_id`, `name`, `type` |

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **Supabase** account
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/la-living-finance.git
cd la-living-finance
```

### 2. Database Setup

1. **Create a Supabase project** at [https://supabase.com](https://supabase.com)
2. **Get your database credentials** from the project settings
3. **Run the setup SQL** in your Supabase SQL editor:

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Accounts Table
CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(account_id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category TEXT,
    place TEXT,
    payment_method TEXT,
    notes TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    tag_id UUID REFERENCES tags(tag_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Income Table
CREATE TABLE income (
    income_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(account_id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    source TEXT,
    notes TEXT,
    income_date DATE DEFAULT CURRENT_DATE,
    tag_id UUID REFERENCES tags(tag_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Budgets Table
CREATE TABLE budgets (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- Tags Table
CREATE TABLE tags (
    tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Expense', 'Income')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Loans Table
CREATE TABLE loans (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    taken_amount NUMERIC(12, 2) DEFAULT 0,
    remaining_amount NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - taken_amount) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Debts Table
CREATE TABLE debts (
    debt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(person_id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('OwedToMe', 'IOwe')),
    notes TEXT,
    debt_date DATE DEFAULT CURRENT_DATE,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- People Table
CREATE TABLE people (
    person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

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

# Set environment variables
export SUPABASE_DB_URL="postgresql://[username]:[password]@[host]:[port]/[database]"
export SUPABASE_ANON_KEY="your_supabase_anon_key"
export SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

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
cp supabase-env-template.txt .env.local

# Edit .env.local with your Supabase credentials
# Add your Supabase URL and anon key

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deploy!

### Backend Deployment (Railway)

1. **Prepare for Railway**:
   - Create a `railway.json` file in the backend directory
   - Ensure your `requirements.txt` is up to date

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Set environment variables:
     - `SUPABASE_DB_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Deploy!

## 📖 Usage Guide

### Getting Started

1. **Sign Up/Login**: Create an account or sign in with existing credentials
2. **Setup Payment Methods**: Add your bank accounts, credit cards, and cash accounts
3. **Set Budget**: Create monthly budgets for different spending categories
4. **Start Tracking**: Begin recording your income and expenses
5. **Monitor Progress**: Use the dashboard to track your financial health

### Key Features Walkthrough

#### 💰 Dashboard
- **Financial Overview**: See your total balance, monthly income/expenses
- **Budget Progress**: Visual representation of spending vs. budget
- **Quick Actions**: Add income/expenses directly from the dashboard
- **Recent Transactions**: Latest financial activities

#### 📊 Expenses Management
- **Add Expenses**: Record spending with categories, locations, and notes
- **Payment Methods**: Link expenses to specific accounts
- **Budget Tracking**: Automatic budget calculation and alerts
- **Search & Filter**: Find specific expenses by date, category, or amount

#### 🏦 Account Management
- **Multiple Accounts**: Manage bank accounts, credit cards, and cash
- **Balance Tracking**: Real-time balance updates
- **Transaction History**: View all income/expenses for each account

#### 👥 Debt Tracking
- **Personal Debts**: Track money owed to you and money you owe
- **Contact Management**: Organize debts by person
- **Settlement Options**: Individual or net settlement
- **Integration**: Settled debts automatically appear in income/expenses

## 🔧 Development

### Backend Development

The backend uses FastAPI with modern Python patterns:

- **Async/Await**: Full async support for better performance
- **Pydantic Models**: Automatic data validation and serialization
- **Repository Pattern**: Clean separation of data access logic
- **Type Hints**: Full TypeScript-like type safety

### Frontend Development

The frontend leverages Next.js 15 features:

- **App Router**: Modern file-based routing
- **Server Components**: Optimized rendering performance
- **TypeScript**: Full type safety across the application
- **Material-UI**: Professional, accessible UI components

### API Development

- **RESTful Design**: Clean, predictable API endpoints
- **OpenAPI Documentation**: Auto-generated API docs
- **Error Handling**: Consistent error responses
- **Validation**: Request/response validation with Pydantic

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow existing code formatting and patterns
- **Testing**: Add tests for new features
- **Documentation**: Update README and code comments
- **Commits**: Use clear, descriptive commit messages

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify your Supabase credentials
   - Check if your IP is whitelisted
   - Ensure the database is running

2. **Frontend Build Issues**:
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

3. **Authentication Problems**:
   - Confirm Supabase project settings
   - Check redirect URLs configuration
   - Verify email templates setup

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
- **Open Source Community** for inspiration and tools

## 📞 Support

- **Documentation**: Check this README and API docs first
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Email**: [your-email@example.com] (Optional)

---

**Made with ❤️ for better financial management**

*Star this repository if you find it helpful!* 