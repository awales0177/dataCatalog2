import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Badge,
  alpha,
  Fab,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Assessment as AssessmentIcon,
  Policy as PolicyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ReadMore as ReadMoreIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DataPoliciesPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const data = await fetchData('policies');
        setPolicies(data.policies || []);
        setError(null);
      } catch (err) {
        setError('Failed to load policies');
        console.error('Error loading policies:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();
  }, []);

  useEffect(() => {
    let filtered = policies;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(policy =>
        policy.name.toLowerCase().includes(searchLower) ||
        policy.description.toLowerCase().includes(searchLower) ||
        policy.type.toLowerCase().includes(searchLower) ||
        policy.category.toLowerCase().includes(searchLower) ||
        policy.owner.toLowerCase().includes(searchLower) ||
        policy.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredPolicies(filtered);
  }, [searchTerm, policies]);

  const getPolicyTypeIcon = (type) => {
    switch (type) {
      case 'retention':
        return <StorageIcon />;
      case 'quality':
        return <AssessmentIcon />;
      case 'access':
        return <SecurityIcon />;
      case 'compliance':
        return <PolicyIcon />;
      default:
        return <PolicyIcon />;
    }
  };

  const getPolicyTypeColor = (type) => {
    switch (type) {
      case 'retention':
        return '#2196f3'; // Blue
      case 'quality':
        return '#4caf50'; // Green
      case 'access':
        return '#ff9800'; // Orange
      case 'compliance':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Grey
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#2196f3';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'draft':
        return '#ff9800';
      case 'review':
        return '#2196f3';
      case 'expired':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };



  const renderPolicyCard = (policy) => {
    const typeColor = getPolicyTypeColor(policy.type);
    const priorityColor = getPriorityColor(policy.priority);
    const statusColor = getStatusColor(policy.status);

    return (
      <Card 
        key={policy.id}
        elevation={0}
        sx={{ 
          height: '100%',
          minHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            '& .action-buttons': {
              opacity: 1,
            },
          },
          position: 'relative',
        }}
      >
        {/* Action buttons */}
        <Box 
          className="action-buttons"
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            display: 'flex', 
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <Tooltip title="Edit Policy">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/policies/edit/${policy.id}`);
              }}
              sx={{ 
                bgcolor: alpha(currentTheme.primary, 0.1),
                color: currentTheme.primary,
                '&:hover': {
                  bgcolor: currentTheme.primary,
                  color: 'white',
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 3, pr: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              color: currentTheme.text, 
              fontWeight: 600,
              mb: 2,
              lineHeight: 1.3,
              pr: 1
            }}>
              {policy.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: currentTheme.textSecondary,
                mb: 3,
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 'unset',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxHeight: '120px',
                overflowY: 'auto'
              }}
            >
              {policy.description}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PersonIcon sx={{ fontSize: 16, color: currentTheme.textSecondary }} />
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
              {policy.owner}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {policy.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: currentTheme.border,
                  color: currentTheme.textSecondary,
                  fontSize: '0.7rem'
                }}
              />
            ))}
            {policy.tags.length > 3 && (
              <Chip
                label={`+${policy.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: currentTheme.border,
                  color: currentTheme.textSecondary,
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ p: 3, pt: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={policy.status}
            size="small"
            sx={{
              bgcolor: alpha(statusColor, 0.1),
              color: statusColor,
              fontWeight: 600,
              textTransform: 'capitalize'
            }}
          />
          <Button
            size="small"
            startIcon={<ReadMoreIcon />}
            onClick={() => {
              // Use policy.externalLink if available, otherwise create a default external link
              const externalLink = policy.externalLink || policy.documentation || `https://company.com/policies/${policy.id}`;
              window.open(externalLink, '_blank', 'noopener,noreferrer');
            }}
            sx={{
              color: currentTheme.textSecondary,
              '&:hover': {
                bgcolor: alpha(currentTheme.textSecondary, 0.1)
              }
            }}
          >
            View Details
          </Button>
        </CardActions>
      </Card>
    );
  };

  const policyTypes = [
    { type: 'retention', label: 'Retention', icon: <StorageIcon />, color: '#2196f3' },
    { type: 'quality', label: 'Quality', icon: <AssessmentIcon />, color: '#4caf50' },
    { type: 'access', label: 'Access', icon: <SecurityIcon />, color: '#ff9800' },
    { type: 'compliance', label: 'Compliance', icon: <PolicyIcon />, color: '#f44336' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" sx={{ color: currentTheme.text }}>
          Loading policies...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Box>
    );
  }



  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Policies
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Manage and monitor data governance policies including retention, quality, access control, and compliance requirements.
      </Typography>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search policies by name, description, type, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
              '&:hover fieldset': {
                borderColor: currentTheme.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: currentTheme.primary,
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
      </Box>



      {/* Policies Grid */}
      <Grid container spacing={3}>
        {filteredPolicies.map(policy => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={policy.id}>
            {renderPolicyCard(policy)}
          </Grid>
        ))}
      </Grid>

      {filteredPolicies.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8, 
          color: currentTheme.textSecondary 
        }}>
          <PolicyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No policies found
          </Typography>
          <Typography variant="body2">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first policy to get started'}
          </Typography>
        </Box>
      )}

      {/* Floating Action Button for creating new policies */}
      <Fab
        color="primary"
        aria-label="add new policy"
        onClick={() => navigate('/policies/create')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: currentTheme.primary,
          color: currentTheme.background,
          '&:hover': {
            bgcolor: currentTheme.primaryDark || currentTheme.primary
          },
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            bgcolor: currentTheme.card, 
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DataPoliciesPage;
