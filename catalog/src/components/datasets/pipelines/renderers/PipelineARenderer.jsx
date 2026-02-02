/**
 * Pipeline A - File-Based Renderer
 * 
 * Custom renderer for file-based pipeline processing documents and files
 * with analytics, text extraction, and entity recognition.
 */

import React, { useContext } from 'react';
import { Box } from '@mui/material';
import { ThemeContext } from '../../../../contexts/ThemeContext';
import FileSelector from '../../FileSelector';
import ProcessStatus from '../../ProcessStatus';
import ETLOverview from '../../ETLOverview';
import TabsSection from '../../TabsSection';

const PipelineARenderer = ({
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
        {/* File Selector */}
        {config?.layout?.showFileSelector && (
          <FileSelector
            pipeline={pipeline}
            files={files}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
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

export default PipelineARenderer;
