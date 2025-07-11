import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  alpha,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowForward as ArrowForwardIcon,
  VerifiedUser as VerifiedUserIcon,
  WorkspacePremium as CrownIcon,
  Construction as WrenchIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Code as CodeIcon,
  Warning as WarningIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Roofing as RoofingIcon,
  Factory as FactoryIcon,
  Add as AddIcon,
  Edit as UpdateIcon,
  Delete as DeleteIcon,
  CheckCircle as FinalizeIcon,
  Create as CreateIcon,
  RemoveCircle as DecomIcon,
  Build as FixIcon,
  Rocket as RocketIcon,
  HelpOutline as HelpOutlineIcon,
  AccessTime as AccessTimeIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Update as RefreshIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { formatDate } from '../utils/dateUtils';
import { fetchAgreements, fetchModels } from '../services/api';

const ProductAgreementDetailPage = ({ currentTheme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = React.useState(null);
  const [model, setModel] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Set document title to "{modelShortName} Agreement"
  React.useEffect(() => {
    if (agreement && agreement.modelShortName) {
      document.title = `${agreement.modelShortName} Agreement`;
    }
  }, [agreement && agreement.modelShortName]);

  const calculateVersionDifference = (agreementVersions, modelVersion) => {
    if (!agreementVersions || !modelVersion) return null;

    const parseVersion = (version) => {
      const [major, minor, patch] = version.split('.').map(Number);
      return { major, minor, patch };
    };

    const model = parseVersion(modelVersion);
    
    // Handle multiple versions
    const versions = Array.isArray(agreementVersions) ? agreementVersions : [agreementVersions];
    let maxHealth = 100;
    let versionDetails = [];
    
    versions.forEach(agreementVersion => {
      const agreement = parseVersion(agreementVersion);
      const majorDiff = model.major - agreement.major;
      const minorDiff = model.minor - agreement.minor;
      const patchDiff = model.patch - agreement.patch;

      // Calculate health percentage based on specific drops
      const majorDrop = majorDiff * 30; // 30% drop per major version
      const minorDrop = minorDiff * 15;  // 15% drop per minor version
      const patchDrop = patchDiff * 5;  // 5% drop per patch version

      // Total health drop for this version
      const totalDrop = majorDrop + minorDrop + patchDrop;
      
      // Calculate health for this version (100% - total drop), capped between 0 and 100
      const versionHealth = Math.min(100, Math.max(0, 100 - totalDrop));
      
      // Take the highest health value among all versions
      maxHealth = Math.max(maxHealth, versionHealth);

      // Add version details
      versionDetails.push({
        version: agreementVersion,
        health: versionHealth,
        drops: {
          major: majorDrop,
          minor: minorDrop,
          patch: patchDrop
        }
      });
    });

    // Additional 15% drop for each additional version beyond the first
    const additionalVersionsDrop = (versions.length - 1) * 15;
    const finalHealth = Math.max(0, maxHealth - additionalVersionsDrop);

    return {
      health: finalHealth,
      isBehind: finalHealth < 100,
      versions: versions,
      modelVersion: modelVersion,
      versionDetails: versionDetails,
      additionalVersionsDrop: additionalVersionsDrop
    };
  };

  const getTodoItemIcon = (text) => {
    const lowerText = text.toLowerCase();
    
    // Add/Implement related keywords
    if (lowerText.includes('add') || 
        lowerText.includes('implement') || 
        lowerText.includes('create') || 
        lowerText.includes('new') || 
        lowerText.includes('introduce') || 
        lowerText.includes('setup') || 
        lowerText.includes('set up') || 
        lowerText.includes('establish') || 
        lowerText.includes('initiate') || 
        lowerText.includes('launch')) {
      return { icon: AddIcon, color: '#4caf50' }; // Green
    } 
    // Update related keywords
    else if (lowerText.includes('update') || 
             lowerText.includes('modify') || 
             lowerText.includes('change') || 
             lowerText.includes('revise') || 
             lowerText.includes('adjust') || 
             lowerText.includes('enhance') || 
             lowerText.includes('improve') || 
             lowerText.includes('upgrade') || 
             lowerText.includes('refactor') || 
             lowerText.includes('optimize')) {
      return { icon: UpdateIcon, color: '#2196f3' }; // Blue
    } 
    // Delete/Remove related keywords
    else if (lowerText.includes('delete') || 
             lowerText.includes('remove') || 
             lowerText.includes('drop') || 
             lowerText.includes('eliminate') || 
             lowerText.includes('clean up') || 
             lowerText.includes('cleanup') || 
             lowerText.includes('purge') || 
             lowerText.includes('clear') || 
             lowerText.includes('strip') || 
             lowerText.includes('uninstall')) {
      return { icon: DeleteIcon, color: '#f44336' }; // Red
    } 
    // Finalize/Complete related keywords
    else if (lowerText.includes('finalize') || 
             lowerText.includes('complete') || 
             lowerText.includes('finish') || 
             lowerText.includes('conclude') || 
             lowerText.includes('resolve') || 
             lowerText.includes('close') || 
             lowerText.includes('end') || 
             lowerText.includes('wrap up') || 
             lowerText.includes('wrapup') || 
             lowerText.includes('final')) {
      return { icon: FinalizeIcon, color: '#9c27b0' }; // Purple
    } 
    // Create related keywords
    else if (lowerText.includes('create') || 
             lowerText.includes('build') || 
             lowerText.includes('develop') || 
             lowerText.includes('design') || 
             lowerText.includes('construct') || 
             lowerText.includes('generate') || 
             lowerText.includes('produce') || 
             lowerText.includes('compose') || 
             lowerText.includes('author') || 
             lowerText.includes('draft')) {
      return { icon: CreateIcon, color: '#ff9800' }; // Orange
    } 
    // Decom/Deprecate related keywords
    else if (lowerText.includes('decom') || 
             lowerText.includes('decommission') || 
             lowerText.includes('decommissioning') || 
             lowerText.includes('decomission') || 
             lowerText.includes('decomissioning') || 
             lowerText.includes('deprecate') || 
             lowerText.includes('deprecated') || 
             lowerText.includes('sunset') || 
             lowerText.includes('retire') || 
             lowerText.includes('phase out') || 
             lowerText.includes('phaseout') || 
             lowerText.includes('discontinue') || 
             lowerText.includes('abandon') || 
             lowerText.includes('obsolete')) {
      return { icon: DecomIcon, color: '#795548' }; // Brown
    } 
    // Fix related keywords
    else if (lowerText.includes('fix') || 
             lowerText.includes('repair') || 
             lowerText.includes('resolve') || 
             lowerText.includes('debug') || 
             lowerText.includes('troubleshoot') || 
             lowerText.includes('patch') || 
             lowerText.includes('correct') || 
             lowerText.includes('address') || 
             lowerText.includes('solve') || 
             lowerText.includes('mend')) {
      return { icon: FixIcon, color: '#e91e63' }; // Pink
    } 
    // Default for unknown actions
    else {
      return { icon: RocketIcon, color: '#673ab7' }; // Deep Purple
    }
  };

  // Utility function to parse and format delivery frequency
  const parseDeliveryFrequency = (frequency) => {
    if (!frequency) return { type: 'unknown', label: 'Not specified', icon: HelpOutlineIcon };
    if (Array.isArray(frequency)) {
      return frequency.map(freq => parseDeliveryFrequency(freq));
    }
    const lowerFreq = frequency.toLowerCase();
    if (lowerFreq === 'real-time' || lowerFreq === 'realtime') {
      return { type: 'real-time', label: 'Real-Time', icon: SpeedIcon, description: 'Continuous data streaming in real-time' };
    }
    if (lowerFreq === 'periodic') {
      return { type: 'periodic', label: 'Periodic', icon: TimerIcon, description: 'Regular scheduled updates at fixed intervals' };
    }
    if (lowerFreq === 'feeds') {
      return { type: 'feeds', label: 'Feeds', icon: RefreshIcon, description: 'Data feeds from external sources' };
    }
    if (lowerFreq === 'one-time' || lowerFreq === 'onetime') {
      return { type: 'one-time', label: 'One-Time', icon: UploadIcon, description: 'Single delivery, no recurring updates' };
    }
    if (lowerFreq === 'aperiodic') {
      return { type: 'aperiodic', label: 'Aperiodic', icon: UpdateIcon, description: 'Irregular updates based on events or triggers' };
    }
    if (lowerFreq.includes('min') || lowerFreq.includes('minute')) {
      const minutes = lowerFreq.match(/(\d+)/)?.[1] || '1';
      return { type: 'minutes', label: `${minutes} minute${minutes !== '1' ? 's' : ''}`, icon: TimerIcon, description: `Updated every ${minutes} minute${minutes !== '1' ? 's' : ''}` };
    }
    if (lowerFreq.includes('hour') || lowerFreq.includes('hr')) {
      const hours = lowerFreq.match(/(\d+)/)?.[1] || '1';
      return { type: 'hours', label: `${hours} hour${hours !== '1' ? 's' : ''}`, icon: AccessTimeIcon, description: `Updated every ${hours} hour${hours !== '1' ? 's' : ''}` };
    }
    if (lowerFreq.includes('day') || lowerFreq.includes('daily')) {
      const days = lowerFreq.match(/(\d+)/)?.[1] || '1';
      return { type: 'days', label: `${days} day${days !== '1' ? 's' : ''}`, icon: ScheduleIcon, description: `Updated every ${days} day${days !== '1' ? 's' : ''}` };
    }
    if (lowerFreq.includes('week') || lowerFreq.includes('weekly')) {
      const weeks = lowerFreq.match(/(\d+)/)?.[1] || '1';
      return { type: 'weeks', label: `${weeks} week${weeks !== '1' ? 's' : ''}`, icon: ScheduleIcon, description: `Updated every ${weeks} week${weeks !== '1' ? 's' : ''}` };
    }
    if (lowerFreq.includes('month') || lowerFreq.includes('monthly')) {
      const months = lowerFreq.match(/(\d+)/)?.[1] || '1';
      return { type: 'months', label: `${months} month${months !== '1' ? 's' : ''}`, icon: ScheduleIcon, description: `Updated every ${months} month${months !== '1' ? 's' : ''}` };
    }
    if (lowerFreq.includes('year') || lowerFreq.includes('yearly') || lowerFreq.includes('annual')) {
      const years = lowerFreq.match(/(\d+)/)?.[1] || '1';
      return { type: 'years', label: `${years} year${years !== '1' ? 's' : ''}`, icon: ScheduleIcon, description: `Updated every ${years} year${years !== '1' ? 's' : ''}` };
    }
    if (lowerFreq.includes('on-demand') || lowerFreq.includes('ondemand') || lowerFreq.includes('manual')) {
      return { type: 'on-demand', label: 'On-demand', icon: RefreshIcon, description: 'Updated manually when requested' };
    }
    if (lowerFreq.includes('event') || lowerFreq.includes('trigger')) {
      return { type: 'event', label: 'Event-driven', icon: RefreshIcon, description: 'Updated based on specific events' };
    }
    if (lowerFreq.includes('batch') || lowerFreq.includes('bulk')) {
      return { type: 'batch', label: 'Batch processing', icon: RefreshIcon, description: 'Updated in batches' };
    }
    return { type: 'custom', label: frequency, icon: ScheduleIcon, description: `Custom frequency: ${frequency}` };
  };
  // Utility function to parse and format S3 location
  const parseLocation = (location) => {
    if (!location) return { label: 'Not specified', icon: HelpOutlineIcon };
    if (Array.isArray(location)) {
      return location.map(loc => parseLocation(loc));
    }
    const lowerLoc = location.toLowerCase();
    if (lowerLoc.includes('s3://') || lowerLoc.includes('s3.amazonaws.com')) {
      return { label: location, icon: StorageIcon, description: 'S3 bucket location' };
    }
    if (lowerLoc.match(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/) && !lowerLoc.includes('/')) {
      return { label: location, icon: StorageIcon, description: 'S3 bucket name' };
    }
    if (lowerLoc.includes('/') && !lowerLoc.includes('://')) {
      const parts = location.split('/');
      if (parts.length >= 2) {
        return { label: location, icon: FolderIcon, description: `S3 object in bucket: ${parts[0]}` };
      }
    }
    if (lowerLoc.includes('us-east') || lowerLoc.includes('us-west') || lowerLoc.includes('eu-') || lowerLoc.includes('ap-')) {
      return { label: location, icon: CloudIcon, description: 'AWS region' };
    }
    if (lowerLoc.includes('cloud') || lowerLoc.includes('storage')) {
      return { label: location, icon: CloudIcon, description: 'Cloud storage location' };
    }
    return { label: location, icon: StorageIcon, description: 'S3 location' };
  };
  // Utility function to parse and format data consumer
  const parseDataConsumer = (consumer) => {
    if (!consumer) return { label: 'Not specified', icon: ShoppingBasketIcon };
    if (Array.isArray(consumer)) {
      return consumer.map(cons => parseDataConsumer(cons));
    }
    const lowerCons = consumer.toLowerCase();
    if (lowerCons.includes('service') || lowerCons.includes('api')) {
      return { label: consumer, icon: CodeIcon, description: 'Service/API consumer' };
    }
    if (lowerCons.includes('app') || lowerCons.includes('application')) {
      return { label: consumer, icon: FactoryIcon, description: 'Application consumer' };
    }
    if (lowerCons.includes('analytics') || lowerCons.includes('bi') || lowerCons.includes('reporting')) {
      return { label: consumer, icon: GroupIcon, description: 'Analytics/BI consumer' };
    }
    return { label: consumer, icon: ShoppingBasketIcon, description: 'Data consumer' };
  };

  React.useEffect(() => {
    const loadAgreementAndModel = async () => {
      try {
        const data = await fetchAgreements();
        const agreement = data.agreements.find(c => c.id === id);
        if (!agreement) {
          setError('Agreement not found');
          return;
        }

        const modelData = await fetchModels();
        const model = modelData.models.find(m => m.shortName === agreement.modelShortName);
        if (!model) {
          setError('Associated model not found');
          return;
        }

        setAgreement(agreement);
        setModel(model);
      } catch (error) {
        console.error('Error loading agreement:', error);
        setError('Failed to load agreement details');
      } finally {
        setLoading(false);
      }
    };

    loadAgreementAndModel();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: currentTheme.text }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!agreement) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'in_review':
        return '#ff9800';
      case 'expired':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const statusColor = getStatusColor(agreement.status);

  const versionDiff = model ? calculateVersionDifference(agreement.deliveredVersion, model.version) : null;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <ArrowBackIcon 
          onClick={() => navigate(-1)} 
          sx={{ 
            cursor: 'pointer',
            color: currentTheme.text,
            '&:hover': { color: currentTheme.primary },
            mt: 0.5
          }} 
        />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text }}>
              {agreement.name}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: `${statusColor}20`,
                color: statusColor,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {agreement.status.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Box>
          </Box>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {agreement.description}
          </Typography>
        </Box>
      </Box>

      {versionDiff && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2,
            mb: 3,
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Version Health
                </Typography>
                {versionDiff.isBehind && (
                  <Tooltip title={
                    `Version differences: ${versionDiff.versionDetails.map(detail => 
                      `v${detail.version} (Health: ${detail.health}%, Major: -${detail.drops.major}%, Minor: -${detail.drops.minor}%, Patch: -${detail.drops.patch}%)`
                    ).join(', ')}
                    ${versionDiff.additionalVersionsDrop > 0 ? 
                      `, Additional ${versionDiff.additionalVersionsDrop}% drop due to multiple versions` : ''}
                    , Latest model version: v${versionDiff.modelVersion}`
                  }>
                    <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                  </Tooltip>
                )}
                <Tooltip title={
                  versionDiff.isBehind ?
                    `Version health is ${versionDiff.health}% due to: ${versionDiff.versionDetails.map(detail => 
                      `v${detail.version} (Major: -${detail.drops.major}%, Minor: -${detail.drops.minor}%, Patch: -${detail.drops.patch}%)`
                    ).join(', ')}
                    ${versionDiff.additionalVersionsDrop > 0 ? 
                      `, Additional ${versionDiff.additionalVersionsDrop}% drop due to maintaining multiple versions` : ''}`
                    : 'Version is up to date!'
                }>
                  <IconButton size="small" sx={{ color: currentTheme.textSecondary }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={versionDiff.health}
                  sx={{ 
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: versionDiff.health > 70 ? '#4caf50' : 
                              versionDiff.health > 30 ? '#ff9800' : '#f44336'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, minWidth: 60 }}>
                  {versionDiff.health}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block' }}>
                Model Versions Delivered
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.text }}>
                {versionDiff.versions.map(v => `v${v}`).join(', ')}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block' }}>
                Latest Model Version
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.text }}>
                v{versionDiff.modelVersion}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Data Flow
            </Typography>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 3,
              bgcolor: alpha(currentTheme.primary, 0.05),
              borderRadius: 2,
            }}>
              <Box sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                  Producer
                </Typography>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {(() => {
                    const producers = Array.isArray(agreement.dataProducer) ? agreement.dataProducer : [agreement.dataProducer];
                    return producers.map((producer, index) => (
                      <Typography key={index} variant="h6" sx={{ color: currentTheme.text, userSelect: 'text' }}>
                        {producer}
                      </Typography>
                    ));
                  })()}
                </Box>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 1 }}>
                  {agreement.producerLead}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                <ArrowForwardIcon sx={{ color: currentTheme.primary }} />
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                  Model
                </Typography>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ color: currentTheme.text, userSelect: 'text' }}>
                    {agreement.modelShortName}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                <ArrowForwardIcon sx={{ color: currentTheme.primary }} />
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                  Consumer
                </Typography>
                {(() => {
                  const consumerInfo = parseDataConsumer(agreement.dataConsumer);
                  const consumers = Array.isArray(consumerInfo) ? consumerInfo : [consumerInfo];
                  return (
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, mt: 1 }}>
                      {consumers.map((cons, index) => (
                        <Box key={index} sx={{ width: '100%' }}>
                          <Tooltip title="View application">
                            <Box
                              sx={{
                                width: '100%',
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                bgcolor: 'transparent',
                                transition: 'background 0.2s',
                                userSelect: 'text',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: currentTheme.hoverBackground || (currentTheme.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                                },
                              }}
                              onClick={() => navigate(`/applications?search=${encodeURIComponent(cons.label)}`)}
                            >
                              <Typography
                                variant="h6"
                                sx={{
                                  color: currentTheme.text,
                                  fontWeight: 600,
                                  userSelect: 'text',
                                }}
                              >
                                {cons.label}
                              </Typography>
                            </Box>
                          </Tooltip>
                          {index < consumers.length - 1 && (
                            <Box sx={{
                              width: '90%',
                              height: '1px',
                              mx: 'auto',
                              bgcolor: currentTheme.border,
                              opacity: 0.5,
                            }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  );
                })()}
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 1 }}>
                  {agreement.consumerLead}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Roles & Responsibilities
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: currentTheme.textSecondary, borderBottom: `1px solid ${currentTheme.border}` }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.textSecondary, borderBottom: `1px solid ${currentTheme.border}` }}>
                      Team
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {model && (
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RoofingIcon sx={{ 
                            fontSize: 20, 
                            color: currentTheme.primary,
                            opacity: 0.8
                          }} />
                          <Typography>Parent System</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                        {agreement.parentSystem}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WrenchIcon sx={{ 
                          fontSize: 20, 
                          color: currentTheme.primary,
                          opacity: 0.8
                        }} />
                        <Typography>Specification Maintainer</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      {agreement.specificationMaintainer}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FactoryIcon sx={{ 
                          fontSize: 20, 
                          color: currentTheme.primary,
                          opacity: 0.8
                        }} />
                        <Typography>Data Producer</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      {agreement.dataProducer}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VerifiedUserIcon sx={{ 
                          fontSize: 20, 
                          color: currentTheme.primary,
                          opacity: 0.8
                        }} />
                        <Typography>Data Validator</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      {agreement.dataValidator}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingBasketIcon sx={{ 
                          fontSize: 20, 
                          color: currentTheme.primary,
                          opacity: 0.8
                        }} />
                        <Typography>Data Consumer</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: 'none' }}>
                      {(() => {
                        const consumerInfo = parseDataConsumer(agreement.dataConsumer);
                        if (Array.isArray(consumerInfo)) {
                          return (
                            <Box>
                              {consumerInfo.map((cons, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: index < consumerInfo.length - 1 ? 1 : 0 }}>
                                  <ShoppingBasketIcon sx={{ fontSize: 20, color: currentTheme.primary, opacity: 0.8 }} />
                                  <Typography variant="body2" sx={{ color: currentTheme.text }}>
                                    {cons.label}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          );
                        }
                        // Always use ShoppingBasketIcon for single consumer too
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShoppingBasketIcon sx={{ fontSize: 20, color: currentTheme.primary, opacity: 0.8 }} />
                            <Typography variant="body2" sx={{ color: currentTheme.text }}>
                              {consumerInfo.label}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              TODO
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                Last Updated: {formatDate(agreement.todo?.date)}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {agreement.todo?.items?.map((item, index) => {
                  const { icon: Icon, color } = getTodoItemIcon(item);
                  return (
                    <Box 
                      key={index}
                      component="li" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 0.5,
                        listStyle: 'none',
                        pl: 0
                      }}
                    >
                      <Icon sx={{ color, fontSize: 20 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ color: currentTheme.text }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Paper>

          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Version History
            </Typography>
            <Accordion 
              sx={{ 
                bgcolor: 'transparent',
                boxShadow: 'none',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: 0,
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.text }} />}
                sx={{
                  px: 0,
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: currentTheme.primary }} />
                  <Typography variant="subtitle1" sx={{ color: currentTheme.text }}>
                    Changelog
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                {agreement.changelog.map((entry, index) => (
                  <Box 
                    key={entry.version}
                    sx={{ 
                      mb: index !== agreement.changelog.length - 1 ? 2 : 0,
                      pb: index !== agreement.changelog.length - 1 ? 2 : 0,
                      borderBottom: index !== agreement.changelog.length - 1 ? `1px solid ${currentTheme.border}` : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: currentTheme.primary }}>
                        v{entry.version}
                      </Typography>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        {formatDate(entry.date)}
                      </Typography>
                    </Box>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {entry.changes.map((change, changeIndex) => (
                        <Typography 
                          key={changeIndex}
                          component="li" 
                          variant="body2" 
                          sx={{ color: currentTheme.textSecondary, mb: 0.5 }}
                        >
                          {change}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              position: 'relative',
            }}
          >
            {/* Data Specification Link Icon Button */}
            <Tooltip title="View Data Specification">
              <IconButton
                component={Link}
                to={`/specifications/${agreement.modelShortName}`}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  color: currentTheme.primary,
                  bgcolor: currentTheme.card,
                  borderRadius: '50%',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: currentTheme.hoverBackground || (currentTheme.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                  },
                }}
              >
                <DescriptionIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Agreement Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Agreement Version
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                v{agreement.agreementVersion}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Model Name
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {agreement.modelShortName}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Model Version Delivered
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {Array.isArray(agreement.deliveredVersion) 
                  ? agreement.deliveredVersion.map(v => `v${v}`).join(', ')
                  : `v${agreement.deliveredVersion}`}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Delivery Frequency
              </Typography>
              <List dense sx={{ bgcolor: alpha(currentTheme.card, 0.7), borderRadius: 1, p: 0.5, pl: 0, ml: '-12px' }}>
                {Array.isArray(agreement.deliveryFrequency) ? agreement.deliveryFrequency.map((freq, index) => {
                  const { icon: IconComponent, label, description } = parseDeliveryFrequency(freq);
                  return (
                    <ListItem key={index} sx={{ py: 0.5, bgcolor: 'transparent' }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <IconComponent sx={{ fontSize: 20, color: currentTheme.primary, opacity: 0.8 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography sx={{ color: currentTheme.text }}>{label}</Typography>}
                        secondary={<Typography sx={{ color: currentTheme.textSecondary }}>{description}</Typography>}
                      />
                    </ListItem>
                  );
                }) : (() => {
                  const { icon: IconComponent, label, description } = parseDeliveryFrequency(agreement.deliveryFrequency);
                  return (
                    <ListItem sx={{ py: 0.5, bgcolor: 'transparent' }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <IconComponent sx={{ fontSize: 20, color: currentTheme.primary, opacity: 0.8 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography sx={{ color: currentTheme.text }}>{label}</Typography>}
                        secondary={<Typography sx={{ color: currentTheme.textSecondary }}>{description}</Typography>}
                      />
                    </ListItem>
                  );
                })()}
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Location
              </Typography>
              <List dense sx={{ bgcolor: alpha(currentTheme.card, 0.7), borderRadius: 1, p: 0.5, pl: 0, ml: '-12px' }}>
                {(() => {
                  if (agreement.location && typeof agreement.location === 'object' && !Array.isArray(agreement.location)) {
                    // Object: key = location, value = description
                    return Object.entries(agreement.location).map(([loc, desc], index) => {
                      const { icon: IconComponent, label } = parseLocation(loc);
                      return (
                        <ListItem key={index} sx={{ py: 0.5, bgcolor: 'transparent', alignItems: 'center' }}>
                          <ListItemIcon sx={{ minWidth: 30, display: 'flex', alignItems: 'center' }}>
                            <CloudIcon sx={{ fontSize: 20, color: currentTheme.primary, opacity: 0.8 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography sx={{ color: currentTheme.text }}>{label}</Typography>}
                            secondary={<Typography sx={{ color: currentTheme.textSecondary }}>{desc}</Typography>}
                          />
                        </ListItem>
                      );
                    });
                  } else if (Array.isArray(agreement.location)) {
                    return agreement.location.map((loc, index) => {
                      const { icon: IconComponent, label, description } = parseLocation(loc);
                      return (
                        <ListItem key={index} sx={{ py: 0.5, bgcolor: 'transparent', alignItems: 'center' }}>
                          <ListItemIcon sx={{ minWidth: 30, display: 'flex', alignItems: 'center' }}>
                            <CloudIcon sx={{ fontSize: 20, color: currentTheme.primary, opacity: 0.8 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography sx={{ color: currentTheme.text }}>{label}</Typography>}
                            secondary={<Typography sx={{ color: currentTheme.textSecondary }}>{description}</Typography>}
                          />
                        </ListItem>
                      );
                    });
                  } else {
                    const { icon: IconComponent, label, description } = parseLocation(agreement.location);
                    return (
                      <ListItem sx={{ py: 0.5, bgcolor: 'transparent', alignItems: 'center' }}>
                        <ListItemIcon sx={{ minWidth: 30, display: 'flex', alignItems: 'center' }}>
                          <CloudIcon sx={{ fontSize: 20, color: currentTheme.primary, opacity: 0.8 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography sx={{ color: currentTheme.text }}>{label}</Typography>}
                          secondary={<Typography sx={{ color: currentTheme.textSecondary }}>{description}</Typography>}
                        />
                      </ListItem>
                    );
                  }
                })()}
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Access Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={agreement.restricted ? 'Restricted' : 'Public'}
                  size="small"
                  sx={{
                    bgcolor: agreement.restricted ? alpha('#f44336', 0.1) : alpha('#4caf50', 0.1),
                    color: agreement.restricted ? '#f44336' : '#4caf50',
                    '&:hover': {
                      bgcolor: agreement.restricted ? alpha('#f44336', 0.2) : alpha('#4caf50', 0.2),
                    }
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Start Date
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {formatDate(agreement.startDate)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                End Date
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {agreement.endDate ? formatDate(agreement.endDate) : 'Not specified'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Last Updated
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {formatDate(agreement.lastUpdated)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductAgreementDetailPage; 