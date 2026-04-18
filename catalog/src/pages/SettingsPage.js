import React, { useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import { ViewModule as GridViewIcon, TableRows as TableViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCatalogPreferences } from '../contexts/CatalogPreferencesContext';
import packageJson from '../../package.json';

const SettingsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { user, currentRole } = useAuth();
  const { listViewMode, setListViewMode } = useCatalogPreferences();
  const navigate = useNavigate();

  const accountLabel =
    user?.email || user?.username || user?.full_name || 'Signed in';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary, maxWidth: 560 }}>
        Preferences and shortcuts for this catalog. Theme controls live in the top app bar.
      </Typography>

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
          <ListItem sx={{ px: 3, py: 2.5, flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
            <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary }}>
              Appearance
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, lineHeight: 1.5 }}>
              Switch light or dark mode with the sun or moon button in the header.
            </Typography>
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
              {currentRole ? (
                <Box component="span" sx={{ color: currentTheme.textSecondary, ml: 1 }}>
                  (role: {currentRole})
                </Box>
              ) : null}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                navigate('/role', {
                  state: { changeRole: true, from: { pathname: window.location.pathname } },
                })
              }
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Change role
            </Button>
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
