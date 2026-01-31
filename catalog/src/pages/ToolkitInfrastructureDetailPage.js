import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Grid,
  Divider,
  Link,
  alpha,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Button,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Cloud as CloudIcon,
  GitHub as GitHubIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Book as BookIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  List as ListIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ToolkitInfrastructureDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { infrastructureId } = useParams();
  const navigate = useNavigate();
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInfrastructureData = async () => {
      try {
        const data = await fetchData('toolkit');
        const infrastructure = data.toolkit.infrastructure || [];
        const foundInfrastructure = infrastructure.find(i => i.id === infrastructureId);
        
        if (foundInfrastructure) {
          setInfrastructureData(foundInfrastructure);
        } else {
          setError('Infrastructure not found');
        }
      } catch (err) {
        setError('Failed to load infrastructure data');
      } finally {
        setLoading(false);
      }
    };

    if (infrastructureId) {
      loadInfrastructureData();
    }
  }, [infrastructureId]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !infrastructureData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Infrastructure not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/toolkit')}
          variant="outlined"
        >
          Back to Toolkit
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get the appropriate theme based on current theme
  const getHighlightTheme = () => {
    return currentTheme.darkMode ? oneDark : oneLight;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/toolkit')}
          sx={{ mb: 2, color: currentTheme.textSecondary }}
        >
          Back to Toolkit
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CloudIcon sx={{ fontSize: 32 }} />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
                {infrastructureData.name}
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1, fontFamily: 'monospace' }}>
                {infrastructureData.id}
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                {infrastructureData.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CloudIcon />}
                  label={infrastructureData.provider || 'terraform'}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<PersonIcon />}
                  label={infrastructureData.author}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<ScheduleIcon />}
                  label={`v${infrastructureData.version}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${infrastructureData.testCoverage !== undefined ? infrastructureData.testCoverage : 0}% coverage`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<VisibilityIcon />}
                  label={`${infrastructureData.clickCount || 0} views`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
              </Box>
            </Box>
            
            {/* Edit Button */}
            <Tooltip title="Edit Infrastructure">
              <IconButton
                onClick={() => navigate(`/toolkit/infrastructure/${infrastructureData.id}/edit`)}
                sx={{
                  color: currentTheme.primary,
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  '&:hover': {
                    bgcolor: alpha(currentTheme.primary, 0.2),
                  },
                  border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Main Terraform File Section */}
          {infrastructureData.mainTf && (
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
                main.tf
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                Main Terraform configuration:
              </Typography>
              <Box
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <SyntaxHighlighter
                  language="hcl"
                  style={getHighlightTheme()}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {infrastructureData.mainTf}
                </SyntaxHighlighter>
              </Box>
            </Paper>
          )}

          {/* Variables Terraform File Section */}
          {infrastructureData.variablesTf && (
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
                variables.tf
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                Variable definitions:
              </Typography>
              <Box
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <SyntaxHighlighter
                  language="hcl"
                  style={getHighlightTheme()}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {infrastructureData.variablesTf}
                </SyntaxHighlighter>
              </Box>
            </Paper>
          )}

          {/* Outputs Terraform File Section */}
          {infrastructureData.outputsTf && (
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
                outputs.tf
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                Output definitions:
              </Typography>
              <Box
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <SyntaxHighlighter
                  language="hcl"
                  style={getHighlightTheme()}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {infrastructureData.outputsTf}
                </SyntaxHighlighter>
              </Box>
            </Paper>
          )}

          {/* Examples Section */}
          {infrastructureData.examples && infrastructureData.examples.length > 0 && (
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
                Use Cases & Examples
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {infrastructureData.examples.map((example, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      bgcolor: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontFamily: 'monospace' }}>
                      {example}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Dependencies */}
          {infrastructureData.dependencies && infrastructureData.dependencies.length > 0 && (
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
                Dependencies
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {infrastructureData.dependencies.map((dep, index) => (
                  <Chip
                    key={index}
                    label={dep}
                    size="small"
                    sx={{
                      bgcolor: alpha(currentTheme.primary, 0.1),
                      color: currentTheme.primary,
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
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
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  // Download main.tf
                  const blob = new Blob([infrastructureData.mainTf || ''], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `main-${infrastructureData.id}.tf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                sx={{
                  color: currentTheme.primary,
                  borderColor: currentTheme.border,
                  '&:hover': {
                    borderColor: currentTheme.primary,
                    bgcolor: alpha(currentTheme.primary, 0.1),
                  },
                }}
              >
                Download main.tf
              </Button>
              {infrastructureData.variablesTf && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    // Download variables.tf
                    const blob = new Blob([infrastructureData.variablesTf], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `variables-${infrastructureData.id}.tf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  sx={{
                    color: currentTheme.primary,
                    borderColor: currentTheme.border,
                    '&:hover': {
                      borderColor: currentTheme.primary,
                      bgcolor: alpha(currentTheme.primary, 0.1),
                    },
                  }}
                >
                  Download variables.tf
                </Button>
              )}
              {infrastructureData.outputsTf && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    // Download outputs.tf
                    const blob = new Blob([infrastructureData.outputsTf], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `outputs-${infrastructureData.id}.tf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  sx={{
                    color: currentTheme.primary,
                    borderColor: currentTheme.border,
                    '&:hover': {
                      borderColor: currentTheme.primary,
                      bgcolor: alpha(currentTheme.primary, 0.1),
                    },
                  }}
                >
                  Download outputs.tf
                </Button>
              )}
              {infrastructureData.git && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GitHubIcon />}
                  onClick={() => {
                    if (infrastructureData.git) {
                      window.open(infrastructureData.git, '_blank');
                    }
                  }}
                  disabled={!infrastructureData.git}
                  sx={{
                    color: currentTheme.primary,
                    borderColor: currentTheme.border,
                    '&:hover': {
                      borderColor: currentTheme.primary,
                      bgcolor: alpha(currentTheme.primary, 0.1),
                    },
                  }}
                >
                  View Source Code
                </Button>
              )}
            </Box>
          </Paper>

          {/* Metadata */}
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
              Metadata
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Provider
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {infrastructureData.provider || 'terraform'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Category
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {infrastructureData.category}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {formatDate(infrastructureData.lastUpdated)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Usage Instructions
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {infrastructureData.usage}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tags */}
          {infrastructureData.tags && infrastructureData.tags.length > 0 && (
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
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {infrastructureData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{
                      bgcolor: alpha(currentTheme.primary, 0.1),
                      color: currentTheme.primary,
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ToolkitInfrastructureDetailPage;



