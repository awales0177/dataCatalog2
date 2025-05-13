import { useContext, useMemo } from 'react';
import { createTheme, alpha } from '@mui/material/styles';
import { ThemeContext } from '../App';

export const useTheme = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const theme = useMemo(() => {
    const primaryColor = '#1976d2';
    const textPrimary = darkMode ? '#ffffff' : '#1a1a1a';
    const textSecondary = darkMode ? '#b0b0b0' : '#666666';
    const background = darkMode ? '#121212' : '#ffffff';
    const border = darkMode ? '#333333' : '#e0e0e0';

    return {
      darkMode,
      primary: primaryColor,
      textPrimary,
      textSecondary,
      background,
      border,
      cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
      hoverBackground: darkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.05),
    };
  }, [darkMode]);

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: theme.primary,
        },
        background: {
          default: theme.background,
          paper: theme.cardBackground,
        },
      },
      typography: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 500 },
        button: { 
          fontWeight: 500,
          textTransform: 'none',
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: theme.background,
              color: theme.textPrimary,
            },
          },
        },
      },
    });
  }, [darkMode, theme]);

  return {
    theme,
    muiTheme,
    toggleTheme,
  };
};

export default useTheme; 