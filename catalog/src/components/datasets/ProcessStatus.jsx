import React from 'react'
import './ProcessStatus.css'
import { getPipelineName } from '../../utils/pipelineUtils'

const ProcessStatus = ({ pipeline, currentStep: baseStep, processSteps: datasetProcessSteps }) => {
  // Use process steps from datasets.json if available, otherwise use defaults
  const getProcessSteps = (pipeline) => {
    if (datasetProcessSteps && datasetProcessSteps.length > 0) {
      return datasetProcessSteps
    }
    
    // Fallback defaults if not in datasets.json
    // Check by name for backward compatibility
    const pipelineName = getPipelineName(pipeline)
    if (pipelineName === 'Pipe B') {
      return [
        { id: 1, name: 'Source Connection', description: 'Establishing connection to data sources', duration: '20m' },
        { id: 2, name: 'Data Ingestion', description: 'Ingesting raw data streams', duration: '1h 30m' },
        { id: 3, name: 'Schema Mapping', description: 'Mapping source schemas to target', duration: '50m' },
        { id: 4, name: 'Data Enrichment', description: 'Enriching data with additional context', duration: '1h' },
        { id: 5, name: 'Quality Assurance', description: 'Running quality checks and validations', duration: '40m' },
        { id: 6, name: 'Pipeline Completion', description: 'Pipeline execution completed', duration: '10m' }
      ]
    }
    
    // Default steps for Pipe A and Pipe C
    return [
      { id: 1, name: 'Data Collection', description: 'Gathering data from sources', duration: '1h 30m' },
      { id: 2, name: 'Data Validation', description: 'Validating data quality', duration: '45m' },
      { id: 3, name: 'Data Transformation', description: 'Transforming and cleaning data', duration: '2h' },
      { id: 4, name: 'Data Storage', description: 'Storing processed data', duration: '30m' },
      { id: 5, name: 'Data Analysis', description: 'Analyzing and generating insights', duration: '1h 15m' },
      { id: 6, name: 'Completion', description: 'Process completed', duration: '15m' }
    ]
  }

  const processSteps = getProcessSteps(pipeline)
  
  // Use baseStep directly from dataset
  const currentStep = Math.max(1, Math.min(processSteps.length, baseStep || 1))

  return (
    <div className="progress-tracker">
      <h2 className="section-title">Process Status</h2>
      <div className="progress-steps">
        {processSteps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep

          return (
            <div key={step.id} className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isUpcoming ? 'upcoming' : ''}`}>
              <div className="step-indicator">
                {isCompleted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <div className="step-number">{step.id}</div>
                )}
              </div>
              <div className="step-content">
                <div className="step-name">{step.name}</div>
                <div className="step-time">{step.duration}</div>
                <div className="step-description">{step.description}</div>
              </div>
              {index < processSteps.length - 1 && (
                <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProcessStatus
