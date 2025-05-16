import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountBalance as TaxIcon,
  DirectionsCar as VehicleIcon,
  Business as BusinessIcon,
  School as EducationIcon,
  LocalHospital as HealthcareIcon,
  AccountBalance as FinanceIcon,
  LocalShipping as TransportIcon,
  Power as UtilitiesIcon,
  Security as SafetyIcon,
  Nature as EnvironmentIcon,
  Home as HousingIcon,
  VolunteerActivism as SocialIcon,
  Park as RecreationIcon,
  Museum as CulturalIcon,
  Computer as TechnologyIcon,
  Agriculture as AgricultureIcon,
  BeachAccess as TourismIcon,
  Construction as InfrastructureIcon,
  Gavel as LegalIcon,
  Architecture as PlanningIcon,
  Campaign as CommunicationsIcon,
  Apartment as PropertyIcon,
} from '@mui/icons-material';

const DomainCard = ({ domain, onClick, currentTheme }) => {
  const getDomainIcon = (domainName) => {
    const name = domainName.toLowerCase();
    if (name.includes('customer')) return <PeopleIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('tax')) return <TaxIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('vehicle')) return <VehicleIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('property')) return <PropertyIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('business')) return <BusinessIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('education')) return <EducationIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('healthcare')) return <HealthcareIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('finance')) return <FinanceIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('transportation')) return <TransportIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('utilities')) return <UtilitiesIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('safety')) return <SafetyIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('environment')) return <EnvironmentIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('housing')) return <HousingIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('social')) return <SocialIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('recreation')) return <RecreationIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('cultural')) return <CulturalIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('technology')) return <TechnologyIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('agriculture')) return <AgricultureIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('tourism')) return <TourismIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('infrastructure')) return <InfrastructureIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('legal')) return <LegalIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('planning')) return <PlanningIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    if (name.includes('communications')) return <CommunicationsIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
    return <BusinessIcon sx={{ color: currentTheme.text, fontSize: 24 }} />;
  };

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: '100%',
        height: '110px',
        p: 0.75,
        cursor: 'pointer',
        bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
        border: `1px solid ${currentTheme.darkMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border}`,
        borderRadius: '8px',
        transition: 'all 0.15s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderColor: currentTheme.primary,
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 0.75,
        height: '100%'
      }}>
        {getDomainIcon(domain.name)}
        <Typography variant="subtitle1" sx={{ color: currentTheme.text, textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>
          {domain.name}
        </Typography>
      </Box>
    </Paper>
  );
};

export default DomainCard; 