import React, { useContext } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
} from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import DatasetTable from '../components/DatasetTable';

const PipelinesPage = () => {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Pipelines
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Manage and monitor datasets across data pipelines. Track pipeline execution, dependencies, and data flow across your organization.
      </Typography>

      <DatasetTable />
    </Container>
  );
};

export default PipelinesPage;
