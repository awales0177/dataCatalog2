import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  Search as SearchIcon,
  PriorityHigh as PriorityIcon,
  BugReport as JiraIcon,
  Storage as SizeIcon,
  TableChart as ColumnsIcon,
  ViewList as RowsIcon,
  Description as FileTypeIcon,
  Schema as SchemaIcon,
  Schedule as LOEIcon,
  TrendingUp as ThroughputIcon,
  Assessment as StatsIcon,
  CheckCircle as CompleteIcon,
  HourglassEmpty as QueueIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import datasetsData from '../data/datasets.json';
import pipelinesData from '../data/pipelines.json';

const PriorityQueuePage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [pipelines, setPipelines] = useState([]);
  const [pipelineNames, setPipelineNames] = useState({});

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load pipelines from hardcoded data
        const pipelinesArray = Array.isArray(pipelinesData) ? pipelinesData : [];
        setPipelines(pipelinesArray);
        
        // Create pipeline names map
        const namesMap = {};
        pipelinesArray.forEach(pipeline => {
          namesMap[pipeline.uuid] = pipeline.name;
        });
        setPipelineNames(namesMap);
        
        // Load datasets from hardcoded data
        const datasetsArray = Array.isArray(datasetsData) ? datasetsData : [];
        
        // Filter datasets that have priority queue information
        // For now, we'll use all datasets and add mock priority data
        const priorityDatasets = datasetsArray.map((dataset, index) => ({
          ...dataset,
          priority: dataset.priority || index + 1,
          jiraTicket: dataset.jiraTicket || `PROJ-${1000 + index}`,
          columns: dataset.columns || Math.floor(Math.random() * 50) + 10,
          rows: dataset.records || dataset.rows || Math.floor(Math.random() * 10000) + 1000,
          fileTypes: dataset.fileTypes || ['CSV', 'JSON'],
          schemas: dataset.schemas || Math.floor(Math.random() * 5) + 1,
          languages: dataset.languages || ['English'],
          loe: dataset.loe || `${Math.floor(Math.random() * 40) + 10}h`,
        }));
        
        setDatasets(priorityDatasets);
      } catch (err) {
        console.error('Error loading priority queue:', err);
        setError('Failed to load priority queue data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'complete':
        return '#4caf50';
      case 'running':
        return '#ff9800';
      case 'failed':
      case 'error':
        return '#f44336';
      case 'in queue':
      case 'queue':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };

  const getPriorityColor = (priority) => {
    if (priority <= 3) return '#f44336'; // High priority - red
    if (priority <= 7) return '#ff9800'; // Medium priority - orange
    return '#2196f3'; // Low priority - blue
  };

  const getComplexity = (dataset) => {
    // Calculate complexity based on rows, columns, and file types
    const rows = dataset.rows || 0;
    const columns = dataset.columns || 0;
    const fileTypes = dataset.fileTypes?.length || 0;
    const schemas = dataset.schemas || 0;
    
    // Complexity score: rows (weighted) + columns + file types + schemas
    const rowScore = Math.min(rows / 100000, 4); // Max 4 points for rows
    const columnScore = Math.min(columns / 50, 2); // Max 2 points for columns
    const fileTypeScore = Math.min(fileTypes, 2); // Max 2 points for file types
    const schemaScore = Math.min(schemas, 2); // Max 2 points for schemas
    
    const totalScore = rowScore + columnScore + fileTypeScore + schemaScore;
    
    if (totalScore >= 7) return 'XL';
    if (totalScore >= 4) return 'L';
    if (totalScore >= 2) return 'M';
    return 'S';
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'XL':
        return '#f44336'; // Red for extra large
      case 'L':
        return '#ff9800'; // Orange for large
      case 'M':
        return '#ffc107'; // Amber for medium
      case 'S':
        return '#4caf50'; // Green for small
      default:
        return '#9e9e9e';
    }
  };

  const filteredDatasets = datasets.filter(dataset => {
    // Search filter
    const matchesSearch = 
      dataset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.jiraTicket?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Pipeline filter
    const matchesPipeline = 
      pipelineFilter === 'all' ||
      (dataset.systems && Array.isArray(dataset.systems) && dataset.systems.includes(pipelineFilter));
    
    return matchesSearch && matchesPipeline;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredDatasets.length;
    const running = filteredDatasets.filter(d => d.status?.toLowerCase() === 'running').length;
    const queued = filteredDatasets.filter(d => d.status?.toLowerCase() === 'queue' || d.status?.toLowerCase() === 'in queue').length;
    const complete = filteredDatasets.filter(d => d.status?.toLowerCase() === 'done' || d.status?.toLowerCase() === 'complete').length;
    
    // Calculate average LOE (parse hours from strings like "25h", "10h", etc.)
    const loeValues = filteredDatasets
      .map(d => {
        const loe = d.loe || '0h';
        const match = loe.match(/(\d+)h/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(h => h > 0);
    const avgLOE = loeValues.length > 0 
      ? Math.round(loeValues.reduce((a, b) => a + b, 0) / loeValues.length)
      : 0;
    
    // Calculate total rows and columns
    const totalRows = filteredDatasets.reduce((sum, d) => sum + (d.rows || 0), 0);
    const totalColumns = filteredDatasets.reduce((sum, d) => sum + (d.columns || 0), 0);
    
    // Calculate average priority
    const priorities = filteredDatasets.map(d => d.priority || 0).filter(p => p > 0);
    const avgPriority = priorities.length > 0
      ? Math.round(priorities.reduce((a, b) => a + b, 0) / priorities.length)
      : 0;
    
    // Calculate throughput (datasets processed per day - estimated)
    // Assuming average processing time based on LOE
    const throughput = avgLOE > 0 ? Math.round((24 / avgLOE) * total) : 0;
    
    // Calculate completion rate
    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;
    
    return {
      total,
      running,
      queued,
      complete,
      avgLOE,
      totalRows,
      totalColumns,
      avgPriority,
      throughput,
      completionRate,
    };
  }, [filteredDatasets]);

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
        Priority Queue
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Manage and track dataset processing priorities
      </Typography>

      {/* Statistics Cards with Circular Dials */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={Math.min((stats.total / 100) * 100, 100)}
                text={`${stats.total}`}
                styles={buildStyles({
                  pathColor: '#37ABBF',
                  textColor: currentTheme.text,
                  trailColor: currentTheme.background,
                  textSize: '24px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StatsIcon sx={{ color: '#37ABBF', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Total in Queue
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={Math.min((stats.throughput / 50) * 100, 100)}
                text={`${stats.throughput}`}
                styles={buildStyles({
                  pathColor: '#37ABBF',
                  textColor: currentTheme.text,
                  trailColor: currentTheme.background,
                  textSize: '20px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThroughputIcon sx={{ color: '#37ABBF', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Throughput
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mt: 0.5 }}>
              datasets/day
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={Math.min((stats.avgLOE / 50) * 100, 100)}
                text={`${stats.avgLOE}h`}
                styles={buildStyles({
                  pathColor: '#37ABBF',
                  textColor: currentTheme.text,
                  trailColor: currentTheme.background,
                  textSize: '18px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LOEIcon sx={{ color: '#37ABBF', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Avg LOE
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={stats.completionRate}
                text={`${stats.completionRate}%`}
                styles={buildStyles({
                  pathColor: '#4caf50',
                  textColor: '#4caf50',
                  trailColor: currentTheme.background,
                  textSize: '20px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CompleteIcon sx={{ color: '#4caf50', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Completion Rate
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={stats.total > 0 ? Math.min((stats.running / stats.total) * 100, 100) : 0}
                text={`${stats.running}`}
                styles={buildStyles({
                  pathColor: '#ff9800',
                  textColor: '#ff9800',
                  trailColor: currentTheme.background,
                  textSize: '24px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <QueueIcon sx={{ color: '#ff9800', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Running
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={stats.total > 0 ? Math.min((stats.queued / stats.total) * 100, 100) : 0}
                text={`${stats.queued}`}
                styles={buildStyles({
                  pathColor: '#2196f3',
                  textColor: '#2196f3',
                  trailColor: currentTheme.background,
                  textSize: '24px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <QueueIcon sx={{ color: '#2196f3', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Queued
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={Math.min((stats.totalRows / 1000000) * 100, 100)}
                text={`${(stats.totalRows / 1000000).toFixed(1)}M`}
                styles={buildStyles({
                  pathColor: '#37ABBF',
                  textColor: currentTheme.text,
                  trailColor: currentTheme.background,
                  textSize: '16px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <RowsIcon sx={{ color: '#37ABBF', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Total Rows
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: 100, height: 100, mb: 1.5 }}>
              <CircularProgressbar
                value={Math.min((stats.avgPriority / 20) * 100, 100)}
                text={`#${stats.avgPriority}`}
                styles={buildStyles({
                  pathColor: getPriorityColor(stats.avgPriority),
                  textColor: getPriorityColor(stats.avgPriority),
                  trailColor: currentTheme.background,
                  textSize: '20px',
                  fontWeight: 600,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PriorityIcon sx={{ color: getPriorityColor(stats.avgPriority), fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, textTransform: 'uppercase', fontWeight: 500 }}>
                Avg Priority
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by dataset name or Jira ticket..."
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
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
            <MenuItem value="all">All Pipelines</MenuItem>
            {pipelines.map((pipeline) => (
              <MenuItem key={pipeline.uuid} value={pipeline.uuid}>
                {pipeline.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Priority Queue Cards */}
      <Grid container spacing={3}>
        {filteredDatasets.length === 0 ? (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: currentTheme.card,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
                No datasets found in priority queue
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredDatasets.map((dataset) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dataset.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: '100%',
                  bgcolor: currentTheme.card,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#37ABBF',
                  },
                }}
              >
                {/* Dataset Name Header */}
                <Typography
                  variant="h6"
                  sx={{
                    color: currentTheme.text,
                    fontWeight: 600,
                    mb: 1.5,
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    minHeight: '2.5rem',
                  }}
                >
                  {dataset.name || 'Unnamed Dataset'}
                </Typography>

                {/* Status, Priority, and Complexity Chips */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={dataset.status || 'Unknown'}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(dataset.status) + '20',
                      color: getStatusColor(dataset.status),
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      border: `1px solid ${getStatusColor(dataset.status)}40`,
                    }}
                  />
                  <Chip
                    icon={<PriorityIcon sx={{ fontSize: 14 }} />}
                    label={`Priority ${dataset.priority || 'N/A'}`}
                    size="small"
                    sx={{
                      bgcolor: getPriorityColor(dataset.priority) + '20',
                      color: getPriorityColor(dataset.priority),
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      border: `1px solid ${getPriorityColor(dataset.priority)}40`,
                      '& .MuiChip-icon': {
                        color: getPriorityColor(dataset.priority),
                      },
                    }}
                  />
                  <Chip
                    label={getComplexity(dataset)}
                    size="small"
                    sx={{
                      bgcolor: getComplexityColor(getComplexity(dataset)) + '20',
                      color: getComplexityColor(getComplexity(dataset)),
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      border: `1px solid ${getComplexityColor(getComplexity(dataset))}40`,
                      minWidth: 36,
                    }}
                  />
                </Box>

                {/* Jira Ticket */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <JiraIcon sx={{ fontSize: 16, color: currentTheme.textSecondary }} />
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {dataset.jiraTicket || 'N/A'}
                  </Typography>
                </Box>

                {/* Metrics Grid */}
                <Grid container spacing={1.5} sx={{ mt: 1 }}>
                  {/* Size */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SizeIcon sx={{ fontSize: 14, color: currentTheme.textSecondary }} />
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Size:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {dataset.size || 'N/A'}
                    </Typography>
                  </Grid>

                  {/* Columns */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ColumnsIcon sx={{ fontSize: 14, color: currentTheme.textSecondary }} />
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Columns:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {dataset.columns || 'N/A'}
                    </Typography>
                  </Grid>

                  {/* Rows */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <RowsIcon sx={{ fontSize: 14, color: currentTheme.textSecondary }} />
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Rows:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {dataset.rows?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Grid>

                  {/* File Types */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FileTypeIcon sx={{ fontSize: 14, color: currentTheme.textSecondary }} />
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Files:
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {dataset.fileTypes?.slice(0, 2).map((type, idx) => (
                        <Chip
                          key={idx}
                          label={type}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            bgcolor: currentTheme.background,
                            color: currentTheme.text,
                          }}
                        />
                      ))}
                      {dataset.fileTypes?.length > 2 && (
                        <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                          +{dataset.fileTypes.length - 2}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Schemas */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SchemaIcon sx={{ fontSize: 14, color: currentTheme.textSecondary }} />
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Schemas:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {dataset.schemas || '0'}
                    </Typography>
                  </Grid>

                  {/* Languages */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <img 
                        src="/iconmonstr-language-6.svg" 
                        alt="Languages" 
                        style={{ width: 14, height: 14, opacity: 0.7 }}
                      />
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Languages:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {dataset.languages?.length || '0'}
                    </Typography>
                  </Grid>

                  {/* LOE */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        p: 1,
                        bgcolor: currentTheme.background,
                        borderRadius: 1,
                        mt: 0.5,
                      }}
                    >
                      <LOEIcon sx={{ fontSize: 16, color: '#37ABBF' }} />
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        LOE:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#37ABBF', fontWeight: 600, ml: 0.5 }}>
                        {dataset.loe || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default PriorityQueuePage;
