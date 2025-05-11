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
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { formatDate } from '../utils/dateUtils';
import { fetchContracts, fetchModels } from '../services/api';

const ContractDetailPage = ({ currentTheme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = React.useState(null);
  const [model, setModel] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const calculateVersionDifference = (contractVersion, modelVersion) => {
    if (!contractVersion || !modelVersion) return null;

    const parseVersion = (version) => {
      const [major, minor, patch] = version.split('.').map(Number);
      return { major, minor, patch };
    };

    const contract = parseVersion(contractVersion);
    const model = parseVersion(modelVersion);

    // Calculate difference in each component
    const majorDiff = model.major - contract.major;
    const minorDiff = model.minor - contract.minor;
    const patchDiff = model.patch - contract.patch;

    // Calculate health percentage based on specific drops
    const majorDrop = majorDiff * 30; // 30% drop per major version
    const minorDrop = minorDiff * 15;  // 15% drop per minor version
    const patchDrop = patchDiff * 5;  // 5% drop per patch version

    // Total health drop
    const totalDrop = majorDrop + minorDrop + patchDrop;
    
    // Calculate final health (100% - total drop), capped between 0 and 100
    const health = Math.min(100, Math.max(0, 100 - totalDrop));

    return {
      health,
      isBehind: totalDrop > 0,
      majorDiff,
      minorDiff,
      patchDiff,
      totalDrop
    };
  };

  React.useEffect(() => {
    const loadContractAndModel = async () => {
      try {
        const [contractsData, modelsData] = await Promise.all([
          fetchContracts(),
          fetchModels()
        ]);
        
        const foundContract = contractsData.contracts.find(c => c.id === id);
        if (foundContract) {
          setContract(foundContract);
          // Find the associated model
          const foundModel = modelsData.models.find(m => m.shortName === foundContract.modelShortName);
          if (foundModel) {
            setModel(foundModel);
          }
        } else {
          setError('Contract not found');
        }
      } catch (error) {
        console.error('Error fetching contract and model:', error);
        setError('Failed to load contract and model');
      } finally {
        setLoading(false);
      }
    };

    loadContractAndModel();
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

  if (!contract) {
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

  const statusColor = getStatusColor(contract.status);

  const versionDiff = model ? calculateVersionDifference(contract.deliveredVersion, model.version) : null;

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
              {contract.name}
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
              {contract.status.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Box>
          </Box>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {contract.description}
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
                    `Version differences:
                    ${versionDiff.majorDiff > 0 ? `\n• ${versionDiff.majorDiff} major version(s) behind (-${versionDiff.majorDiff * 30}%)` : ''}
                    ${versionDiff.minorDiff > 0 ? `\n• ${versionDiff.minorDiff} minor version(s) behind (-${versionDiff.minorDiff * 15}%)` : ''}
                    ${versionDiff.patchDiff > 0 ? `\n• ${versionDiff.patchDiff} patch version(s) behind (-${versionDiff.patchDiff * 5}%)` : ''}
                    \n\nTotal health drop: -${versionDiff.totalDrop}%`
                  }>
                    <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                  </Tooltip>
                )}
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
                Current Model Version
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.text }}>
                v{contract.deliveredVersion}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block' }}>
                Latest Model Version
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.text }}>
                v{model.version}
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
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                  Producer
                </Typography>
                <Typography variant="h6" sx={{ color: currentTheme.text }}>
                  {contract.producer}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 1 }}>
                  {contract.producerLead}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                <ArrowForwardIcon sx={{ color: currentTheme.primary }} />
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                  Model
                </Typography>
                <Typography variant="h6" sx={{ color: currentTheme.text }}>
                  {contract.modelShortName}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                <ArrowForwardIcon sx={{ color: currentTheme.primary }} />
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                  Consumer
                </Typography>
                <Typography variant="h6" sx={{ color: currentTheme.text }}>
                  {contract.consumer}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 1 }}>
                  {contract.consumerLead}
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
                      Person/Team
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {model && (
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WrenchIcon sx={{ 
                            fontSize: 20, 
                            color: currentTheme.primary,
                            opacity: 0.8
                          }} />
                          <Typography>Model Maintainer</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                        {model.specMaintainer}
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
                        <Typography>Producer Team</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      {contract.producer}
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
                        <Typography>Validator</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
                      {contract.validator}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupIcon sx={{ 
                          fontSize: 20, 
                          color: currentTheme.primary,
                          opacity: 0.8
                        }} />
                        <Typography>Consumer Team</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, borderBottom: 'none' }}>
                      {contract.consumer}
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
                {contract.changelog.map((entry, index) => (
                  <Box 
                    key={entry.version}
                    sx={{ 
                      mb: index !== contract.changelog.length - 1 ? 2 : 0,
                      pb: index !== contract.changelog.length - 1 ? 2 : 0,
                      borderBottom: index !== contract.changelog.length - 1 ? `1px solid ${currentTheme.border}` : 'none',
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
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Contract Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Contract Version
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                v{contract.contractVersion}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Model Version Delivered
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                v{contract.deliveredVersion}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Delivery Frequency
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ 
                  fontSize: 20, 
                  color: currentTheme.primary,
                  opacity: 0.8
                }} />
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {contract.deliveryFrequency}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Start Date
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {formatDate(contract.startDate)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Last Updated
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {formatDate(contract.lastUpdated)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Next Update
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {formatDate(contract.nextUpdate)}
              </Typography>
            </Box>
          </Paper>

          {model && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                bgcolor: currentTheme.card,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: 2,
                mt: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Model Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Model Name
                </Typography>
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {model.name}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Current Version
                </Typography>
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  v{model.version}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {model.description}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Maintainer
                </Typography>
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {model.specMaintainer}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Users
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {model.users.map((user, index) => (
                    <Chip
                      key={index}
                      label={user}
                      size="small"
                      sx={{
                        bgcolor: alpha(currentTheme.primary, 0.1),
                        color: currentTheme.primary,
                        '&:hover': {
                          bgcolor: alpha(currentTheme.primary, 0.2),
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {formatDate(model.lastUpdated)}
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractDetailPage; 