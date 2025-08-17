import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

const ChangelogEditor = ({ 
  value = [], 
  onChange, 
  label = "Changelog",
  currentTheme 
}) => {
  const handleAddChangelogItem = () => {
    const newItem = {
      version: '',
      date: new Date().toISOString(),
      changes: ['']
    };
    
    const newChangelog = [...(value || []), newItem];
    onChange(newChangelog);
  };

  const handleDeleteChangelogItem = (indexToDelete) => {
    const newChangelog = (value || []).filter((_, index) => index !== indexToDelete);
    onChange(newChangelog);
  };

  const handleVersionChange = (changelogIndex, newVersion) => {
    const newChangelog = [...(value || [])];
    if (newChangelog[changelogIndex]) {
      newChangelog[changelogIndex] = {
        ...newChangelog[changelogIndex],
        version: newVersion
      };
      onChange(newChangelog);
    }
  };

  const handleDateChange = (changelogIndex, newDate) => {
    const newChangelog = [...(value || [])];
    if (newChangelog[changelogIndex]) {
      newChangelog[changelogIndex] = {
        ...newChangelog[changelogIndex],
        date: newDate + 'T00:00:00Z'
      };
      onChange(newChangelog);
    }
  };

  const handleChangeChange = (changelogIndex, changeIndex, newChange) => {
    const newChangelog = [...(value || [])];
    if (newChangelog[changelogIndex] && newChangelog[changelogIndex].changes) {
      newChangelog[changelogIndex] = {
        ...newChangelog[changelogIndex],
        changes: [...newChangelog[changelogIndex].changes]
      };
      newChangelog[changelogIndex].changes[changeIndex] = newChange;
      onChange(newChangelog);
    }
  };

  const addChange = (changelogIndex) => {
    const newChangelog = [...(value || [])];
    if (newChangelog[changelogIndex]) {
      if (!newChangelog[changelogIndex].changes) {
        newChangelog[changelogIndex].changes = [];
      }
      newChangelog[changelogIndex] = {
        ...newChangelog[changelogIndex],
        changes: [...newChangelog[changelogIndex].changes, '']
      };
      onChange(newChangelog);
    }
  };

  const deleteChange = (changelogIndex, changeIndex) => {
    const newChangelog = [...(value || [])];
    if (newChangelog[changelogIndex] && newChangelog[changelogIndex].changes) {
      newChangelog[changelogIndex] = {
        ...newChangelog[changelogIndex],
        changes: newChangelog[changelogIndex].changes.filter((_, index) => index !== changeIndex)
      };
      onChange(newChangelog);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ 
        color: currentTheme.text, 
        mb: 2,
        fontWeight: 600,
        borderBottom: `2px solid ${currentTheme.primary}`,
        pb: 1,
        display: 'inline-block'
      }}>
        {label}
      </Typography>
      {(value || []).map((change, index) => (
        <Accordion key={index} sx={{ 
          mb: 2, 
          bgcolor: 'transparent', 
          boxShadow: 'none',
          '& .MuiAccordionSummary-root': {
            bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 1,
            '&:hover': {
              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
            }
          },
          '& .MuiAccordionDetails-root': {
            bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
            borderRadius: '0 0 4px 4px'
          }
        }}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
            sx={{
              '& .MuiAccordionSummary-content': {
                '&.Mui-expanded': {
                  minHeight: '48px'
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.primary, fontWeight: 600 }}>
                v{change.version}
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                {change.date}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 2, pr: 2, pb: 1 }}>
              <TextField
                fullWidth
                label="Version"
                value={change.version || ''}
                onChange={(e) => handleVersionChange(index, e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border },
                    '&:hover fieldset': { borderColor: currentTheme.primary },
                    '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                  },
                  '& .MuiInputBase-input': { color: currentTheme.text },
                  '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
                }}
                placeholder="e.g., 1.0.0"
              />
              
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={change.date ? change.date.split('T')[0] : ''}
                onChange={(e) => handleDateChange(index, e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  mb: 2,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border },
                    '&:hover fieldset': { borderColor: currentTheme.primary },
                    '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                  },
                  '& .MuiInputBase-input': { color: currentTheme.text },
                  '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
                }}
              />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    Changes
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => addChange(index)}
                    sx={{ 
                      color: currentTheme.primary,
                      '&:hover': {
                        bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                
                {(change.changes || []).map((changeItem, changeIndex) => (
                  <Box key={changeIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      value={changeItem}
                      onChange={(e) => handleChangeChange(index, changeIndex, e.target.value)}
                      sx={{ 
                        flex: 1,
                        '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                        '& .MuiOutlinedInput-root': { 
                          color: currentTheme.text,
                          '& fieldset': { borderColor: currentTheme.border },
                          '&:hover fieldset': { borderColor: currentTheme.primary },
                          '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                        },
                        '& .MuiInputBase-input': { color: currentTheme.text },
                        '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
                      }}
                      placeholder="Enter change description"
                    />
                    <IconButton
                      size="small"
                      onClick={() => deleteChange(index, changeIndex)}
                      sx={{ 
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              
              {/* Delete Changelog Entry Button */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleDeleteChangelogItem(index)}
                  startIcon={<DeleteIcon />}
                  sx={{ 
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.main',
                      color: 'white',
                    },
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  Delete Entry
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
      <Button
        variant="outlined"
        onClick={handleAddChangelogItem}
        startIcon={<AddIcon />}
        sx={{ 
          mt: 1, 
          color: currentTheme.primary, 
          borderColor: currentTheme.primary,
          '&:hover': {
            bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderColor: currentTheme.primary
          }
        }}
      >
        Add Changelog Entry
      </Button>
    </Box>
  );
};

export default ChangelogEditor;
