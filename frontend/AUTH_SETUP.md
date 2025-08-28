# 🔐 Authentication Setup Guide

This guide will help you set up Supabase authentication for the LA living $ application.

## 🌴 What's Included

The authentication system includes:

- **Signup Page** (`/auth/signup`) - Register with name, username, email, and password
- **Login Page** (`/auth/login`) - Sign in with email/username and password
- **Forgot Password** - Reset password functionality integrated into login page
- **Reset Password Page** (`/auth/reset-password`) - Handle password reset from email links
- **Test Page** (`/auth/test`) - Easy access to test all auth pages

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `la-living-finance` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (takes ~2 minutes)

### 2. Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment Variables

1. In the `frontend` directory, create a file named `.env.local`
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following settings:

#### Site URL
- Set to: `http://localhost:3000` (for development)
- For production, use your actual domain

#### Email Confirmation (IMPORTANT)
- **Disable** "Enable email confirmations" for simplified signup
- This allows users to create accounts without email verification

#### Redirect URLs
Add these URLs:
- `http://localhost:3000/auth/reset-password`
- `http://localhost:3000` (or your production domain)

#### Email Templates (Optional)
You can customize the email templates in **Authentication** → **Email Templates**

### 6. Test the Authentication

1. Start the development server:
```bash
npm run dev
```

2. Visit the test page: `http://localhost:3000/auth/test`

3. Test each authentication flow:
   - **Signup**: Create a new account
   - **Login**: Sign in with your credentials
   - **Forgot Password**: Test password reset flow

## 📋 Features

### Signup Page Features
- ✅ Full name validation
- ✅ Username uniqueness (handled by Supabase metadata)
- ✅ Email validation and uniqueness
- ✅ Password strength requirements (min 6 characters)
- ✅ Real-time form validation
- ✅ No email verification required - instant account creation
- ✅ Beautiful dark theme UI matching app design

### Login Page Features
- ✅ Email/username input (currently email-only, username requires additional setup)
- ✅ Password visibility toggle
- ✅ Forgot password integration
- ✅ Form validation and error handling
- ✅ Smooth transitions and loading states

### Password Reset Features
- ✅ Email-based password reset
- ✅ Secure token validation
- ✅ Password confirmation matching
- ✅ Auto-redirect after successful reset

## 🎨 Design Features

All authentication pages feature:
- 🌴 **LA living $** branding with palm tree emoji
- 🎨 Dark gradient background matching app theme
- ✨ Glassmorphism design with backdrop blur
- 🔥 Teal gradient buttons and accents
- 📱 Fully responsive design
- ⚡ Smooth animations and transitions

## 🔧 Advanced Configuration

### Username Login Support
To enable username login, you'll need to:
1. Create a `profiles` table in Supabase
2. Store username-to-email mapping
3. Update the login logic to query the profiles table

### Custom Email Templates
Customize email templates in Supabase dashboard:
- **Authentication** → **Email Templates**
- Edit confirmation, recovery, and invite templates

### 5. Database Setup (REQUIRED)

You need to create the users table and set up proper permissions:

```sql
-- Create the users table (if not already created)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_username_key UNIQUE (username)
) TABLESPACE pg_default;

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own record during signup
CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own record
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
```

**Important:** Run these SQL commands in your Supabase SQL Editor before testing the authentication.

## 🚨 Security Notes

- ✅ All passwords are hashed by Supabase
- ✅ JWT tokens are used for session management
- ✅ No email verification required (simplified for personal use)
- ✅ Rate limiting is handled by Supabase
- ✅ SQL injection protection via Supabase client

## 🔗 Integration with Main App

The authentication pages are currently separate from the main app. To integrate:

1. Add authentication checks to protected routes
2. Create auth context for user state management
3. Update navigation to show login/logout options
4. Connect user data to the financial tracking features

## 🎯 Next Steps

1. Set up your Supabase project
2. Configure environment variables
3. Test all authentication flows
4. Customize email templates (optional)
5. Set up user profiles table (optional)
6. Integrate with main application

---

**Need help?** Check the [Supabase Documentation](https://supabase.com/docs/guides/auth) for more detailed information about authentication features. 