import { createTheme } from '@mui/material';

// Create theme with Inter font
export const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
});

// Add Google Fonts import
export const addGoogleFonts = () => {
  const fontStyle = document.createElement('style');
  fontStyle.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Courgette&display=swap');
  `;
  document.head.appendChild(fontStyle);
};
