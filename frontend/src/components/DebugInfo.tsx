'use client';
import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';

const DebugInfo: React.FC = () => {
  const debugInfo = {
    'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NODE_ENV': process.env.NODE_ENV,
    'Current URL': typeof window !== 'undefined' ? window.location.href : 'N/A',
    'User Agent': typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  };

  return (
    <Paper sx={{ p: 2, m: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        Debug Information
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {Object.entries(debugInfo).map(([key, value]) => (
        <Box key={key} sx={{ mb: 1 }}>
          <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
            {key}:
          </Typography>
          <Typography variant="body2" component="span" sx={{ ml: 1, fontFamily: 'monospace' }}>
            {value || 'undefined'}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default DebugInfo;
