import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const FilterAccordion = ({
  title,
  expanded,
  onChange,
  children,
  currentTheme,
  defaultExpanded = false,
}) => (
  <Accordion
    expanded={expanded}
    onChange={onChange}
    defaultExpanded={defaultExpanded}
    sx={{
      bgcolor: 'transparent',
      boxShadow: 'none',
      '&:before': { display: 'none' },
      border: `1px solid ${currentTheme.border}`,
      mb: 2,
    }}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
      sx={{
        '& .MuiAccordionSummary-content': {
          margin: '12px 0',
        },
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          color: currentTheme.textPrimary,
          fontWeight: 500,
        }}
      >
        {title}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ p: 1 }}>{children}</Box>
    </AccordionDetails>
  </Accordion>
);

export const FilterCheckbox = ({ label, checked, onChange, currentTheme }) => (
  <FormControlLabel
    control={
      <Checkbox
        checked={checked}
        onChange={onChange}
        sx={{
          color: currentTheme.textSecondary,
          '&.Mui-checked': {
            color: currentTheme.primary,
          },
        }}
      />
    }
    label={
      <Typography
        variant="body2"
        sx={{ color: currentTheme.textSecondary }}
      >
        {label}
      </Typography>
    }
  />
);

export const FilterSlider = ({
  value,
  onChange,
  min,
  max,
  step,
  marks,
  currentTheme,
}) => (
  <Box sx={{ px: 2, py: 1 }}>
    <Slider
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      marks={marks}
      valueLabelDisplay="auto"
      sx={{
        color: currentTheme.primary,
        '& .MuiSlider-thumb': {
          '&:hover, &.Mui-focusVisible': {
            boxShadow: `0px 0px 0px 8px ${currentTheme.primary}20`,
          },
        },
      }}
    />
  </Box>
);

export default FilterAccordion; 