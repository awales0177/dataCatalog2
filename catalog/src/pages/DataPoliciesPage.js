import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Fab,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Policy as PolicyIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import DataPolicyCard from '../components/DataPolicyCard';

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
      } catch {
        setError('Failed to load data standards');
        // Handle error silently
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
        (Array.isArray(policy.owner) ? policy.owner.join(' ').toLowerCase() : (policy.owner || '').toLowerCase()).includes(searchLower) ||
        policy.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredPolicies(filtered);
  }, [searchTerm, policies]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" sx={{ color: currentTheme.text }}>
          Loading data standards...
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
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
          Data Standards
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: currentTheme.textSecondary, maxWidth: 720, mx: 'auto' }}
        >
          Manage and monitor data standards.
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search standards by name, description, type, or tags..."
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



      {/* Standards grid */}
      <Grid container spacing={3}>
        {filteredPolicies.map(policy => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={policy.id}>
            <DataPolicyCard policy={policy} currentTheme={currentTheme} />
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
            No data standards found
          </Typography>
          <Typography variant="body2">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first standard to get started'}
          </Typography>
        </Box>
      )}

      {/* Floating action button for creating a new standard */}
      <Fab
        color="primary"
        aria-label="add new data standard"
        onClick={() => navigate('/standards/create')}
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
