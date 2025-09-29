import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import ApplicationCard from '../components/ApplicationCard';
import Pagination from '../components/Pagination';
import { useLocation, useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

const ApplicationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  // Initialize searchQuery from URL param if present
  const getInitialSearch = () => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  };
  const [searchQuery, setSearchQuery] = useState(getInitialSearch());
  const [selectedRole, setSelectedRole] = useState('');
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Role options for the picker
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'data_producer', label: 'Data Producer' },
    { value: 'data_consumer', label: 'Data Consumer' },
    { value: 'application', label: 'Application' },
    { value: 'data_governance', label: 'Data Governance' },
    { value: 'data_manager', label: 'Data Manager' },
  ];


  // Update searchQuery if URL param changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search') || '';
    setSearchQuery(urlSearch);
  }, [location.search]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData('applications');
        setApplications(data.applications || []);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = applications;

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchLower) ||
        app.description.toLowerCase().includes(searchLower) ||
        (app.roles && Array.isArray(app.roles) && app.roles.some(role => role.toLowerCase().includes(searchLower)))
      );
    }

    // Apply role filter
    if (selectedRole) {
      filtered = filtered.filter(app => 
        app.roles && Array.isArray(app.roles) && app.roles.includes(selectedRole)
      );
    }

    setFilteredApplications(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedRole, applications]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleCreateNewApplication = () => {
    navigate('/applications/create');
  };

  const handleEditApplication = (applicationId) => {
    navigate(`/applications/edit/${applicationId}`);
  };



  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
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
        Enterprise Data Teams
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Discover and manage data applications in your data ecosystem. View application details, status, and their relationships with data models and contracts.
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            minWidth: 300,
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
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: currentTheme.textSecondary }}>Filter by Role</InputLabel>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            label="Filter by Role"
            sx={{
              bgcolor: currentTheme.card,
              color: currentTheme.text,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: currentTheme.border,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: currentTheme.primary,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: currentTheme.primary,
              },
              '& .MuiSvgIcon-root': {
                color: currentTheme.textSecondary,
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: currentTheme.card,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  '& .MuiMenuItem-root': {
                    color: currentTheme.text,
                    '&:hover': {
                      bgcolor: currentTheme.primary,
                      color: 'white',
                    },
                    '&.Mui-selected': {
                      bgcolor: alpha(currentTheme.primary, 0.1),
                      color: currentTheme.primary,
                      '&:hover': {
                        bgcolor: currentTheme.primary,
                        color: 'white',
                      },
                    },
                  },
                },
              },
            }}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {paginatedApplications.map((application) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={application.id}>
            <ApplicationCard
              application={application}
              currentTheme={currentTheme}
              onEdit={handleEditApplication}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={currentPage}
          onChange={handlePageChange}
          currentTheme={currentTheme}
        />
      </Box>

      {/* Floating Action Button for creating new applications */}
      <Fab
        color="primary"
        aria-label="add new application"
        onClick={handleCreateNewApplication}
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


    </Container>
  );
};

export default ApplicationsPage; 