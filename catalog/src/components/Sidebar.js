import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  alpha,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Storage as StorageIcon,
  Description as DescriptionIcon,
  Domain as DomainIcon,
  Apps as AppsIcon,
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
} from '@mui/icons-material';
import { menuItems } from '../data/menuItems';

// Map of icon names to components
const iconMap = {
  StorageIcon: StorageIcon,
  DescriptionIcon: DescriptionIcon,
  DomainIcon: DomainIcon,
  AppsIcon: AppsIcon,
  MenuBookIcon: MenuBookIcon,
  LibraryBooksIcon: LibraryBooksIcon,
};

// Sidebar component for navigation and search
const Sidebar = ({ currentTheme, onSearch, domains = [], selectedDomain, onDomainSelect }) => {
  return (
    <Box sx={{ height: '100%', bgcolor: currentTheme.card }}>
      <Box sx={{ p: 2, bgcolor: currentTheme.background }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            mb: 2,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: currentTheme.primary,
            '&:hover': {
              bgcolor: currentTheme.primaryHover,
            },
          }}
        >
          New Data Model
        </Button>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search..."
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
              '&:hover fieldset': {
                borderColor: currentTheme.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: currentTheme.primary,
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
      </Box>

      <Divider sx={{ borderColor: currentTheme.border }} />

      <List sx={{ p: 2 }}>
        {menuItems.items.map((item) => (
          <ListItem
            key={item.id}
            button
            sx={{
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.1),
              },
            }}
          >
            <ListItemIcon sx={{ color: currentTheme.textSecondary }}>
              {React.createElement(iconMap[item.icon])}
            </ListItemIcon>
            <ListItemText 
              primary={item.name} 
              sx={{ 
                '& .MuiTypography-root': { 
                  color: currentTheme.text,
                  fontWeight: 500,
                } 
              }} 
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: currentTheme.border }} />

      <Box sx={{ p: 2 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: currentTheme.textSecondary,
            mb: 2,
            fontWeight: 600,
          }}
        >
          Domains
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All"
            onClick={() => onDomainSelect(null)}
            sx={{
              backgroundColor: !selectedDomain ? currentTheme.primary : currentTheme.background,
              color: !selectedDomain ? currentTheme.background : currentTheme.text,
              '&:hover': {
                backgroundColor: !selectedDomain ? currentTheme.primaryDark : currentTheme.background,
              }
            }}
          />
          {domains.map((domain) => (
            <Chip
              key={domain}
              label={domain}
              onClick={() => onDomainSelect(domain)}
              sx={{
                backgroundColor: selectedDomain === domain ? currentTheme.primary : currentTheme.background,
                color: selectedDomain === domain ? currentTheme.background : currentTheme.text,
                '&:hover': {
                  backgroundColor: selectedDomain === domain ? currentTheme.primaryDark : currentTheme.background,
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar; 