import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Grid,
  Divider
} from '@mui/material';
import {
  DataObject as DataObjectIcon
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchModels } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ModelRuleBuilder from '../components/ModelRuleBuilder';
import CountryRuleBuilder from '../components/CountryRuleBuilder';

const RuleBuilderPage = () => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modelParam = searchParams.get('model');
  
  // State management
  const [step, setStep] = useState('typeSelection'); // 'typeSelection', 'selectModel', or 'builder'
  const [ruleType, setRuleType] = useState(null); // 'model' or 'country'
  const [typeSelectionModalOpen, setTypeSelectionModalOpen] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Auto-select model from URL parameter
  useEffect(() => {
    if (modelParam && models.length > 0 && !selectedModel) {
      const model = models.find(m => m.shortName.toLowerCase() === modelParam.toLowerCase());
      if (model) {
        setRuleType('model');
        setSelectedModel(model);
        setStep('builder');
        setTypeSelectionModalOpen(false);
      }
    }
  }, [modelParam, models, selectedModel]);

  const loadModels = async () => {
    try {
      const data = await fetchModels();
      setModels(data.models || []);
    } catch (error) {
      console.error('Error loading models:', error);
      setSnackbar({ open: true, message: 'Failed to load models', severity: 'error' });
    }
  };

  const handleTypeSelection = (type) => {
    console.log('handleTypeSelection called with:', type);
    setRuleType(type);
    if (type === 'model') {
      setStep('selectModel');
    } else if (type === 'country') {
      setStep('builder');
      setTypeSelectionModalOpen(false);
    }
  };

  const handleModelSelect = (modelId) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      setTypeSelectionModalOpen(false);
      setStep('builder');
    }
  };

  const handleBackToModelSelect = () => {
    setStep('selectModel');
    setRuleType('model');
    setTypeSelectionModalOpen(true);
    setSelectedModel(null);
  };

  const handleBackToTypeSelection = () => {
    setStep('typeSelection');
    setRuleType(null);
    setSelectedModel(null);
    setTypeSelectionModalOpen(true);
  };

  // Render type selection modal
  const renderTypeSelectionModal = () => (
    <Dialog
      open={typeSelectionModalOpen}
      onClose={() => {
        navigate(-1);
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: currentTheme?.card,
          color: currentTheme?.text,
          border: `1px solid ${currentTheme?.border}`,
          boxShadow: 'none'
        }
      }}
    >
      <DialogTitle sx={{ color: currentTheme?.text, textAlign: 'center', pb: 2 }}>
        Rule Builder
      </DialogTitle>
      <DialogContent sx={{ color: currentTheme?.text }}>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: currentTheme?.textSecondary }}>
          Select the type of rules you want to manage
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card
              onClick={() => handleTypeSelection('model')}
              sx={{
                cursor: 'pointer',
                bgcolor: currentTheme?.background,
                border: `2px solid ${currentTheme?.border}`,
                '&:hover': {
                  borderColor: currentTheme?.primary,
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 180,
                boxShadow: 'none'
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <DataObjectIcon sx={{ fontSize: 48, color: currentTheme?.primary }} />
                </Box>
                <Typography variant="h6" sx={{ color: currentTheme?.text, mb: 1 }}>
                  Model
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                  Create and manage rules for data models
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card
              onClick={() => handleTypeSelection('country')}
              sx={{
                cursor: 'pointer',
                bgcolor: currentTheme?.background,
                border: `2px solid ${currentTheme?.border}`,
                '&:hover': {
                  borderColor: currentTheme?.primary,
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 180,
                boxShadow: 'none'
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: 48, color: currentTheme?.primary, mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>🌍</Box>
                <Typography variant="h6" sx={{ color: currentTheme?.text, mb: 1 }}>
                  Country
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                  Create and manage country-specific rules
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {step === 'selectModel' && (
          <>
            <Divider sx={{ my: 3, borderColor: currentTheme?.border }} />
            <FormControl fullWidth>
              <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                Select Data Model
              </InputLabel>
              <Select
                value=""
                onChange={(e) => handleModelSelect(e.target.value)}
                label="Select Data Model"
                sx={{
                  color: currentTheme?.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '& .MuiSvgIcon-root': {
                    color: currentTheme?.textSecondary
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme?.card,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                      '& .MuiMenuItem-root': {
                        color: currentTheme?.text,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        },
                        '&.Mui-selected': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          '&:hover': {
                            bgcolor: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)'
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: currentTheme?.text }}>
                        {model.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                        {model.shortName}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  // Debug logging
  console.log('RuleBuilderPage render:', { step, ruleType, selectedModel, typeSelectionModalOpen });

  // Show modal for type selection and model selection
  if (step === 'typeSelection' || step === 'selectModel') {
    return renderTypeSelectionModal();
  }

  // Render the appropriate builder component
  if (ruleType === 'model' && selectedModel) {
    return <ModelRuleBuilder selectedModel={selectedModel} onBack={handleBackToModelSelect} />;
  }

  if (ruleType === 'country') {
    console.log('Rendering CountryRuleBuilder');
    try {
      return <CountryRuleBuilder onBack={handleBackToTypeSelection} />;
    } catch (error) {
      console.error('Error rendering CountryRuleBuilder:', error);
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ color: currentTheme?.text, mb: 2 }}>
            Error Loading Country Rule Builder
          </Typography>
          <Typography sx={{ color: currentTheme?.textSecondary, mb: 2 }}>
            {error.message}
          </Typography>
          <Button onClick={handleBackToTypeSelection} variant="contained">
            Go Back
          </Button>
        </Box>
      );
    }
  }

  // Fallback: show type selection modal if nothing else matches
  console.log('No match, showing type selection modal');
  return renderTypeSelectionModal();
};

export default RuleBuilderPage;
