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
    title: "Data Specifications",
    description: "Create, manage, and discover data specifications with comprehensive schema information and quality metrics.",
    path: "/specifications"
  },
  {
    icon: DescriptionIcon,
    title: "Product Agreements",
    description: "Define and enforce product agreements to ensure data quality and consistency across your organization.",
    path: "/agreements"
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

const WaveAnimation = ({ darkMode }) => (
  <Box
    sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '200px',
      overflow: 'hidden',
      zIndex: 0,
      width: '100%',
    }}
  >
    <svg
      viewBox="0 0 7000 320"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        bottom: 0,
        width: '200%',
        height: '100%',
      }}
    >
      <g style={{ animation: 'flow 20s linear infinite' }}>
        <path
          fill={darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}
          d="M0,224L96,229.3C192,235,384,245,576,245.3C768,245,960,235,1152,224C1344,213,1536,203,1728,208C1920,213,2112,235,2304,240C2496,245,2688,235,2880,224C3072,213,3264,203,3456,208C3648,213,3840,235,4032,240C4224,245,4416,235,4608,224C4800,213,4992,203,5184,208C5376,213,5568,235,5760,240C5952,245,6144,235,6336,224C6528,213,6720,203,6840,198.7L6960,192L6960,320L6840,320C6720,320,6528,320,6336,320C6144,320,5952,320,5760,320C5568,320,5376,320,5184,320C4992,320,4800,320,4608,320C4416,320,4224,320,4032,320C3840,320,3648,320,3456,320C3264,320,3072,320,2880,320C2688,320,2496,320,2304,320C2112,320,1920,320,1728,320C1536,320,1344,320,1152,320C960,320,768,320,576,320C384,320,192,320,96,320L0,320Z"
        />
        <path
          fill={darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}
          d="M0,224L96,229.3C192,235,384,245,576,245.3C768,245,960,235,1152,224C1344,213,1536,203,1728,208C1920,213,2112,235,2304,240C2496,245,2688,235,2880,224C3072,213,3264,203,3456,208C3648,213,3840,235,4032,240C4224,245,4416,235,4608,224C4800,213,4992,203,5184,208C5376,213,5568,235,5760,240C5952,245,6144,235,6336,224C6528,213,6720,203,6840,198.7L6960,192L6960,320L6840,320C6720,320,6528,320,6336,320C6144,320,5952,320,5760,320C5568,320,5376,320,5184,320C4992,320,4800,320,4608,320C4416,320,4224,320,4032,320C3840,320,3648,320,3456,320C3264,320,3072,320,2880,320C2688,320,2496,320,2304,320C2112,320,1920,320,1728,320C1536,320,1344,320,1152,320C960,320,768,320,576,320C384,320,192,320,96,320L0,320Z"
          transform="translate(7000, 0)"
        />
      </g>
      <g style={{ animation: 'flow 25s linear infinite', animationDelay: '-5s' }}>
        <path
          fill={darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'}
          d="M0,256L96,261.3C192,267,384,277,576,277.3C768,277,960,267,1152,261.3C1344,256,1536,256,1728,266.7C1920,277,2112,299,2304,293.3C2496,288,2688,256,2880,240C3072,224,3264,224,3456,234.7C3648,245,3840,267,4032,261.3C4224,256,4416,224,4608,213.3C4800,203,4992,213,5184,234.7C5376,256,5568,288,5760,293.3C5952,299,6144,277,6336,261.3C6528,245,6720,235,6840,230.7L6960,224L6960,320L6840,320C6720,320,6528,320,6336,320C6144,320,5952,320,5760,320C5568,320,5376,320,5184,320C4992,320,4800,320,4608,320C4416,320,4224,320,4032,320C3840,320,3648,320,3456,320C3264,320,3072,320,2880,320C2688,320,2496,320,2304,320C2112,320,1920,320,1728,320C1536,320,1344,320,1152,320C960,320,768,320,576,320C384,320,192,320,96,320L0,320Z"
        />
        <path
          fill={darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'}
          d="M0,256L96,261.3C192,267,384,277,576,277.3C768,277,960,267,1152,261.3C1344,256,1536,256,1728,266.7C1920,277,2112,299,2304,293.3C2496,288,2688,256,2880,240C3072,224,3264,224,3456,234.7C3648,245,3840,267,4032,261.3C4224,256,4416,224,4608,213.3C4800,203,4992,213,5184,234.7C5376,256,5568,288,5760,293.3C5952,299,6144,277,6336,261.3C6528,245,6720,235,6840,230.7L6960,224L6960,320L6840,320C6720,320,6528,320,6336,320C6144,320,5952,320,5760,320C5568,320,5376,320,5184,320C4992,320,4800,320,4608,320C4416,320,4224,320,4032,320C3840,320,3648,320,3456,320C3264,320,3072,320,2880,320C2688,320,2496,320,2304,320C2112,320,1920,320,1728,320C1536,320,1344,320,1152,320C960,320,768,320,576,320C384,320,192,320,96,320L0,320Z"
          transform="translate(7000, 0)"
        />
      </g>
      <style>
        {`
          @keyframes flow {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}
      </style>
    </svg>
  </Box>
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
      <WaveAnimation darkMode={darkMode} />
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
          mb: { xs: 2, md: 4 },
          width: '100%',
          maxWidth: '800px',
          mt: { xs: 6, md: 0 },
          position: 'relative',
        }}>
          <Box
            component="img"
            src={darkMode ? lotusWhite : lotusRed}
            alt="Lotus"
            sx={{
              height: { xs: '100px', sm: '150px', md: '200px' },
              width: 'auto',
              mb: 0,
              position: 'relative',
              zIndex: 2,
              filter: darkMode ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))' : 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.2))'
            }}
          />
          <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
            Welcome to Data Catalog
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
            Your central hub for discovering, understanding, and managing data assets across your organization. Get started by exploring data models, contracts, and applications.
          </Typography>
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

        {/* Powered By Section */}
        <Box sx={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          zIndex: 2,
        }}>
          <Typography variant="body2" sx={{ 
            color: currentTheme.textSecondary,
            opacity: 0.7,
            fontSize: '0.875rem',
          }}>
            Powered by
          </Typography>
          <Box
            component="img"
            src={darkMode ? lotusWhite : lotusRed}
            alt="Lotus"
            sx={{
              height: '32px',
              width: 'auto',
              opacity: 0.7,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': {
                opacity: 1,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SplashPage; 