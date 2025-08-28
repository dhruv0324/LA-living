'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

export default function LandingPage() {
  const router = useRouter();

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
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Branding and description */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                  fontSize: { xs: '3rem', md: '4rem' },
                }}
              >
                🌴 LA living $
              </Typography>
              
              <Typography
                variant="h5"
                sx={{
                  color: 'text.primary',
                  fontWeight: 400,
                  mb: 3,
                  opacity: 0.9,
                }}
              >
                Your personal finance companion for the LA lifestyle
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                }}
              >
                Track expenses, manage budgets, monitor loans and debts, and gain insights into your financial health - all in one beautiful, intuitive app.
              </Typography>

              {/* Feature highlights */}
              <Stack direction="row" spacing={3} sx={{ mb: 4, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Box sx={{ textAlign: 'center' }}>
                  <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Accounts
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Analytics
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <AssessmentIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Budgets
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>

          {/* Right side - Auth options */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Paper
                elevation={24}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(31, 41, 55, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(20, 184, 166, 0.1)',
                  maxWidth: 400,
                  width: '100%',
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 1,
                    textAlign: 'center',
                  }}
                >
                  Get Started
                </Typography>
                
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 4,
                    textAlign: 'center',
                  }}
                >
                  Join thousands managing their finances smarter
                </Typography>

                <Stack spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/auth/signup')}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                      },
                      fontWeight: 600,
                      fontSize: '1.1rem',
                    }}
                  >
                    Create Account
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => router.push('/auth/login')}
                    sx={{
                      py: 1.5,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.light',
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                      },
                      fontWeight: 600,
                      fontSize: '1.1rem',
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>

                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    display: 'block',
                    mt: 3,
                  }}
                >
                  Secure • Private • Free to use
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 