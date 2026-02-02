import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewModule as CardViewIcon,
  AccountTree as PipelineViewIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import datasetsData from '../data/datasets.json';
import pipelinesData from '../data/pipelines.json';
import { getPipelineName, initializePipelines } from '../utils/pipelineUtils';
import DatasetCard from './DatasetCard';
import PipelineView from './PipelineView';

const ITEMS_PER_PAGE = 10;

const DatasetTable = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('lastUpdated');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pipelineNames, setPipelineNames] = useState({});
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'pipeline'

  // Initialize pipelines and load datasets from hardcoded data
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        initializePipelines();
        
        const datasetsArray = Array.isArray(datasetsData) ? datasetsData : [];
        const pipelinesArray = Array.isArray(pipelinesData) ? pipelinesData : [];
        
        setDatasets(datasetsArray);
        
        // Build pipeline name map
        const nameMap = {};
        pipelinesArray.forEach(p => {
          nameMap[p.uuid] = p.name;
        });
        setPipelineNames(nameMap);
        
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load datasets');
        setDatasets([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const allPipelineUuids = new Set();
    const statuses = new Set();
    
    datasets.forEach(dataset => {
      if (dataset?.systems) {
        dataset.systems.forEach(system => allPipelineUuids.add(system));
      }
      if (dataset?.status) {
        statuses.add(dataset.status);
      }
    });

    return {
      pipelines: ['All', ...Array.from(allPipelineUuids)],
      statuses: ['All', ...Array.from(statuses).sort()],
    };
  }, [datasets]);

  // Filter and sort datasets
  useEffect(() => {
    let filtered = [...datasets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(dataset => {
        return (
          (dataset.name && dataset.name.toLowerCase().includes(query)) ||
          (dataset.description && dataset.description.toLowerCase().includes(query)) ||
          (dataset.id && dataset.id.toString().includes(query)) ||
          (dataset.shortId && dataset.shortId.toLowerCase().includes(query))
        );
      });
    }

    // Pipeline filter
    if (pipelineFilter !== 'All') {
      filtered = filtered.filter(dataset => 
        dataset.systems && dataset.systems.includes(pipelineFilter)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(dataset => dataset.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated || 0);
          bValue = new Date(b.lastUpdated || 0);
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDatasets(filtered);
    setPage(1); // Reset to first page when filters change
  }, [datasets, searchQuery, pipelineFilter, statusFilter, sortColumn, sortDirection]);

  // Pagination
  const paginatedDatasets = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredDatasets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDatasets, page]);

  const totalPages = Math.ceil(filteredDatasets.length / ITEMS_PER_PAGE);


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error && datasets.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* View Mode Tabs - Filing Cabinet Style */}
      <Box 
        sx={{ 
          mb: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgcolor: currentTheme.border,
          }
        }}
      >
        <Tabs
          value={viewMode}
          onChange={(e, newValue) => setViewMode(newValue)}
          sx={{
            minHeight: '48px',
            '& .MuiTabs-flexContainer': {
              gap: '4px',
              paddingTop: '8px',
            },
            '& .MuiTab-root': {
              minHeight: '40px',
              padding: '8px 20px',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: currentTheme.textSecondary,
              bgcolor: 'transparent',
              borderRadius: '8px 8px 0 0',
              border: `1px solid transparent`,
              borderBottom: 'none',
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: currentTheme.background,
                color: '#37ABBF',
                borderColor: 'rgba(55, 171, 191, 0.3)',
              },
              '&.Mui-selected': {
                color: '#37ABBF',
                bgcolor: currentTheme.card,
                border: `1px solid #37ABBF`,
                borderBottom: 'none',
                zIndex: 2,
                boxShadow: `0 -2px 8px rgba(55, 171, 191, 0.15)`,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '1px',
                  bgcolor: currentTheme.card,
                },
              },
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab
            icon={<CardViewIcon sx={{ fontSize: '18px' }} />}
            iconPosition="start"
            label="Card View"
            value="cards"
          />
          <Tab
            icon={<PipelineViewIcon sx={{ fontSize: '18px' }} />}
            iconPosition="start"
            label="Pipeline View"
            value="pipeline"
          />
        </Tabs>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search datasets..."
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
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              backgroundColor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
              '&:hover fieldset': {
                borderColor: '#37ABBF',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#37ABBF',
                borderWidth: '2px',
              },
            },
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel 
            sx={{ 
              color: currentTheme.textSecondary,
              '&.Mui-focused': {
                color: '#37ABBF',
              },
            }}
          >
            Pipeline
          </InputLabel>
          <Select
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
            label="Pipeline"
            sx={{
              backgroundColor: currentTheme.card,
              color: currentTheme.text,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: currentTheme.border,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#37ABBF',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#37ABBF',
                borderWidth: '2px',
              },
            }}
          >
            {filterOptions.pipelines.map((uuid) => (
              <MenuItem key={uuid} value={uuid}>
                {uuid === 'All' ? 'All' : (pipelineNames[uuid] || uuid)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel 
            sx={{ 
              color: currentTheme.textSecondary,
              '&.Mui-focused': {
                color: '#37ABBF',
              },
            }}
          >
            Status
          </InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
            sx={{
              backgroundColor: currentTheme.card,
              color: currentTheme.text,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: currentTheme.border,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#37ABBF',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#37ABBF',
                borderWidth: '2px',
              },
            }}
          >
            {filterOptions.statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Results count */}
      {filteredDatasets.length > 0 && viewMode === 'cards' && (
        <Typography variant="body2" sx={{ mb: 2, color: currentTheme.textSecondary }}>
          Showing {paginatedDatasets.length} of {filteredDatasets.length} datasets
        </Typography>
      )}

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <Box sx={{ mb: 3 }}>
          <PipelineView
            datasets={filteredDatasets}
            pipelineNames={pipelineNames}
            onDatasetClick={(dataset) => navigate(`/pipelines/datasets/${dataset.id}`)}
          />
        </Box>
      )}

      {/* Cards Grid */}
      {viewMode === 'cards' && (paginatedDatasets.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            color: currentTheme.textSecondary,
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '12px',
          }}
        >
          <Typography variant="body1">
            No datasets found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {paginatedDatasets.map((dataset) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dataset.id}>
              <DatasetCard
                dataset={dataset}
                onClick={() => navigate(`/pipelines/datasets/${dataset.id}`)}
                currentTheme={currentTheme}
                pipelineNames={pipelineNames}
              />
            </Grid>
          ))}
        </Grid>
      ))}

      {/* Pagination */}
      {viewMode === 'cards' && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                color: currentTheme.text,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default DatasetTable;
