'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { authHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Sign in with email
      const { data, error: signInError } = await authHelpers.signInWithEmail(
        formData.email,
        formData.password
      );

      if (signInError) {
        setError(signInError.message);
      } else {
        // Redirect to dashboard
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordMessage('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setForgotPasswordMessage('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      const { error } = await authHelpers.resetPassword(forgotPasswordEmail);
      
      if (error) {
        setForgotPasswordMessage(error.message);
      } else {
        setForgotPasswordMessage('Password reset email sent! Please check your inbox.');
        setForgotPasswordEmail('');
      }
    } catch (err) {
      setForgotPasswordMessage('An unexpected error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(31, 41, 55, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(20, 184, 166, 0.1)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              🌴 LA living $
            </Typography>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Sign in with your email to continue managing your finances
            </Typography>
          </Box>

          {!showForgotPassword ? (
            /* Login Form */
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'primary.main' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
                <Link
                  component="button"
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    // Pre-fill the forgot password email with the login email
                    setForgotPasswordEmail(formData.email);
                  }}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(20, 184, 166, 0.3)',
                  },
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Don't have an account?{' '}
                  <Link
                    href="/auth/signup"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </Box>
          ) : (
            /* Forgot Password Form */
            <Box>
              <Box component="form" onSubmit={handleForgotPassword} sx={{ mt: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ color: 'text.primary', mb: 2, textAlign: 'center' }}
                >
                  Reset Password
                </Typography>
                
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}
                >
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>

                {forgotPasswordMessage && (
                  <Alert 
                    severity={forgotPasswordMessage.includes('sent') ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                  >
                    {forgotPasswordMessage}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => {
                    setForgotPasswordEmail(e.target.value);
                    if (forgotPasswordMessage) setForgotPasswordMessage('');
                  }}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={forgotPasswordLoading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(20, 184, 166, 0.3)',
                    },
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {forgotPasswordLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link
                    component="button"
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordMessage('');
                      setForgotPasswordEmail('');
                    }}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Back to Sign In
                  </Link>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
} 