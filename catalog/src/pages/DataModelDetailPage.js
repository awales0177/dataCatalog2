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
} from '@mui/icons-material';
import { formatDate, getQualityColor } from '../utils/themeUtils';
import verifiedLogo from '../imgs/verified.svg';
import { fetchData, fetchContractsByModel } from '../services/api';
import DataContractCard from '../components/DataContractCard';

const DataModelDetailPage = ({ currentTheme }) => {
  const { shortName } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = React.useState(null);
  const [contracts, setContracts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadModelAndContracts = async () => {
      try {
        const [modelData, contractsData] = await Promise.all([
          fetchData('models'),
          fetchContractsByModel(shortName)
        ]);
        
        const foundModel = modelData.models.find(m => m.shortName.toLowerCase() === shortName.toLowerCase());
        if (foundModel) {
          setModel(foundModel);
          setContracts(contractsData.contracts || []);
        } else {
          setError('Model not found');
        }
      } catch (error) {
        console.error('Error fetching model and contracts:', error);
        setError('Failed to load model and contracts');
      } finally {
        setLoading(false);
      }
    };

    loadModelAndContracts();
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
  const qualityColor = getQualityColor(score, currentTheme.darkMode);
  const tierColor = getTierColor(model.meta?.tier);

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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text }}>
                {model.name}
              </Typography>
              {model.meta?.verified && (
                <Tooltip title="Verified Model">
                  <Box
                    component="img"
                    src={verifiedLogo}
                    alt="Verified"
                    sx={{
                      width: '32px',
                      height: '32px',
                      objectFit: 'contain',
                      filter: currentTheme.darkMode ? 'invert(1)' : 'none',
                      mt: 0.5
                    }}
                  />
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

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
                Domains
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {model.domain?.map((domain, index) => (
                  <Chip
                    key={index}
                    label={domain}
                    size="small"
                    sx={{
                      bgcolor: alpha(currentTheme.primary, 0.1),
                      color: currentTheme.primary,
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
                Users
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {model.users?.map((user, index) => (
                  <Chip
                    key={index}
                    label={user}
                    size="small"
                    sx={{
                      bgcolor: alpha(currentTheme.primary, 0.1),
                      color: currentTheme.primary,
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Metadata Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" sx={{ color: qualityColor, fontWeight: 600, mr: 1 }}>
                  {score}%
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Complete
                </Typography>
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
                    width: `${score}%`,
                    bgcolor: qualityColor,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {contracts.length > 0 && (
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
                Data Contracts
              </Typography>
              <Grid container spacing={2}>
                {contracts.map((contract) => (
                  <Grid item xs={12} sm={6} key={contract.id}>
                    <DataContractCard contract={contract} currentTheme={currentTheme} />
                  </Grid>
                ))}
              </Grid>
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
              Model Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Version
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
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
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
                  <Typography variant="body2">Code Repository</Typography>
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

    for (const [key, value] of Object.entries(obj)) {
      totalCount++;
      if (value === null || value === undefined || value === "") {
        continue;
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nestedResult = countFilledFields(value);
        filledCount += nestedResult.filled;
        totalCount += nestedResult.total - 1; // Subtract 1 to avoid double counting the parent object
      } else {
        filledCount++;
      }
    }
    return { filled: filledCount, total: totalCount };
  };

  const result = countFilledFields(model);
  return Math.round((result.filled / result.total) * 100);
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