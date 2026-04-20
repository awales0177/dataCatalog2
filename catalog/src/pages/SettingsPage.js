import React, { useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Switch,
  Stack,
} from '@mui/material';
import {
  ViewModule as GridViewIcon,
  TableRows as TableViewIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCatalogPreferences } from '../contexts/CatalogPreferencesContext';
import packageJson from '../../package.json';

const SettingsPage = () => {
  const { currentTheme, darkMode, toggleColorMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const { listViewMode, setListViewMode } = useCatalogPreferences();

  const accountLabel =
    user?.email || user?.username || user?.full_name || 'Signed in';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
          Settings
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: currentTheme.textSecondary, maxWidth: 560, mx: 'auto' }}
        >
          Preferences and shortcuts for this catalog. You can change appearance here or from the header.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <List disablePadding>
          <ListItem sx={{ px: 3, py: 2.5, flexDirection: 'column', alignItems: 'stretch', gap: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
                Appearance
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, lineHeight: 1.5, mt: 0.5 }}>
                Choose light or dark theme for the catalog. The same setting applies if you use the sun or moon in
                the header.
              </Typography>
            </Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{
                py: 0.5,
                px: 1.5,
                borderRadius: 2,
                border: `1px solid ${currentTheme.border}`,
                bgcolor: currentTheme.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                maxWidth: 400,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ color: currentTheme.text, minWidth: 0 }}>
                <LightModeIcon
                  sx={{
                    fontSize: 22,
                    color: darkMode ? currentTheme.textSecondary : currentTheme.primary,
                    opacity: darkMode ? 0.7 : 1,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: darkMode ? 400 : 600, color: currentTheme.text }}>
                  Light
                </Typography>
              </Stack>
              <Switch
                checked={Boolean(darkMode)}
                onChange={() => toggleColorMode?.()}
                inputProps={{ 'aria-label': 'Toggle dark mode' }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: currentTheme.primary },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: `${currentTheme.primary}99`,
                  },
                }}
              />
              <Stack direction="row" alignItems="center" spacing={1} sx={{ color: currentTheme.text, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: darkMode ? 600 : 400, color: currentTheme.text }}>
                  Dark
                </Typography>
                <DarkModeIcon
                  sx={{
                    fontSize: 22,
                    color: darkMode ? currentTheme.primary : currentTheme.textSecondary,
                    opacity: darkMode ? 1 : 0.7,
                  }}
                />
              </Stack>
            </Stack>
          </ListItem>
          <Divider sx={{ borderColor: currentTheme.border }} />
          <ListItem sx={{ px: 3, py: 2.5, flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 0.5 }}>
                Preferences
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, lineHeight: 1.5, maxWidth: 520 }}>
                Default layout for catalog lists that support both views (e.g. Data Models and Reference Data).
                You can still change the layout from those pages; this sets the default everywhere.
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={listViewMode}
              exclusive
              onChange={(_, v) => {
                if (v) setListViewMode(v);
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: currentTheme.textSecondary,
                  borderColor: currentTheme.border,
                  px: 1.5,
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 600,
                },
                '& .Mui-selected': {
                  bgcolor: `${currentTheme.primary}22`,
                  color: currentTheme.primary,
                  borderColor: `${currentTheme.primary}55 !important`,
                },
              }}
            >
              <ToggleButton value="grid" aria-label="Cards">
                <Tooltip title="Card grid">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GridViewIcon fontSize="small" />
                    Cards
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table" aria-label="Table">
                <Tooltip title="Table">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TableViewIcon fontSize="small" />
                    Table
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </ListItem>
          <Divider sx={{ borderColor: currentTheme.border }} />
          <ListItem sx={{ px: 3, py: 2.5, flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
              Account
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.text }}>
              {accountLabel}
            </Typography>
          </ListItem>
          <Divider sx={{ borderColor: currentTheme.border }} />
          <ListItem sx={{ px: 3, py: 2.5 }}>
            <ListItemText
              primary="App version"
              secondary={packageJson.version}
              primaryTypographyProps={{
                variant: 'subtitle2',
                sx: { color: currentTheme.textSecondary },
              }}
              secondaryTypographyProps={{
                variant: 'body2',
                sx: { color: currentTheme.text, fontWeight: 500 },
              }}
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
