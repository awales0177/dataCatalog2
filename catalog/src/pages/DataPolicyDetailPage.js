import React, { useState, useEffect, useContext } from 'react';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Flag as FlagIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Gavel as GavelIcon,
  Shield as ShieldIcon,
  Timeline as TimelineIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { formatDate } from '../utils/themeUtils';

const DataPolicyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/policies');
        if (response.ok) {
          const data = await response.json();
          const foundPolicy = data.policies.find(p => p.id === id);
          if (foundPolicy) {
            setPolicy(foundPolicy);
            document.title = `${foundPolicy.name} - Data Policy`;
          } else {
            setError('Policy not found');
          }
        } else {
          setError('Failed to fetch policy data');
        }
      } catch (err) {
        setError('Error loading policy: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: alpha('#4caf50', 0.1), color: '#4caf50' };
      case 'draft': return { bg: alpha('#ff9800', 0.1), color: '#ff9800' };
      case 'inactive': return { bg: alpha('#f44336', 0.1), color: '#f44336' };
      default: return { bg: alpha('#9e9e9e', 0.1), color: '#9e9e9e' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return { bg: alpha('#f44336', 0.1), color: '#f44336' };
      case 'high': return { bg: alpha('#ff9800', 0.1), color: '#ff9800' };
      case 'medium': return { bg: alpha('#2196f3', 0.1), color: '#2196f3' };
      case 'low': return { bg: alpha('#4caf50', 0.1), color: '#4caf50' };
      default: return { bg: alpha('#9e9e9e', 0.1), color: '#9e9e9e' };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'retention': return <TimelineIcon />;
      case 'access': return <SecurityIcon />;
      case 'compliance': return <GavelIcon />;
      case 'quality': return <CheckCircleIcon />;
      default: return <DescriptionIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
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
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/policies')}
          sx={{ mt: 2, bgcolor: currentTheme.primary }}
        >
          Back to Policies
        </Button>
      </Box>
    );
  }

  if (!policy) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: currentTheme.text }}>
          Policy not found
        </Typography>
      </Box>
    );
  }

  const statusColors = getStatusColor(policy.status);
  const priorityColors = getPriorityColor(policy.priority);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/policies')}
          sx={{ 
            color: currentTheme.textSecondary,
            mr: 2,
            '&:hover': { bgcolor: currentTheme.primary + '20' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
            {policy.name}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {policy.description}
          </Typography>
        </Box>
        <Tooltip title="Edit Policy">
          <IconButton
            onClick={() => navigate(`/policies/${policy.id}/edit`)}
            sx={{
              color: currentTheme.primary,
              bgcolor: alpha(currentTheme.primary, 0.1),
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.2),
                color: currentTheme.primary,
              },
              border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Policy Information */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Policy Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                    Type
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {getTypeIcon(policy.type)}
                    <Typography sx={{ color: currentTheme.text, textTransform: 'capitalize' }}>
                      {policy.type}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                    Status
                  </Typography>
                  <Chip
                    label={policy.status}
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: statusColors.bg,
                      color: statusColors.color,
                      textTransform: 'capitalize'
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                    Priority
                  </Typography>
                  <Chip
                    label={policy.priority}
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: priorityColors.bg,
                      color: priorityColors.color,
                      textTransform: 'capitalize'
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                    Version
                  </Typography>
                  <Typography sx={{ color: currentTheme.text, mt: 0.5 }}>
                    {policy.version}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                    Owner
                  </Typography>
                  <Typography sx={{ color: currentTheme.text, mt: 0.5 }}>
                    {policy.owner}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                    Category
                  </Typography>
                  <Typography sx={{ color: currentTheme.text, mt: 0.5, textTransform: 'capitalize' }}>
                    {policy.category?.replace('-', ' ')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Policy Details - Dynamic based on type */}
          {policy.type === 'retention' && policy.retentionRules && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Retention Rules
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.textSecondary, fontWeight: 'bold' }}>Data Type</TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary, fontWeight: 'bold' }}>Retention Period</TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary, fontWeight: 'bold' }}>Action</TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary, fontWeight: 'bold' }}>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {policy.retentionRules.map((rule, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: currentTheme.text }}>
                          {rule.dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableCell>
                        <TableCell sx={{ color: currentTheme.text }}>{rule.retentionPeriod}</TableCell>
                        <TableCell sx={{ color: currentTheme.text, textTransform: 'capitalize' }}>{rule.action}</TableCell>
                        <TableCell sx={{ color: currentTheme.textSecondary }}>{rule.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {policy.type === 'access' && policy.accessLevels && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Access Levels
              </Typography>
              {policy.accessLevels.map((level, index) => (
                <Accordion key={index} sx={{ mb: 1, bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={level.level}
                        size="small"
                        sx={{
                          bgcolor: level.level === 'public' ? alpha('#4caf50', 0.1) : 
                                   level.level === 'internal' ? alpha('#2196f3', 0.1) :
                                   level.level === 'confidential' ? alpha('#ff9800', 0.1) :
                                   alpha('#f44336', 0.1),
                          color: level.level === 'public' ? '#4caf50' : 
                                 level.level === 'internal' ? '#2196f3' :
                                 level.level === 'confidential' ? '#ff9800' : '#f44336',
                          textTransform: 'capitalize'
                        }}
                      />
                      <Typography sx={{ color: currentTheme.text }}>
                        {level.description}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                      Data Types:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {level.dataTypes.map((dataType, idx) => (
                        <Chip
                          key={idx}
                          label={dataType.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ color: currentTheme.textSecondary }}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          )}

          {policy.type === 'compliance' && policy.regulations && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Regulatory Compliance
              </Typography>
              {policy.regulations.map((regulation, index) => (
                <Accordion key={index} sx={{ mb: 1, bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GavelIcon sx={{ color: currentTheme.primary }} />
                      <Typography sx={{ color: currentTheme.text, fontWeight: 'bold' }}>
                        {regulation.name}
                      </Typography>
                      <Chip
                        label={regulation.country}
                        size="small"
                        variant="outlined"
                        sx={{ color: currentTheme.textSecondary }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                        Requirements:
                      </Typography>
                      <List dense>
                        {regulation.requirements.map((req, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <CheckCircleIcon sx={{ fontSize: 16, color: currentTheme.primary }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={<Typography sx={{ color: currentTheme.text, fontSize: '0.875rem' }}>{req}</Typography>}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    {regulation.deadlines && regulation.deadlines.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                          Deadlines:
                        </Typography>
                        <List dense>
                          {regulation.deadlines.map((deadline, idx) => (
                            <ListItem key={idx} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <ScheduleIcon sx={{ fontSize: 16, color: currentTheme.warning }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={<Typography sx={{ color: currentTheme.text, fontSize: '0.875rem' }}>{deadline}</Typography>}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          )}

          {/* Exceptions */}
          {policy.exceptions && policy.exceptions.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Exceptions
              </Typography>
              <List dense>
                {policy.exceptions.map((exception, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <WarningIcon sx={{ fontSize: 16, color: currentTheme.warning }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography sx={{ color: currentTheme.text, fontSize: '0.875rem' }}>{exception}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Tags */}
          {policy.tags && policy.tags.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {policy.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{
                      bgcolor: currentTheme.primary + '20',
                      color: currentTheme.primary,
                      textTransform: 'capitalize'
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Key Dates */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Key Dates
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Effective Date
              </Typography>
              <Typography sx={{ color: currentTheme.text }}>
                {formatDate(policy.effectiveDate)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Review Date
              </Typography>
              <Typography sx={{ color: currentTheme.text }}>
                {formatDate(policy.reviewDate)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Last Updated
              </Typography>
              <Typography sx={{ color: currentTheme.text }}>
                {formatDate(policy.lastUpdated)}
              </Typography>
            </Box>
          </Paper>

          {/* Stakeholders */}
          {policy.stakeholders && policy.stakeholders.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Stakeholders
              </Typography>
              <List dense>
                {policy.stakeholders.map((stakeholder, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <GroupIcon sx={{ fontSize: 16, color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography sx={{ color: currentTheme.text, fontSize: '0.875rem' }}>{stakeholder}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Compliance */}
          {policy.compliance && policy.compliance.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Compliance
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {policy.compliance.map((comp, index) => (
                  <Chip
                    key={index}
                    label={comp}
                    size="small"
                    sx={{
                      bgcolor: currentTheme.success + '20',
                      color: currentTheme.success,
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataPolicyDetailPage;
