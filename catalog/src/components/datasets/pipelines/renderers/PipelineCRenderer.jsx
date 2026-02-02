/**
 * Pipeline C - Zip-Based Renderer
 * 
 * Custom renderer for zip file-based pipeline processing archived/compressed files
 * with extraction and analysis. Features MetroMap view and process status toggle.
 */

import React, { useState, useContext, useMemo } from 'react';
import { Box } from '@mui/material';
import { ThemeContext } from '../../../../contexts/ThemeContext';
import FileSelector from '../../FileSelector';
import ZipSelector from '../../ZipSelector';
import ProcessStatus from '../../ProcessStatus';
import MetroMap from '../../MetroMap';
import ETLOverview from '../../ETLOverview';
import TabsSection from '../../TabsSection';

const PipelineCRenderer = ({
  pipeline,
  dataset,
  files,
  selectedFile,
  currentFile,
  onFileSelect,
  selectedZip,
  onZipSelect,
  tables,
  selectedTable,
  onTableSelect,
  pipelineAgreements,
  config,
}) => {
  const { currentTheme } = useContext(ThemeContext);
  const [viewMode, setViewMode] = useState('metro');

  // For zip-based pipelines, filter files based on selected zip contents
  const displayFiles = useMemo(() => {
    if (selectedZip) {
      const selectedZipFile = files.find(f => f.id === selectedZip);
      if (selectedZipFile && selectedZipFile.contents) {
        return selectedZipFile.contents;
      }
      return [];
    }
    return files;
  }, [files, selectedZip]);

  const currentFileFromDisplay = selectedFile ? displayFiles.find(f => f.id === selectedFile) : null;

  // View toggle component
  const ViewToggle = () => (
    <div className="pipeline-view-toggle">
      <button
        className={`toggle-button ${viewMode === 'metro' ? 'active' : ''}`}
        onClick={() => setViewMode('metro')}
        title="Metro Map View"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Metro sign circle */}
          <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1"/>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
          {/* Letter M for Metro */}
          <path d="M8 8 L8 16 M8 8 L12 12 M12 12 L16 8 M16 8 L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>
      <button
        className={`toggle-button ${viewMode === 'process' ? 'active' : ''}`}
        onClick={() => setViewMode('process')}
        title="Process Status View"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Metro Map - Only when metro view is selected */}
      {viewMode === 'metro' && (
        <Box sx={{ mb: 4 }}>
          <MetroMap
            stepCompletionStatus={dataset?.processSteps?.reduce((acc, step) => {
              acc[step.name] = {
                status: step.status || 'pending',
                runtime: step.duration || null
              };
              return acc;
            }, {})}
            viewToggle={<ViewToggle />}
          />
        </Box>
      )}

      {/* View Toggle - Only when process view is selected */}
      {viewMode === 'process' && (
        <Box sx={{ mb: 4 }}>
          <ViewToggle />
        </Box>
      )}

      {/* Process Status - Show when process view is selected */}
      {viewMode === 'process' && config?.layout?.showProcessStatus && (
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
        {/* Zip Selector - shown above file selector for zip-based pipelines */}
        {config?.layout?.showZipSelector && (
          <ZipSelector
            pipeline={pipeline}
            files={files}
            selectedZip={selectedZip}
            onZipSelect={onZipSelect}
          />
        )}

        {/* File Selector */}
        {config?.layout?.showFileSelector && (
          <>
            {!selectedZip ? (
              <div className="detail-section file-selector-section">
                <div className="file-selector-header">
                  <h3 className="section-title">Files</h3>
                </div>
                <div className="file-selector-list-container">
                  <div className="file-selector-main">
                    <div className="file-no-results">
                      <p>Please select an archive above to view its contents.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <FileSelector
                pipeline={pipeline}
                files={displayFiles}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            )}
          </>
        )}

        {/* Tabs Section */}
        <TabsSection
          pipeline={pipeline}
          currentFile={currentFileFromDisplay}
          dataset={dataset}
          selectedTable={selectedTable}
        />
      </div>
    </Box>
  );
};

export default PipelineCRenderer;
