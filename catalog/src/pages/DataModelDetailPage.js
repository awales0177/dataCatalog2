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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Code as CodeIcon,
  MenuBook as MenuBookIcon,
  Build as BuildIcon,
  GitHub as GitHubIcon,
  VerifiedUser as VerifiedUserIcon,
  WorkspacePremium as CrownIcon,
  Construction as WrenchIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Email as EmailIcon,
  HelpOutline as HelpOutlineIcon,
  Gavel as GavelIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { ImMakeGroup } from "react-icons/im";
import { MdHandshake, MdDomain } from "react-icons/md";
import { IoIosApps } from "react-icons/io";
import { formatDate, getQualityColor } from '../utils/themeUtils';
import verifiedLogo from '../imgs/verified.svg';
import { fetchData, fetchAgreementsByModel } from '../services/api';
import ProductAgreementCard from '../components/ProductAgreementCard';
import { GoVerified } from "react-icons/go";

const DataModelDetailPage = ({ currentTheme }) => {
  const { shortName } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = React.useState(null);
  const [agreements, setAgreements] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [currentAgreementIndex, setCurrentAgreementIndex] = React.useState(0);

  React.useEffect(() => {
    const loadModelAndAgreements = async () => {
      try {
        console.log('Loading model and agreements for:', shortName);
        console.log('Fetching model data...');
        const modelData = await fetchData('models', { forceRefresh: true });
        console.log('Model data received:', modelData);
        
        console.log('Fetching agreements data...');
        const agreementsData = await fetchAgreementsByModel(shortName, { forceRefresh: true });
        console.log('Agreements data received:', agreementsData);
        
        const foundModel = modelData.models.find(m => m.shortName.toLowerCase() === shortName.toLowerCase());
        if (foundModel) {
          console.log('Found model:', foundModel);
          setModel(foundModel);
          setAgreements(agreementsData.agreements || []);
        } else {
          console.error('Model not found:', {
            shortName,
            availableModels: modelData.models.map(m => m.shortName)
          });
          setError('Model not found');
        }
      } catch (error) {
        console.error('Error fetching model and agreements:', error);
        console.error('Error details:', {
          shortName,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        });
        setError('Failed to load model and agreements');
      } finally {
        setLoading(false);
      }
    };

    loadModelAndAgreements();
  }, [shortName]);

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
    return null;
  }

  const score = calculateScore(model);
  const qualityColor = getQualityColor(score.score, currentTheme.darkMode);
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

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <ArrowBackIcon 
          onClick={() => navigate('/specifications')} 
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
              }}
            >
              {model.shortName}
            </Typography>
          </Box>
        </Box>
        
        {/* Edit Mode Toggle */}
        <Tooltip title="Edit Model">
          <IconButton
            onClick={() => navigate(`/specifications/${model.shortName}/edit`)}
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
              Description
            </Typography>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
              {model.extendedDescription}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                {model.domain?.length > 0 && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MdDomain style={{ fontSize: 20, color: currentTheme.primary }} />
                      Domains
                    </Typography>
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
                    <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IoIosApps style={{ fontSize: 20, color: currentTheme.primary }} />
                      Reference Data
                    </Typography>
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
                  <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdHandshake style={{ fontSize: 20, color: currentTheme.primary }} />
                    Users
                  </Typography>
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

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Metadata Score
              </Typography>
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

          {agreements.length > 0 && (
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
                Product Agreements
              </Typography>
              {agreements.length > 2 ? (
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    mb: 2
                  }}>
                    <IconButton 
                      onClick={handlePrevAgreement}
                      sx={{ 
                        color: currentTheme.text,
                        '&:hover': { color: currentTheme.primary }
                      }}
                    >
                      <NavigateBeforeIcon />
                    </IconButton>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flex: 1,
                      justifyContent: 'center'
                    }}>
                      <Box sx={{ flex: 1, maxWidth: 'calc(50% - 8px)' }}>
                        <ProductAgreementCard 
                          agreement={agreements[currentAgreementIndex]} 
                          currentTheme={currentTheme} 
                        />
                      </Box>
                      {currentAgreementIndex + 1 < agreements.length && (
                        <Box sx={{ flex: 1, maxWidth: 'calc(50% - 8px)' }}>
                          <ProductAgreementCard 
                            agreement={agreements[currentAgreementIndex + 1]} 
                            currentTheme={currentTheme} 
                          />
                        </Box>
                      )}
                    </Box>
                    <IconButton 
                      onClick={handleNextAgreement}
                      sx={{ 
                        color: currentTheme.text,
                        '&:hover': { color: currentTheme.primary }
                      }}
                    >
                      <NavigateNextIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 1,
                    mt: 2
                  }}>
                    {Array.from({ length: Math.ceil(agreements.length / 2) }).map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: index === Math.floor(currentAgreementIndex / 2)
                            ? currentTheme.primary 
                            : alpha(currentTheme.primary, 0.2),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: currentTheme.primary,
                          }
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
                      <ProductAgreementCard agreement={agreement} currentTheme={currentTheme} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}
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
              Spec information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Latest Version
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {model.version}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Owner
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CrownIcon sx={{ 
                  fontSize: 20, 
                  color: currentTheme.primary,
                  opacity: 0.8
                }} />
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {model.owner}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                Specification Maintainer
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WrenchIcon sx={{ 
                  fontSize: 20, 
                  color: currentTheme.primary,
                  opacity: 0.8
                }} />
                <Typography variant="body1" sx={{ color: currentTheme.text }}>
                  {model.specMaintainer}
                </Typography>
                {model.maintainerEmail && (
                  <Tooltip title="Email Maintainer">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EmailIcon sx={{ fontSize: 14 }} />}
                      onClick={() => window.location.href = `mailto:${model.maintainerEmail}`}
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
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Last Updated
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text }}>
                {formatDate(model.lastUpdated)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Tier
              </Typography>
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
              {model.resources?.tools && (
                typeof model.resources.tools === 'object' && Object.keys(model.resources.tools).length > 0 ? (
                  <Accordion 
                    defaultExpanded={false}
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
                      expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.text, fontSize: 16 }} />}
                      sx={{
                        px: 0,
                        py: 0,
                        minHeight: 'auto',
                        '& .MuiAccordionSummary-content': {
                          margin: 0,
                        },
                        '&:hover': {
                          bgcolor: 'transparent',
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: currentTheme.text,
                        '&:hover': {
                          color: currentTheme.primary,
                        },
                      }}>
                        <BuildIcon sx={{ fontSize: 20 }} />
                        <Typography variant="body2">Tools ({Object.keys(model.resources.tools).length})</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 3 }}>
                        {Object.entries(model.resources.tools).map(([toolName, toolUrl], index) => (
                          <Link
                            key={index}
                            href={toolUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: currentTheme.textSecondary,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              fontSize: '0.875rem',
                              '&:hover': {
                                color: currentTheme.primary,
                              },
                            }}
                          >
                            <WrenchIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {toolName}
                            </Typography>
                          </Link>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  <Link
                    href={model.resources.tools}
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
                    <BuildIcon sx={{ fontSize: 20 }} />
                    <Typography variant="body2">Tools</Typography>
                  </Link>
                )
              )}
              {model.resources?.rules && (
                <Link
                  href={model.resources.rules}
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
                  <GavelIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2">Rules</Typography>
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
          </Paper>
        </Grid>
      </Grid>

      {/* Changelog Section */}
      {model.changelog && model.changelog.length > 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            mt: 3,
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Accordion 
            defaultExpanded={false}
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
                px: 3,
                py: 2,
                '& .MuiAccordionSummary-content': {
                  margin: 0,
                },
                '&:hover': {
                  bgcolor: alpha(currentTheme.primary, 0.05),
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ color: currentTheme.primary }} />
                <Typography variant="h6" sx={{ color: currentTheme.text }}>
                  Version History
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {model.changelog.map((entry, index) => (
                  <Box key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      mb: 1
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: currentTheme.primary,
                          fontWeight: 600,
                        }}
                      >
                        v{entry.version}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: currentTheme.textSecondary,
                        }}
                      >
                        {formatDate(entry.date)}
                      </Typography>
                    </Box>
                    <Box component="ul" sx={{ 
                      m: 0, 
                      pl: 2,
                      '& li': {
                        color: currentTheme.textSecondary,
                        mb: 0.5,
                        '&:last-child': {
                          mb: 0
                        }
                      }
                    }}>
                      {entry.changes.map((change, changeIndex) => (
                        <Box component="li" key={changeIndex}>
                          {change}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
    </Box>
  );
};

// Helper function to calculate score (reused from DataModelCard)
const calculateScore = (model) => {
  const countFilledFields = (obj) => {
    let filledCount = 0;
    let totalCount = 0;
    let missingFields = [];

    for (const [key, value] of Object.entries(obj)) {
      totalCount++;
      if (value === null || value === undefined || value === "") {
        missingFields.push(key);
        continue;
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nestedResult = countFilledFields(value);
        filledCount += nestedResult.filled;
        totalCount += nestedResult.total - 1; // Subtract 1 to avoid double counting the parent object
        missingFields = missingFields.concat(nestedResult.missing.map(field => `${key}.${field}`));
      } else {
        filledCount++;
      }
    }
    return { filled: filledCount, total: totalCount, missing: missingFields };
  };

  const result = countFilledFields(model);
  return {
    score: Math.round((result.filled / result.total) * 100),
    missingFields: result.missing
  };
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