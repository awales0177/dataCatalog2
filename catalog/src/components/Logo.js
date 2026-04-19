import React from 'react';
import { Box } from '@mui/material';
import { Link } from 'react-router-dom';

/** Lotus mark only (`public/lotus.svg`). */
const Logo = ({ currentTheme: _currentTheme, sx, ...other }) => (
  <Box
    component={Link}
    to="/"
    {...other}
    sx={[
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        '&:hover': {
          opacity: 0.85,
        },
      },
      ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
    ]}
  >
    <Box
      component="img"
      src="/lotus.svg"
      alt=""
      sx={{
        height: '40px',
        width: 'auto',
        display: 'block',
      }}
    />
  </Box>
);

export default Logo;
