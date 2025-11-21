import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import lotusRed from '../imgs/lotus-red.svg';
import lotusWhite from '../imgs/lotus-white.svg';

const Logo = ({ currentTheme }) => (
  <Box 
    component={Link} 
    to="/"
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      textDecoration: 'none',
      '&:hover': {
        opacity: 0.8,
      },
    }}
  >
    <Box
      component="img"
      src={currentTheme.darkMode ? lotusWhite : lotusRed}
      alt="Lotus"
      sx={{
        height: '40px',
        width: 'auto',
      }}
    />
    <Typography 
      variant="h6" 
      sx={{ 
        color: currentTheme.primary, 
        fontWeight: 600,
        letterSpacing: '-0.5px',
      }}
    >
      DH-TEST
    </Typography>
  </Box>
);

export default Logo;
