/**
 * Pipeline View Component
 * 
 * This is a wrapper that renders the appropriate view based on pipeline configuration.
 * For pipelines with custom viewComponent, it renders that.
 * For others, it uses the default layout with configuration.
 */

import React, { useState } from 'react'
import { getPipelineConfig } from '../../../config/pipelineConfig'
import FileSelector from '../FileSelector'
import ZipSelector from '../ZipSelector'
import TableSelector from '../TableSelector'
import TabsSection from '../TabsSection'
import ProcessStatus from '../ProcessStatus'
import MetroMap from '../MetroMap'
import ETLOverview from '../ETLOverview'
import './PipelineView.css'

const PipelineView = ({ 
  pipeline, 
  pipelineName,
  dataset, 
  files, 
  selectedFile, 
  onFileSelect,
  selectedZip,
  onZipSelect,
  tables,
  selectedTable,
  onTableSelect,
  pipelineAgreements 
}) => {
  const config = getPipelineConfig(pipeline)
  
  // View toggle state for Pipeline C (MetroMap is default)
  // Must be called before any conditional returns
  const [viewMode, setViewMode] = useState('metro')
  
  // For zip-based pipelines, filter files based on selected zip contents
  const displayFiles = React.useMemo(() => {
    if (config.layout?.type === 'zip-based' && selectedZip) {
      const selectedZipFile = files.find(f => f.id === selectedZip)
      if (selectedZipFile && selectedZipFile.contents) {
        return selectedZipFile.contents
      }
      return []
    }
    return files
  }, [files, selectedZip, config.layout?.type])
  
  const currentFile = selectedFile ? displayFiles.find(f => f.id === selectedFile) : null
  
  // If pipeline has a custom view component, use it
  if (config.viewComponent) {
    const CustomView = config.viewComponent
    return (
      <CustomView
        pipeline={pipeline}
        dataset={dataset}
        files={files}
        selectedFile={selectedFile}
        currentFile={currentFile}
        onFileSelect={onFileSelect}
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={onTableSelect}
        pipelineAgreements={pipelineAgreements}
        config={config}
      />
    )
  }
  
  // Otherwise, use default layout with configuration
  const layout = config.layout || {}
  
  // Check if this is Pipeline C (zip-based)
  const isPipelineC = config.layout?.type === 'zip-based'

  return (
    <>
      {/* Metro Map - Only for Pipeline C when metro view is selected */}
      {isPipelineC && viewMode === 'metro' && (
        <MetroMap 
          stepCompletionStatus={dataset?.processSteps?.reduce((acc, step) => {
            acc[step.name] = {
              status: step.status || 'pending',
              runtime: step.duration || null
            }
            return acc
          }, {})}
          viewToggle={
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
          }
        />
      )}
      
      {/* View Toggle - Only for Pipeline C when process view is selected */}
      {isPipelineC && viewMode === 'process' && (
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
      )}
      
      {/* Process Status - Show for Pipeline C when process view is selected, or for other pipelines if configured */}
      {((isPipelineC && viewMode === 'process') || (!isPipelineC && layout.showProcessStatus)) && (
        <ProcessStatus 
          pipeline={pipeline} 
          currentStep={dataset?.currentStep || 1}
          processSteps={dataset?.processSteps}
        />
      )}

      {/* ETL Overview - Show for all pipelines */}
      <ETLOverview
        pipeline={pipeline}
        dataset={dataset}
        pipelineAgreements={pipelineAgreements}
      />

      {/* Dataset Details */}
      <div className="detail-sections">
        {/* Zip Selector - shown above file selector for zip-based pipelines */}
        {layout.showZipSelector && (
          <ZipSelector
            pipeline={pipeline}
            files={files}
            selectedZip={selectedZip}
            onZipSelect={onZipSelect}
          />
        )}

        {/* File Selector */}
        {layout.showFileSelector && (
          <>
            {layout.type === 'zip-based' && !selectedZip ? (
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

        {/* Table Selector */}
        {layout.showTableSelector && (
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

    </>
  )
}

export default PipelineView
