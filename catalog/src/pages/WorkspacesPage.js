import React, { useContext } from 'react';
import { Container, Typography } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import HomeWorkspaceSection from '../components/HomeWorkspaceSection';
import StickyPageIntro from '../components/StickyPageIntro';
import PageWithFixedHeader from '../components/PageWithFixedHeader';

const WorkspacesPage = () => {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <PageWithFixedHeader
      header={
        <StickyPageIntro sx={{ mb: 0 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
            Workspaces
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, maxWidth: 720 }}>
            Launch the workbench modalsto query, data model, reference data, and build Rules.
          </Typography>
        </StickyPageIntro>
      }
    >
      <Container maxWidth="xl" sx={{ py: 2, pb: 4 }}>
        <HomeWorkspaceSection />
      </Container>
    </PageWithFixedHeader>
  );
};

export default WorkspacesPage;
