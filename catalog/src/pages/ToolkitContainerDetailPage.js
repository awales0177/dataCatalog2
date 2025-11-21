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
  Storage as StorageIcon,
  GitHub as GitHubIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  GetApp as GetAppIcon,
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

const ToolkitContainerDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { containerId } = useParams();
  const navigate = useNavigate();
  const [containerData, setContainerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContainerData = async () => {
      try {
        const data = await fetchData('toolkit');
        const containers = data.toolkit.containers || [];
        const foundContainer = containers.find(c => c.id === containerId);
        
        if (foundContainer) {
          setContainerData(foundContainer);
        } else {
          setError('Container not found');
        }
      } catch (err) {
        setError('Failed to load container data');
      } finally {
        setLoading(false);
      }
    };

    if (containerId) {
      loadContainerData();
    }
  }, [containerId]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !containerData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Container not found'}
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
            <StorageIcon sx={{ fontSize: 32 }} />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
                {containerData.name}
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1, fontFamily: 'monospace' }}>
                {containerData.id}
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                {containerData.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<StorageIcon />}
                  label={containerData.type || 'docker'}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<PersonIcon />}
                  label={containerData.author}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<ScheduleIcon />}
                  label={`v${containerData.version}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<StarIcon />}
                  label={`${containerData.rating}/5`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<GetAppIcon />}
                  label={`${containerData.downloads} downloads`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
              </Box>
            </Box>
            
            {/* Edit Button */}
            <Tooltip title="Edit Container">
              <IconButton
                onClick={() => navigate(`/toolkit/container/${containerData.id}/edit`)}
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
          {/* Dockerfile Section */}
          {containerData.dockerfile && (
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
                Dockerfile
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                Container build configuration:
              </Typography>
              <Box
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <SyntaxHighlighter
                  language="dockerfile"
                  style={getHighlightTheme()}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {containerData.dockerfile}
                </SyntaxHighlighter>
              </Box>
            </Paper>
          )}

          {/* Docker Compose Section */}
          {containerData.dockerCompose && (
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
                Docker Compose
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                Multi-container orchestration configuration:
              </Typography>
              <Box
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <SyntaxHighlighter
                  language="yaml"
                  style={getHighlightTheme()}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {containerData.dockerCompose}
                </SyntaxHighlighter>
              </Box>
            </Paper>
          )}

          {/* Examples Section */}
          {containerData.examples && containerData.examples.length > 0 && (
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
                {containerData.examples.map((example, index) => (
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
          {containerData.dependencies && containerData.dependencies.length > 0 && (
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
                {containerData.dependencies.map((dep, index) => (
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
                  // Download container configuration
                  const blob = new Blob([containerData.dockerfile || ''], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Dockerfile-${containerData.id}`;
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
                Download Dockerfile
              </Button>
              {containerData.dockerCompose && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    // Download docker-compose configuration
                    const blob = new Blob([containerData.dockerCompose], { type: 'text/yaml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `docker-compose-${containerData.id}.yml`;
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
                  Download Docker Compose
                </Button>
              )}
              {containerData.git && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GitHubIcon />}
                  onClick={() => {
                    if (containerData.git) {
                      window.open(containerData.git, '_blank');
                    }
                  }}
                  disabled={!containerData.git}
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
                  Type
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {containerData.type || 'docker'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Category
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {containerData.category}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {formatDate(containerData.lastUpdated)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Usage Instructions
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {containerData.usage}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tags */}
          {containerData.tags && containerData.tags.length > 0 && (
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
                {containerData.tags.map((tag, index) => (
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

export default ToolkitContainerDetailPage;

