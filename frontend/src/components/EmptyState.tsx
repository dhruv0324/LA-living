'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon
}: EmptyStateProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 6,
        textAlign: 'center',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ mb: 3 }}>
        {icon || (
          <Box
            sx={{
              width: 80,
              height: 80,
              backgroundColor: 'grey.100',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Typography variant="h3" sx={{ color: 'grey.400' }}>
              📭
            </Typography>
          </Box>
        )}
      </Box>

      <Typography
        variant="h6"
        component="h3"
        sx={{
          color: 'text.primary',
          fontWeight: 600,
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 4,
          maxWidth: 400,
          mx: 'auto',
          lineHeight: 1.5,
        }}
      >
        {description}
      </Typography>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
} 