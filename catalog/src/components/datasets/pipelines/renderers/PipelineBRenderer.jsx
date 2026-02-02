/**
 * Pipeline B - Table-Based Renderer
 * 
 * Custom renderer for table-based pipeline processing structured data tables
 * with ETL operations and quality checks.
 */

import React, { useContext } from 'react';
import { Box } from '@mui/material';
import { ThemeContext } from '../../../../contexts/ThemeContext';
import TableSelector from '../../TableSelector';
import ProcessStatus from '../../ProcessStatus';
import ETLOverview from '../../ETLOverview';
import TabsSection from '../../TabsSection';

const PipelineBRenderer = ({
  pipeline,
  dataset,
  files,
  selectedFile,
  currentFile,
  onFileSelect,
  tables,
  selectedTable,
  onTableSelect,
  pipelineAgreements,
  config,
}) => {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Process Status */}
      {config?.layout?.showProcessStatus && (
        <Box sx={{ mb: 4 }}>
          <ProcessStatus
            pipeline={pipeline}
            currentStep={dataset?.currentStep || 1}
            processSteps={dataset?.processSteps}
          />
        </Box>
      )}

      {/* ETL Overview */}
      <Box sx={{ mb: 4 }}>
        <ETLOverview
          pipeline={pipeline}
          dataset={dataset}
          pipelineAgreements={pipelineAgreements}
        />
      </Box>

      {/* Dataset Details */}
      <div className="detail-sections">
        {/* Table Selector */}
        {config?.layout?.showTableSelector && (
          <TableSelector
            pipeline={pipeline}
            tables={tables || []}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
          />
        )}

        {/* Tabs Section */}
        <TabsSection
          pipeline={pipeline}
          currentFile={currentFile}
          dataset={dataset}
          selectedTable={selectedTable}
        />
      </div>
    </Box>
  );
};

export default PipelineBRenderer;
