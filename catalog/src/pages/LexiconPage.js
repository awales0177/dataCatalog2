import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  alpha,
  Popover,
  InputBase,
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';

const LexiconPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [terms, setTerms] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'term', direction: 'asc' });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [columnFilters, setColumnFilters] = useState({
    term: '',
    definition: '',
    domains: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const data = await fetchData('lexicon');
        setTerms(data.terms || []);
        setSuffixes(data.suffixes || []);
        setError(null);
      } catch (err) {
        setError('Failed to load lexicon terms');

      } finally {
        setLoading(false);
      }
    };

    loadTerms();
  }, []);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterClick = (event, column) => {
    setFilterAnchorEl(event.currentTarget);
    setActiveFilter(column);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setActiveFilter(null);
  };

  const handleFilterChange = (event) => {
    setColumnFilters(prev => ({
      ...prev,
      [activeFilter]: event.target.value
    }));
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle arrays (domains)
      if (Array.isArray(aValue)) {
        aValue = aValue.join(', ');
        bValue = bValue.join(', ');
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterData = (data) => {
    return data.filter(item => {
      if (!item) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (item.term || '').toLowerCase().includes(searchLower) ||
        (item.definition || '').toLowerCase().includes(searchLower) ||
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.description || '').toLowerCase().includes(searchLower) ||
        (item.domains || [item.domain] || []).some(domain => 
          (domain || '').toLowerCase().includes(searchLower)
        ) ||
        (item.examples || []).some(example => 
          (example || '').toLowerCase().includes(searchLower)
        );

      const matchesColumnFilters = Object.entries(columnFilters).every(([key, value]) => {
        if (!value) return true;
        if (key === 'domains') {
          return (item.domains || [item.domain] || []).some(domain => 
            (domain || '').toLowerCase().includes(value.toLowerCase())
          );
        }
        return (item[key] || '').toLowerCase().includes(value.toLowerCase());
      });

      return matchesSearch && matchesColumnFilters;
    });
  };

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

  const filteredTerms = filterData(terms);
  const filteredSuffixes = filterData(suffixes);
  const sortedTerms = sortData(filteredTerms);
  const sortedSuffixes = sortData(filteredSuffixes);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Lexicon
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Browse and search through standardized business terms and definitions. Maintain a common language for data across your organization.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search terms and suffixes..."
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

      <Typography variant="h5" sx={{ color: currentTheme.text, mb: 2 }}>
        Terms
      </Typography>
      <TableContainer 
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: currentTheme.border,
          borderRadius: 2,
          bgcolor: currentTheme.card,
          mb: 4,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: currentTheme.text, fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Term
                  <Tooltip title={`Sort ${sortConfig.key === 'term' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('term')}
                      sx={{ color: currentTheme.textSecondary }}
                    >
                      {sortConfig.key === 'term' ? (
                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />
                      ) : <ArrowUpwardIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, 'term')}
                      sx={{ 
                        color: columnFilters.term ? currentTheme.primary : currentTheme.textSecondary,
                      }}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{ color: currentTheme.text, fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Definition
                  <Tooltip title={`Sort ${sortConfig.key === 'definition' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('definition')}
                      sx={{ color: currentTheme.textSecondary }}
                    >
                      {sortConfig.key === 'definition' ? (
                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />
                      ) : <ArrowUpwardIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, 'definition')}
                      sx={{ 
                        color: columnFilters.definition ? currentTheme.primary : currentTheme.textSecondary,
                      }}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{ color: currentTheme.text, fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Domains
                  <Tooltip title={`Sort ${sortConfig.key === 'domains' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('domains')}
                      sx={{ color: currentTheme.textSecondary }}
                    >
                      {sortConfig.key === 'domains' ? (
                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />
                      ) : <ArrowUpwardIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, 'domains')}
                      sx={{ 
                        color: columnFilters.domains ? currentTheme.primary : currentTheme.textSecondary,
                      }}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTerms.map((term) => (
              <TableRow 
                key={term.id}
                sx={{
                  '&:hover': {
                    bgcolor: currentTheme.background,
                  },
                }}
              >
                <TableCell sx={{ color: currentTheme.text }}>{term.term}</TableCell>
                <TableCell sx={{ color: currentTheme.textSecondary }}>{term.definition}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {(term.domains || [term.domain]).map((domain, index) => (
                      <Chip 
                        key={index}
                        label={domain}
                        size="small"
                        sx={{ 
                          backgroundColor: currentTheme.primary,
                          color: currentTheme.background,
                          '&:hover': {
                            backgroundColor: currentTheme.primaryDark
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" sx={{ color: currentTheme.text, mb: 2 }}>
        Suffixes
      </Typography>
      <TableContainer 
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: currentTheme.border,
          borderRadius: 2,
          bgcolor: currentTheme.card,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: currentTheme.text, fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Name
                  <Tooltip title={`Sort ${sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('name')}
                      sx={{ color: currentTheme.textSecondary }}
                    >
                      {sortConfig.key === 'name' ? (
                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />
                      ) : <ArrowUpwardIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, 'name')}
                      sx={{ 
                        color: columnFilters.name ? currentTheme.primary : currentTheme.textSecondary,
                      }}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{ color: currentTheme.text, fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Description
                  <Tooltip title={`Sort ${sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSort('description')}
                      sx={{ color: currentTheme.textSecondary }}
                    >
                      {sortConfig.key === 'description' ? (
                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />
                      ) : <ArrowUpwardIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, 'description')}
                      sx={{ 
                        color: columnFilters.description ? currentTheme.primary : currentTheme.textSecondary,
                      }}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedSuffixes.map((suffix) => (
              <TableRow 
                key={suffix.id}
                sx={{
                  '&:hover': {
                    bgcolor: currentTheme.background,
                  },
                }}
              >
                <TableCell sx={{ color: currentTheme.text }}>{suffix.name}</TableCell>
                <TableCell sx={{ color: currentTheme.textSecondary }}>{suffix.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <InputBase
            placeholder={`Filter ${activeFilter}...`}
            value={columnFilters[activeFilter] || ''}
            onChange={handleFilterChange}
            sx={{
              color: currentTheme.text,
              '& .MuiInputBase-input': {
                p: 1,
              },
            }}
          />
        </Box>
      </Popover>
    </Container>
  );
};

export default LexiconPage; 