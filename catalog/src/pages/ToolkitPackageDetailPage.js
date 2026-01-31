import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Grid,
  alpha,
  Tooltip,
  CircularProgress,
  IconButton,
  Button,
  Alert,
  Link,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Code as CodeIcon,
  Language as LanguageIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, deleteToolkitPackage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DeleteModal from '../components/DeleteModal';

const ToolkitPackageDetailPage = () => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadPackageData = async () => {
      try {
        const data = await fetchData('toolkit');
        const functions = data.toolkit.functions || [];
        
        // Group functions by package
        const getPackageName = (func) => {
          if (func.language !== 'python') return null;
          if (func.source_module) {
            const parts = func.source_module.split('.');
            return parts[0];
          }
          if (func.dependencies && func.dependencies.length > 0) {
            const packageDep = func.dependencies.find(dep => 
              typeof dep === 'string' && !dep.includes('/') && !dep.includes('http')
            );
            if (packageDep) {
              return packageDep.split(/[>=<!=]/)[0].trim();
            }
          }
          return null;
        };

        // Check if package metadata exists in toolkit.packages first
        const packages = data.toolkit.packages || [];
        // Try to find by ID first, then fallback to name for backward compatibility
        const existingPackage = packages.find(p => p.id === packageId) || 
                               packages.find(p => p.name === packageId);
        
        // Get functions associated with this package
        let packageFunctions = [];
        if (existingPackage?.functionIds && existingPackage.functionIds.length > 0) {
          packageFunctions = functions.filter(f => existingPackage.functionIds.includes(f.id));
        } else {
          // Fallback: try to find by name if no functionIds
          const packageName = existingPackage?.name || packageId;
          packageFunctions = functions.filter(func => {
            const pkg = getPackageName(func);
            return pkg === packageName;
          });
        }

        // Show package if it exists in packages array OR has associated functions
        if (existingPackage || packageFunctions.length > 0) {
          const packageName = existingPackage?.name || packageId;
          const firstFunc = packageFunctions.length > 0 ? packageFunctions[0] : null;
          
          // Use the actual package ID if it exists, otherwise use the URL packageId
          // But mark if it's not in the packages array (can't be deleted)
          const packageIdToUse = existingPackage?.id || packageId;
          const isInPackagesArray = !!existingPackage;
          
          const packageInfo = {
            id: packageIdToUse,
            name: packageName,
            functions: packageFunctions,
            language: firstFunc?.language || existingPackage?.language || 'python',
            // Package-level metadata from packages array or defaults
            description: existingPackage?.description || `Python package ${packageName}`,
            version: existingPackage?.version || 'N/A',
            latestReleaseDate: existingPackage?.latestReleaseDate || null,
            maintainers: existingPackage?.maintainers || [],
            documentation: existingPackage?.documentation || null,
            githubRepo: existingPackage?.githubRepo || null,
            pipInstall: existingPackage?.pipInstall || `pip install ${packageName}`,
            _isInPackagesArray: isInPackagesArray, // Internal flag to know if package can be deleted
          };
          setPackageData(packageInfo);
        } else {
          setError('Package not found');
        }
      } catch (err) {
        setError('Failed to load package data');
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      loadPackageData();
    }
  }, [packageId]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !packageData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Package not found'}
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

  const getLanguageIcon = (language) => {
    if (!language) return <CodeIcon />;
    const languageLower = language.toLowerCase();
    if (languageLower === 'python') {
      return <img src="/python.svg" alt="Python" style={{ width: 24, height: 24 }} />;
    }
    return <CodeIcon />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleCopyPipInstall = () => {
    navigator.clipboard.writeText(packageData.pipInstall);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    // Only proceed if package exists in packages array
    if (!packageData._isInPackagesArray) {
      setShowDeleteModal(false);
      return;
    }
    
    setDeleting(true);
    try {
      // Always prefer ID, but if it's not a UUID, it might be a name (backward compatibility)
      const deleteId = packageData.id && packageData.id !== packageData.name ? packageData.id : packageData.name;
      await deleteToolkitPackage(deleteId);
      navigate('/toolkit');
    } catch (err) {
      console.error('Error deleting package:', err);
      setError(err.message || 'Failed to delete package');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };


  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/toolkit')}
          variant="outlined"
          sx={{
            borderColor: currentTheme.border,
            color: currentTheme.text,
            '&:hover': {
              borderColor: currentTheme.primary,
              bgcolor: alpha(currentTheme.primary, 0.1),
            },
          }}
        >
          Back to Toolkit
        </Button>
        {canEdit && (
          <>
            <Button
              startIcon={<EditIcon />}
              onClick={() => navigate(`/toolkit/package/${encodeURIComponent(packageData.id || packageData.name)}/edit`)}
              variant="outlined"
              sx={{
                borderColor: currentTheme.primary,
                color: currentTheme.primary,
                '&:hover': {
                  borderColor: currentTheme.primary,
                  bgcolor: alpha(currentTheme.primary, 0.1),
                },
              }}
            >
              Edit Package
            </Button>
            {packageData?._isInPackagesArray && (
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
                variant="outlined"
                sx={{
                  borderColor: '#f44336',
                  color: '#f44336',
                  '&:hover': {
                    borderColor: '#f44336',
                    bgcolor: alpha('#f44336', 0.1),
                  },
                }}
              >
                Delete Package
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Package Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {getLanguageIcon(packageData.language)}
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
              {packageData.name}
            </Typography>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
              {packageData.description}
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 18, color: currentTheme.textSecondary }} />
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    Version:
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    {packageData.version}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 18, color: currentTheme.textSecondary }} />
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    Latest Release:
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    {formatDate(packageData.latestReleaseDate)}
                  </Typography>
                </Box>
                {packageData.maintainers && packageData.maintainers.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ fontSize: 18, color: currentTheme.textSecondary }} />
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      Maintainers:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {packageData.maintainers.map((maintainer, idx) => (
                        <Chip
                          key={idx}
                          label={maintainer}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: alpha(currentTheme.primary, 0.1),
                            color: currentTheme.primary,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                {packageData.documentation && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DescriptionIcon sx={{ fontSize: 18, color: currentTheme.textSecondary }} />
                    <Link
                      href={packageData.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: currentTheme.primary,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      View Documentation
                    </Link>
                  </Box>
                )}
                {packageData.githubRepo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <GitHubIcon sx={{ fontSize: 18, color: currentTheme.textSecondary }} />
                    <Link
                      href={packageData.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: currentTheme.primary,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      GitHub Repository
                    </Link>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                    Install:
                  </Typography>
                  <TextField
                    fullWidth
                    value={packageData.pipInstall}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleCopyPipInstall}
                            sx={{ color: currentTheme.primary }}
                            size="small"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: currentTheme.background,
                        color: currentTheme.text,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: currentTheme.border,
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                icon={<LanguageIcon />}
                label={packageData.language}
                size="small"
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                }}
              />
              <Chip
                label={`${packageData.functions.length} ${packageData.functions.length === 1 ? 'function' : 'functions'}`}
                size="small"
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Functions List */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" sx={{ color: currentTheme.text, mb: 3 }}>
          Functions ({packageData.functions.length})
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {packageData.functions.map((func) => (
            <Chip
              key={func.id}
              icon={<CodeIcon />}
              label={func.displayName || func.name}
              sx={{
                bgcolor: alpha(currentTheme.primary, 0.1),
                color: currentTheme.primary,
                border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                '& .MuiChip-icon': {
                  color: currentTheme.primary,
                },
                '&:hover': {
                  bgcolor: alpha(currentTheme.primary, 0.2),
                },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Delete Package Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Package"
        itemName={packageData?.name}
        itemType="package"
        theme={currentTheme}
        isDeleting={deleting}
        confirmationText={packageData?._isInPackagesArray ? `delete ${packageData?.name}` : undefined}
      >
        {packageData?._isInPackagesArray ? (
          <>
            <Typography sx={{ mb: 2 }}>
              This will:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 3 }}>
              <Typography component="li">Permanently delete the package "{packageData?.name}"</Typography>
              <Typography component="li">Remove all package metadata and configurations</Typography>
              <Typography component="li">Associated functions will remain in the toolkit</Typography>
              <Typography component="li">This action cannot be undone</Typography>
            </Box>
          </>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
              This package is not in the packages array.
            </Typography>
            <Typography variant="body2">
              This package only exists as grouped functions. To delete it, you would need to create a package entry first, or delete the individual functions.
            </Typography>
          </Alert>
        )}
      </DeleteModal>

    </Container>
  );
};

export default ToolkitPackageDetailPage;

