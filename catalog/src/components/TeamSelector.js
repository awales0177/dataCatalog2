import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { fetchData } from '../services/api';

const TeamSelector = ({ 
  selectedTeams = [], 
  onTeamsChange, 
  currentTheme,
  label = 'Teams',
  showLabel = true,
  maxSelections = null,
  placeholder = 'No teams selected'
}) => {
  const [teamsData, setTeamsData] = useState([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [availableOptions, setAvailableOptions] = useState([]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetchData('applications');
        setTeamsData(response.applications || []);
      } catch (error) {
        // Handle error silently or show user notification
      }
    };

    loadTeams();
  }, []);

  const handleTeamChange = (index, newValue) => {
    const newTeams = [...selectedTeams];
    newTeams[index] = newValue;
    onTeamsChange(newTeams);
  };

  const handleDeleteTeam = (indexToDelete) => {
    const newTeams = selectedTeams.filter((_, index) => index !== indexToDelete);
    onTeamsChange(newTeams);
  };

  const addTeam = () => {
    // Check max selections limit
    if (maxSelections && selectedTeams.length >= maxSelections) {
      return;
    }
    
    handleAddTeam();
  };

  const handleAddTeam = () => {
    // Get available team options (filter out already selected ones)
    const currentTeams = selectedTeams || [];
    const availableOptions = teamsData
      .filter(team => !currentTeams.includes(team.name))
      .map(team => ({
        value: team.name,
        label: team.name,
        description: team.description || team.shortDescription || ''
      }));

    if (availableOptions.length === 0) {
      return;
    }

    setAvailableOptions(availableOptions);
    setShowSelectionDialog(true);
  };

  const handleTeamSelection = (selectedTeam) => {
    if (!selectedTeam) return;
    
    // Find the first empty team slot or add a new one
    const emptyIndex = selectedTeams.findIndex(team => team === '');
    if (emptyIndex !== -1) {
      const newTeams = [...selectedTeams];
      newTeams[emptyIndex] = selectedTeam;
      onTeamsChange(newTeams);
    } else if (!maxSelections || selectedTeams.length < maxSelections) {
      const newTeams = [...selectedTeams, selectedTeam];
      onTeamsChange(newTeams);
    }
    
    setShowSelectionDialog(false);
    setAvailableOptions([]);
  };

  const canAddMore = !maxSelections || selectedTeams.length < maxSelections;

  return (
    <Box sx={{ mb: 2 }}>
      {showLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ 
            color: currentTheme.text, 
            fontWeight: 600
          }}>
            {label}
          </Typography>
          {canAddMore && (
            <IconButton
              size="small"
              onClick={addTeam}
              sx={{
                color: currentTheme.primary,
                '&:hover': {
                  bgcolor: currentTheme.primary,
                  color: 'white'
                }
              }}
              title="Add team"
            >
              <AddIcon />
            </IconButton>
          )}
        </Box>
      )}

      {/* Existing teams */}
      {selectedTeams && selectedTeams.length > 0 ? (
        (selectedTeams || []).map((team, index) => (
        <Box key={index} sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 1.5
        }}>
          <TextField
            size="small"
            label={maxSelections === 1 ? label : `Team ${index + 1}`}
            value={team}
            sx={{ 
              flex: 1,
              '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
              '& .MuiOutlinedInput-root': { 
                color: currentTheme.text,
                '& fieldset': { borderColor: currentTheme.border },
                '&:hover fieldset': { borderColor: currentTheme.primary },
                '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
              },
              '& .MuiInputBase-input': { color: currentTheme.text },
              '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
            }}
            placeholder="Selected team"
            InputProps={{
              readOnly: true,
            }}
          />
          <IconButton
            size="small"
            onClick={() => handleDeleteTeam(index)}
            sx={{ 
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white'
              }
            }}
            title="Delete team"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))
      ) : (
        <Typography variant="body2" sx={{ 
          color: currentTheme.textSecondary, 
          fontStyle: 'italic',
          mb: 2
        }}>
          No {label.toLowerCase()} selected
        </Typography>
      )}


      {/* Team Selection Dialog */}
      <Dialog
        open={showSelectionDialog}
        onClose={() => setShowSelectionDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupsIcon />
          Select Team
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
              ℹ️ <strong>Note:</strong> Selected teams will be read-only and cannot be manually edited. Use the delete button to remove teams if needed.
            </Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Choose from available teams:
          </Typography>
          
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {availableOptions.map((option, index) => (
              <Button
                key={index}
                fullWidth
                variant="outlined"
                onClick={() => handleTeamSelection(option.value)}
                sx={{
                  mb: 1,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: currentTheme.primary,
                    color: 'white',
                    borderColor: currentTheme.primary,
                  }
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {option.label}
                </Typography>
                {option.description && (
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                    {option.description}
                  </Typography>
                )}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSelectionDialog(false)} 
            sx={{ color: currentTheme.text }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamSelector;
