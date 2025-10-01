import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Chip
} from '@mui/material';
import {
  SwapHoriz as RoleIcon,
  Visibility as EyeIcon,
  Edit as EditIcon,
  Diamond as CrownIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

const RolePage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { changeRole, switchRole, isAuthenticated, setAuthData, user } = useAuth();
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Only redirect if already authenticated and not trying to change roles
  useEffect(() => {
    if (isAuthenticated() && !location.state?.changeRole) {
      // If we have a from location, go there, otherwise stay on current page
      const from = location.state?.from?.pathname;
      if (from && from !== '/role') {
        navigate(from, { replace: true });
      } else {
        // If no specific from location, go to models page (main content)
        navigate('/models', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location]);

  // Set current role as selected when changing roles
  useEffect(() => {
    if (location.state?.changeRole && user) {
      setSelectedRole(user.currentRole || 'reader');
    }
  }, [location.state?.changeRole, user]);

  // PKI Plugin Interface - All roles available for now
  const pkiPlugin = {
    authenticate: async (role) => {
      // All roles are available without restrictions
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            user: {
              username: 'user',
              roles: ['reader', 'editor', 'admin'], // All roles
              currentRole: role, // Set the selected role as current
              full_name: 'User',
              email: 'user@example.com'
            }
          });
        }, 500); // Faster for testing
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const result = await pkiPlugin.authenticate(selectedRole);
      
      if (result.success) {
        // Store the authenticated user in localStorage
        const token = 'pki_token_' + Date.now();
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Update the auth context immediately
        setAuthData(token, result.user);
        
        // Change to the selected role
        switchRole(selectedRole);
        
        // Navigate to intended destination or models page
        const from = location.state?.from?.pathname;
        if (from && from !== '/role') {
          navigate(from, { replace: true });
        } else {
          // If no specific from location, go to models page (main content)
          navigate('/models', { replace: true });
        }
      } else {
        setError(result.error || 'PKI authentication failed');
      }
    } catch (err) {
      setError('PKI authentication error: ' + err.message);
    }
    
    setLoading(false);
  };

  const availableRoles = [
    { value: 'reader', label: 'Reader', icon: <EyeIcon />, color: 'primary', description: 'View all data, no editing' },
    { value: 'editor', label: 'Editor', icon: <EditIcon />, color: 'secondary', description: 'Full access to create, edit, and delete' },
    { value: 'admin', label: 'Admin', icon: <CrownIcon />, color: 'error', description: 'All permissions including user management' }
  ];

  const getRoleIcon = (role) => {
    const roleData = availableRoles.find(r => r.value === role);
    return roleData ? roleData.icon : <SecurityIcon />;
  };

  return (
    <Dialog
      open={true}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: currentTheme.card,
          color: currentTheme.text,
          border: `1px solid ${currentTheme.border}`,
        },
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <RoleIcon sx={{ fontSize: 48, color: currentTheme.primary, mb: 2 }} />
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ color: currentTheme.text }}
          >
            Change Role
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: currentTheme.textSecondary }}
          >
            Select a different role to change your permissions
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              bgcolor: currentTheme.error + '20',
              color: currentTheme.text,
              '& .MuiAlert-icon': {
                color: currentTheme.error,
              }
            }}
          >
            {error}
          </Alert>
        )}

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            PKI Integration
          </Typography>
        </Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }} gutterBottom>
            Quick role selection for testing:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
            {availableRoles.map((role) => (
              <Chip
                key={role.value}
                label={role.label}
                color={role.color}
                variant={selectedRole === role.value ? "filled" : "outlined"}
                clickable
                onClick={() => setSelectedRole(role.value)}
                icon={role.icon}
                sx={{ 
                  mb: 1,
                  borderColor: selectedRole === role.value ? 'transparent' : currentTheme.border,
                  color: selectedRole === role.value ? 'white' : currentTheme.text,
                  bgcolor: selectedRole === role.value ? `${role.color}.main` : 'transparent',
                  '&:hover': {
                    bgcolor: selectedRole === role.value 
                      ? `${role.color}.dark` 
                      : currentTheme.primary + '20',
                  },
                  fontWeight: selectedRole === role.value ? 600 : 400,
                  transform: selectedRole === role.value ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: currentTheme.background, borderRadius: 1, border: `1px solid ${currentTheme.border}` }}>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }} align="center">
            <strong style={{ color: currentTheme.text }}>Development Mode:</strong><br />
            All roles are currently available for testing.<br />
            Replace <code style={{ color: currentTheme.primary }}>pkiPlugin.authenticate()</code> with your PKI implementation.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          size="large"
          disabled={loading || !selectedRole}
          onClick={handleSubmit}
          sx={{ 
            minWidth: 200,
            bgcolor: currentTheme.primary,
            color: currentTheme.background,
            '&:hover': {
              bgcolor: currentTheme.primaryHover || currentTheme.primary,
            },
            '&:disabled': {
              bgcolor: currentTheme.textSecondary + '40',
              color: currentTheme.textSecondary,
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Change Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolePage;
