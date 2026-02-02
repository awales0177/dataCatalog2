import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { getPipelineName, initializePipelines } from '../utils/pipelineUtils';
import datasetsData from '../data/datasets.json';
import pipelinesData from '../data/pipelines.json';

const DatasetDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pipelineNames, setPipelineNames] = useState({});

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        initializePipelines();
        
        const pipelinesArray = Array.isArray(pipelinesData) ? pipelinesData : [];
        const nameMap = {};
        pipelinesArray.forEach(p => {
          nameMap[p.uuid] = p.name;
        });
        setPipelineNames(nameMap);

        const datasetsArray = Array.isArray(datasetsData) ? datasetsData : [];
        const datasetData = datasetsArray.find(d => d.id === parseInt(id));
        setDataset(datasetData || null);
        setError(datasetData ? null : 'Dataset not found');
      } catch (err) {
        console.error('Error loading dataset:', err);
        setError('Failed to load dataset');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'complete':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      case 'backlog':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: currentTheme.primary }} />
        </Box>
      </Container>
    );
  }

  if (error || !dataset) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error || 'Dataset not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pipelines')}
          sx={{ mt: 2 }}
        >
          Back to Datasets
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pipelines')}
          sx={{ color: currentTheme.text }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {dataset.metadataAccess ? (
              <LockOpenIcon sx={{ color: currentTheme.success, fontSize: 20 }} />
            ) : (
              <LockIcon sx={{ color: currentTheme.textSecondary, fontSize: 20 }} />
            )}
            <Typography variant="h4" sx={{ color: currentTheme.text }}>
              {dataset.name}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            ID: {dataset.id} {dataset.shortId && `• Short ID: ${dataset.shortId}`}
          </Typography>
        </Box>
        <Chip
          label={dataset.status || 'unknown'}
          color={getStatusColor(dataset.status)}
          size="medium"
        />
      </Box>

      {/* Description */}
      {dataset.description && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
          <Typography variant="body1" sx={{ color: currentTheme.text }}>
            {dataset.description}
          </Typography>
        </Paper>
      )}

      {/* Details Grid */}
      <Grid container spacing={3}>
        {/* Basic Info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
                Basic Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    Records
                  </Typography>
                  <Typography variant="body1" sx={{ color: currentTheme.text }}>
                    {dataset.records?.toLocaleString() || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    Size
                  </Typography>
                  <Typography variant="body1" sx={{ color: currentTheme.text }}>
                    {dataset.size || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    Complexity
                  </Typography>
                  <Typography variant="body1" sx={{ color: currentTheme.text }}>
                    {dataset.complexity || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    Periodicity
                  </Typography>
                  <Typography variant="body1" sx={{ color: currentTheme.text }}>
                    {dataset.periodicity || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ color: currentTheme.text }}>
                    {dataset.lastUpdated || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pipelines */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
                Pipelines
              </Typography>
              {dataset.systems && dataset.systems.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {dataset.systems.map((systemUuid, idx) => (
                    <Chip
                      key={idx}
                      label={pipelineNames[systemUuid] || systemUuid}
                      sx={{
                        backgroundColor: currentTheme.primary + '20',
                        color: currentTheme.primary,
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  No pipelines assigned
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ETL Overview */}
        {dataset.etlOverview && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
                  ETL Overview
                </Typography>
                <Grid container spacing={2}>
                  {dataset.etlOverview.poc && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        POC
                      </Typography>
                      <Typography variant="body1" sx={{ color: currentTheme.text }}>
                        {dataset.etlOverview.poc}
                      </Typography>
                    </Grid>
                  )}
                  {dataset.etlOverview.org && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Organization
                      </Typography>
                      <Typography variant="body1" sx={{ color: currentTheme.text }}>
                        {dataset.etlOverview.org}
                      </Typography>
                    </Grid>
                  )}
                  {dataset.etlOverview.platform && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Platform
                      </Typography>
                      <Typography variant="body1" sx={{ color: currentTheme.text }}>
                        {dataset.etlOverview.platform}
                      </Typography>
                    </Grid>
                  )}
                  {dataset.etlOverview.avgRunTime && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Avg Runtime
                      </Typography>
                      <Typography variant="body1" sx={{ color: currentTheme.text }}>
                        {dataset.etlOverview.avgRunTime}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Notifications */}
        {dataset.notifications && dataset.notifications.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
                  Notifications
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {dataset.notifications.map((notification, idx) => (
                    <Alert
                      key={idx}
                      severity={notification.type === 'error' ? 'error' : 'warning'}
                      sx={{ bgcolor: currentTheme.background }}
                    >
                      {notification.message}
                      {notification.timestamp && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                      )}
                    </Alert>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default DatasetDetailPage;
