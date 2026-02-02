/**
 * Pipeline D - Reference Data Renderer
 * 
 * Custom renderer for tracking and displaying reference data information.
 * This component provides a specialized view for reference data pipelines.
 */

import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  Link,
  IconButton,
} from '@mui/material';
import Graph from 'react-graph-vis';
import {
  Category as CategoryIcon,
  Link as LinkIcon,
  Update as UpdateIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../../../../contexts/ThemeContext';
import { fetchData } from '../../../../services/api';
import ETLOverview from '../../ETLOverview';
import ProcessStatus from '../../ProcessStatus';

const PipelineDRenderer = ({
  pipeline,
  dataset,
  files,
  selectedFile,
  currentFile,
  onFileSelect,
  tables,
  selectedTable,
  onTableSelect,
  pipelineAgreements,
  config,
}) => {
  const { currentTheme } = useContext(ThemeContext);
  const [referenceData, setReferenceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReferenceItem, setSelectedReferenceItem] = useState(null);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoading(true);
        const data = await fetchData('reference');
        setReferenceData(data.items || []);
        setError(null);
      } catch (err) {
        console.error('Error loading reference data:', err);
        setError('Failed to load reference data');
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Get status color helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4caf50';
      case 'draft':
        return '#ff9800';
      case 'review':
        return '#2196f3';
      case 'expired':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  // Get category color helper
  const getCategoryColor = (category) => {
    const colors = {
      'Geography': '#2196f3',
      'Finance': '#4caf50',
      'Industry': '#ff9800',
      'Compliance': '#f44336',
      'Standard': '#9c27b0',
    };
    return colors[category] || '#9e9e9e';
  };

  // Aggregate source datasets and downstream products from all reference items
  const aggregatedSources = useMemo(() => {
    const sources = new Set();
    referenceData.forEach(item => {
      if (item.sourceDatasets) {
        item.sourceDatasets.forEach(source => {
          sources.add(JSON.stringify({
            name: source.datasetName || source.datasetId,
            system: source.source_system,
          }));
        });
      }
    });
    return Array.from(sources).slice(0, 5).map(s => JSON.parse(s));
  }, [referenceData]);

  const aggregatedProducts = useMemo(() => {
    const products = new Set();
    referenceData.forEach(item => {
      if (item.lineage?.downstream) {
        item.lineage.downstream.forEach(product => {
          products.add(JSON.stringify({
            model: product.model,
            field: product.field,
          }));
        });
      }
    });
    return Array.from(products).slice(0, 5).map(p => JSON.parse(p));
  }, [referenceData]);

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
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600 }}>
            Reference Data Tracking
          </Typography>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 0.5 }}>
            Monitor and manage standardized codes, values, and classifications
          </Typography>
        </Box>
      </Box>

      {/* Process Status */}
      {config?.layout?.showProcessStatus && (
        <Box sx={{ mb: 4 }}>
          <ProcessStatus
            pipeline={pipeline}
            currentStep={dataset?.currentStep || 1}
            processSteps={dataset?.processSteps}
          />
        </Box>
      )}

      {/* ETL Overview */}
      <Box sx={{ mb: 4 }}>
        <ETLOverview
          pipeline={pipeline}
          dataset={dataset}
          pipelineAgreements={pipelineAgreements}
        />
      </Box>

      {/* Graph Database Chart */}
      <Paper
        sx={{
          p: 4,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
          mb: 4,
        }}
      >
        <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3, fontWeight: 600 }}>
          Data Lineage Graph
        </Typography>
        
        {(() => {
          // Build graph nodes
          const graphNodes = [];
          const graphEdges = [];
          
          // Add source dataset nodes
          aggregatedSources.forEach((source, idx) => {
            graphNodes.push({
              id: `source-${idx}`,
              label: source.name.length > 20 ? source.name.substring(0, 20) + '...' : source.name,
              title: `${source.name}\n${source.system || ''}`,
              color: {
                background: currentTheme.background,
                border: currentTheme.border,
                highlight: {
                  background: currentTheme.background,
                  border: '#37ABBF',
                },
              },
              font: {
                color: currentTheme.text,
                size: 14,
              },
              shape: 'dot',
              size: 20,
            });
          });
          
          // Add one reference data node (the product)
          let refNodeId = null;
          if (referenceData.length > 0) {
            const selectedRef = selectedReferenceItem || referenceData[0];
            refNodeId = `ref-${selectedRef.id}`;
            graphNodes.push({
              id: refNodeId,
              label: selectedRef.name.length > 20 ? selectedRef.name.substring(0, 20) + '...' : selectedRef.name,
              title: `${selectedRef.name}\n${selectedRef.category || ''}`,
              color: {
                background: '#37ABBF',
                border: '#37ABBF',
                highlight: {
                  background: '#37ABBF',
                  border: '#2a8a9a',
                },
              },
              font: {
                color: 'white',
                size: 16,
              },
              shape: 'dot',
              size: 30,
            });
            
            // Add edges from all source datasets to the reference data product
            aggregatedSources.forEach((source, idx) => {
              graphEdges.push({
                id: `edge-${idx}-${refNodeId}`,
                from: `source-${idx}`,
                to: refNodeId,
                color: {
                  color: '#37ABBF',
                  highlight: '#37ABBF',
                  hover: '#37ABBF',
                },
                width: 2,
                arrows: {
                  to: {
                    enabled: true,
                    scaleFactor: 0.8,
                  },
                },
                smooth: {
                  type: 'continuous',
                  roundness: 0.5,
                },
              });
            });
          }
          
          const graph = {
            nodes: graphNodes,
            edges: graphEdges,
          };
          
          const options = {
            layout: {
              hierarchical: false,
            },
            physics: {
              enabled: true,
              stabilization: {
                enabled: true,
                iterations: 200,
              },
            },
            interaction: {
              dragNodes: true,
              dragView: true,
              zoomView: true,
              selectConnectedEdges: false,
            },
            nodes: {
              borderWidth: 2,
              shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.2)',
                size: 5,
              },
            },
          };
          
          const events = {
            select: (event) => {
              const { nodes } = event;
              if (nodes && nodes.length > 0) {
                const nodeId = nodes[0];
                if (nodeId.startsWith('ref-')) {
                  const refId = nodeId.replace('ref-', '');
                  const refItem = referenceData.find(item => item.id === refId);
                  if (refItem) {
                    setSelectedReferenceItem(refItem);
                  }
                }
              }
            },
          };
          
          return (
            <Box sx={{ width: '100%', height: '500px', border: `1px solid ${currentTheme.border}`, borderRadius: 1 }}>
              <Graph graph={graph} options={options} events={events} style={{ width: '100%', height: '100%' }} />
            </Box>
          );
        })()}
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 3, pt: 3, borderTop: `1px solid ${currentTheme.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: currentTheme.background,
                border: `2px solid ${currentTheme.border}`,
              }}
            />
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
              Source Datasets
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#37ABBF',
                border: `3px solid #37ABBF`,
              }}
            />
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
              Reference Data Product
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Selected Reference Item Details - Simplified */}
      {selectedReferenceItem && (
        <Paper
          sx={{
            p: 3,
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600 }}>
              {selectedReferenceItem.name} - Details
            </Typography>
            <IconButton
              onClick={() => setSelectedReferenceItem(null)}
              sx={{
                color: currentTheme.textSecondary,
                '&:hover': {
                  color: currentTheme.text,
                  bgcolor: currentTheme.background,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1, textTransform: 'uppercase' }}>
                Basic Information
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.textSecondary, border: 'none', py: 1 }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, border: 'none', py: 1 }}>
                        {selectedReferenceItem.id}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.textSecondary, border: 'none', py: 1 }}>
                        Category
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, border: 'none', py: 1 }}>
                        {selectedReferenceItem.category || 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.textSecondary, border: 'none', py: 1 }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, border: 'none', py: 1 }}>
                        <Chip
                          label={selectedReferenceItem.status || 'Unknown'}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(selectedReferenceItem.status) + '20',
                            color: getStatusColor(selectedReferenceItem.status),
                          }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.textSecondary, border: 'none', py: 1 }}>
                        Version
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, border: 'none', py: 1 }}>
                        {selectedReferenceItem.version || 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.textSecondary, border: 'none', py: 1 }}>
                        Owner
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, border: 'none', py: 1 }}>
                        {selectedReferenceItem.owner || 'N/A'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Source Datasets */}
            {selectedReferenceItem.sourceDatasets && selectedReferenceItem.sourceDatasets.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1, textTransform: 'uppercase' }}>
                  Source Datasets
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: currentTheme.textSecondary, borderBottom: `1px solid ${currentTheme.border}` }}>
                          System
                        </TableCell>
                        <TableCell sx={{ color: currentTheme.textSecondary, borderBottom: `1px solid ${currentTheme.border}` }}>
                          Dataset
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedReferenceItem.sourceDatasets.map((source, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ color: currentTheme.text, border: 'none', py: 1 }}>
                            {source.source_system || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: currentTheme.text, border: 'none', py: 1 }}>
                            {source.apiLink ? (
                              <Link href={source.apiLink} target="_blank" rel="noopener">
                                {source.datasetName || source.datasetId}
                              </Link>
                            ) : (
                              source.datasetName || source.datasetId || 'N/A'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Lineage Information */}
            {selectedReferenceItem.lineage && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1, textTransform: 'uppercase' }}>
                  Data Lineage
                </Typography>
                <Grid container spacing={2}>
                  {selectedReferenceItem.lineage.downstream && selectedReferenceItem.lineage.downstream.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                        Downstream Dependencies
                      </Typography>
                      {selectedReferenceItem.lineage.downstream.map((dep, idx) => (
                        <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: currentTheme.background, borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: currentTheme.text }}>
                            <strong>{dep.model}</strong> - {dep.field}
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                            Relationship: {dep.relationship}
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  )}
                  {selectedReferenceItem.lineage.upstream && selectedReferenceItem.lineage.upstream.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                        Upstream Sources
                      </Typography>
                      {selectedReferenceItem.lineage.upstream.map((source, idx) => (
                        <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: currentTheme.background, borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: currentTheme.text }}>
                            {source}
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  )}
                </Grid>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default PipelineDRenderer;
