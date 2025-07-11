import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../App';
import { fetchData } from '../services/api';
import ApplicationCard from '../components/ApplicationCard';
import Pagination from '../components/Pagination';
import { useLocation } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

const ApplicationsPage = () => {
  const location = useLocation();
  const { currentTheme } = useContext(ThemeContext);
  // Initialize searchQuery from URL param if present
  const getInitialSearch = () => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  };
  const [searchQuery, setSearchQuery] = useState(getInitialSearch());
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchLower) ||
        app.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredApplications(filtered);
    setCurrentPage(1);
  }, [searchQuery, applications]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
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
        Applications
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Discover and manage applications in your data ecosystem. View application details, status, and their relationships with data models and contracts.
      </Typography>

      <Box sx={{ mb: 4 }}>
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

      <Grid container spacing={3}>
        {paginatedApplications.map((application) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={application.id}>
            <ApplicationCard
              application={application}
              currentTheme={currentTheme}
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
    </Container>
  );
};

export default ApplicationsPage; 