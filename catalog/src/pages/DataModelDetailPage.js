import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Divider,
  Link,
  alpha,
  Tooltip,
  CircularProgress,
  IconButton,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Code as CodeIcon,
  MenuBook as MenuBookIcon,
  GitHub as GitHubIcon,
  VerifiedUser as VerifiedUserIcon,
  Construction as WrenchIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Email as EmailIcon,
  HelpOutline as HelpOutlineIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  ChevronRight as ChevronRightIcon,
  Handyman as HandymanIcon,
} from '@mui/icons-material';
import { MdHandshake, MdDomain } from "react-icons/md";
import { IoIosApps } from "react-icons/io";
import { formatDate } from '../utils/themeUtils';
import { calculateModelScore, getModelQualityColor } from '../utils/modelScoreUtils';
import { fetchData, fetchAgreementsByModel, getRulesForModel } from '../services/api';
import MiniCard from '../components/MiniCards';
import ModelRulesTable from '../components/ModelRulesTable';
import { GoVerified } from "react-icons/go";
import { modelFieldsConfig } from '../config/modelFields';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import MermaidDiagram from '../components/MermaidDiagram';
import { modelMarkdownsForDisplay, modelMarkdownProseSx, dataModelMarkdownEditPath } from '../utils/modelMarkdowns';
import { fontStackSans } from '../theme/theme';
import FieldInfoIcon from '../components/FieldInfoIcon';
import { useAuth } from '../contexts/AuthContext';
import {
  resolveModelToolTechnology,
  getTechnologyCardImage,
} from '../utils/modelToolCardImage';
import { findCatalogModel, modelApiRef } from '../utils/catalogModelLookup';

/** Short line for tool cards (hostname or path, truncated). */
function toolLinkCaption(url) {
  if (!url || typeof url !== 'string') return '';
  const s = url.trim();
  if (!s) return '';
  if (s.startsWith('/')) return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  try {
    const u = new URL(s);
    const path = u.pathname === '/' ? '' : u.pathname;
    const line = `${u.hostname}${path}`;
    return line.length > 72 ? `${line.slice(0, 72)}…` : line;
  } catch {
    return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  }
}

function ModelToolCardAvatar({ imgSpec, darkMode }) {
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => {
    setBroken(false);
  }, [imgSpec?.src]);
  if (!imgSpec?.src || broken) {
    return <HandymanIcon sx={{ fontSize: 22 }} />;
  }
  return (
    <Box
      component="img"
      src={imgSpec.src}
      alt={imgSpec.alt || ''}
      onError={() => setBroken(true)}
      sx={{
        width: 28,
        height: 28,
        objectFit: 'contain',
        filter: imgSpec.invert && darkMode ? 'invert(1)' : 'none',
      }}
    />
  );
}

function getAgreementStatusColor(status) {
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
}

function AgreementMiniCard({ agreement, currentTheme, navigate }) {
  const statusColor = getAgreementStatusColor(agreement.status);
  const statusLabel = (agreement.status || 'unknown')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return (
    <MiniCard
      currentTheme={currentTheme}
      title={agreement.name}
      description={agreement.description?.trim() || 'No description available'}
      descriptionLines={3}
      avatar={<MdHandshake style={{ fontSize: 22, color: 'inherit' }} />}
      chip={
        <Chip
          label={statusLabel}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: alpha(statusColor, 0.12),
            color: statusColor,
            textTransform: 'capitalize',
          }}
        />
      }
      trailing={<ChevronRightIcon sx={{ fontSize: 22 }} />}
      onClick={() => navigate(`/agreements/${encodeURIComponent(agreement.uuid || agreement.id)}`)}
    />
  );
}

