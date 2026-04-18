import { createTheme } from '@mui/material';

/** Monospace stack for code / readme tabs (Toolkit detail matches UUX dh). */
export const fontStackMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace';

/** Sans stack (data models table / dh parity). */
export const fontStackSans = '"Inter", "Helvetica", "Arial", sans-serif';

// Create theme with Inter font
export const theme = createTheme({
  typography: {
    fontFamily: fontStackSans,
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
