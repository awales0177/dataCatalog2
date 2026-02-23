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
  const [readmeTab, setReadmeTab] = useState(0); // 0 = Installation, 1 = Usage, 2 = Requirements, 3 = Evaluation
  const [rankChangeDialog, setRankChangeDialog] = useState({ open: false, techId: null, direction: null, techName: null });

  // Helper function to convert icon filename to readable label
  const getIconLabel = (filename) => {
    // Remove extension and convert kebab-case to Title Case
    const name = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // All available icons categorized by type
  const allIcons = {
    pros: [
      { icon: '/eval_icons/low-cost.png', label: 'Low Cost' },
      { icon: '/eval_icons/cncf.png', label: 'CNCF' },
      { icon: '/eval_icons/containerized.png', label: 'Containerized' },
      { icon: '/eval_icons/fast.png', label: 'Fast' },
      { icon: '/eval_icons/modular.png', label: 'Modular' },
      { icon: '/eval_icons/quality.png', label: 'High Quality' },
      { icon: '/eval_icons/scalable.png', label: 'Scalable', invert: true, size: 'large' },
      { icon: '/eval_icons/secure.png', label: 'Secure' },
      { icon: '/eval_icons/supports-many.png', label: 'Supports Many' },
      { icon: '/eval_icons/tested.png', label: 'Tested' },
    ],
    cons: [
      { icon: '/eval_icons/high-cost.png', label: 'High Cost' },
      { icon: '/eval_icons/not-scalable.png', label: 'Not Scalable',invert: true },
      { icon: '/eval_icons/not-secure.png', label: 'Not Secure' },
      { icon: '/eval_icons/poor-quality.png', label: 'Poor Quality' },
      { icon: '/eval_icons/slow.webp', label: 'Slow' },
      { icon: '/eval_icons/supports-one.png', label: 'Supports One' },
    ],
  };

  // Get pros and cons icons for a specific technology
  const getTechIcons = (tech) => {
    if (!tech) return { pros: [], cons: [] };

    // Check if technology has custom pros/cons icons stored
    const storageKey = `toolkit_${toolkitId}_tech_${tech.id}_icons`;
    const savedIcons = localStorage.getItem(storageKey);
    
    if (savedIcons) {
      try {
        const parsed = JSON.parse(savedIcons);
        return {
          pros: parsed.pros || [],
          cons: parsed.cons || [],
        };
      } catch (e) {
        console.error('Error parsing saved icons:', e);
      }
    }

    // Default: use technology's pros/cons arrays to map to icons
    // Map pros/cons text to icon filenames
    const techPros = tech.pros || [];
    const techCons = tech.cons || [];

    const prosIcons = [];
    const consIcons = [];

    // Enhanced mapping for pros - check multiple keywords
    techPros.forEach(pro => {
      const proLower = pro.toLowerCase();
      
      // Fast / Performance
      if (proLower.includes('fast') || proLower.includes('speed') || proLower.includes('performance') || 
          proLower.includes('quick') || proLower.includes('rapid') || proLower.includes('efficient')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Fast'));
      }
      
      // Low Cost / Free / Cost-effective
      if (proLower.includes('cheap') || proLower.includes('free') || proLower.includes('cost-effective') ||
          proLower.includes('affordable') || proLower.includes('low cost') || proLower.includes('inexpensive') ||
          proLower.includes('open-source') || proLower.includes('open source')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Low Cost'));
      }
      
      // Secure / Security
      if (proLower.includes('secure') || proLower.includes('security') || proLower.includes('safe') ||
          proLower.includes('encrypted') || proLower.includes('protected') || proLower.includes('authentication')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Secure'));
      }
      
      // Scalable
      if (proLower.includes('scalable') || proLower.includes('scale') || proLower.includes('scaling') ||
          proLower.includes('elastic') || proLower.includes('grows') || proLower.includes('expandable')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Scalable'));
      }
      
      // Quality
      if (proLower.includes('quality') || proLower.includes('reliable') || proLower.includes('robust') ||
          proLower.includes('well-documented') || proLower.includes('well documented') || proLower.includes('accurate')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Quality'));
      }
      
      // Modular
      if (proLower.includes('modular') || proLower.includes('modularity') || proLower.includes('composable') ||
          proLower.includes('flexible') || proLower.includes('extensible')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Modular'));
      }
      
      // Containerized / Docker
      if (proLower.includes('container') || proLower.includes('docker') || proLower.includes('kubernetes') ||
          proLower.includes('k8s') || proLower.includes('containerized')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Containerized'));
      }
      
      // CNCF
      if (proLower.includes('cncf') || proLower.includes('cloud native')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'CNCF'));
      }
      
      // Supports Many
      if (proLower.includes('multi') || proLower.includes('many') || proLower.includes('multiple') ||
          proLower.includes('various') || proLower.includes('wide') || proLower.includes('extensive')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Supports Many'));
      }
      
      // Tested
      if (proLower.includes('tested') || proLower.includes('testing') || proLower.includes('test') ||
          proLower.includes('validated') || proLower.includes('verified')) {
        prosIcons.push(allIcons.pros.find(i => i.label === 'Tested'));
      }
    });

    // Enhanced mapping for cons - check multiple keywords
    techCons.forEach(con => {
      const conLower = con.toLowerCase();
      
      // Slow / Performance issues
      if (conLower.includes('slow') || conLower.includes('slower') || conLower.includes('performance') ||
          conLower.includes('lag') || conLower.includes('bottleneck') || conLower.includes('inefficient')) {
        consIcons.push(allIcons.cons.find(i => i.label === 'Slow'));
      }
      
      // High Cost / Expensive
      if (conLower.includes('expensive') || conLower.includes('cost') || conLower.includes('pricey') ||
          conLower.includes('high cost') || conLower.includes('premium') || conLower.includes('paid')) {
        consIcons.push(allIcons.cons.find(i => i.label === 'High Cost'));
      }
      
      // Not Secure
      if (conLower.includes('not secure') || conLower.includes('insecurity') || conLower.includes('vulnerable') ||
          conLower.includes('security risk') || conLower.includes('unsafe')) {
        consIcons.push(allIcons.cons.find(i => i.label === 'Not Secure'));
      }
      
      // Not Scalable
      if (conLower.includes('not scalable') || conLower.includes('doesn\'t scale') || conLower.includes('scaling issues') ||
          conLower.includes('limited scale') || conLower.includes('hard to scale')) {
        consIcons.push(allIcons.cons.find(i => i.label === 'Not Scalable'));
      }
      
      // Poor Quality
      if (conLower.includes('poor quality') || conLower.includes('low quality') || conLower.includes('unreliable') ||
          conLower.includes('inaccurate') || conLower.includes('buggy') || conLower.includes('issues')) {
        consIcons.push(allIcons.cons.find(i => i.label === 'Poor Quality'));
      }
      
      // Supports One
      if (conLower.includes('single') || conLower.includes('one') || conLower.includes('limited') ||
          conLower.includes('narrow') || conLower.includes('restricted')) {
        consIcons.push(allIcons.cons.find(i => i.label === 'Supports One'));
      }
    });

    // Remove duplicates and nulls
    const uniquePros = prosIcons.filter((icon, index, self) => icon && self.findIndex(i => i?.icon === icon.icon) === index);
    const uniqueCons = consIcons.filter((icon, index, self) => icon && self.findIndex(i => i?.icon === icon.icon) === index);

    // If no icons found from pros/cons text, show default examples
    if (uniquePros.length === 0 && uniqueCons.length === 0) {
      // Default examples - show all available icons
      return {
        pros: [
          allIcons.pros.find(i => i.label === 'Low Cost'),
          allIcons.pros.find(i => i.label === 'CNCF'),
          allIcons.pros.find(i => i.label === 'Containerized'),
          allIcons.pros.find(i => i.label === 'Fast'),
          allIcons.pros.find(i => i.label === 'Modular'),
          allIcons.pros.find(i => i.label === 'Quality'),
          allIcons.pros.find(i => i.label === 'Scalable'),
          allIcons.pros.find(i => i.label === 'Secure'),
          allIcons.pros.find(i => i.label === 'Supports Many'),
          allIcons.pros.find(i => i.label === 'Tested'),
        ].filter(Boolean),
        cons: [
          allIcons.cons.find(i => i.label === 'High Cost'),
          allIcons.cons.find(i => i.label === 'Not Scalable'),
          allIcons.cons.find(i => i.label === 'Not Secure'),
          allIcons.cons.find(i => i.label === 'Poor Quality'),
          allIcons.cons.find(i => i.label === 'Slow'),
          allIcons.cons.find(i => i.label === 'Supports One'),
        ].filter(Boolean),
      };
    }

    return {
      pros: uniquePros,
      cons: uniqueCons,
    };
  };

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
    
    // Helper function to determine if tech is evaluated
    const isEvaluated = (tech) => {
      const storageKey = `toolkit_${toolkitId}_tech_${tech.id}_evaluation`;
      const hasEvaluation = localStorage.getItem(storageKey) || tech.evaluation;
      return hasEvaluation || tech.status === 'evaluated' || tech.status === 'evaluation';
    };

    // Create globally sorted list: Production first, then Evaluated
    const productionTechs = technologies.filter(tech => !isEvaluated(tech)).sort((a, b) => a.rank - b.rank);
    const evaluatedTechs = technologies.filter(isEvaluated).sort((a, b) => a.rank - b.rank);
    const globalSortedTechs = [...productionTechs, ...evaluatedTechs];

    const tech = globalSortedTechs.find(t => t.id === techId);
    if (!tech) return;

    const currentIndex = globalSortedTechs.findIndex(t => t.id === techId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= globalSortedTechs.length) return;

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

    // Helper function to determine if tech is evaluated
    const isEvaluated = (tech) => {
      const storageKey = `toolkit_${toolkitId}_tech_${tech.id}_evaluation`;
      const hasEvaluation = localStorage.getItem(storageKey) || tech.evaluation;
      return hasEvaluation || tech.status === 'evaluated' || tech.status === 'evaluation';
    };

    // Create globally sorted list: Production first, then Evaluated
    const productionTechs = technologies.filter(tech => !isEvaluated(tech)).sort((a, b) => a.rank - b.rank);
    const evaluatedTechs = technologies.filter(isEvaluated).sort((a, b) => a.rank - b.rank);
    const globalSortedTechs = [...productionTechs, ...evaluatedTechs];

    const tech = globalSortedTechs[currentIndex];
    const targetTech = globalSortedTechs[newIndex];
    
    // Check if we're crossing the boundary
    const wasInProduction = currentIndex < productionTechs.length;
    const willBeInProduction = newIndex < productionTechs.length;
    const crossingBoundary = wasInProduction !== willBeInProduction;

    // Move in global list
    const newGlobalTechs = [...globalSortedTechs];
    const [moved] = newGlobalTechs.splice(currentIndex, 1);
    newGlobalTechs.splice(newIndex, 0, moved);

    // If crossing boundary, update evaluation status
    if (crossingBoundary) {
      if (willBeInProduction) {
        // Moving to Production - remove evaluation
        const storageKey = `toolkit_${toolkitId}_tech_${techId}_evaluation`;
        localStorage.removeItem(storageKey);
        moved.evaluation = null;
        moved.status = 'production';
      } else {
        // Moving to Evaluated - add evaluation if it doesn't exist
        const storageKey = `toolkit_${toolkitId}_tech_${techId}_evaluation`;
        if (!localStorage.getItem(storageKey) && !moved.evaluation) {
          const defaultEvaluation = `# Evaluation for ${moved.name}\n\nThis technology has been evaluated.`;
          localStorage.setItem(storageKey, defaultEvaluation);
          moved.evaluation = defaultEvaluation;
        }
        moved.status = 'evaluated';
      }
    }

    // Update ranks globally (1 to N)
    newGlobalTechs.forEach((tech, index) => {
      tech.rank = index + 1;
    });

    setTechnologies(newGlobalTechs);
    setRankChangeDialog({ open: false, techId: null, direction: null, techName: null });
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
                (() => {
                  // Helper function to determine if tech is evaluated or production
                  const isEvaluated = (tech) => {
                    const storageKey = `toolkit_${toolkitId}_tech_${tech.id}_evaluation`;
                    const hasEvaluation = localStorage.getItem(storageKey) || tech.evaluation;
                    return hasEvaluation || tech.status === 'evaluated' || tech.status === 'evaluation';
                  };

                  // Create globally sorted list: Production first, then Evaluated
                  const productionTechs = technologies.filter(tech => !isEvaluated(tech)).sort((a, b) => a.rank - b.rank);
                  const evaluatedTechs = technologies.filter(isEvaluated).sort((a, b) => a.rank - b.rank);
                  const globalSortedTechs = [...productionTechs, ...evaluatedTechs];

                  const renderTechList = (techList, sectionTitle, sectionColor) => {
                    if (techList.length === 0) return null;

                    return (
                      <Box sx={{ mb: 3 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: currentTheme.text, 
                            fontWeight: 600, 
                            mb: 1,
                            px: 1,
                            pb: 0.5,
                            borderBottom: `2px solid ${sectionColor || currentTheme.primary}`,
                          }}
                        >
                          {sectionTitle}
                        </Typography>
                <List sx={{ p: 0 }}>
                          {techList.map((tech, index) => {
                            const globalIndex = globalSortedTechs.findIndex(t => t.id === tech.id);
                            return (
                    <React.Fragment key={tech.id}>
                      <ListItem
                        button
                        onClick={() => {
                          setSelectedTech(tech);
                                    setReadmeTab(0);
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body1" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                                {tech.name}
                              </Typography>
                              {(() => {
                                const techIcons = getTechIcons(tech);
                                if (techIcons.pros.length > 0) {
                                  return (
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', ml: 0.5 }}>
                                      {techIcons.pros.slice(0, 5).map((iconData, iconIndex) => (
                                        <Box
                                          key={`list-pros-${tech.id}-${iconIndex}`}
                                          component="img"
                                          src={iconData.icon}
                                          alt={iconData.label}
                                          sx={{
                                            width: iconData.size === 'large' ? 24 : 20,
                                            height: iconData.size === 'large' ? 24 : 20,
                                            objectFit: 'contain',
                                            filter: iconData.invert && darkMode ? 'invert(1)' : 'none',
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ))}
                                      {techIcons.pros.length > 5 && (
                                        <Typography variant="caption" sx={{ color: currentTheme.textSecondary, ml: 0.5 }}>
                                          +{techIcons.pros.length - 5}
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                }
                                return null;
                              })()}
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
                                        disabled={globalIndex === 0}
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
                                        disabled={globalIndex === globalSortedTechs.length - 1}
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
                                {index < techList.length - 1 && (
                        <Divider sx={{ mx: 1, borderColor: currentTheme.border }} />
                      )}
                    </React.Fragment>
                            );
                          })}
                </List>
                      </Box>
                    );
                  };

                  return (
                    <>
                      {renderTechList(productionTechs, 'Production', '#2196f3')}
                      {renderTechList(evaluatedTechs, 'Evaluated', '#4caf50')}
                    </>
                  );
                })()
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

                  {/* Eval Icons - Pros and Cons with Roles */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    {/* Pros and Cons Section */}
                    {(() => {
                      const techIcons = getTechIcons(selectedTech);
                      return (
                        <Box sx={{ flex: 1 }}>
                          {/* Pros Row */}
                          {techIcons.pros.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mb: 0.5, display: 'block', fontWeight: 700 }}>
                                Pros
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {techIcons.pros.map((iconData, iconIndex) => (
                                  <Box
                                    key={`pros-${iconIndex}`}
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: 0.5,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: currentTheme.card,
                                        p: 0.5,
                                        border: `1px solid ${currentTheme.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          transform: 'scale(1.1)',
                                          boxShadow: `0 2px 8px ${currentTheme.shadow}`,
                                        },
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        src={iconData.icon}
                                        alt={iconData.label}
                                        sx={{
                                          width: iconData.size === 'large' ? 50 : '100%',
                                          height: iconData.size === 'large' ? 50 : '100%',
                                          objectFit: 'contain',
                                          filter: iconData.invert && darkMode ? 'invert(1)' : 'none',
                                        }}
                                        onError={(e) => {
                                          // Hide if image doesn't load
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    </Box>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: currentTheme.textSecondary,
                                        fontSize: '0.65rem',
                                        textAlign: 'center',
                                      }}
                                    >
                                      {iconData.label}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Cons Row */}
                          {techIcons.cons.length > 0 && (
                            <Box>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mb: 0.5, display: 'block', fontWeight: 700 }}>
                                Cons
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {techIcons.cons.map((iconData, iconIndex) => (
                                  <Box
                                    key={`cons-${iconIndex}`}
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: 0.5,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: currentTheme.card,
                                        p: 0.5,
                                        border: `1px solid ${currentTheme.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          transform: 'scale(1.1)',
                                          boxShadow: `0 2px 8px ${currentTheme.shadow}`,
                                        },
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        src={iconData.icon}
                                        alt={iconData.label}
                                        sx={{
                                          width: iconData.size === 'large' ? 50 : '100%',
                                          height: iconData.size === 'large' ? 50 : '100%',
                                          objectFit: 'contain',
                                          filter: iconData.invert && darkMode ? 'invert(1)' : 'none',
                                        }}
                                        onError={(e) => {
                                          // Hide if image doesn't load
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    </Box>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: currentTheme.textSecondary,
                                        fontSize: '0.65rem',
                                        textAlign: 'center',
                                      }}
                                    >
                                      {iconData.label}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      );
                    })()}

                    {/* Divider */}
                    <Divider 
                      orientation="vertical" 
                      flexItem 
                      sx={{ 
                        borderColor: currentTheme.border,
                        opacity: 0.3,
                        height: 'auto',
                        alignSelf: 'stretch',
                      }} 
                    />

                    {/* Roles Section */}
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mb: 1, display: 'block', fontWeight: 700 }}>
                        Roles
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Maintainer */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500 }}>
                            Maintainer:
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentTheme.text }}>
                            {selectedTech.maintainer || selectedTech.author || 'N/A'}
                          </Typography>
                        </Box>
                        
                        {/* Deployed to */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500 }}>
                            Deployed to:
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentTheme.text }}>
                            {selectedTech.deployedTo || selectedTech.deployment || 'N/A'}
                          </Typography>
                        </Box>
                        
                        {/* Last Updated */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500 }}>
                            Last updated:
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentTheme.text }}>
                            {selectedTech.lastUpdated || selectedTech.lastModified || 'N/A'}
                          </Typography>
                        </Box>
                        
                        {/* Version */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 500 }}>
                            Version:
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentTheme.text }}>
                            {selectedTech.version || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Like/Dislike Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
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
                      <Tab label="Installation" />
                      <Tab label="Usage" />
                      <Tab label="Requirements" />
                      <Tab label="Evaluation" />
                    </Tabs>
                    {canEdit() && (
                      <Tooltip title="Edit Markdown">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const readmeTypes = ['installation', 'usage', 'requirements', 'evaluation'];
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
                      const readmeTypes = ['installation', 'usage', 'requirements', 'evaluation'];
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
