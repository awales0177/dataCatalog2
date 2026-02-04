import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Grid,
  IconButton,
  Alert,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  alpha,
  Divider,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Code as CodeIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import MermaidDiagram from '../components/MermaidDiagram';

const ToolkitDetailPage = () => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const { toolkitId } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [toolkitData, setToolkitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technologies, setTechnologies] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [techReactions, setTechReactions] = useState({});
  const [readmeTab, setReadmeTab] = useState(0); // 0 = Evaluation, 1 = Installation, 2 = Usage
  const [rankChangeDialog, setRankChangeDialog] = useState({ open: false, techId: null, direction: null, techName: null });

  useEffect(() => {
    const loadToolkitData = async () => {
      try {
        const data = await fetchData('toolkit');
        const toolkits = data.toolkit?.toolkits || [];
        const foundToolkit = toolkits.find(t => t.id === toolkitId);
        
        if (foundToolkit) {
          setToolkitData(foundToolkit);
          // Load technologies and merge with localStorage data
          const baseTechs = foundToolkit.technologies || [];
          const mergedTechs = baseTechs.map(tech => {
            // Check if there's a saved version in localStorage
            const storageKey = `toolkit_${toolkitId}_tech_${tech.id}`;
            const savedTech = localStorage.getItem(storageKey);
            if (savedTech) {
              const savedTechData = JSON.parse(savedTech);
              // Merge with base tech, prioritizing saved data
              return { ...tech, ...savedTechData };
            }
            return tech;
          });
          
          // Also check for newly created technologies in localStorage
          const allStorageKeys = Object.keys(localStorage);
          const newTechKeys = allStorageKeys.filter(key => 
            key.startsWith(`toolkit_${toolkitId}_tech_`) && 
            !key.includes('_evaluation') && 
            !key.includes('_installation') && 
            !key.includes('_usage')
          );
          
          newTechKeys.forEach(key => {
            const techId = key.replace(`toolkit_${toolkitId}_tech_`, '');
            if (!mergedTechs.find(t => t.id === techId)) {
              const newTech = JSON.parse(localStorage.getItem(key));
              mergedTechs.push(newTech);
            }
          });
          
          // Sort technologies by rank
          const sortedTechs = mergedTechs.sort((a, b) => a.rank - b.rank);
          setTechnologies(sortedTechs);
          // Set first technology as selected by default
          if (sortedTechs.length > 0) {
            setSelectedTech(sortedTechs[0]);
            setReadmeTab(0); // Reset to first tab when selecting new tech
          }
          // Initialize reactions from localStorage
          const savedReactions = localStorage.getItem(`toolkit-reactions-${toolkitId}`);
          if (savedReactions) {
            setTechReactions(JSON.parse(savedReactions));
          } else {
            // Initialize from data
            const initialReactions = {};
            sortedTechs.forEach(tech => {
              initialReactions[tech.id] = {
                likes: tech.likes || 0,
                dislikes: tech.dislikes || 0,
                userLiked: false,
                userDisliked: false,
              };
            });
            setTechReactions(initialReactions);
          }
        } else {
          setError('Toolkit not found');
        }
      } catch (err) {
        setError('Failed to load toolkit data');
      } finally {
        setLoading(false);
      }
    };

    if (toolkitId) {
      loadToolkitData();
    }
  }, [toolkitId]);

  const handleRankChange = (techId, direction) => {
    if (!canEdit()) return;
    
    const tech = technologies.find(t => t.id === techId);
    if (!tech) return;

    const currentIndex = technologies.findIndex(t => t.id === techId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= technologies.length) return;

    // Show confirmation dialog
    setRankChangeDialog({
      open: true,
      techId,
      direction,
      techName: tech.name,
      currentIndex,
      newIndex,
    });
  };

  const confirmRankChange = () => {
    const { techId, direction, currentIndex, newIndex } = rankChangeDialog;

    const newTechnologies = [...technologies];
    const [moved] = newTechnologies.splice(currentIndex, 1);
    newTechnologies.splice(newIndex, 0, moved);

    // Update ranks
    newTechnologies.forEach((tech, index) => {
      tech.rank = index + 1;
    });

    setTechnologies(newTechnologies);
    setRankChangeDialog({ open: false, techId: null, direction: null, techName: null });
    // TODO: Save to backend
  };

  const cancelRankChange = () => {
    setRankChangeDialog({ open: false, techId: null, direction: null, techName: null });
  };

  const handleReaction = (techId, type) => {
    const reactions = { ...techReactions };
    if (!reactions[techId]) {
      reactions[techId] = { likes: 0, dislikes: 0, userLiked: false, userDisliked: false };
    }

    const current = reactions[techId];
    
    if (type === 'like') {
      if (current.userLiked) {
        current.likes = Math.max(0, current.likes - 1);
        current.userLiked = false;
      } else {
        current.likes += 1;
        current.userLiked = true;
        if (current.userDisliked) {
          current.dislikes = Math.max(0, current.dislikes - 1);
          current.userDisliked = false;
        }
      }
    } else if (type === 'dislike') {
      if (current.userDisliked) {
        current.dislikes = Math.max(0, current.dislikes - 1);
        current.userDisliked = false;
      } else {
        current.dislikes += 1;
        current.userDisliked = true;
        if (current.userLiked) {
          current.likes = Math.max(0, current.likes - 1);
          current.userLiked = false;
        }
      }
    }

    setTechReactions(reactions);
    localStorage.setItem(`toolkit-reactions-${toolkitId}`, JSON.stringify(reactions));
  };



  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: currentTheme.primary }} />
        </Box>
      </Container>
    );
  }

  if (error || !toolkitData) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text, mb: 3 }}>
          {error || 'Toolkit not found'}
        </Alert>
        <IconButton
          onClick={() => navigate('/toolkit')}
          sx={{
            color: currentTheme.textSecondary,
            '&:hover': {
              color: currentTheme.primary,
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
      }}>
      {/* Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          onClick={() => navigate('/toolkit')}
          sx={{
            color: currentTheme.textSecondary,
            '&:hover': {
              color: currentTheme.primary,
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text }}>
              {toolkitData.displayName || toolkitData.name}
            </Typography>
            {canEdit() && (
              <Tooltip title="Edit Toolkit">
                <IconButton
                  onClick={() => navigate(`/toolkit/${toolkitId}/edit`)}
                  size="small"
                  sx={{ 
                    color: currentTheme.textSecondary,
                    '&:hover': {
                      color: currentTheme.primary,
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            {toolkitData.description}
          </Typography>
        </Box>
      </Box>

      {/* Two Column Layout */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left Pane: Technologies List */}
        <Grid item xs={12} md={5} sx={{ 
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}`, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    Technologies ({technologies.length})
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 0.5 }}>
                    Ranked by effectiveness and suitability
                  </Typography>
                </Box>
                {canEdit() && (
                  <Tooltip title="Add Technology">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/toolkit/toolkit/${toolkitId}/technology/create`)}
                      sx={{
                        color: currentTheme.primary,
                        bgcolor: alpha(currentTheme.primary, 0.1),
                        '&:hover': {
                          bgcolor: alpha(currentTheme.primary, 0.2),
                        },
                        border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              {technologies.length === 0 ? (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, textAlign: 'center', p: 3 }}>
                  No technologies available
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {technologies.map((tech, index) => (
                    <React.Fragment key={tech.id}>
                      <ListItem
                        button
                        onClick={() => {
                          setSelectedTech(tech);
                          setReadmeTab(0); // Reset to first tab when selecting new tech
                        }}
                        selected={selectedTech?.id === tech.id}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          bgcolor: selectedTech?.id === tech.id 
                            ? alpha(currentTheme.primary, 0.1) 
                            : 'transparent',
                          border: selectedTech?.id === tech.id 
                            ? `1px solid ${currentTheme.primary}` 
                            : `1px solid transparent`,
                          '&:hover': {
                            bgcolor: alpha(currentTheme.primary, 0.05),
                            border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                          },
                          '&.Mui-selected': {
                            bgcolor: alpha(currentTheme.primary, 0.1),
                            '&:hover': {
                              bgcolor: alpha(currentTheme.primary, 0.15),
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            sx={{
                              minWidth: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: currentTheme.primary,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                            }}
                          >
                            #{tech.rank}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                                {tech.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: currentTheme.textSecondary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {tech.description}
                            </Typography>
                          }
                        />
                        {canEdit() && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, ml: 1 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRankChange(tech.id, 'up');
                              }}
                              disabled={index === 0}
                              sx={{
                                color: currentTheme.textSecondary,
                                '&:hover': { color: currentTheme.primary },
                                '&:disabled': { opacity: 0.3 },
                                p: 0.5,
                              }}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRankChange(tech.id, 'down');
                              }}
                              disabled={index === technologies.length - 1}
                              sx={{
                                color: currentTheme.textSecondary,
                                '&:hover': { color: currentTheme.primary },
                                '&:disabled': { opacity: 0.3 },
                                p: 0.5,
                              }}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </ListItem>
                      {index < technologies.length - 1 && (
                        <Divider sx={{ mx: 1, borderColor: currentTheme.border }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Pane: Selected Technology Details */}
        <Grid item xs={12} md={7} sx={{ 
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
            }}
          >
            {selectedTech ? (
              <>
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: `1px solid ${currentTheme.border}`, flexShrink: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600, flex: 1 }}>
                      {selectedTech.name}
                    </Typography>
                  </Box>

                  <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                    {selectedTech.description}
                  </Typography>

                  {/* Like/Dislike Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Like this technology">
                      <IconButton
                        onClick={() => handleReaction(selectedTech.id, 'like')}
                        sx={{
                          color: techReactions[selectedTech.id]?.userLiked ? '#37ABBF' : currentTheme.textSecondary,
                          bgcolor: techReactions[selectedTech.id]?.userLiked ? alpha('#37ABBF', 0.1) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha('#37ABBF', 0.1),
                          },
                        }}
                      >
                        <ThumbUpIcon />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, minWidth: '24px' }}>
                      {techReactions[selectedTech.id]?.likes || 0}
                    </Typography>
                    <Tooltip title="Dislike this technology">
                      <IconButton
                        onClick={() => handleReaction(selectedTech.id, 'dislike')}
                        sx={{
                          color: techReactions[selectedTech.id]?.userDisliked ? '#f44336' : currentTheme.textSecondary,
                          bgcolor: techReactions[selectedTech.id]?.userDisliked ? alpha('#f44336', 0.1) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha('#f44336', 0.1),
                          },
                        }}
                      >
                        <ThumbDownIcon />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, minWidth: '24px' }}>
                      {techReactions[selectedTech.id]?.dislikes || 0}
                    </Typography>
                  </Box>
                </Box>

                {/* README Tabs */}
                <Box>
                  <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <Tabs
                      value={readmeTab}
                      onChange={(e, newValue) => setReadmeTab(newValue)}
                      sx={{
                        '& .MuiTab-root': {
                          color: currentTheme.textSecondary,
                          textTransform: 'none',
                          fontWeight: 500,
                          minHeight: 48,
                        },
                        '& .Mui-selected': {
                          color: currentTheme.primary,
                        },
                        '& .MuiTabs-indicator': {
                          bgcolor: currentTheme.primary,
                        },
                      }}
                    >
                      <Tab label="Evaluation" />
                      <Tab label="Installation" />
                      <Tab label="Usage" />
                    </Tabs>
                    {canEdit() && (
                      <Tooltip title="Edit Markdown">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const readmeTypes = ['evaluation', 'installation', 'usage'];
                            const readmeType = readmeTypes[readmeTab];
                            navigate(`/toolkit/toolkit/${toolkitId}/technology/${selectedTech.id}/readme/${readmeType}`);
                          }}
                          sx={{
                            color: currentTheme.textSecondary,
                            '&:hover': {
                              color: currentTheme.primary,
                            }
                          }}
                        >
                          <CodeIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {/* README Content */}
                  <Box sx={{ flex: 1, overflowY: 'auto', p: 3, minHeight: 0 }}>
                    {(() => {
                      const readmeTypes = ['evaluation', 'installation', 'usage'];
                      const currentReadmeType = readmeTypes[readmeTab];
                      // Check localStorage first, then use technology readme or empty
                      const storageKey = `toolkit_${toolkitId}_tech_${selectedTech.id}_${currentReadmeType}`;
                      const savedReadme = localStorage.getItem(storageKey);
                      const readmeContent = savedReadme || selectedTech[currentReadmeType] || null;

                      return readmeContent ? (
                        <Box
                          sx={{
                            '& pre': {
                              bgcolor: currentTheme.darkMode ? '#1e1e1e' : '#f5f5f5',
                              p: 2,
                              borderRadius: 1,
                              overflow: 'auto',
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                            },
                            '& code': {
                              bgcolor: currentTheme.darkMode ? '#1e1e1e' : '#f5f5f5',
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.5,
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                            },
                            '& pre code': {
                              bgcolor: 'transparent',
                              px: 0,
                              py: 0,
                            },
                            '& h1, & h2, & h3, & h4, & h5, & h6': {
                              color: currentTheme.text,
                              marginTop: 2,
                              marginBottom: 1,
                            },
                            '& p': {
                              color: currentTheme.textSecondary,
                              marginBottom: 1.5,
                            },
                            '& a': {
                              color: currentTheme.primary,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            },
                            '& table': {
                              width: '100%',
                              borderCollapse: 'collapse',
                              marginTop: 2,
                              marginBottom: 2,
                              '& th, & td': {
                                border: `1px solid ${currentTheme.border}`,
                                padding: '8px 12px',
                                textAlign: 'left',
                                color: currentTheme.text,
                              },
                              '& th': {
                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                fontWeight: 600,
                                color: currentTheme.text,
                              },
                              '& tr:nth-of-type(even)': {
                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                              },
                            },
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkEmoji]}
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const isMermaid = match && match[1] === 'mermaid';
                                
                                if (isMermaid && !inline) {
                                  const codeContent = Array.isArray(children)
                                    ? children.join('')
                                    : String(children);
                                  return (
                                    <MermaidDiagram className={className}>
                                      {codeContent}
                                    </MermaidDiagram>
                                  );
                                }
                                
                                return (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {readmeContent}
                          </ReactMarkdown>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                          No {currentReadmeType.charAt(0).toUpperCase() + currentReadmeType.slice(1)} README available. {canEdit() && 'Click Edit to add content.'}
                        </Typography>
                      );
                    })()}
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                p: 3,
              }}>
                <Typography variant="body1" sx={{ color: currentTheme.textSecondary, textAlign: 'center' }}>
                  Select a technology from the list to view details
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      </Box>

      {/* Rank Change Confirmation Dialog */}
      <Dialog
        open={rankChangeDialog.open}
        onClose={cancelRankChange}
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>
          Confirm Rank Change
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Typography sx={{ color: currentTheme.text, mb: 2 }}>
            Are you sure you want to {rankChangeDialog.direction === 'up' ? 'promote' : 'demote'} <strong>"{rankChangeDialog.techName}"</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            This will change the ranking from position {rankChangeDialog.currentIndex !== undefined ? rankChangeDialog.currentIndex + 1 : ''} to position {rankChangeDialog.newIndex !== undefined ? rankChangeDialog.newIndex + 1 : ''}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={cancelRankChange}
            sx={{
              color: currentTheme.textSecondary,
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.1),
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmRankChange}
            variant="contained"
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              '&:hover': {
                bgcolor: currentTheme.primaryHover || currentTheme.primary,
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ToolkitDetailPage;
