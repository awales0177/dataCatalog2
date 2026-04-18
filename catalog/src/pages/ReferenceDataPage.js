import React, { useState, useContext, useEffect, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ViewModule as GridViewIcon,
  TableRows as TableViewIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import referenceData from '../data/reference.json';
import ReferenceDataCard from '../components/ReferenceDataCard';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { datasetOriginMeta } from '../utils/referenceDataOrigin';
import { useCatalogPreferences } from '../contexts/CatalogPreferencesContext';
import { fontStackSans } from '../theme/theme';

const ITEMS_PER_PAGE_GRID = 12;
const ITEMS_PER_PAGE_TABLE = 20;

const ReferenceDataPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { listViewMode: viewMode, setListViewMode } = useCatalogPreferences();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadReferenceData = () => {
      try {
        const items = referenceData.items || [];
        setOriginalData(items);
        setFilteredData(items);
        setError(null);
      } catch (err) {
        setError('Failed to load reference data');
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = originalData.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          (item.category && item.category.toLowerCase().includes(searchLower)),
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(originalData);
    }
    setPage(1);
  }, [searchQuery, originalData]);

  useEffect(() => {
    setPage(1);
  }, [viewMode]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const pageSize = viewMode === 'table' ? ITEMS_PER_PAGE_TABLE : ITEMS_PER_PAGE_GRID;
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(
    () => filteredData.slice((page - 1) * pageSize, page * pageSize),
    [filteredData, page, pageSize],
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
      <Typography variant="body1" sx={{ mb: 3, color: currentTheme.textSecondary }}>
        Manage and maintain reference data sets. Ensure consistency and standardization of key business values across your data ecosystem.
        Each card shows{' '}
        <Box component="span" sx={{ whiteSpace: 'nowrap', fontWeight: 600, color: currentTheme.text }}>
          <Box component="img" src="/herd.svg" alt="" sx={{ width: 22, height: 22, verticalAlign: 'text-bottom', mr: 0.5 }} />
          HERD
        </Box>{' '}
        (human-curated) or{' '}
        <Box component="span" sx={{ whiteSpace: 'nowrap', fontWeight: 600, color: currentTheme.text }}>
          <Box component="img" src="/mg.svg" alt="" sx={{ width: 20, height: 20, verticalAlign: 'text-bottom', mr: 0.5 }} />
          System
        </Box>{' '}
        (automated) data origin. Default card or table layout is set in{' '}
        <Box component="span" sx={{ fontWeight: 600, color: currentTheme.text }}>Settings → Preferences</Box>.
      </Typography>

      <Box sx={{ mb: 3 }}>
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
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => {
              if (v) setListViewMode(v);
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: currentTheme.textSecondary,
                borderColor: currentTheme.border,
                px: 1.25,
              },
              '& .Mui-selected': {
                bgcolor: `${currentTheme.primary}22`,
                color: currentTheme.primary,
                borderColor: `${currentTheme.primary}55 !important`,
              },
            }}
          >
            <ToggleButton value="grid" aria-label="Card grid">
              <Tooltip title="Cards">
                <GridViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <Tooltip title="Table">
                <TableViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {paginatedData.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <ReferenceDataCard item={item} currentTheme={currentTheme} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: `1px solid ${currentTheme.border}`,
            borderRadius: 2,
            bgcolor: currentTheme.card,
            overflowX: 'auto',
          }}
        >
          <Table size="medium" stickyHeader sx={{ minWidth: 640, '& td': { fontFamily: fontStackSans } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: currentTheme.textSecondary, bgcolor: currentTheme.card, borderBottom: `2px solid ${currentTheme.border}` }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: currentTheme.textSecondary, bgcolor: currentTheme.card, borderBottom: `2px solid ${currentTheme.border}` }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: currentTheme.textSecondary, bgcolor: currentTheme.card, borderBottom: `2px solid ${currentTheme.border}` }}>
                  Version
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: currentTheme.textSecondary, bgcolor: currentTheme.card, borderBottom: `2px solid ${currentTheme.border}` }}>
                  Origin
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: currentTheme.textSecondary, bgcolor: currentTheme.card, borderBottom: `2px solid ${currentTheme.border}` }}>
                  Description
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: currentTheme.textSecondary, textAlign: 'center', py: 4 }}>
                    No reference data matches your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const o = datasetOriginMeta(item);
                  const desc = item.description || '';
                  const descShort = desc.length > 120 ? `${desc.slice(0, 117)}…` : desc;
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      onClick={() => navigate(`/reference/${item.id}`)}
                      sx={{
                        cursor: 'pointer',
                        '&:nth-of-type(even)': {
                          bgcolor: currentTheme.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        },
                      }}
                    >
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600 }}>{item.name}</TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary }}>{item.category || '—'}</TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary }}>{item.version || '—'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title={o.tooltip}>
                          <Box
                            component="img"
                            src={o.src}
                            alt=""
                            sx={{ width: o.origin === 'herd' ? 28 : 24, height: o.origin === 'herd' ? 28 : 24, mx: 'auto', display: 'block' }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary, maxWidth: 360 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
                          {descShort || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {paginatedData.length === 0 && viewMode === 'grid' && filteredData.length === 0 ? (
        <Typography sx={{ color: currentTheme.textSecondary, textAlign: 'center', py: 6 }}>
          No reference data matches your search.
        </Typography>
      ) : null}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={page}
          onChange={handlePageChange}
          currentTheme={currentTheme}
        />
      </Box>

      <Fab
        color="primary"
        aria-label="add new reference data"
        onClick={() => navigate('/reference/create')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: currentTheme.primary,
          color: currentTheme.background,
          '&:hover': {
            bgcolor: currentTheme.primaryDark || currentTheme.primary,
          },
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default ReferenceDataPage;
