/**
 * Interactive Pipeline SVG View
 * 
 * Displays an interactive pipeline diagram using the metro.svg from Pipeline C
 * with clickable nodes showing datasets and pipeline information.
 */

import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  Zoom,
  Modal,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ThemeContext } from '../contexts/ThemeContext';
import './PipelineView.css';

const PipelineView = ({ datasets, pipelineNames, onDatasetClick }) => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const svgContainerRef = useRef(null);

  // Group datasets by pipeline
  const datasetsByPipeline = useMemo(() => {
    const grouped = {};
    datasets.forEach(dataset => {
      if (dataset.systems && Array.isArray(dataset.systems)) {
        dataset.systems.forEach(pipelineUuid => {
          if (!grouped[pipelineUuid]) {
            grouped[pipelineUuid] = [];
          }
          grouped[pipelineUuid].push(dataset);
        });
      }
    });
    return grouped;
  }, [datasets]);

  // Get status color
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

  // Get status for a pipeline (based on its datasets)
  const getPipelineStatus = (pipelineUuid) => {
    const datasets = datasetsByPipeline[pipelineUuid] || [];
    if (datasets.length === 0) return 'pending';
    
    const hasRunning = datasets.some(d => d.status?.toLowerCase() === 'running');
    const hasFailed = datasets.some(d => d.status?.toLowerCase() === 'failed' || d.status?.toLowerCase() === 'error');
    const allComplete = datasets.every(d => d.status?.toLowerCase() === 'done' || d.status?.toLowerCase() === 'complete');
    
    if (hasRunning) return 'running';
    if (hasFailed) return 'failed';
    if (allComplete) return 'complete';
    return 'pending';
  };

  // Handle node click
  const handleNodeClick = (pipelineUuid, event) => {
    event?.stopPropagation();
    setSelectedNode(pipelineUuid);
    // If there's only one dataset, navigate to it
    const pipelineDatasets = datasetsByPipeline[pipelineUuid] || [];
    if (pipelineDatasets.length === 1 && onDatasetClick) {
      onDatasetClick(pipelineDatasets[0]);
    }
  };

  // Load and make the metro.svg interactive
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container) return;

    fetch('/metro.svg')
      .then(response => response.text())
      .then(svgText => {
        container.innerHTML = svgText;
        
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.maxHeight = '400px';
        svg.style.display = 'block';
        svg.style.overflow = 'visible';
        svg.style.backgroundColor = 'transparent';
        
        // Get all pipeline UUIDs
        const pipelineUuids = Object.keys(datasetsByPipeline);
        
        // Get all station images (circles in the SVG)
        const images = svg.querySelectorAll('image');
        
        // Map pipelines to stations (one pipeline per station)
        images.forEach((image, index) => {
          if (index >= pipelineUuids.length) return; // Skip if more stations than pipelines
          
          const pipelineUuid = pipelineUuids[index];
          const pipelineName = pipelineNames[pipelineUuid] || pipelineUuid;
          const datasets = datasetsByPipeline[pipelineUuid] || [];
          const status = getPipelineStatus(pipelineUuid);
          
          const x = parseFloat(image.getAttribute('x') || 0);
          const y = parseFloat(image.getAttribute('y') || 0);
          const width = parseFloat(image.getAttribute('width') || 30);
          const height = parseFloat(image.getAttribute('height') || 30);
          
          // Style the station based on pipeline status
          const isComplete = status === 'complete';
          const isRunning = status === 'running';
          const isFailed = status === 'failed';
          
          if (isRunning) {
            image.style.opacity = '1';
            image.style.filter = 'drop-shadow(0 0 8px #ff9500) brightness(1.1)';
          } else if (isComplete) {
            image.style.opacity = '1';
            image.style.filter = 'drop-shadow(0 0 6px #24b064)';
          } else if (isFailed) {
            image.style.opacity = '1';
            image.style.filter = 'drop-shadow(0 0 6px #f44336)';
          } else {
            image.style.opacity = '0.3';
            image.style.filter = 'grayscale(100%)';
          }
          
          // Create label for pipeline name
          const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          labelText.textContent = pipelineName;
          labelText.setAttribute('x', x + width / 2);
          labelText.setAttribute('y', y + height + 18);
          labelText.setAttribute('text-anchor', 'middle');
          labelText.setAttribute('class', 'pipeline-station-label');
          labelText.setAttribute('data-pipeline-uuid', pipelineUuid);
          labelText.style.fontSize = '11px';
          labelText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';
          labelText.style.fontWeight = '500';
          
          if (isRunning) {
            labelText.style.fill = '#ff9500';
          } else if (isComplete) {
            labelText.style.fill = currentTheme.darkMode ? '#ffffff' : '#000000';
          } else if (isFailed) {
            labelText.style.fill = '#f44336';
          } else {
            labelText.style.fill = '#999999';
          }
          labelText.style.pointerEvents = 'none';
          
          // Create dataset count label
          const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          countText.textContent = `${datasets.length} dataset${datasets.length !== 1 ? 's' : ''}`;
          countText.setAttribute('x', x + width / 2);
          countText.setAttribute('y', y + height + 32);
          countText.setAttribute('text-anchor', 'middle');
          countText.setAttribute('class', 'pipeline-station-count');
          countText.style.fontSize = '9px';
          countText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';
          countText.style.fontWeight = '400';
          countText.style.fill = '#666666';
          countText.style.pointerEvents = 'none';
          
          // Insert labels
          const parent = image.parentNode;
          if (parent) {
            parent.insertBefore(labelText, image.nextSibling);
            parent.insertBefore(countText, labelText.nextSibling);
          }
          
          // Create hover area
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', x - 5);
          rect.setAttribute('y', y - 5);
          rect.setAttribute('width', width + 10);
          rect.setAttribute('height', height + 10);
          rect.setAttribute('fill', 'transparent');
          rect.setAttribute('class', 'pipeline-station-hover');
          rect.setAttribute('data-pipeline-uuid', pipelineUuid);
          rect.style.cursor = 'pointer';
          rect.style.pointerEvents = 'all';
          
          image.setAttribute('data-pipeline-uuid', pipelineUuid);
          image.style.cursor = 'pointer';
          
          const handleMouseEnter = (e) => {
            setHoverInfo({
              type: 'pipeline',
              id: pipelineUuid,
              name: pipelineName,
              status: status,
              datasetCount: datasets.length,
              x: e.clientX,
              y: e.clientY
            });
            
            if (image) {
              if (isRunning) {
                image.style.filter = 'drop-shadow(0 0 12px #ff9500) brightness(1.2)';
              } else if (isComplete) {
                image.style.filter = 'drop-shadow(0 0 10px #24b064) brightness(1.1)';
              } else if (isFailed) {
                image.style.filter = 'drop-shadow(0 0 10px #f44336) brightness(1.1)';
              }
            }
          };
          
          const handleMouseLeave = (e) => {
            setHoverInfo(null);
            if (image) {
              if (isRunning) {
                image.style.filter = 'drop-shadow(0 0 8px #ff9500) brightness(1.1)';
              } else if (isComplete) {
                image.style.filter = 'drop-shadow(0 0 6px #24b064)';
              } else if (isFailed) {
                image.style.filter = 'drop-shadow(0 0 6px #f44336)';
              }
            }
          };
          
          const handleClick = (e) => {
            handleNodeClick(pipelineUuid, e);
          };
          
          rect.addEventListener('mouseenter', handleMouseEnter);
          rect.addEventListener('mouseleave', handleMouseLeave);
          rect.addEventListener('click', handleClick);
          image.addEventListener('mouseenter', handleMouseEnter);
          image.addEventListener('mouseleave', handleMouseLeave);
          image.addEventListener('click', handleClick);
          
          if (parent) {
            parent.insertBefore(rect, image);
          }
        });
        
        // Style the paths (lines) based on pipeline status
        const paths = svg.querySelectorAll('path[stroke]');
        paths.forEach((path, index) => {
          if (index >= pipelineUuids.length - 1) return; // One less path than stations
          
          const pipelineUuid = pipelineUuids[index];
          const status = getPipelineStatus(pipelineUuid);
          const isActive = status === 'complete' || status === 'running';
          
          path.setAttribute('class', 'pipeline-line');
          path.style.transition = 'all 0.2s ease';
          
          if (isActive) {
            path.setAttribute('stroke-opacity', '1');
            path.style.opacity = '1';
            path.style.cursor = 'pointer';
          } else {
            path.setAttribute('stroke-opacity', '0.3');
            path.style.opacity = '1';
            path.style.cursor = 'default';
          }
        });
      })
      .catch(error => {
        console.error('Error loading metro.svg:', error);
      });
  }, [datasetsByPipeline, pipelineNames, currentTheme.darkMode]);
  
  // Clear hover on scroll
  useEffect(() => {
    const handleScroll = () => {
      setHoverInfo(null);
    };
    
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: currentTheme.background,
        borderRadius: 2,
        overflow: 'auto',
        minHeight: '500px',
      }}
    >
      {/* Metro SVG Container */}
      <Box
        sx={{
          width: '100%',
          bgcolor: currentTheme.background,
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text, fontWeight: 600 }}>
          Pipeline Flow Map
        </Typography>
        <Box
          ref={svgContainerRef}
          className="pipeline-svg-container"
          sx={{
            width: '100%',
            bgcolor: 'transparent',
            borderRadius: 1,
            p: 2,
            minHeight: '400px',
          }}
        />
        
        {/* Tooltip */}
        {hoverInfo && (
          <Box
            sx={{
              position: 'fixed',
              left: `${hoverInfo.x + 10}px`,
              top: `${hoverInfo.y - 10}px`,
              bgcolor: currentTheme.card,
              color: currentTheme.text,
              p: 1.5,
              borderRadius: 1,
              boxShadow: 3,
              border: `1px solid ${currentTheme.border}`,
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {hoverInfo.name}
            </Typography>
            {hoverInfo.status && (
              <Typography
                variant="caption"
                sx={{
                  color:
                    hoverInfo.status === 'running' ? '#ff9500' :
                    hoverInfo.status === 'complete' ? '#24b064' :
                    hoverInfo.status === 'failed' ? '#f44336' : '#999999',
                  textTransform: 'capitalize',
                  display: 'block',
                }}
              >
                {hoverInfo.status}
              </Typography>
            )}
            {hoverInfo.datasetCount !== undefined && (
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mt: 0.5 }}>
                {hoverInfo.datasetCount} dataset{hoverInfo.datasetCount !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Selected Node Details Modal */}
      <Modal
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          sx={{
            position: 'relative',
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
            p: 3,
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: 2,
            boxShadow: 24,
            outline: 'none',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600 }}>
              {pipelineNames[selectedNode] || selectedNode}
            </Typography>
            <IconButton
              onClick={() => setSelectedNode(null)}
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
          
          {(!datasetsByPipeline[selectedNode] || datasetsByPipeline[selectedNode].length === 0) ? (
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, textAlign: 'center', py: 4 }}>
              No datasets in this pipeline
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: currentTheme.text, borderColor: currentTheme.border }}>
                      Dataset Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: currentTheme.text, borderColor: currentTheme.border }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: currentTheme.text, borderColor: currentTheme.border }}>
                      Type
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(datasetsByPipeline[selectedNode] || []).map((dataset) => (
                    <TableRow
                      key={dataset.id}
                      onClick={() => {
                        setSelectedNode(null);
                        if (onDatasetClick) {
                          onDatasetClick(dataset);
                        } else {
                          navigate(`/pipelines/datasets/${dataset.id}`);
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: currentTheme.background,
                          '& td': {
                            borderColor: '#37ABBF',
                          },
                        },
                      }}
                    >
                      <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border }}>
                        {dataset.name}
                      </TableCell>
                      <TableCell sx={{ borderColor: currentTheme.border }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: getStatusColor(dataset.status),
                            }}
                          />
                          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                            {dataset.status || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border }}>
                        {dataset.type || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Modal>
    </Box>
  );
};

export default PipelineView;
