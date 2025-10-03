import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  alpha,
} from '@mui/material';

const ModelSelector = ({ 
  selectedModel, 
  onModelChange, 
  currentTheme,
  label = 'Model Short Name',
  models = [],
  isRequired = false,
  loading = false
}) => {
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel sx={{ color: currentTheme.textSecondary }}>
        {label}
        {isRequired && (
          <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
            *
          </Typography>
        )}
      </InputLabel>
      <Select
        value={selectedModel || ''}
        onChange={(e) => onModelChange(e.target.value)}
        label={label}
        disabled={loading}
        sx={{
          color: currentTheme.text,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
          '& .MuiSelect-icon': { color: currentTheme.textSecondary }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: currentTheme.card,
              color: currentTheme.text,
              border: `1px solid ${currentTheme.border}`,
              '& .MuiMenuItem-root': {
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.text,
                },
                '&.Mui-selected': {
                  bgcolor: alpha(currentTheme.primary, 0.2),
                  color: currentTheme.text,
                  '&:hover': {
                    bgcolor: alpha(currentTheme.primary, 0.3),
                  },
                },
              },
            },
          },
        }}
      >
        <MenuItem value="">
          <Typography sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
            {loading ? 'Loading models...' : 'No model selected'}
          </Typography>
        </MenuItem>
        {models.length === 0 && !loading ? (
          <MenuItem disabled>
            <Typography sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
              No models available
            </Typography>
          </MenuItem>
        ) : (
          models.map((model) => (
          <MenuItem key={model.shortName} value={model.shortName}>
            <Box>
              <Typography sx={{ color: currentTheme.text, fontWeight: 500 }}>
                {model.shortName}
              </Typography>
              <Typography sx={{ color: currentTheme.textSecondary, fontSize: '0.875rem' }}>
                {model.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Typography
                  sx={{
                    bgcolor: model.meta?.tier === 'gold' ? alpha('#ffd700', 0.2) : 
                             model.meta?.tier === 'silver' ? alpha('#c0c0c0', 0.2) : 
                             alpha('#cd7f32', 0.2),
                    color: model.meta?.tier === 'gold' ? '#ffd700' : 
                           model.meta?.tier === 'silver' ? '#c0c0c0' : '#cd7f32',
                    fontSize: '0.7rem',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    textTransform: 'capitalize'
                  }}
                >
                  {model.meta?.tier || 'bronze'}
                </Typography>
                {model.meta?.verified && (
                  <Typography
                    sx={{
                      bgcolor: alpha('#4caf50', 0.2),
                      color: '#4caf50',
                      fontSize: '0.7rem',
                      px: 1,
                      py: 0.25,
                      borderRadius: 1
                    }}
                  >
                    Verified
                  </Typography>
                )}
                <Typography
                  sx={{
                    color: currentTheme.textSecondary,
                    fontSize: '0.7rem',
                    px: 1,
                    py: 0.25
                  }}
                >
                  v{model.version || '1.0.0'}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default ModelSelector;
