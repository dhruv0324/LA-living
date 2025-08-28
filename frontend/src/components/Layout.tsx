'use client';
import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  IconButton,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  Receipt,
  People,
  CreditCard,
  TrendingUp,
  Analytics,
  Assessment,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'dashboard', text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { id: 'expenses', text: 'Expenses', icon: <Receipt />, path: '/expenses' },
    { id: 'income', text: 'Income', icon: <TrendingUp />, path: '/income' },
    { id: 'budget', text: 'Budget', icon: <Assessment />, path: '/budget' },
    { id: 'payment-methods', text: 'Payment Methods', icon: <AccountBalance />, path: '/payment-methods' },
    { id: 'debts', text: 'Debts', icon: <People />, path: '/debts' },
    { id: 'loans', text: 'Loans', icon: <CreditCard />, path: '/loans' },
    { id: 'statistics', text: 'Statistics', icon: <Analytics />, path: '/statistics' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/landing');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
      }}>
        <Typography variant="h6" noWrap component="div" sx={{ 
          fontWeight: 700,
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          🌴 LA living $
        </Typography>
      </Toolbar>
      
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            sx={{
              cursor: 'pointer',
              mx: 1,
              mb: 0.5,
              borderRadius: 2,
              backgroundColor: pathname === item.path ? 'primary.main' : 'transparent',
              color: pathname === item.path ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: pathname === item.path ? 'primary.dark' : 'action.hover',
                transform: 'translateX(4px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ 
              color: pathname === item.path ? 'primary.contrastText' : 'primary.main',
              minWidth: 40,
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: pathname === item.path ? 600 : 500,
                fontSize: '0.95rem',
              }}
            />
          </ListItem>
        ))}
      </List>
      
      {/* User Info and Logout */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        {user && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Welcome back,
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
              {user.name}
            </Typography>
          </Box>
        )}
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              borderColor: 'primary.light',
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
      
      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        backgroundColor: 'background.elevated'
      }}>
        <Typography variant="caption" sx={{ 
          color: 'text.secondary',
          display: 'block',
          textAlign: 'center'
        }}>
          v1.0.0 • Built with ❤️
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease, margin-left 0.3s ease',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          {isMobile && (
            <IconButton
              color="primary"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {!isMobile && (
            <IconButton
              color="primary"
              aria-label={sidebarOpen ? "hide sidebar" : "show sidebar"}
              edge="start"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ 
                mr: 2,
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }
              }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
          <Typography variant="h5" noWrap component="div" sx={{
            fontWeight: 600,
            color: 'text.primary',
            flex: 1,
          }}>
            {menuItems.find(item => item.path === pathname)?.text || '🌴 LA living $'}
          </Typography>
          
          {/* Optional: Add a status indicator or user info */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            backgroundColor: 'success.main',
            color: 'success.contrastText',
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: 'success.contrastText',
              animation: 'pulse 2s infinite'
            }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Live
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ 
          width: { md: sidebarOpen ? drawerWidth : 0 }, 
          flexShrink: { md: 0 },
          transition: 'width 0.3s ease',
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          width: { md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        <Box sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1400px',
          mx: 'auto',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 