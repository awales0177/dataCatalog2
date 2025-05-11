import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  MobileStepper,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Description as DescriptionIcon,
  Domain as DomainIcon,
  ArrowForward as ArrowForwardIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Apps as AppsIcon,
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../App';
import { useContext } from 'react';
import lotusRed from '../imgs/lotus-red.svg';
import lotusWhite from '../imgs/lotus-white.svg';

const features = [
  {
    icon: StorageIcon,
    title: "Data Models",
    description: "Create, manage, and discover data models with comprehensive schema information and quality metrics.",
    path: "/models"
  },
  {
    icon: DescriptionIcon,
    title: "Data Contracts",
    description: "Define and enforce data contracts to ensure data quality and consistency across your organization.",
    path: "/contracts"
  },
  {
    icon: DomainIcon,
    title: "Data Domains",
    description: "Organize your data into logical domains for better governance and discoverability.",
    path: "/domains"
  },
  {
    icon: AppsIcon,
    title: "Applications",
    description: "Track and manage data applications, their dependencies, and integration points across your ecosystem.",
    path: "/applications"
  },
  {
    icon: MenuBookIcon,
    title: "Lexicon",
    description: "Maintain a comprehensive business glossary and terminology to ensure consistent data understanding.",
    path: "/lexicon"
  },
  {
    icon: LibraryBooksIcon,
    title: "Reference Data",
    description: "Manage and maintain reference data sets to ensure consistency across your data ecosystem.",
    path: "/reference"
  }
];

const FeatureCard = ({ icon: Icon, title, description, currentTheme, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      height: '100%',
      maxWidth: '280px',
      mx: 'auto',
      bgcolor: currentTheme.darkMode ? alpha(currentTheme.card, 0.8) : currentTheme.card,
      border: `1px solid ${currentTheme.border}`,
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease-in-out',
      backdropFilter: 'blur(10px)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 24px ${alpha(currentTheme.primary, 0.15)}`,
        borderColor: currentTheme.primary,
      },
    }}
  >
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1.5,
      mb: 1.5 
    }}>
      <Box sx={{
        p: 1,
        borderRadius: '12px',
        bgcolor: alpha(currentTheme.primary, 0.1),
      }}>
        <Icon sx={{ 
          fontSize: 24, 
          color: currentTheme.primary,
        }} />
      </Box>
      <Typography variant="h6" sx={{ 
        color: currentTheme.text,
        fontWeight: 600,
        fontSize: '1.1rem',
      }}>
        {title}
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ 
      color: currentTheme.textSecondary,
      lineHeight: 1.5,
      fontSize: '0.9rem',
    }}>
      {description}
    </Typography>
  </Paper>
);

const SplashPage = () => {
  const navigate = useNavigate();
  const { currentTheme, darkMode, setDarkMode } = useContext(ThemeContext);
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const maxSteps = Math.ceil(features.length / 3);

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      background: darkMode ? '#1a1a1a' : '#ffffff',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto',
    }}>
      {/* Theme Toggle Button */}
      <Box sx={{ 
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 2,
        display: 'flex',
        gap: 1,
      }}>
        <Tooltip title="View on GitHub">
          <IconButton 
            onClick={() => window.open('https://github.com', '_blank')}
            sx={{ 
              color: darkMode ? '#ffffff' : '#000000',
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <GitHubIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <IconButton 
            onClick={handleThemeToggle} 
            sx={{ 
              color: darkMode ? '#ffffff' : '#000000',
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ 
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: { xs: 'flex-start', md: 'center' },
        alignItems: 'center',
        width: '100%',
        px: 2,
        py: { xs: 2, md: 4 },
      }}>
        {/* Hero Section */}
        <Box sx={{ 
          textAlign: 'center',
          mb: { xs: 4, md: 8 },
          width: '100%',
          maxWidth: '800px',
          mt: { xs: 6, md: 0 },
        }}>
          <Box
            component="img"
            src={darkMode ? lotusWhite : lotusRed}
            alt="Lotus"
            sx={{
              height: { xs: '100px', sm: '150px', md: '200px' },
              width: 'auto',
              mb: 0,
            }}
          />
          <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
            Welcome to Data Catalog
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
            Your central hub for discovering, understanding, and managing data assets across your organization. Get started by exploring data models, contracts, and applications.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => window.location.href = 'https://accounts.google.com/signup'}
            sx={{
              bgcolor: currentTheme.primary,
              color: '#ffffff',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.9),
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Register
          </Button>
        </Box>

        {/* Features Carousel */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '1200px',
          position: 'relative',
        }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            mb: 4,
          }}>
            <IconButton
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ 
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: alpha(currentTheme.primary, 0.1),
                },
              }}
            >
              <KeyboardArrowLeft sx={{ fontSize: 32 }} />
            </IconButton>

            <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
              {features.slice(activeStep * 3, (activeStep + 1) * 3).map((feature, index) => (
                <Grid item xs={12} md={4} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    currentTheme={currentTheme}
                    onClick={() => navigate(feature.path)}
                  />
                </Grid>
              ))}
            </Grid>

            <IconButton
              onClick={handleNext}
              disabled={activeStep === maxSteps - 1}
              sx={{ 
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: alpha(currentTheme.primary, 0.1),
                },
              }}
            >
              <KeyboardArrowRight sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <MobileStepper
              steps={maxSteps}
              position="static"
              activeStep={activeStep}
              sx={{
                bgcolor: 'transparent',
                maxWidth: '200px',
                '& .MuiMobileStepper-dot': {
                  bgcolor: currentTheme.textSecondary,
                  opacity: 0.3,
                  width: 8,
                  height: 8,
                  margin: '0 4px',
                },
                '& .MuiMobileStepper-dotActive': {
                  bgcolor: currentTheme.primary,
                  opacity: 1,
                },
              }}
              nextButton={null}
              backButton={null}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SplashPage; 