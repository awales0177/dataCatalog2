import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
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
  Edit as EditIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, updateToolkitComponent } from '../services/api';
import {
  looksLikeDatabaseToolkitId,
  normalizeTechnologyStatus,
  technologyToApiPayload,
} from '../utils/toolkitDbPayload';
import {
  findWorkbenchToolkit,
  workbenchPath,
  workbenchEditPath,
  workbenchTechnologyReadmePath,
} from '../utils/toolkitWorkbench';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import MermaidDiagram from '../components/MermaidDiagram';
import { TOOLKIT_EVAL_ICONS, TOOLKIT_LANGUAGE_OPTIONS } from '../data/toolkitEvalIcons';
import {
  getEffectiveMarkdownTabs,
  mergeMarkdownTabStateFromTech,
  tabLabelForTab,
} from '../utils/toolkitMarkdownTabs';
import { fontStackMono } from '../theme/theme';

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
  const [canonicalToolkitId, setCanonicalToolkitId] = useState(null);
  const [dataTeams, setDataTeams] = useState([]);
  const reactionSaveTimer = useRef(null);
  const technologiesRef = useRef([]);
  const rankingDisabled = Boolean(toolkitData?.rankingDisabled);
  const multipleTechnologies = toolkitData?.multipleTechnologies !== false;

  const readmeTabs = useMemo(
    () => getEffectiveMarkdownTabs(selectedTech),
    [selectedTech],
  );
  const readmeTabList = readmeTabs.markdownTabs;
  const readmeTabSlots = readmeTabs.slots;

  useEffect(() => {
    if (!selectedTech) return;
    const { slots } = getEffectiveMarkdownTabs(selectedTech);
    if (slots.length === 0) {
      setReadmeTab(0);
      return;
    }
    setReadmeTab((prev) => (prev >= slots.length ? 0 : prev));
  }, [selectedTech]);

  useEffect(() => {
    technologiesRef.current = technologies;
  }, [technologies]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchData('teams');
        if (!cancelled) setDataTeams(response.data_teams || []);
      } catch (e) {
        console.error('Error loading data teams:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper function to convert icon filename to readable label
  const getIconLabel = (filename) => {
    // Remove extension and convert kebab-case to Title Case
    const name = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const allIcons = TOOLKIT_EVAL_ICONS;

  const mapLangLabels = (labels) => {
    if (!Array.isArray(labels)) return [];
    return labels
      .map((label) => {
        const lc = String(label).trim().toLowerCase();
        return TOOLKIT_LANGUAGE_OPTIONS.find((o) => o.label.toLowerCase() === lc);
      })
      .filter(Boolean);
  };

  // Get pros, cons, and language icons for a specific technology
  const getTechIcons = (tech) => {
    if (!tech) return { pros: [], cons: [], languages: [] };

    const io = tech.iconOverrides;
    if (io && typeof io === 'object') {
      const resolveList = (savedList, options) => {
        if (!Array.isArray(savedList)) return [];
        const out = [];
        for (const entry of savedList) {
          const s = String(entry);
          const hit = options.find(
            (o) =>
              o.icon === s ||
              s.endsWith(o.icon.replace(/^.*\//, '')) ||
              o.icon.endsWith(s.replace(/^.*\//, '')),
          );
          if (hit) out.push(hit);
        }
        return out.filter((icon, i, self) => icon && self.findIndex((x) => x?.icon === icon.icon) === i);
      };
      const prosIcons = resolveList(io.pros, allIcons.pros);
      const consIcons = resolveList(io.cons, allIcons.cons);
      const langIcons = mapLangLabels(tech.languages);
      if (prosIcons.length || consIcons.length) {
        return { pros: prosIcons, cons: consIcons, languages: langIcons };
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
    const langIcons = mapLangLabels(tech.languages);

    // If no icons found from pros/cons text, show default examples (unless languages are set)
    if (uniquePros.length === 0 && uniqueCons.length === 0) {
      if (langIcons.length > 0) {
        return { pros: [], cons: [], languages: langIcons };
      }
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
        languages: [],
      };
    }

    return {
      pros: uniquePros,
      cons: uniqueCons,
      languages: langIcons,
    };
  };

  useEffect(() => {
    const loadToolkitData = async () => {
      try {
        const data = await fetchData('toolkit');
        const toolkits = data.toolkit?.toolkits || [];
        const resolved = findWorkbenchToolkit(toolkits, toolkitId);
        if (resolved && resolved.canonicalId !== String(toolkitId)) {
          navigate(workbenchPath(resolved.canonicalId), { replace: true });
          return;
        }
        const foundToolkit = resolved?.toolkit ?? null;

        if (foundToolkit) {
          setToolkitData(foundToolkit);
          setCanonicalToolkitId(resolved.canonicalId);
          const baseTechs = foundToolkit.technologies || [];
          const sortedTechs = [...baseTechs]
            .map((t) => ({
              ...t,
              ...mergeMarkdownTabStateFromTech(t),
              status: normalizeTechnologyStatus(t?.status),
              languages: Array.isArray(t.languages)
                ? t.languages
                : Array.isArray(t.details?.languages)
                  ? [...t.details.languages]
                  : [],
            }))
            .sort((a, b) => a.rank - b.rank);
          setTechnologies(sortedTechs);
          if (sortedTechs.length > 0) {
            setSelectedTech(sortedTechs[0]);
            setReadmeTab(0);
          }
          const initialReactions = {};
          sortedTechs.forEach((tech) => {
            initialReactions[tech.id] = {
              likes: tech.likes || 0,
              dislikes: tech.dislikes || 0,
              userLiked: false,
              userDisliked: false,
            };
          });
          setTechReactions(initialReactions);
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
  }, [toolkitId, navigate]);

  const isEvaluatedTech = (tech) =>
    normalizeTechnologyStatus(tech?.status) === 'evaluated';

  const isDevelopmentTech = (tech) =>
    normalizeTechnologyStatus(tech?.status) === 'development';

  const maintainerDisplayForTech = (tech) => {
    if (!tech) return 'N/A';
    const mid =
      tech.maintainerTeamId != null && String(tech.maintainerTeamId).trim() !== ''
        ? String(tech.maintainerTeamId).trim()
        : '';
    if (mid) {
      const team = dataTeams.find((t) => String(t.id) === mid);
      if (team?.name) return team.name;
    }
    const legacy = tech.maintainer || tech.author;
    if (legacy) return legacy;
    if (mid) return mid;
    return 'N/A';
  };

  const handleRankChange = (techId, direction) => {
    if (rankingDisabled || !canEdit()) return;

    const nonEvaluatedTechs = technologies
      .filter((tech) => !isEvaluatedTech(tech))
      .sort((a, b) => a.rank - b.rank);
    const evaluatedTechs = technologies
      .filter(isEvaluatedTech)
      .sort((a, b) => a.rank - b.rank);
    const globalSortedTechs = [...nonEvaluatedTechs, ...evaluatedTechs];

    const tech = globalSortedTechs.find((t) => t.id === techId);
    if (!tech) return;

    const currentIndex = globalSortedTechs.findIndex((t) => t.id === techId);
    if (currentIndex === -1) return;

    const nonEvalLen = nonEvaluatedTechs.length;
    let newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (
      direction === 'down' &&
      evaluatedTechs.length === 0 &&
      nonEvalLen > 0 &&
      currentIndex === nonEvalLen - 1
    ) {
      newIndex = nonEvalLen;
    }
    if (newIndex < 0) return;
    if (newIndex > globalSortedTechs.length) return;

    setRankChangeDialog({
      open: true,
      techId,
      direction,
      techName: tech.name,
      currentIndex,
      newIndex,
    });
  };

  const confirmRankChange = async () => {
    const { techId, currentIndex, newIndex } = rankChangeDialog;

    const nonEvaluatedTechs = technologies
      .filter((t) => !isEvaluatedTech(t))
      .sort((a, b) => a.rank - b.rank);
    const evaluatedTechs = technologies
      .filter(isEvaluatedTech)
      .sort((a, b) => a.rank - b.rank);
    const globalSortedTechs = [...nonEvaluatedTechs, ...evaluatedTechs];

    const nonEvaluatedLen = nonEvaluatedTechs.length;

    const newGlobalTechs = [...globalSortedTechs];
    const [moved] = newGlobalTechs.splice(currentIndex, 1);
    if (newIndex >= newGlobalTechs.length) {
      newGlobalTechs.push(moved);
    } else {
      newGlobalTechs.splice(newIndex, 0, moved);
    }

    const wasInProduction = currentIndex < nonEvaluatedLen;
    const willBeInProduction = newIndex < nonEvaluatedLen;
    const crossingBoundary = wasInProduction !== willBeInProduction;

    if (crossingBoundary) {
      if (willBeInProduction) {
        moved.evaluation = null;
        moved.status = 'production';
      } else {
        if (!moved.evaluation) {
          moved.evaluation = `# Evaluation for ${moved.name}\n\nThis technology has been evaluated.`;
        }
        moved.status = 'evaluated';
      }
    }

    newGlobalTechs.forEach((t, index) => {
      t.rank = index + 1;
    });

    setTechnologies(newGlobalTechs);
    setRankChangeDialog({ open: false, techId: null, direction: null, techName: null });

    const cid = canonicalToolkitId;
    if (!looksLikeDatabaseToolkitId(cid)) return;
    try {
      await updateToolkitComponent('toolkits', cid, {
        ...(typeof toolkitData.rankingDisabled === 'boolean'
          ? { rankingDisabled: toolkitData.rankingDisabled }
          : {}),
        ...(typeof toolkitData.multipleTechnologies === 'boolean'
          ? { multipleTechnologies: toolkitData.multipleTechnologies }
          : {}),
        technologies: newGlobalTechs.map(technologyToApiPayload),
      });
      await fetchData('toolkit', { forceRefresh: true });
    } catch (e) {
      console.error('Failed to save technology order', e);
      setError(e.message || 'Failed to save rank change');
    }
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

    const cid = canonicalToolkitId;
    if (!looksLikeDatabaseToolkitId(cid)) return;
    if (reactionSaveTimer.current) clearTimeout(reactionSaveTimer.current);
    reactionSaveTimer.current = setTimeout(async () => {
      try {
        const techs = technologiesRef.current;
        const mergedTechs = techs.map((t) => {
          const r = reactions[t.id];
          return {
            ...t,
            likes: r ? r.likes : t.likes || 0,
            dislikes: r ? r.dislikes : t.dislikes || 0,
          };
        });
        await updateToolkitComponent('toolkits', cid, {
          ...(typeof toolkitData.rankingDisabled === 'boolean'
            ? { rankingDisabled: toolkitData.rankingDisabled }
            : {}),
          ...(typeof toolkitData.multipleTechnologies === 'boolean'
            ? { multipleTechnologies: toolkitData.multipleTechnologies }
            : {}),
          technologies: mergedTechs.map(technologyToApiPayload),
        });
        await fetchData('toolkit', { forceRefresh: true });
      } catch (e) {
        console.error('Failed to save reactions', e);
      }
    }, 450);
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
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
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
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text, mb: 0.5 }}>
              {toolkitData.displayName || toolkitData.name}
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              {toolkitData.description}
            </Typography>
          </Box>
        </Box>
        {canEdit() && (
          <Tooltip title="Edit toolkit">
            <IconButton
              onClick={() => navigate(workbenchEditPath(toolkitId))}
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
        )}
      </Box>

      {/* Two Column Layout (single-technology workbenches: no technologies sidebar) */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {multipleTechnologies ? (
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
              bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
              border: `1px solid ${currentTheme.darkMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}`, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                Technologies ({technologies.length})
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 0.5 }}>
                Development and production first (by rank); evaluated below. Edit the workbench to add technologies.
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              {technologies.length === 0 ? (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, textAlign: 'center', p: 3 }}>
                  No technologies available
                </Typography>
              ) : (
                (() => {
                  const nonEvaluatedTechs = technologies
                    .filter((tech) => !isEvaluatedTech(tech))
                    .sort((a, b) => a.rank - b.rank);
                  const evaluatedTechs = technologies
                    .filter(isEvaluatedTech)
                    .sort((a, b) => a.rank - b.rank);
                  const globalSortedTechs = [...nonEvaluatedTechs, ...evaluatedTechs];

                  const developmentTechs = nonEvaluatedTechs.filter(isDevelopmentTech);
                  const productionTechs = nonEvaluatedTechs.filter((t) => !isDevelopmentTech(t));

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
                            const globalIndex = globalSortedTechs.findIndex((t) => t.id === tech.id);
                            const canMoveDown =
                              globalIndex < globalSortedTechs.length - 1 ||
                              (evaluatedTechs.length === 0 &&
                                globalIndex === nonEvaluatedTechs.length - 1 &&
                                nonEvaluatedTechs.length > 0);
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
                            {rankingDisabled
                              ? String(tech.name || '?')
                                  .slice(0, 1)
                                  .toUpperCase()
                              : `#${tech.rank}`}
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
                        {canEdit() && !rankingDisabled && (
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
                              disabled={!canMoveDown}
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
                      {renderTechList(developmentTechs, 'Development', '#ff9800')}
                      {renderTechList(productionTechs, 'Production', currentTheme.primary)}
                      {renderTechList(evaluatedTechs, 'Evaluated', '#4caf50')}
                    </>
                  );
                })()
              )}
            </Box>
          </Paper>
        </Grid>
        ) : null}

        {/* Right Pane: Selected Technology Details */}
        <Grid item xs={12} md={multipleTechnologies ? 7 : 12} sx={{ 
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
              bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
              border: `1px solid ${currentTheme.darkMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border}`,
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
                                        bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
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
                            <Box sx={{ mb: techIcons.languages.length > 0 ? 1.5 : 0 }}>
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
                                        bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
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

                          {/* Languages row */}
                          {techIcons.languages.length > 0 && (
                            <Box>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mb: 0.5, display: 'block', fontWeight: 700 }}>
                                Languages
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {techIcons.languages.map((iconData, iconIndex) => (
                                  <Box
                                    key={`lang-${iconIndex}-${iconData.label}`}
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
                                        bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
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
                            {maintainerDisplayForTech(selectedTech)}
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
                          color: techReactions[selectedTech.id]?.userLiked ? currentTheme.primary : currentTheme.textSecondary,
                          bgcolor: techReactions[selectedTech.id]?.userLiked ? alpha(currentTheme.primary, 0.1) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(currentTheme.primary, 0.1),
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
                    {readmeTabSlots.length > 0 ? (
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
                        {readmeTabList.map((tab) => (
                          <Tab key={tab.id} label={tabLabelForTab(tab)} />
                        ))}
                      </Tabs>
                    ) : (
                      <Typography variant="body2" sx={{ color: currentTheme.textSecondary, py: 0.5 }}>
                        No documentation tabs
                      </Typography>
                    )}
                    {canEdit() && readmeTabSlots.length > 0 && (
                      <Tooltip title="Edit markdown">
                        <IconButton
                          size="small"
                          aria-label="Edit markdown"
                          onClick={() => {
                            const readmeType = readmeTabSlots[readmeTab];
                            if (!readmeType) return;
                            navigate(
                              workbenchTechnologyReadmePath(
                                canonicalToolkitId || toolkitId,
                                selectedTech.id,
                                readmeType,
                              ),
                            );
                          }}
                          sx={{
                            color: currentTheme.textSecondary,
                            '&:hover': {
                              color: currentTheme.primary,
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {/* README Content */}
                  <Box sx={{ flex: 1, overflowY: 'auto', p: 3, minHeight: 0 }}>
                    {(() => {
                      if (readmeTabSlots.length === 0) {
                        return (
                          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                            No documentation tabs for this technology. Editors can configure tabs on the toolkit edit page.
                          </Typography>
                        );
                      }
                      const currentReadmeType = readmeTabSlots[readmeTab];
                      const readmeContent = currentReadmeType ? selectedTech[currentReadmeType] || null : null;

                      return readmeContent ? (
                        <Box
                          sx={{
                            '& pre': {
                              bgcolor: currentTheme.darkMode ? '#1e1e1e' : '#f5f5f5',
                              p: 2,
                              borderRadius: 1,
                              overflow: 'auto',
                              fontFamily: fontStackMono,
                              fontSize: '0.875rem',
                            },
                            '& code': {
                              bgcolor: currentTheme.darkMode ? '#1e1e1e' : '#f5f5f5',
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.5,
                              fontFamily: fontStackMono,
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
                          No{' '}
                          {tabLabelForTab(
                            readmeTabList.find((x) => x.id === currentReadmeType) || {
                              id: currentReadmeType,
                              title: currentReadmeType,
                            },
                          )}{' '}
                          README available.{' '}
                          {canEdit() && 'Click Edit to add content.'}
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
                  {multipleTechnologies
                    ? 'Select a technology from the list to view details'
                    : 'No technology to show. Add one in Edit toolkit.'}
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
            bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.darkMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border}`
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
