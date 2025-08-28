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
  Code as CodeIcon,
  GitHub as GitHubIcon,
  Download as DownloadIcon,
  Language as LanguageIcon,
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
import { ThemeContext } from '../App';
import { fetchData } from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ToolkitFunctionDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { functionId } = useParams();
  const navigate = useNavigate();
  const [functionData, setFunctionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFunctionData = async () => {
      try {
        const data = await fetchData('toolkit');
        const functions = data.toolkit.functions || [];
        const foundFunction = functions.find(f => f.id === functionId);
        
        if (foundFunction) {
          setFunctionData(foundFunction);
        } else {
          setError('Function not found');
        }
      } catch (err) {
        setError('Failed to load function data');
        console.error('Error loading function data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (functionId) {
      loadFunctionData();
    }
  }, [functionId]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !functionData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Function not found'}
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

  // Get the appropriate language for syntax highlighting
  const getLanguageForHighlighting = (language) => {
    switch (language?.toLowerCase()) {
      case 'python':
        return 'python';
      case 'javascript':
      case 'js':
        return 'javascript';
      case 'typescript':
      case 'ts':
        return 'typescript';
      case 'java':
        return 'java';
      case 'c#':
      case 'csharp':
        return 'csharp';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      case 'go':
        return 'go';
      case 'rust':
        return 'rust';
      case 'php':
        return 'php';
      case 'ruby':
        return 'ruby';
      case 'swift':
        return 'swift';
      case 'kotlin':
        return 'kotlin';
      case 'scala':
        return 'scala';
      case 'r':
        return 'r';
      case 'sql':
        return 'sql';
      case 'bash':
      case 'shell':
        return 'bash';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'text';
    }
  };

  // Get the appropriate theme based on current theme
  const getHighlightTheme = () => {
    return currentTheme.darkMode ? oneDark : oneLight;
  };

  // Get language-specific icon
  const getLanguageIcon = (language) => {
    if (!language) return <CodeIcon sx={{ fontSize: 32 }} />;
    
    const languageLower = language.toLowerCase();
    switch (languageLower) {
      case 'python':
        return <img src="/python.svg" alt="Python" style={{ width: 32, height: 32 }} />;
      case 'javascript':
      case 'js':
        return <img src="/javascript.svg" alt="JavaScript" style={{ width: 32, height: 32 }} />;
      case 'java':
        return <img src="/java.svg" alt="Java" style={{ width: 32, height: 32 }} />;
      case 'ruby':
        return <img src="/ruby.svg" alt="Ruby" style={{ width: 32, height: 32 }} />;
      case 'typescript':
      case 'ts':
        return <img src="/typescript.svg" alt="TypeScript" style={{ width: 32, height: 32 }} />;
      case 'go':
        return <img src="/go.svg" alt="Go" style={{ width: 32, height: 32 }} />;
      case 'rust':
        return <img src="/rust.svg" alt="Rust" style={{ width: 32, height: 32 }} />;
      case 'php':
        return <img src="/php.svg" alt="PHP" style={{ width: 32, height: 32 }} />;
      case 'swift':
        return <img src="/swift.svg" alt="Swift" style={{ width: 32, height: 32 }} />;
      case 'kotlin':
        return <img src="/kotlin.svg" alt="Kotlin" style={{ width: 32, height: 32 }} />;
      case 'scala':
        return <img src="/scala.svg" alt="Scala" style={{ width: 32, height: 32 }} />;
      case 'r':
        return <img src="/r.svg" alt="R" style={{ width: 32, height: 32 }} />;
      case 'sql':
        return <img src="/sql.svg" alt="SQL" style={{ width: 32, height: 32 }} />;
      case 'bash':
      case 'shell':
        return <img src="/bash.svg" alt="Bash" style={{ width: 32, height: 32 }} />;
      case 'yaml':
      case 'yml':
        return <img src="/yaml.svg" alt="YAML" style={{ width: 32, height: 32 }} />;
      case 'json':
        return <img src="/json.svg" alt="JSON" style={{ width: 32, height: 32 }} />;
      case 'xml':
        return <img src="/xml.svg" alt="XML" style={{ width: 32, height: 32 }} />;
      case 'html':
        return <img src="/html.svg" alt="HTML" style={{ width: 32, height: 32 }} />;
      case 'css':
        return <img src="/css.svg" alt="CSS" style={{ width: 32, height: 32 }} />;
      default:
        return <CodeIcon sx={{ fontSize: 32 }} />;
    }
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
            {getLanguageIcon(functionData.language)}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
                {functionData.displayName || functionData.name}
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1, fontFamily: 'monospace' }}>
                {functionData.name}
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                {functionData.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<LanguageIcon />}
                  label={functionData.language}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<PersonIcon />}
                  label={functionData.author}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<ScheduleIcon />}
                  label={`v${functionData.version}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<StarIcon />}
                  label={`${functionData.rating}/5`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
                <Chip
                  icon={<GetAppIcon />}
                  label={`${functionData.downloads} downloads`}
                  size="small"
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
              </Box>
            </Box>
            
            {/* Edit Button */}
            <Tooltip title="Edit Function">
              <IconButton
                onClick={() => navigate(`/toolkit/function/${functionData.id}/edit`)}
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
          {/* Example Usage Section */}
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
              Example Usage
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
              How to import and use this function:
            </Typography>
            <Box
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <SyntaxHighlighter
                language={getLanguageForHighlighting(functionData.language)}
                style={getHighlightTheme()}
                customStyle={{
                  margin: 0,
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                }}
                showLineNumbers={true}
                wrapLines={true}
              >
                {functionData.code}
              </SyntaxHighlighter>
            </Box>
          </Paper>

          {/* Parameters Section */}
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
              Parameters
            </Typography>
            <Grid container spacing={2}>
              {functionData.parameters ? functionData.parameters.map((param, index) => (
                <Grid item xs={12} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: currentTheme.primary, fontWeight: 600 }}>
                        {param.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500 }}>
                        ({(param.type === 'string' || param.type === 'boolean') && param.allowedValues && param.allowedValues.length <= 5 
                          ? `${param.type} (enum)` 
                          : param.type})
                      </Typography>
                      {param.required !== false && (
                        <Chip
                          label="Required"
                          size="small"
                          sx={{
                            bgcolor: alpha('#f44336', 0.1),
                            color: '#f44336',
                            fontSize: '0.75rem',
                          }}
                        />
                      )}
                      {param.required === false && (
                        <Chip
                          label="Optional"
                          size="small"
                          sx={{
                            bgcolor: alpha('#4caf50', 0.1),
                            color: '#4caf50',
                            fontSize: '0.75rem',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                      {param.description}
                    </Typography>
                    
                    {/* Parameter Options */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* Default Value */}
                      {param.default !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500, minWidth: '60px' }}>
                            Default:
                          </Typography>
                          <Typography variant="body2" sx={{ color: currentTheme.text, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {String(param.default)}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Allowed Values */}
                      {param.allowedValues && param.allowedValues.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500, minWidth: '60px' }}>
                            Allowed Values:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {param.allowedValues.map((value, valueIndex) => (
                              <Typography 
                                key={valueIndex}
                                variant="body2" 
                                sx={{ 
                                  color: (param.type === 'string' || param.type === 'boolean') && param.allowedValues.length <= 5 
                                    ? '#2196f3' 
                                    : currentTheme.text,
                                  fontFamily: 'monospace', 
                                  fontSize: '0.875rem',
                                  fontWeight: (param.type === 'string' || param.type === 'boolean') && param.allowedValues.length <= 5 ? 600 : 400,
                                  bgcolor: (param.type === 'string' || param.type === 'boolean') && param.allowedValues.length <= 5 
                                    ? alpha('#2196f3', 0.05) 
                                    : 'transparent',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                  border: (param.type === 'string' || param.type === 'boolean') && param.allowedValues.length <= 5 
                                    ? `1px solid ${alpha('#2196f3', 0.2)}` 
                                    : 'none',
                                }}
                              >
                                {String(value)}
                              </Typography>
                            ))}

                          </Box>
                        </Box>
                      )}
                      
                      {/* Min/Max Values */}
                      {(param.min !== undefined || param.max !== undefined) && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500, minWidth: '60px' }}>
                            Range:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {param.min !== undefined && (
                              <Typography variant="body2" sx={{ color: currentTheme.text, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                Min: {param.min}
                              </Typography>
                            )}
                            {param.max !== undefined && (
                              <Typography variant="body2" sx={{ color: currentTheme.text, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                Max: {param.max}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Pattern/Format */}
                      {param.pattern && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500, minWidth: '60px' }}>
                            Pattern:
                          </Typography>
                          <Typography variant="body2" sx={{ color: currentTheme.text, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {param.pattern}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Example Value */}
                      {param.example && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500, minWidth: '60px' }}>
                            Example:
                          </Typography>
                          <Typography variant="body2" sx={{ color: currentTheme.text, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {String(param.example)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              )) : (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                    No parameter information available for this function.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Dependencies */}
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
              {functionData.dependencies.map((dep, index) => (
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
                  // TODO: Implement download functionality
                  console.log('Download function:', functionData.id);
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
                Download Function
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHubIcon />}
                onClick={() => {
                  if (functionData.git) {
                    window.open(functionData.git, '_blank');
                  } else {
                    console.log('No git repository available for:', functionData.id);
                  }
                }}
                disabled={!functionData.git}
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
                  Category
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {functionData.category}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {formatDate(functionData.lastUpdated)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  Usage Instructions
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {functionData.usage}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tags */}
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
              {functionData.tags.map((tag, index) => (
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
        </Grid>
      </Grid>
    </Container>
  );
};

export default ToolkitFunctionDetailPage;
