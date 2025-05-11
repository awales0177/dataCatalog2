import React from 'react';
import { Pagination as MuiPagination, Box, alpha } from '@mui/material';

const Pagination = ({ count, page, onChange, currentTheme }) => {
  const hasEnoughItems = count > 1;

  return (
    <Box sx={{ 
      opacity: hasEnoughItems ? 1 : 0.5,
      pointerEvents: hasEnoughItems ? 'auto' : 'none',
      transition: 'opacity 0.2s ease-in-out'
    }}>
      <MuiPagination
        count={count}
        page={page}
        onChange={onChange}
        color="primary"
        size="large"
        sx={{
          '& .MuiPaginationItem-root': {
            color: currentTheme.text,
            '&.Mui-selected': {
              backgroundColor: currentTheme.primary,
              color: currentTheme.background,
              '&:hover': {
                backgroundColor: currentTheme.primaryDark,
              },
            },
            '&:hover': {
              backgroundColor: alpha(currentTheme.primary, 0.1),
            },
          },
          '& .MuiPaginationItem-ellipsis': {
            color: currentTheme.textSecondary,
          },
        }}
      />
    </Box>
  );
};

export default Pagination; 