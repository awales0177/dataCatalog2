import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';

const DatasetCard = ({ dataset, onClick, currentTheme, pipelineNames }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'complete':
        return '#4caf50'; // Green
      case 'running':
        return '#ff9800'; // Orange
      case 'failed':
      case 'error':
        return '#f44336'; // Red
      case 'in queue':
      case 'queue':
        return '#2196f3'; // Blue
      case 'backlog':
        return '#2196f3'; // Blue
      default:
        return '#9e9e9e'; // Gray
    }
  };

  const getStatusPercent = (status, dataset) => {
    // If failed, calculate percentage based on where it failed
    if (status?.toLowerCase() === 'failed' || status?.toLowerCase() === 'error') {
      // Check for explicit failure percentage
      if (dataset?.failurePercentage !== undefined) {
        return dataset.failurePercentage;
      }
      // Calculate based on currentStep and processSteps
      if (dataset?.currentStep && dataset?.processSteps && dataset.processSteps.length > 0) {
        const stepPercent = (dataset.currentStep / dataset.processSteps.length) * 100;
        return Math.max(10, Math.min(90, stepPercent)); // Clamp between 10% and 90%
      }
      // Use progress if available
      if (dataset?.progress !== undefined) {
        return dataset.progress;
      }
      // Default to 50% if failed
      return 50;
    }
    
    switch (status?.toLowerCase()) {
      case 'done':
      case 'complete':
        return 100;
      case 'running':
        // Calculate based on currentStep if available
        if (dataset?.currentStep && dataset?.processSteps && dataset.processSteps.length > 0) {
          const stepPercent = (dataset.currentStep / dataset.processSteps.length) * 100;
          return Math.min(99, stepPercent); // Cap at 99% for running
        }
        return dataset?.progress || 75; // Use progress if available, otherwise 75%
      case 'in queue':
      case 'queue':
        return 50;
      case 'backlog':
        return 25;
      default:
        return 0;
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    const statusLower = status.toLowerCase();
    if (statusLower === 'in queue' || statusLower === 'queue') {
      return 'In Queue';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const errorCount = dataset.notifications?.filter(n => n.type === 'error').length || 0;
  const warningCount = dataset.notifications?.filter(n => n.type === 'warning').length || 0;
  const hasErrors = errorCount > 0;
  const hasWarnings = warningCount > 0;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: '100%',
        minHeight: '200px',
        p: 2,
        cursor: 'pointer',
        bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
        border: `1px solid ${currentTheme.darkMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border}`,
        borderRadius: '12px',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderColor: '#37ABBF',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 1.5 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: currentTheme.text, 
            fontWeight: 600,
            fontSize: '1rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
          }}
        >
          {dataset.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
          {dataset.metadataAccess ? (
            <LockOpenIcon sx={{ color: currentTheme.success, fontSize: 14 }} />
          ) : (
            <LockIcon sx={{ color: '#ef4444', fontSize: 14 }} />
          )}
          <Typography 
            variant="body2" 
            sx={{ 
              color: currentTheme.textSecondary, 
              fontSize: '0.75rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            ID: {dataset.id} {dataset.shortId && `• ${dataset.shortId}`} {dataset.periodicity && `• ${dataset.periodicity}`}
          </Typography>
          {dataset.datasetType && (
            <Chip
              label={dataset.datasetType}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: '20px',
                backgroundColor: currentTheme.primary + '20',
                color: currentTheme.primary,
                flexShrink: 0,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Description */}
      {dataset.description && (
        <Typography 
          variant="body2" 
          sx={{ 
            color: currentTheme.textSecondary, 
            mb: 1.5,
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            width: '100%',
          }}
        >
          {dataset.description}
        </Typography>
      )}

      {/* Details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto', position: 'relative' }}>
        {/* Status Bar */}
        {dataset.status && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontSize: '0.7rem' }}>
                Status
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: getStatusColor(dataset.status),
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {getStatusLabel(dataset.status)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getStatusPercent(dataset.status, dataset)}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: currentTheme.background,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStatusColor(dataset.status),
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}

        {/* Pipelines */}
        {dataset.systems && dataset.systems.length > 0 && (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: currentTheme.textSecondary, 
                fontSize: '0.7rem',
                display: 'block',
                mb: 0.5,
              }}
            >
              Pipelines:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', width: '100%' }}>
              {dataset.systems.slice(0, 3).map((systemUuid, idx) => {
                // Get status for this specific pipeline
                const pipelineStatus = dataset.pipelineStatuses?.[systemUuid] || dataset.status || 'unknown';
                const statusColor = getStatusColor(pipelineStatus);
                
                return (
                  <Chip
                    key={idx}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 
                              statusColor === 'success' ? '#4caf50' :
                              statusColor === 'warning' ? '#ff9800' :
                              statusColor === 'error' ? '#f44336' :
                              statusColor === 'info' ? '#2196f3' :
                              '#9e9e9e',
                            flexShrink: 0,
                          }}
                        />
                        <span>{pipelineNames[systemUuid] || systemUuid}</span>
                      </Box>
                    }
                    size="small"
                    sx={{
                      backgroundColor: currentTheme.primary + '20',
                      color: currentTheme.primary,
                      fontSize: '0.7rem',
                      height: '22px',
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      },
                    }}
                  />
                );
              })}
              {dataset.systems.length > 3 && (
                <Chip
                  label={`+${dataset.systems.length - 3}`}
                  size="small"
                  sx={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.textSecondary,
                    fontSize: '0.7rem',
                    height: '22px',
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Last Updated */}
        {dataset.lastUpdated && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: currentTheme.textSecondary, 
              fontSize: '0.7rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            Last processed: {dataset.lastUpdated}
          </Typography>
        )}

        {/* Warning and Error Icons - Bottom Right Corner */}
        {(hasWarnings || hasErrors) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {hasWarnings && (
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: '#ffffff',
                  color: '#f59e0b',
                  '&:hover': {
                    background: '#fef3c7',
                    borderColor: '#f59e0b',
                  },
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {warningCount > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#f59e0b',
                      color: '#ffffff',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      px: 0.5,
                      py: 0.125,
                      borderRadius: '10px',
                      minWidth: '18px',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {warningCount}
                  </Box>
                )}
              </Box>
            )}
            {hasErrors && (
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: '#ffffff',
                  color: '#ef4444',
                  '&:hover': {
                    background: '#fee2e2',
                    borderColor: '#ef4444',
                  },
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {errorCount > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      px: 0.5,
                      py: 0.125,
                      borderRadius: '10px',
                      minWidth: '18px',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {errorCount}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DatasetCard;
