import React, { useContext, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
} from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import DatasetTable from '../components/DatasetTable';
import PipelineSelectorCarousel from '../components/PipelineSelectorCarousel';

const PipelinesPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [selectedPipeline, setSelectedPipeline] = useState(null);

  const handlePipelineSelect = (pipeline) => {
    setSelectedPipeline(pipeline);
    // You can add additional logic here, like filtering the dataset table
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Pipelines
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Manage and monitor datasets across data pipelines. Track pipeline execution, dependencies, and data flow across your organization.
      </Typography>

      <PipelineSelectorCarousel
        onPipelineSelect={handlePipelineSelect}
        selectedPipeline={selectedPipeline}
      />

      <DatasetTable selectedPipeline={selectedPipeline} />
    </Container>
  );
};

export default PipelinesPage;
