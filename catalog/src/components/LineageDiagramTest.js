import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import LineageDiagram from './LineageDiagram';

const LineageDiagramTest = ({ currentTheme }) => {
  const sampleUpstream = [
    {
      id: "ds-raw-customers",
      name: "Raw Customer Data",
      type: "Source",
      lastUpdated: "2024-03-15T08:00:00Z",
      status: "Active"
    },
    {
      id: "ds-external-api",
      name: "External API Data",
      type: "API",
      lastUpdated: "2024-03-15T07:30:00Z",
      status: "Active"
    }
  ];

  const sampleDownstream = [
    {
      id: "ds-customer-insights",
      name: "Customer Insights Dashboard",
      type: "Consumer",
      lastUpdated: "2024-03-15T09:00:00Z",
      status: "Active"
    },
    {
      id: "ds-ml-features",
      name: "ML Feature Store",
      type: "Consumer",
      lastUpdated: "2024-03-15T08:45:00Z",
      status: "Active"
    },
    {
      id: "ds-reporting",
      name: "Reporting System",
      type: "Consumer",
      lastUpdated: "2024-03-15T09:30:00Z",
      status: "Inactive"
    }
  ];

  const currentItem = {
    name: "Customer Analytics Dataset",
    type: "Dataset"
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: currentTheme?.text }}>
        Lineage Diagram Test
      </Typography>
      
      <Card variant="outlined" sx={{ mb: 3, bgcolor: currentTheme?.card, borderColor: currentTheme?.border }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: currentTheme?.text }}>
            Sample Data Lineage
          </Typography>
          <LineageDiagram
            upstream={sampleUpstream}
            downstream={sampleDownstream}
            currentItem={currentItem}
            currentTheme={currentTheme}
            height="600px"
          />
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3, bgcolor: currentTheme?.card, borderColor: currentTheme?.border }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: currentTheme?.text }}>
            Empty Lineage Test
          </Typography>
          <LineageDiagram
            upstream={[]}
            downstream={[]}
            currentItem={currentItem}
            currentTheme={currentTheme}
            height="300px"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default LineageDiagramTest;
