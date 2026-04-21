import React from 'react';
import { Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Logo = ({ sx, children, ...other }) => {
  return (
    <Box
      component={Link}
      to="/"
      {...other}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: children ? 1 : 0,
          minWidth: 0,
          textDecoration: 'none',
          ...(children ? { width: '100%' } : {}),
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
          flexShrink: 0,
        }}
      />
      {children}
    </Box>
  );
};

export default Logo;
