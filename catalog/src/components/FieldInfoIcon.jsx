import React, { useContext } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ThemeContext } from '../contexts/ThemeContext';
import { getFieldDefinition } from '../fieldDefinitions/fieldRegistry';

/**
 * Info (i) icon with tooltip from fieldRegistry. Renders nothing if fieldId is missing or unknown.
 */
const FieldInfoIcon = ({ fieldId, iconSize = 16 }) => {
  const def = getFieldDefinition(fieldId);
  const ctx = useContext(ThemeContext);
  const color = ctx?.currentTheme?.textSecondary ?? 'inherit';

  if (!def?.description) return null;

  return (
    <Tooltip title={def.description} arrow enterTouchDelay={0}>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}>
        <IconButton
          size="small"
          aria-label={def.label ? `About ${def.label}` : `About ${fieldId}`}
          sx={{
            p: 0.125,
            color,
            '&:hover': { color: ctx?.currentTheme?.primary ?? color },
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: iconSize }} />
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default FieldInfoIcon;
