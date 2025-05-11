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
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../App';
import { fetchData } from '../services/api';
import ReferenceDataCard from '../components/ReferenceDataCard';
import Pagination from '../components/Pagination';
import { useThemeContext } from '../contexts/ThemeContext';

const ITEMS_PER_PAGE = 12;

const ReferenceDataPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const theme = useTheme();

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const data = await fetchData('reference');
        setOriginalData(data.items || []);
        setFilteredData(data.items || []);
        setError(null);
      } catch (err) {
        setError('Failed to load reference data');
        console.error('Error loading reference data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = originalData.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.category && item.category.toLowerCase().includes(searchLower))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(originalData);
    }
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, originalData]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Reference Data
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Manage and maintain reference data sets. Ensure consistency and standardization of key business values across your data ecosystem.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search reference data..."
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
              backgroundColor: currentTheme.card,
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
        {paginatedData.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <ReferenceDataCard item={item} currentTheme={currentTheme} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={page}
          onChange={handlePageChange}
          currentTheme={currentTheme}
        />
      </Box>
    </Container>
  );
};

export default ReferenceDataPage; 