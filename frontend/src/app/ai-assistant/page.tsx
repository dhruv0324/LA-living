'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { assistantApi, ChatMessage } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const EXAMPLE_PROMPTS = [
  "How much did I spend last month?",
  "What's my biggest expense category?",
  "Am I over budget this month?",
  "Suggest a budget for groceries based on my spending",
  "What's my savings rate?",
  "Forecast my expenses for next month",
  "How can I improve my financial health?",
  "What are my top 3 spending categories?",
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MAX_CHARACTERS = 500;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id || loading || input.length > MAX_CHARACTERS) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await assistantApi.chat({
        user_id: user.id,
        message: currentInput,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            color: 'white',
            textAlign: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
              <AssistantIcon sx={{ fontSize: 40 }} />
              <Typography variant="h3" component="h1" sx={{ 
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                AI Assistant (Beta)
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ 
              opacity: 0.9,
              fontWeight: 400
            }}>
              Get insights, forecasts, and recommendations about your finances
            </Typography>
          </Box>

          {/* Example Prompts */}
          {messages.length === 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LightbulbIcon color="primary" />
                  <Typography variant="h6">Try asking:</Typography>
                </Box>
                <Grid container spacing={2}>
                  {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Chip
                        label={prompt}
                        onClick={() => handleExampleClick(prompt)}
                        sx={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          height: 'auto',
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            cursor: 'pointer',
                          },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Chat Messages */}
          <Paper 
            sx={{ 
              mb: 2, 
              minHeight: 400, 
              maxHeight: 600,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.default'
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
                <AssistantIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  Start a conversation
                </Typography>
                <Typography variant="body2">
                  Ask me anything about your finances!
                </Typography>
              </Box>
            )}
            <Box>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      maxWidth: '80%',
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                        width: 32,
                        height: 32,
                      }}
                    >
                      {message.role === 'user' ? 'U' : <AssistantIcon sx={{ fontSize: 20 }} />}
                    </Avatar>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: message.role === 'user' ? 'primary.main' : 'grey.200',
                        borderRadius: 2,
                      }}
                    >
                      {message.role === 'user' ? (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            color: 'white',
                          }}
                        >
                          {message.content}
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            color: 'rgba(0, 0, 0, 0.87)',
                            '& p': {
                              margin: '0 0 8px 0',
                              '&:last-child': {
                                marginBottom: 0,
                              },
                            },
                            '& h1, & h2, & h3, & h4, & h5, & h6': {
                              marginTop: '16px',
                              marginBottom: '8px',
                              fontWeight: 600,
                              '&:first-child': {
                                marginTop: 0,
                              },
                            },
                            '& ul, & ol': {
                              margin: '8px 0',
                              paddingLeft: '24px',
                            },
                            '& li': {
                              margin: '4px 0',
                            },
                            '& strong': {
                              fontWeight: 600,
                            },
                            '& em': {
                              fontStyle: 'italic',
                            },
                            '& code': {
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              fontFamily: 'monospace',
                              fontSize: '0.9em',
                            },
                            '& pre': {
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              padding: '12px',
                              borderRadius: '4px',
                              overflow: 'auto',
                              '& code': {
                                backgroundColor: 'transparent',
                                padding: 0,
                              },
                            },
                          }}
                        >
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                      <AssistantIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Paper sx={{ p: 2, bgcolor: 'grey.200', borderRadius: 2 }}>
                      <CircularProgress size={20} />
                    </Paper>
                  </Box>
                </Box>
              )}
            </Box>
            <div ref={messagesEndRef} />
          </Paper>

          {/* Input Area */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Ask about your finances..."
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARACTERS) {
                    setInput(e.target.value);
                  }
                }}
                onKeyPress={handleKeyPress}
                disabled={loading}
                size="small"
                helperText={`${input.length}/${MAX_CHARACTERS} characters`}
                error={input.length > MAX_CHARACTERS}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={loading || !input.trim() || input.length > MAX_CHARACTERS}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
}

