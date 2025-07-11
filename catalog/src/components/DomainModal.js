import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import { formatDate } from '../utils/dateUtils';
import {
  Close as CloseIcon,
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

const DomainModal = ({ domain, open, onClose, currentTheme }) => {
  if (!domain) return null;

  const getDomainIcon = (domainName) => {
    const name = domainName.toLowerCase();
    if (name.includes('customer')) return <PeopleIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('tax')) return <TaxIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('vehicle')) return <VehicleIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('property')) return <PropertyIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('business')) return <BusinessIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('education')) return <EducationIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('healthcare')) return <HealthcareIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('finance')) return <FinanceIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('transportation')) return <TransportIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('utilities')) return <UtilitiesIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('safety')) return <SafetyIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('environment')) return <EnvironmentIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('housing')) return <HousingIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('social')) return <SocialIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('recreation')) return <RecreationIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('cultural')) return <CulturalIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('technology')) return <TechnologyIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('agriculture')) return <AgricultureIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('tourism')) return <TourismIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('infrastructure')) return <InfrastructureIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('legal')) return <LegalIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('planning')) return <PlanningIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    if (name.includes('communications')) return <CommunicationsIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    return <BusinessIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
          borderRadius: '12px',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: currentTheme.text,
        borderBottom: `1px solid ${currentTheme.border}`,
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getDomainIcon(domain.name)}
          <Box>
            <Typography variant="h5">{domain.name}</Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              {domain.description}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: currentTheme.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 1 }}>
            Details
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              Owner: {domain.owner}
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              Last Updated: {formatDate(domain.lastUpdated)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 1 }}>
            Subdomains
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {domain.subdomains?.map((subdomain) => (
              <Box 
                key={subdomain.id}
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  border: `1px solid ${currentTheme.border}`
                }}
              >
                <Typography variant="subtitle1" sx={{ color: currentTheme.text, mb: 0.5 }}>
                  {subdomain.name}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  {subdomain.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DomainModal; 