const DataModelDetailPage = ({ currentTheme }) => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [model, setModel] = React.useState(null);
  const [agreements, setAgreements] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [currentAgreementIndex, setCurrentAgreementIndex] = React.useState(0);
  const [applications, setApplications] = React.useState([]);
  const [maintainerEmail, setMaintainerEmail] = React.useState(null);
  const [ruleCount, setRuleCount] = React.useState(0);
  const [modelRulesList, setModelRulesList] = React.useState([]);
  const [rulesListLoading, setRulesListLoading] = React.useState(false);
  const [docTabIndex, setDocTabIndex] = React.useState(0);
  const [toolkitCatalogForTools, setToolkitCatalogForTools] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;

    const loadModelAndAgreements = async () => {
      setLoading(true);
      setError(null);
      setModel(null);
      setAgreements([]);
      setMaintainerEmail(null);
      setCurrentAgreementIndex(0);

      try {
        const modelData = await fetchData('models', { forceRefresh: true });
        if (cancelled) return;
        const applicationsData = await fetchData('applications', { forceRefresh: true });
        if (cancelled) return;

        setApplications(applicationsData.applications || []);

        const modelsList = modelData?.models;
        if (!Array.isArray(modelsList)) {
          throw new Error('Invalid models response');
        }

        const foundModel = findCatalogModel(modelsList, modelId);

        if (foundModel) {
          const agreementsData = await fetchAgreementsByModel(modelApiRef(foundModel), {
            forceRefresh: true,
          });
          if (cancelled) return;

          setModel(foundModel);
          setAgreements(agreementsData.agreements || []);

          if (foundModel.specMaintainer) {
            const maintainerApp = applicationsData.applications?.find(
              (app) => app.name === foundModel.specMaintainer,
            );
            setMaintainerEmail(maintainerApp?.email || null);
          } else {
            setMaintainerEmail(null);
          }

          setRulesListLoading(true);
          try {
            const rulesData = await getRulesForModel(modelApiRef(foundModel));
            if (cancelled) return;
            const list = rulesData.rules || [];
            setModelRulesList(list);
            setRuleCount(list.length);
          } catch (err) {
            if (!cancelled) {
              console.error('Error loading rules:', err);
              setModelRulesList([]);
              setRuleCount(0);
            }
          } finally {
            if (!cancelled) setRulesListLoading(false);
          }
        } else if (!cancelled) {
          setError('Model not found');
          setModel(null);
          setAgreements([]);
          setModelRulesList([]);
          setRuleCount(0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading model:', err);
          setError('Failed to load model and agreements');
          setModel(null);
          setAgreements([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadModelAndAgreements();
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const markdownTabs = model ? modelMarkdownsForDisplay(model) : [];
  const hasTools =
    model?.resources?.tools &&
    typeof model.resources.tools === 'object' &&
    Object.keys(model.resources.tools).length > 0;
  const hasAgreements = agreements.length > 0;
  const hasReleaseNotes = Boolean(model?.changelog?.length > 0);

  React.useEffect(() => {
    if (!hasTools) {
      setToolkitCatalogForTools([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchData('toolkit');
        if (!cancelled) setToolkitCatalogForTools(data.toolkit?.toolkits || []);
      } catch {
        if (!cancelled) setToolkitCatalogForTools([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasTools]);

  const detailTabLayout = React.useMemo(() => {
    const md = markdownTabs.length;
    let n = md;
    let toolsIdx = -1;
    if (hasTools) {
      toolsIdx = n;
      n += 1;
    }
    const rulesIdx = n;
    n += 1;
    let agreementsIdx = -1;
    if (hasAgreements) {
      agreementsIdx = n;
      n += 1;
    }
    let releaseIdx = -1;
    if (hasReleaseNotes) {
      releaseIdx = n;
      n += 1;
    }
    const versionIdx = n;
    n += 1;
    return { toolsIdx, rulesIdx, agreementsIdx, releaseIdx, versionIdx, total: n };
  }, [markdownTabs.length, hasTools, hasAgreements, hasReleaseNotes]);

  const docTabCount = detailTabLayout.total;

  const sortedModelRules = React.useMemo(
    () =>
      [...modelRulesList].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
      ),
    [modelRulesList],
  );

  React.useEffect(() => {
    setDocTabIndex(0);
  }, [modelId]);

  React.useEffect(() => {
    setDocTabIndex((i) => Math.min(i, Math.max(0, docTabCount - 1)));
  }, [docTabCount]);

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

  if (!model) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
          No model to display. Try returning to the list and opening the model again.
        </Typography>
      </Box>
    );
  }

  const score = calculateScore(model);
  const qualityColor = getModelQualityColor(score.score, currentTheme.darkMode);
  const tierColor = getTierColor(model.meta?.tier);

  const handleNextAgreement = () => {
    setCurrentAgreementIndex((prevIndex) => {
      const nextIndex = prevIndex + 2;
      return nextIndex >= agreements.length ? 0 : nextIndex;
    });
  };

  const handlePrevAgreement = () => {
    setCurrentAgreementIndex((prevIndex) => {
      const newIndex = prevIndex - 2;
      return newIndex < 0 ? Math.max(0, agreements.length - 2) : newIndex;
    });
  };

  const { toolsIdx, rulesIdx, agreementsIdx, releaseIdx, versionIdx } = detailTabLayout;
  const mdTabCount = markdownTabs.length;
  const docTabSafe = Math.min(docTabIndex, Math.max(0, docTabCount - 1));

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <ArrowBackIcon 
          onClick={() => navigate('/models')} 
          sx={{ 
            cursor: 'pointer',
            color: currentTheme.text,
            '&:hover': { color: currentTheme.primary },
            mt: 0.5
          }} 
        />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text }}>
                {model.name}
              </Typography>
              {model.meta?.verified && (
                <Tooltip title="Verified Model">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: currentTheme.primary,
                      mt: 0.5
                    }}
                  >
                    <GoVerified size={24} />
                  </Box>
                </Tooltip>
              )}
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: currentTheme.textSecondary,
                fontWeight: 500,
                letterSpacing: '0.5px',
                fontFamily: 'monospace',
              }}
            >
              {model.shortName}
            </Typography>
          </Box>
        </Box>
        
        {/* Edit Mode Toggle */}
        <Tooltip title="Edit Model">
          <IconButton
            onClick={() => navigate(`/models/${encodeURIComponent(modelApiRef(model))}/edit`)}
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

      <Grid container spacing={3} sx={{ mb: 3, alignItems: 'stretch' }}>
        <Grid item xs={12} md={8} sx={{ display: 'flex' }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              boxSizing: 'border-box',
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text }}>
                Description
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
              {model.extendedDescription || model.description}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                {model.domain?.length > 0 && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MdDomain style={{ fontSize: 20, color: currentTheme.primary }} />
                      <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                        Domains
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {model.domain.map((domain, index) => (
                        <Chip
                          key={index}
                          label={domain}
                          size="small"
                          sx={{
                            bgcolor: alpha(currentTheme.primary, 0.1),
                            color: currentTheme.primary,
                            fontWeight: 500,
                            '& .MuiChip-label': {
                              px: 1,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {model.referenceData?.length > 0 && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IoIosApps style={{ fontSize: 20, color: currentTheme.primary }} />
                      <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                        Reference Data
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {model.referenceData.map((ref, index) => (
                        <Chip
                          key={index}
                          label={ref}
                          size="small"
                          sx={{
                            bgcolor: alpha(currentTheme.primary, 0.1),
                            color: currentTheme.primary,
                            fontWeight: 500,
                            '& .MuiChip-label': {
                              px: 1,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {model.users?.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MdHandshake style={{ fontSize: 20, color: currentTheme.primary }} />
                    <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                      Users
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {model.users.map((user, index) => (
                      <Chip
                        key={index}
                        label={user}
                        size="small"
                        sx={{
                          bgcolor: alpha(currentTheme.primary, 0.1),
                          color: currentTheme.primary,
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 1,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                <Typography variant="h6" sx={{ color: currentTheme.text }}>
                  Metadata Score
                </Typography>
                <FieldInfoIcon fieldId="dataModel.metadataScore" iconSize={18} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" sx={{ color: qualityColor, fontWeight: 600, mr: 1 }}>
                  {score.score}%
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Complete
                </Typography>
                <Tooltip 
                  title={
                    score.missingFields.length > 0 
                      ? `Missing fields: ${score.missingFields.join(', ')}`
                      : 'All fields are complete!'
                  }
                >
                  <IconButton size="small" sx={{ ml: 1, color: currentTheme.textSecondary }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box
                sx={{
                  height: 8,
                  width: '100%',
                  bgcolor: alpha(qualityColor, 0.1),
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${score.score}%`,
                    bgcolor: qualityColor,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              boxSizing: 'border-box',
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Spec information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Latest Version
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {model.version}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Specification Maintainer
                </Typography>
                <FieldInfoIcon fieldId="dataModel.spec.specificationMaintainer" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WrenchIcon sx={{ 
                  fontSize: 20, 
                  color: currentTheme.primary,
                  opacity: 0.8
                }} />
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {model.specMaintainer}
                </Typography>
                {maintainerEmail && (
                  <Tooltip title="Email Maintainer">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EmailIcon sx={{ fontSize: 14 }} />}
                      onClick={() => window.location.href = `mailto:${maintainerEmail}`}
                      sx={{
                        color: currentTheme.primary,
                        borderColor: currentTheme.primary,
                        ml: 1,
                        py: 0.25,
                        px: 0.75,
                        minWidth: 'auto',
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        height: '24px',
                        '&:hover': {
                          borderColor: currentTheme.primary,
                          bgcolor: alpha(currentTheme.primary, 0.1),
                        }
                      }}
                    >
                      EMAIL
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Last Updated
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {formatDate(model.lastUpdated)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                  Tier
                </Typography>
                <FieldInfoIcon fieldId="dataModel.spec.tier" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: tierColor,
                    boxShadow: `0 0 0 1px ${alpha(tierColor, 0.3)}`,
                  }}
                />
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {model.meta?.tier?.charAt(0).toUpperCase() + model.meta?.tier?.slice(1)}
                </Typography>
              </Box>
            </Box>

            {/* Sensitivity Level Field */}
            {model[modelFieldsConfig.field1.jsonKey] && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                      {modelFieldsConfig.field1.name}
                    </Typography>
                    <FieldInfoIcon fieldId="dataModel.field.sensitivityLevel" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {(Array.isArray(model[modelFieldsConfig.field1.jsonKey]) 
                      ? model[modelFieldsConfig.field1.jsonKey] 
                      : [model[modelFieldsConfig.field1.jsonKey]]
                    ).map((value, index) => {
                      // If options exist, try to find matching option, otherwise use free text
                      const options = modelFieldsConfig.field1.options || [];
                      if (options.length > 0) {
                        const option = options.find(opt => opt.value === value);
                        const label = option ? option.label : value;
                        const color = option ? option.color : '#9e9e9e';
                        
                        return (
                          <Chip
                            key={index}
                            label={label}
                            size="small"
                            sx={{
                              bgcolor: alpha(color, 0.1),
                              color: color,
                              '&:hover': {
                                bgcolor: alpha(color, 0.2),
                              }
                            }}
                          />
                        );
                      } else {
                        // Free text - display as plain chip
                        return (
                          <Chip
                            key={index}
                            label={value}
                            size="small"
                            sx={{
                              bgcolor: alpha(currentTheme.primary, 0.1),
                              color: currentTheme.primary,
                              '&:hover': {
                                bgcolor: alpha(currentTheme.primary, 0.2),
                              }
                            }}
                          />
                        );
                      }
                    })}
                  </Box>
                </Box>
              </>
            )}

            <Box sx={{ mt: 'auto', width: '100%' }}>
            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Resources
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {model.resources?.code && (
                <Link
                  href={model.resources.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: currentTheme.text,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      color: currentTheme.primary,
                    },
                  }}
                >
                  <CodeIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2">Conditioning Code</Typography>
                </Link>
              )}
              {model.resources?.documentation && (
                <Link
                  href={model.resources.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: currentTheme.text,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      color: currentTheme.primary,
                    },
                  }}
                >
                  <MenuBookIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2">Documentation</Typography>
                </Link>
              )}
              {model.resources?.git && (
                <Link
                  href={model.resources.git}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: currentTheme.text,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      color: currentTheme.primary,
                    },
                  }}
                >
                  <GitHubIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2">Git Repository</Typography>
                </Link>
              )}
              {model.resources?.validation && (
                <Link
                  href={model.resources.validation}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: currentTheme.text,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      color: currentTheme.primary,
                    },
                  }}
                >
                  <VerifiedUserIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2">Validation</Typography>
                </Link>
              )}
            </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mt: 0,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${currentTheme.border}`,
            pr: 0.5,
          }}
        >
          <Tabs
            value={docTabSafe}
            onChange={(_, v) => setDocTabIndex(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              flex: 1,
              minWidth: 0,
              borderBottom: 'none',
              px: 1,
              '& .MuiTab-root': { textTransform: 'none', minHeight: 48 },
            }}
          >
            {markdownTabs.map((t) => (
              <Tab key={t.id} label={t.title} />
            ))}
            {hasTools && <Tab label="Tools" />}
            <Tab label={`Rules${ruleCount > 0 ? ` (${ruleCount})` : ''}`} />
            {hasAgreements && <Tab label="Product agreements" />}
            {hasReleaseNotes && <Tab label="Release notes" />}
            <Tab label="Version history" />
          </Tabs>
          {mdTabCount > 0 && docTabSafe < mdTabCount && canEdit?.() && (
            <Tooltip title="Edit this tab’s markdown">
              <IconButton
                size="small"
                aria-label="Edit documentation markdown"
                onClick={() => {
                  const id = markdownTabs[docTabSafe]?.id;
                  if (id) navigate(dataModelMarkdownEditPath(modelApiRef(model), id));
                }}
                sx={{
                  flexShrink: 0,
                  color: currentTheme.textSecondary,
                  '&:hover': { color: currentTheme.primary },
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ p: 3 }}>
          {docTabSafe < mdTabCount && (
            <Box
              sx={{
                ...modelMarkdownProseSx(currentTheme),
                fontFamily: fontStackSans,
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkEmoji]}
                components={{
                  code({ inline, className, children, ...props }) {
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
                {markdownTabs[docTabSafe]?.content || ''}
              </ReactMarkdown>
            </Box>
          )}

          {hasTools && docTabSafe === toolsIdx && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Toolkit technologies linked from model resources. Each card opens the technology in the
                catalog or the documentation link.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2,
                }}
              >
                {Object.entries(model.resources.tools).map(([toolName, toolUrl], index) => {
                  const url = typeof toolUrl === 'string' ? toolUrl : '';
                  const isInternal = url.startsWith('/');
                  const caption = toolLinkCaption(url);
                  const resolved = resolveModelToolTechnology(toolkitCatalogForTools, toolName, url);
                  const imgSpec = resolved
                    ? getTechnologyCardImage(resolved.technology, resolved.toolkit)
                    : null;
                  const techDescription = resolved?.technology?.description?.trim();
                  const toolDescription = techDescription || caption || undefined;
                  const descriptionSx = techDescription
                    ? {}
                    : caption
                      ? {
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                        }
                      : {};

                  return (
                    <MiniCard
                      key={`${toolName}-${index}`}
                      currentTheme={currentTheme}
                      title={toolName}
                      description={toolDescription}
                      descriptionVariant={techDescription ? 'body2' : 'caption'}
                      descriptionLines={techDescription ? 3 : 2}
                      descriptionSx={descriptionSx}
                      avatar={
                        <ModelToolCardAvatar imgSpec={imgSpec} darkMode={currentTheme.darkMode} />
                      }
                      chip={
                        <Chip
                          size="small"
                          label={isInternal ? 'In catalog' : 'External'}
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: isInternal
                              ? alpha(currentTheme.primary, currentTheme.darkMode ? 0.25 : 0.15)
                              : alpha(currentTheme.textSecondary, 0.12),
                            color: isInternal ? currentTheme.primary : currentTheme.textSecondary,
                            border: 'none',
                          }}
                        />
                      }
                      trailing={
                        isInternal ? (
                          <ChevronRightIcon sx={{ fontSize: 22 }} />
                        ) : (
                          <OpenInNewIcon sx={{ fontSize: 20 }} />
                        )
                      }
                      to={isInternal ? url : undefined}
                      href={!isInternal ? url : undefined}
                      target={!isInternal ? '_blank' : undefined}
                      rel={!isInternal ? 'noopener noreferrer' : undefined}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {docTabSafe === rulesIdx && (
            <Box>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                Rules associated with this model
              </Typography>
              <ModelRulesTable
                rules={sortedModelRules}
                loading={rulesListLoading}
                readOnly
                expandResetKey={modelApiRef(model)}
                currentTheme={currentTheme}
                darkMode={currentTheme.darkMode}
                applications={applications}
                emptyMessage="No rules for this model yet."
              />
            </Box>
          )}

          {hasAgreements && docTabSafe === agreementsIdx && (
            <Box>
              {agreements.length > 2 ? (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <IconButton
                      onClick={handlePrevAgreement}
                      sx={{
                        color: currentTheme.text,
                        '&:hover': { color: currentTheme.primary },
                      }}
                    >
                      <NavigateBeforeIcon />
                    </IconButton>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        flex: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <Box sx={{ flex: 1, maxWidth: 'calc(50% - 8px)' }}>
                        <AgreementMiniCard
                          agreement={agreements[currentAgreementIndex]}
                          currentTheme={currentTheme}
                          navigate={navigate}
                        />
                      </Box>
                      {currentAgreementIndex + 1 < agreements.length && (
                        <Box sx={{ flex: 1, maxWidth: 'calc(50% - 8px)' }}>
                          <AgreementMiniCard
                            agreement={agreements[currentAgreementIndex + 1]}
                            currentTheme={currentTheme}
                            navigate={navigate}
                          />
                        </Box>
                      )}
                    </Box>
                    <IconButton
                      onClick={handleNextAgreement}
                      sx={{
                        color: currentTheme.text,
                        '&:hover': { color: currentTheme.primary },
                      }}
                    >
                      <NavigateNextIcon />
                    </IconButton>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    {Array.from({ length: Math.ceil(agreements.length / 2) }).map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor:
                            index === Math.floor(currentAgreementIndex / 2)
                              ? currentTheme.primary
                              : alpha(currentTheme.primary, 0.2),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': { bgcolor: currentTheme.primary },
                        }}
                        onClick={() => setCurrentAgreementIndex(index * 2)}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {agreements.map((agreement) => (
                    <Grid item xs={12} sm={6} key={agreement.id}>
                      <AgreementMiniCard
                        agreement={agreement}
                        currentTheme={currentTheme}
                        navigate={navigate}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {hasReleaseNotes && docTabSafe === releaseIdx && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {model.changelog.map((entry, index) => (
                <Box key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: currentTheme.primary,
                        fontWeight: 600,
                      }}
                    >
                      v{entry.version}
                    </Typography>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      {formatDate(entry.date)}
                    </Typography>
                  </Box>
                  <Box
                    component="ul"
                    sx={{
                      m: 0,
                      pl: 2,
                      '& li': {
                        color: currentTheme.textSecondary,
                        mb: 0.5,
                        '&:last-child': { mb: 0 },
                      },
                    }}
                  >
                    {entry.changes.map((change, changeIndex) => (
                      <Box component="li" key={changeIndex}>
                        {change}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {docTabSafe === versionIdx && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(model.versionHistory || []).map((entry, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: 1,
                    bgcolor: currentTheme.background,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: currentTheme.primary,
                        fontWeight: 600,
                      }}
                    >
                      v{entry.version}
                    </Typography>
                    <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                      {formatDate(entry.timestamp)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                      by {entry.updatedBy}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: currentTheme.text }}>
                    {entry.changeDescription}
                  </Typography>
                  {entry.fieldChanges && entry.fieldChanges.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: currentTheme.textSecondary,
                            fontWeight: 600,
                          }}
                        >
                          Field Changes:
                        </Typography>
                        <FieldInfoIcon fieldId="dataModel.versionHistory.fieldChanges" />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {entry.fieldChanges.map((change, changeIndex) => (
                          <Box
                            key={changeIndex}
                            sx={{
                              p: 1.5,
                              bgcolor: currentTheme.background,
                              borderRadius: 1,
                              border: `1px solid ${currentTheme.border}`,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ color: currentTheme.primary, fontWeight: 600, mb: 0.5 }}
                            >
                              {change.field}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: currentTheme.textSecondary, minWidth: '60px' }}
                                >
                                  From:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: currentTheme.text,
                                    fontFamily: 'monospace',
                                    bgcolor: alpha('#f44336', 0.1),
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 0.5,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {change.oldValue ?? 'empty'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: currentTheme.textSecondary, minWidth: '60px' }}
                                >
                                  To:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: currentTheme.text,
                                    fontFamily: 'monospace',
                                    bgcolor: alpha('#4caf50', 0.1),
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 0.5,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {change.newValue ?? 'empty'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
              {(!model.versionHistory || model.versionHistory.length === 0) && (
                <Typography
                  variant="body2"
                  sx={{
                    color: currentTheme.textSecondary,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    py: 2,
                  }}
                >
                  No version history available. Changes will be tracked starting from the next update.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

// Use the new scoring system from modelScoreUtils
const calculateScore = (model) => {
  return calculateModelScore(model);
};

// Helper function to get tier color
const getTierColor = (tier) => {
  switch (tier?.toLowerCase()) {
    case 'gold':
      return '#FFD700';
    case 'silver':
      return '#C0C0C0';
    case 'bronze':
      return '#CD7F32';
    default:
      return '#9e9e9e';
  }
};

export default DataModelDetailPage; 