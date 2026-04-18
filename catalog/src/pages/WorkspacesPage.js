import React, { useContext } from 'react';
import { Container, Typography } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import HomeWorkspaceSection from '../components/HomeWorkspaceSection';

const WorkspacesPage = () => {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
        Workspaces
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary, maxWidth: 720 }}>
        Launch the same workbench modals as in DH: query engine (Agora), data modeling, modeling studio (split
        view), reference data hub, and rule builder for editors.
      </Typography>
      <HomeWorkspaceSection />
    </Container>
  );
};

export default WorkspacesPage;
