import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  CircularProgress, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper as MuiPaper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
  Button,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import SourceIcon from '@mui/icons-material/Source';
import ApiIcon from '@mui/icons-material/Api';
import StorageIcon from '@mui/icons-material/Storage';
import { fetchData } from '../services/api';
import { formatDate } from '../utils/themeUtils';

const ReferenceDataDetailPage = ({ currentTheme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadReferenceItem = async () => {
      try {
        const data = await fetchData('reference');
        const found = (data.items || []).find(i => i.id === id);
        if (found) {
          setItem(found);
        } else {
          setError('Reference data item not found');
        }
      } catch (err) {
        setError('Failed to load reference data item');
      } finally {
        setLoading(false);
      }
    };
    loadReferenceItem();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4caf50';
      case 'inactive': return '#f44336';
      case 'deprecated': return '#ff9800';
      default: return currentTheme?.textSecondary;
    }
  };

  const getSensitivityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'public': return '#4caf50';
      case 'internal': return '#ff9800';
      case 'confidential': return '#f44336';
      case 'restricted': return '#9c27b0';
      default: return currentTheme?.textSecondary;
    }
  };

  const getSourceTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'authoritative': return '#4caf50';
      case 'derived': return '#2196f3';
      case 'custom': return '#ff9800';
      default: return currentTheme?.textSecondary;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: currentTheme?.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: currentTheme?.text }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!item) return null;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon sx={{ color: currentTheme?.text }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ color: currentTheme?.text }}>
            {item.name}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: currentTheme?.textSecondary, fontFamily: 'monospace' }}>
            {item.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label={item.category} 
            sx={{ bgcolor: alpha(currentTheme?.primary, 0.1), color: currentTheme?.primary }} 
          />
          {item.status && (
            <Chip 
              label={item.status} 
              sx={{ 
                bgcolor: alpha(getStatusColor(item.status), 0.1), 
                color: getStatusColor(item.status),
                fontWeight: 600
              }} 
            />
          )}
          {item.sensitivityLevel && (
            <Chip 
              icon={<SecurityIcon />}
              label={item.sensitivityLevel} 
              sx={{ 
                bgcolor: alpha(getSensitivityColor(item.sensitivityLevel), 0.1), 
                color: getSensitivityColor(item.sensitivityLevel),
                fontWeight: 600
              }} 
            />
          )}
        </Box>
        <Tooltip title="Edit Reference Data">
          <IconButton
            onClick={() => navigate(`/reference/${item.id}/edit`)}
            sx={{
              color: currentTheme?.primary,
              bgcolor: alpha(currentTheme?.primary, 0.1),
              '&:hover': {
                bgcolor: alpha(currentTheme?.primary, 0.2),
                color: currentTheme?.primary,
              },
              border: `1px solid ${alpha(currentTheme?.primary, 0.3)}`,
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}`, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: currentTheme?.text, mb: 2 }}>
              Description
            </Typography>
            <Typography variant="body1" sx={{ color: currentTheme?.textSecondary, mb: 3 }}>
              {item.description}
            </Typography>
            
            {/* Source Datasets */}
            {item.sourceDatasets && item.sourceDatasets.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme?.text, mb: 1 }}>
                  Source Datasets:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {item.sourceDatasets.map((dataset, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        border: `1px solid ${alpha(currentTheme?.primary, 0.2)}`,
                        borderRadius: 1,
                        bgcolor: alpha(currentTheme?.primary, 0.05),
                        minWidth: '200px',
                        position: 'relative',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => window.open(`/api/docs#/reference/get_reference_${item.id}`, '_blank')}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          color: currentTheme?.textSecondary,
                          '&:hover': {
                            color: currentTheme?.primary,
                            bgcolor: alpha(currentTheme?.primary, 0.1),
                          }
                        }}
                      >
                        <ApiIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ color: currentTheme?.primary, fontWeight: 600, fontSize: '0.8rem', mb: 0.25 }}>
                        {dataset.source_system}
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentTheme?.text, fontSize: '0.75rem', mb: 0.25 }}>
                        {dataset.datasetName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, fontSize: '0.7rem' }}>
                        ID: {dataset.datasetId}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                  <strong>Version:</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                  {item.version}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                  <strong>Last Updated:</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                  {formatDate(item.lastUpdated)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                  <strong>Owner:</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                  {item.owner}
                </Typography>
              </Grid>
              {item.sourceSystem && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    <strong>Source System:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                    {item.sourceSystem}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Metadata Panel */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}`, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: currentTheme?.text, mb: 2 }}>
              Metadata
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {item.childTables && (
                <Box>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Child Tables: <strong>{item.childTables.length}</strong>
                  </Typography>
                </Box>
              )}
              {item.lineage?.downstream && (
                <Box>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Downstream Models: <strong>{item.lineage.downstream.length}</strong>
                  </Typography>
                </Box>
              )}
              {item.sourceDatasets && (
                <Box>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Source Datasets: <strong>{item.sourceDatasets.length}</strong>
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Lineage Section */}
      {item.lineage && (item.lineage.upstream?.length > 0 || item.lineage.downstream?.length > 0) && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}`, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimelineIcon sx={{ color: currentTheme?.primary }} />
            <Typography variant="h6" sx={{ color: currentTheme?.text }}>
              Data Lineage
            </Typography>
          </Box>
          
          {item.lineage.downstream && item.lineage.downstream.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ color: currentTheme?.text, mb: 1 }}>
                Downstream Dependencies
              </Typography>
              <List dense>
                {item.lineage.downstream.map((dep, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                          <strong>{dep.model}</strong> - {dep.field}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                          Relationship: {dep.relationship}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      )}

      {/* Child Tables */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ color: currentTheme?.text, mb: 2 }}>
          Child Tables ({item.childTables?.length || 0})
        </Typography>
        {item.childTables && item.childTables.length > 0 ? (
          item.childTables.map((table) => (
            <Accordion 
              key={table.id} 
              sx={{ 
                mb: 2, 
                bgcolor: currentTheme?.card, 
                border: `1px solid ${currentTheme?.border}`,
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: currentTheme?.text }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: currentTheme?.primary, fontWeight: 600 }}>
                      {table.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                      {table.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={table.sourceType} 
                      size="small"
                      sx={{ 
                        bgcolor: alpha(getSourceTypeColor(table.sourceType), 0.1), 
                        color: getSourceTypeColor(table.sourceType),
                        fontSize: '0.7rem'
                      }} 
                    />
                    <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                      {table.rowCount} rows
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                        <strong>Owner:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                        {table.owner}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                        <strong>Last Reviewed:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                        {formatDate(table.lastReviewed)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                        <strong>Review Frequency:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                        {table.reviewFrequency}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                        <strong>Derived From:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                        {table.derivedFrom}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {table.transformations && table.transformations.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: currentTheme?.text, mb: 1 }}>
                      Transformations:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {table.transformations.map((transformation, idx) => (
                        <Chip 
                          key={idx} 
                          label={transformation} 
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: currentTheme?.border,
                            color: currentTheme?.textSecondary,
                            fontSize: '0.7rem'
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <TableContainer component={MuiPaper} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {table.columns.map((col) => (
                          <TableCell key={col} sx={{ color: currentTheme?.text, fontWeight: 600 }}>{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {table.rows.map((row, idx) => (
                        <TableRow key={idx}>
                          {table.columns.map((col) => (
                            <TableCell key={col} sx={{ color: currentTheme?.textSecondary }}>{row[col]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
            (No child tables)
          </Typography>
        )}
      </Box>

      {/* Change Log */}
      {item.changeLog && item.changeLog.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}`, borderRadius: 2, mb: 3, mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryIcon sx={{ color: currentTheme?.primary }} />
            <Typography variant="h6" sx={{ color: currentTheme?.text }}>
              Change Log
            </Typography>
          </Box>
          <List dense>
            {item.changeLog.map((change, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                      <strong>v{change.version}</strong> - {change.updateReason}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                      {formatDate(change.timestamp)} by {change.updatedBy}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ReferenceDataDetailPage; 