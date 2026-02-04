import React, { useState, useEffect, useMemo } from 'react'
import './TabsSection.css'
import { getPipelineConfig, getPipelineDefaultTab, hasPipelineFeature } from '../../config/pipelineConfig'
import { fetchData } from '../../services/api'
import modelsData from '../../data/models.json'

const TabsSection = React.memo(({ pipeline, currentFile, dataset, selectedTable }) => {
  const config = getPipelineConfig(pipeline)
  const defaultTab = getPipelineDefaultTab(pipeline)
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  // Reset to default tab when switching pipelines or when selection changes
  useEffect(() => {
    const newDefaultTab = getPipelineDefaultTab(pipeline)
    setActiveTab(newDefaultTab)
  }, [pipeline, selectedTable])
  
  // Cache table lookups to avoid repeated .find() operations
  const tablesCache = useMemo(() => {
    const cache = new Map()
    if (dataset?.tables) {
      dataset.tables.forEach(table => {
        if (table?.name) {
          cache.set(table.name, table)
        }
      })
    }
    return cache
  }, [dataset?.tables])

  // Get functions from table data in datasets.json (optimized)
  const getTableFunctions = useMemo(() => {
    return (tableName) => {
      const table = tablesCache.get(tableName)
      if (table?.functions && table.functions.length > 0) {
        return table.functions.map(func => ({
          name: func.name,
          timeStart: new Date(func.timeStart),
          timeFinish: new Date(func.timeFinish),
          duration: func.duration,
          logs: func.logs || []
        }))
      }
      return []
    }
  }, [tablesCache])

  // Get tooling from table data in datasets.json (optimized)
  const getTableTooling = useMemo(() => {
    return (tableName) => {
      const table = tablesCache.get(tableName)
      return table?.tooling || []
    }
  }, [tablesCache])

  // Get column mapping from table data in datasets.json (optimized)
  const getColumnMapping = useMemo(() => {
    return (tableName) => {
      const table = tablesCache.get(tableName)
      if (table?.columnMapping) {
        return table.columnMapping
      }
      return { sourceColumns: [], etlColumns: [] }
    }
  }, [tablesCache])

  // Get sample data from table data in datasets.json (optimized)
  const getTableSample = useMemo(() => {
    return (tableName) => {
      const table = tablesCache.get(tableName)
      if (table?.sampleData) {
        return table.sampleData
      }
      // Fallback: use columns if available
      if (table?.columns && table.columns.length > 0) {
        // Extract column names if columns are objects, otherwise use as-is
        const columnNames = table.columns.map(col => 
          typeof col === 'string' ? col : col.name
        )
        return {
          columns: columnNames,
          rows: []
        }
      }
      return { columns: [], rows: [] }
    }
  }, [tablesCache])

  // Get model outputs from current file (memoized)
  const modelOutputs = useMemo(() => currentFile?.modelOutputs || [], [currentFile?.modelOutputs])
  const [selectedModelId, setSelectedModelId] = useState(null)
  
  // Initialize selectedModelId when modelOutputs change
  useEffect(() => {
    if (modelOutputs.length > 0 && !selectedModelId) {
      setSelectedModelId(modelOutputs[0]?.id || null)
    }
  }, [modelOutputs, selectedModelId])
  
  const selectedModel = useMemo(() => 
    modelOutputs.find(model => model.id === selectedModelId) || null,
    [modelOutputs, selectedModelId]
  )

  // Get text and entity model outputs from current file (memoized)
  const textModelOutputs = useMemo(() => 
    modelOutputs.filter(m => m.type === 'text'),
    [modelOutputs]
  )
  const entityModelOutputs = useMemo(() => 
    modelOutputs.filter(m => m.type === 'entity'),
    [modelOutputs]
  )

  // Memoize model lookup cache
  const allModelsCache = useMemo(() => {
    return [...modelOutputs, ...textModelOutputs, ...entityModelOutputs]
  }, [modelOutputs, textModelOutputs, entityModelOutputs])

  // Helper function to find a model by ID from all model sources (memoized)
  const findModelById = useMemo(() => {
    const cache = new Map()
    allModelsCache.forEach(model => {
      if (model?.id) {
        cache.set(model.id, model)
      }
    })
    return (modelId) => cache.get(modelId) || null
  }, [allModelsCache])

  // Helper function to compare semantic versions (memoized)
  const compareVersions = useMemo(() => {
    return (v1, v2) => {
      const parts1 = v1.split('.').map(Number)
      const parts2 = v2.split('.').map(Number)
      const maxLength = Math.max(parts1.length, parts2.length)
      
      for (let i = 0; i < maxLength; i++) {
        const part1 = parts1[i] || 0
        const part2 = parts2[i] || 0
        if (part1 > part2) return 1
        if (part1 < part2) return -1
      }
      return 0
    }
  }, [])

  // Cache model version lookups
  const modelVersionCache = useMemo(() => {
    const cache = new Map()
    const models = Array.isArray(modelsData) ? modelsData : (modelsData.models || [])
    models.forEach(model => {
      const key = model.name
      if (!cache.has(key)) {
        cache.set(key, [])
      }
      cache.get(key).push(model)
    })
    // Find latest version for each model name
    const latestCache = new Map()
    cache.forEach((models, name) => {
      const latest = models.reduce((latest, current) => {
        if (!latest) return current
        return compareVersions(current.version, latest.version) > 0 ? current : latest
      })
      latestCache.set(name, latest.version)
    })
    return latestCache
  }, [compareVersions])

  // Helper function to check if there's a newer version available (optimized)
  const hasNewerVersion = useMemo(() => {
    return (modelName, currentVersion) => {
      if (!modelName || !currentVersion) return false
      const latestVersion = modelVersionCache.get(modelName)
      if (!latestVersion) return false
      return compareVersions(latestVersion, currentVersion) > 0
    }
  }, [modelVersionCache, compareVersions])

  // Helper function to get the latest version for a model (optimized)
  const getLatestVersion = useMemo(() => {
    return (modelName) => {
      if (!modelName) return null
      return modelVersionCache.get(modelName) || null
    }
  }, [modelVersionCache])

  // State to track feedback (thumbs up/down) for each model
  const [modelFeedback, setModelFeedback] = useState({})
  // State to store feedback text for each model
  const [modelFeedbackText, setModelFeedbackText] = useState({})
  // State for feedback modal
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    modelId: null,
    feedbackText: ''
  })
  // State to track feedback (thumbs up/down) for each table
  const [tableFeedback, setTableFeedback] = useState({})
  // State to store feedback text for each table
  const [tableFeedbackText, setTableFeedbackText] = useState({})
  // State for table feedback modal
  const [tableFeedbackModal, setTableFeedbackModal] = useState({
    isOpen: false,
    tableName: null,
    feedbackText: ''
  })
  // State for update modal
  const [updateModal, setUpdateModal] = useState({
    isOpen: false,
    modelName: null,
    currentVersion: null,
    latestVersion: null
  })

  const handleFeedback = (modelId, feedback) => {
    if (feedback === 'down') {
      // Always open modal for thumbs down (even if already active, to allow editing)
      // If there's existing feedback text, pre-populate it
      setFeedbackModal({
        isOpen: true,
        modelId,
        feedbackText: modelFeedbackText[modelId] || ''
      })
    } else {
      // For thumbs up, just set the feedback directly
      setModelFeedback(prev => {
        // If clicking the same feedback, toggle it off
        if (prev[modelId] === feedback) {
          const newState = { ...prev }
          delete newState[modelId]
          return newState
        }
        // Otherwise, set the new feedback
        return { ...prev, [modelId]: feedback }
      })
      // Clear feedback text when switching to thumbs up
      setModelFeedbackText(prev => {
        const newState = { ...prev }
        delete newState[modelId]
        return newState
      })
    }
  }

  const handleFeedbackSubmit = () => {
    if (feedbackModal.modelId && feedbackModal.feedbackText.trim()) {
      // Set the feedback as down
      setModelFeedback(prev => ({
        ...prev,
        [feedbackModal.modelId]: 'down'
      }))
      // Store the feedback text
      setModelFeedbackText(prev => ({
        ...prev,
        [feedbackModal.modelId]: feedbackModal.feedbackText.trim()
      }))
      // Close the modal
      setFeedbackModal({
        isOpen: false,
        modelId: null,
        feedbackText: ''
      })
    }
  }

  const handleFeedbackCancel = () => {
    setFeedbackModal({
      isOpen: false,
      modelId: null,
      feedbackText: ''
    })
  }

  const handleUpdateClick = (modelName, currentVersion) => {
    const latestVersion = getLatestVersion(modelName)
    if (latestVersion) {
      setUpdateModal({
        isOpen: true,
        modelName,
        currentVersion,
        latestVersion
      })
    }
  }

  const handleUpdateCancel = () => {
    setUpdateModal({
      isOpen: false,
      modelName: null,
      currentVersion: null,
      latestVersion: null
    })
  }

  const handleUpdateFile = () => {
    // Handle update for just this file
    console.log(`Updating ${updateModal.modelName} from v${updateModal.currentVersion} to v${updateModal.latestVersion} for file: ${currentFile?.name}`)
    // TODO: Implement actual update logic
    handleUpdateCancel()
  }

  const handleUpdateDataset = () => {
    // Handle update for whole dataset
    console.log(`Updating ${updateModal.modelName} from v${updateModal.currentVersion} to v${updateModal.latestVersion} for dataset: ${dataset?.name}`)
    // TODO: Implement actual update logic
    handleUpdateCancel()
  }

  const handleTableFeedback = (tableName, feedback) => {
    if (feedback === 'down') {
      // Open modal for thumbs down
      setTableFeedbackModal({
        isOpen: true,
        tableName,
        feedbackText: tableFeedbackText[tableName] || ''
      })
    } else {
      // For thumbs up, just set the feedback directly
      setTableFeedback(prev => {
        // If clicking the same feedback, toggle it off
        if (prev[tableName] === feedback) {
          const newState = { ...prev }
          delete newState[tableName]
          return newState
        }
        // Otherwise, set the new feedback
        return { ...prev, [tableName]: feedback }
      })
      // Clear feedback text when switching to thumbs up
      setTableFeedbackText(prev => {
        const newState = { ...prev }
        delete newState[tableName]
        return newState
      })
    }
  }

  const handleTableFeedbackSubmit = () => {
    if (tableFeedbackModal.tableName && tableFeedbackModal.feedbackText.trim()) {
      // Set the feedback as down
      setTableFeedback(prev => ({
        ...prev,
        [tableFeedbackModal.tableName]: 'down'
      }))
      // Store the feedback text
      setTableFeedbackText(prev => ({
        ...prev,
        [tableFeedbackModal.tableName]: tableFeedbackModal.feedbackText.trim()
      }))
      // Close the modal
      setTableFeedbackModal({
        isOpen: false,
        tableName: null,
        feedbackText: ''
      })
    }
  }

  const handleTableFeedbackCancel = () => {
    setTableFeedbackModal({
      isOpen: false,
      tableName: null,
      feedbackText: ''
    })
  }

  const renderModelOutput = (models, selectedId, setSelectedId, selected, tabName) => {
    const hasModels = models && models.length > 0
    
    if (!hasModels) {
      return (
        <div className="model-output-empty">
          No {tabName} available for this file.
        </div>
      )
    }
    
    return (
      <>
        <div className="model-list">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              className={`model-card ${selectedId === model.id ? 'active' : ''}`}
              onClick={() => setSelectedId(model.id)}
            >
              <div className="model-name">{model.name}</div>
              <div className="model-summary">{model.summary}</div>
              <div className="model-runtime">Runtime: {model.runtime}</div>
            </button>
          ))}
        </div>
        <div className="model-output">
          {selected ? (
            <>
              <div className="model-output-header">
                <div className="model-output-title">Model Output</div>
                {hasPipelineFeature(pipeline, 'feedbackEnabled') && (
                  <div className="model-feedback-buttons">
                    <button
                      type="button"
                      className={`model-feedback-button thumbs-up ${modelFeedback[selected.id] === 'up' ? 'active' : ''}`}
                      onClick={() => handleFeedback(selected.id, 'up')}
                      title="Mark as correct"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`model-feedback-button thumbs-down ${modelFeedback[selected.id] === 'down' ? 'active' : ''}`}
                      onClick={() => handleFeedback(selected.id, 'down')}
                      title="Mark as incorrect"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <pre className="model-output-json">
                {JSON.stringify(selected.output || {}, null, 2)}
              </pre>
              <div className="model-output-footer">
                <div className="model-metrics">
                  {Object.entries(selected.metrics || {}).map(([key, value]) => (
                    <div key={key} className="model-metric">
                      <span className="model-metric-label">{key}</span>
                      <span className="model-metric-value">{value}</span>
                    </div>
                  ))}
                </div>
                {selected.version && (
                  <div className="model-version-container">
                    <span className="model-version-label">Version</span>
                    <span className="model-version-value">
                      v{selected.version}
                      {hasPipelineFeature(pipeline, 'updateModal') && hasNewerVersion(selected.name, selected.version) && (
                        <span 
                          className="model-version-update-flag" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateClick(selected.name, selected.version)
                          }}
                          title={`Newer version available: v${getLatestVersion(selected.name)}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                          Update Available
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="model-output-empty">Select a model to view output.</div>
          )}
        </div>
      </>
    )
  }

  const [selectedTextModelId, setSelectedTextModelId] = useState(textModelOutputs[0]?.id || null)
  const [selectedEntityModelId, setSelectedEntityModelId] = useState(entityModelOutputs[0]?.id || null)
  const selectedTextModel = textModelOutputs.find(model => model.id === selectedTextModelId)
  const selectedEntityModel = entityModelOutputs.find(model => model.id === selectedEntityModelId)

  const tabs = config.tabs?.available || []
  const layout = config.layout || {}
  const isFileBased = layout.type === 'file-based'
  const isTableBased = layout.type === 'table-based'
  
  return (
    <div className="detail-section tabs-section">
      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tabs-content">
          {isFileBased && !currentFile && (
            <div className="tab-panel">
              <div className="tab-panel-content">
                <div className="tab-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <h4>No File Selected</h4>
                  <p>Please select a file from the File Selector to view its details.</p>
                </div>
              </div>
            </div>
          )}


          {isFileBased && currentFile && activeTab === 'metadata' && (
            <div className="tab-panel">
              <h4 className="tab-panel-title">Metadata Extraction - {currentFile?.name}</h4>
              <div className="tab-panel-content">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <div className="metadata-label">File name</div>
                    <div className="metadata-value">{currentFile?.name || 'N/A'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">File extension</div>
                    <div className="metadata-value">{currentFile?.name?.split('.').pop() || currentFile?.type || 'N/A'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">File path</div>
                    <div className="metadata-value">{currentFile?.path || currentFile?.name || 'N/A'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">File size</div>
                    <div className="metadata-value">{currentFile?.size || 'N/A'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Created time</div>
                    <div className="metadata-value">
                      {currentFile?.createdTime 
                        ? new Date(currentFile.createdTime).toISOString().split('T')[0] + ' ' + new Date(currentFile.createdTime).toTimeString().split(' ')[0]
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Last modified time</div>
                    <div className="metadata-value">
                      {currentFile?.lastModified 
                        ? new Date(currentFile.lastModified).toISOString().split('T')[0] + ' ' + new Date(currentFile.lastModified).toTimeString().split(' ')[0]
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Last accessed time</div>
                    <div className="metadata-value">
                      {currentFile?.lastAccessedTime 
                        ? new Date(currentFile.lastAccessedTime).toISOString().split('T')[0] + ' ' + new Date(currentFile.lastAccessedTime).toTimeString().split(' ')[0]
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Ingested time (platform-generated)</div>
                    <div className="metadata-value">
                      {currentFile?.ingestedTime 
                        ? new Date(currentFile.ingestedTime).toISOString().split('T')[0] + ' ' + new Date(currentFile.ingestedTime).toTimeString().split(' ')[0]
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">File hash (MD5)</div>
                    <div className="metadata-value">{currentFile?.fileHash || 'N/A'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">File UUID</div>
                    <div className="metadata-value">{currentFile?.fileUuid || 'N/A'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Source system</div>
                    <div className="metadata-value">{dataset?.systems?.[0] || dataset?.pipeline || 'N/A'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Media type</div>
                    <div className="metadata-value">
                      {currentFile?.type 
                        ? `application/${currentFile.type === 'json' ? 'json' : currentFile.type === 'csv' ? 'csv' : currentFile.type === 'pdf' ? 'pdf' : currentFile.type === 'png' ? 'png' : currentFile.type === 'xlsx' ? 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' : currentFile.type === 'xls' ? 'vnd.ms-excel' : currentFile.type === 'txt' ? 'text/plain' : 'octet-stream'}`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isFileBased && currentFile && activeTab === 'schema' && (
            <div className="tab-panel">
              <h4 className="tab-panel-title">Schema Extractions - {currentFile?.name}</h4>
              <div className="tab-panel-content">
                <div className="schema-detection-info">
                  <div className="schema-info-item">
                    <div className="schema-info-label">Delimiter</div>
                    <div className="schema-info-value">
                      {currentFile?.schemaInfo?.delimiter || (currentFile?.type === 'csv' ? ',' : currentFile?.type === 'txt' ? '\\t' : currentFile?.type === 'json' ? 'N/A' : '—')}
                    </div>
                  </div>
                  <div className="schema-info-item">
                    <div className="schema-info-label">Escape Character</div>
                    <div className="schema-info-value">
                      {currentFile?.schemaInfo?.escapeCharacter || (currentFile?.type === 'csv' ? '\\' : currentFile?.type === 'txt' ? '\\' : currentFile?.type === 'json' ? 'N/A' : '—')}
                    </div>
                  </div>
                  <div className="schema-info-item">
                    <div className="schema-info-label">Contains Header</div>
                    <div className="schema-info-value">
                      {currentFile?.schemaInfo?.containsHeader !== undefined ? (currentFile.schemaInfo.containsHeader ? 'Yes' : 'No') : (currentFile?.type === 'csv' || currentFile?.type === 'txt' ? 'Yes' : currentFile?.type === 'json' ? 'N/A' : '—')}
                    </div>
                  </div>
                  <div className="schema-info-item">
                    <div className="schema-info-label">Encoding</div>
                    <div className="schema-info-value">
                      {currentFile?.schemaInfo?.encoding || (currentFile?.type === 'csv' || currentFile?.type === 'txt' || currentFile?.type === 'json' ? 'UTF-8' : '—')}
                    </div>
                  </div>
                  <div className="schema-info-item">
                    <div className="schema-info-label">Quote Character</div>
                    <div className="schema-info-value">
                      {currentFile?.schemaInfo?.quoteCharacter || (currentFile?.type === 'csv' ? '"' : currentFile?.type === 'txt' ? '—' : currentFile?.type === 'json' ? 'N/A' : '—')}
                    </div>
                  </div>
                  <div className="schema-info-item">
                    <div className="schema-info-label">Multi-line Fields</div>
                    <div className="schema-info-value">
                      {currentFile?.schemaInfo?.multiLineFields !== undefined ? (currentFile.schemaInfo.multiLineFields ? 'Yes' : 'No') : (currentFile?.type === 'csv' ? 'No' : currentFile?.type === 'txt' ? 'No' : currentFile?.type === 'json' ? 'N/A' : '—')}
                    </div>
                  </div>
                  <div className="schema-info-item">
                    <div className="schema-info-label">Column Count</div>
                    <div className="schema-info-value">
                      {currentFile?.schema?.columns?.length || 'N/A'}
                    </div>
                  </div>
                  <div className="schema-info-item">
                    <div className="schema-info-label">Row Count</div>
                    <div className="schema-info-value">
                      {currentFile?.records ? currentFile.records.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
                {currentFile?.schema?.columns && currentFile.schema.columns.length > 0 ? (
                  <div className="schema-columns-grid">
                    {currentFile.schema.columns.map((column, index) => (
                      <div key={index} className="schema-column-item">
                        <div className="schema-column-name">
                          {typeof column === 'string' ? column : column.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="schema-empty">No schema data available</div>
                )}
              </div>
            </div>
          )}

          {isTableBased && activeTab === 'tooling' && (() => {
            if (!selectedTable) {
              return (
                <div className="tab-panel">
                  <div className="tab-panel-content">
                    <div className="tab-empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
                      </svg>
                      <h4>No Table Selected</h4>
                      <p>Please select a table from the Table Selector to view its details.</p>
                    </div>
                  </div>
                </div>
              )
            }
            const tooling = getTableTooling(selectedTable)
            return (
              <div className="tab-panel">
                <h4 className="tab-panel-title">Tooling - {selectedTable}</h4>
                <div className="tab-panel-content">
                  <div className="tooling-grid">
                    {tooling.map((tool, index) => (
                      <div key={index} className="tooling-item">
                        <div className="tooling-name">{tool.name}</div>
                        <div className="tooling-details">
                          <span className="tooling-version">v{tool.version}</span>
                          <span className="tooling-function">{tool.function}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {isTableBased && activeTab === 'quality' && (() => {
            if (!selectedTable) {
              return (
                <div className="tab-panel">
                  <div className="tab-panel-content">
                    <div className="tab-empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
                      </svg>
                      <h4>No Table Selected</h4>
                      <p>Please select a table from the Table Selector to view its details.</p>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Get quality checks from table data in datasets.json
            const table = dataset?.tables?.find(t => t.name === selectedTable)
            const qualityChecks = table?.qualityChecks || []
            const passedChecks = qualityChecks.filter(c => c.status === 'pass').length
            const totalChecks = qualityChecks.length
            const qualityScore = ((passedChecks / totalChecks) * 100).toFixed(1)
            
            return (
              <div className="tab-panel">
                <h4 className="tab-panel-title">Data Quality - {selectedTable}</h4>
                <div className="tab-panel-content">
                  <div className="quality-summary">
                    <div className="quality-summary-item">
                      <div className="quality-summary-label">Overall Quality Score</div>
                      <div className="quality-summary-value">{qualityScore}%</div>
                    </div>
                    <div className="quality-summary-item">
                      <div className="quality-summary-label">Checks Passed</div>
                      <div className="quality-summary-value">{passedChecks} / {totalChecks}</div>
                    </div>
                  </div>
                  <div className="quality-checks-list">
                    {qualityChecks.map((check, index) => (
                      <div key={index} className={`quality-check-item ${check.status === 'pass' ? 'pass' : 'fail'}`}>
                        <div className="quality-check-header">
                          <div className="quality-check-name-row">
                            <div className="quality-check-name">{check.name}</div>
                            <div className={`quality-check-badge ${check.status === 'pass' ? 'pass-badge' : 'fail-badge'}`}>
                              {check.status === 'pass' ? 'PASS' : 'FAIL'}
                            </div>
                          </div>
                          <div className="quality-check-description">{check.description}</div>
                        </div>
                        <div className="quality-check-details">{check.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {isTableBased && activeTab === 'origin' && (() => {
            if (!selectedTable) {
              return (
                <div className="tab-panel">
                  <div className="tab-panel-content">
                    <div className="tab-empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
                      </svg>
                      <h4>No Table Selected</h4>
                      <p>Please select a table from the Table Selector to view its details.</p>
                    </div>
                  </div>
                </div>
              )
            }
            const columnMapping = getColumnMapping(selectedTable)
            return (
              <div className="tab-panel">
                <h4 className="tab-panel-title">Column Origin - {selectedTable}</h4>
                <div className="tab-panel-content">
                  <div className="column-mapping">
                    <div className="column-mapping-header">
                      <span className="column-mapping-subtitle">Source vs ETL Columns</span>
                    </div>
                    <div className="column-mapping-content">
                      <div className="column-mapping-section">
                        <div className="column-mapping-section-header">
                          <span className="column-badge source-badge">Source</span>
                          <span className="column-count">{columnMapping.sourceColumns.length} columns</span>
                        </div>
                        <div className="column-list">
                          {columnMapping.sourceColumns.map((col, index) => (
                            <div key={index} className="column-item source-column">
                              <div className="column-name-row">
                                <span className="column-name">{col.name}</span>
                                {col.sourceColumn && col.sourceColumn !== col.name && (
                                  <span className="column-source-name">← {col.sourceColumn}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="column-mapping-section">
                        <div className="column-mapping-section-header">
                          <span className="column-badge etl-badge">ETL Added</span>
                          <span className="column-count">{columnMapping.etlColumns.length} columns</span>
                        </div>
                        <div className="column-list">
                          {columnMapping.etlColumns.map((col, index) => (
                            <div key={index} className="column-item etl-column">
                              <div className="column-name-row">
                                <span className="column-name">{col.name}</span>
                              </div>
                              {col.transformation && (
                                <div className="column-transformation">{col.transformation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {isTableBased && activeTab === 'functions' && (() => {
            if (!selectedTable) {
              return (
                <div className="tab-panel">
                  <div className="tab-panel-content">
                    <div className="tab-empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
                      </svg>
                      <h4>No Table Selected</h4>
                      <p>Please select a table from the Table Selector to view its details.</p>
                    </div>
                  </div>
                </div>
              )
            }
            const functions = getTableFunctions(selectedTable)
            return (
              <div className="tab-panel">
                <h4 className="tab-panel-title">Functions - {selectedTable}</h4>
                <div className="tab-panel-content">
                  <div className="functions-table">
                    <div className="functions-table-header">
                      <div className="functions-header-cell">Function</div>
                      <div className="functions-header-cell">Time Start</div>
                      <div className="functions-header-cell">Time Finish</div>
                    </div>
                    {functions.map((func, index) => (
                      <div key={index} className="functions-table-row">
                        <div className="functions-cell function-name">
                          <code>{func.name}</code>
                        </div>
                        <div className="functions-cell">
                          {func.timeStart.toISOString().replace('T', ' ').substring(0, 19)}
                        </div>
                        <div className="functions-cell">
                          {func.timeFinish.toISOString().replace('T', ' ').substring(0, 19)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {isTableBased && activeTab === 'sample' && (() => {
            if (!selectedTable) {
              return (
                <div className="tab-panel">
                  <div className="tab-panel-content">
                    <div className="tab-empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
                      </svg>
                      <h4>No Table Selected</h4>
                      <p>Please select a table from the Table Selector to view its details.</p>
                    </div>
                  </div>
                </div>
              )
            }
            const tableData = getTableSample(selectedTable)
            // Find the table object to get all properties
            const tableObj = dataset?.tables?.find(t => t.name === selectedTable)
            const s3Path = tableObj?.s3Location || 'N/A'
            const tableType = tableObj?.type || tableObj?.tableType || 'Iceberg Table'
            const dataFreshness = tableObj?.dataFreshness || 0
            const dataQuality = tableObj?.dataQuality || 0
            const totalRows = tableObj?.rowCount || 0
            const totalColumns = tableObj?.columnCount || tableData.columns.length
            
            return (
              <div className="tab-panel">
                <div className="table-overview-header">
                  <h4 className="tab-panel-title">Overview - {selectedTable}</h4>
                  {hasPipelineFeature(pipeline, 'feedbackEnabled') && (
                    <div className="model-feedback-buttons">
                      <button
                        type="button"
                        className={`model-feedback-button thumbs-up ${tableFeedback[selectedTable] === 'up' ? 'active' : ''}`}
                        onClick={() => handleTableFeedback(selectedTable, 'up')}
                        title="Mark as correct"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`model-feedback-button thumbs-down ${tableFeedback[selectedTable] === 'down' ? 'active' : ''}`}
                        onClick={() => handleTableFeedback(selectedTable, 'down')}
                        title="Mark as incorrect"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="tab-panel-content">
                  <div className="table-metrics-section">
                    <div className="table-metric-item">
                      <div className="table-metric-label">Table Type</div>
                      <div className="table-metric-value">{tableType}</div>
                    </div>
                    <div className="table-metric-item">
                      <div className="table-metric-label">S3 Path</div>
                      <div className="table-metric-value s3-path">{s3Path}</div>
                    </div>
                    <div className="table-metric-item">
                      <div className="table-metric-label">Data Quality</div>
                      <div className="table-metric-value quality-value">{dataQuality}%</div>
                    </div>
                    <div className="table-metric-item">
                      <div className="table-metric-label">Columns</div>
                      <div className="table-metric-value">{totalColumns}</div>
                    </div>
                    <div className="table-metric-item">
                      <div className="table-metric-label">Rows</div>
                      <div className="table-metric-value">{totalRows.toLocaleString()}</div>
                    </div>
                    <div className="table-metric-item">
                      <div className="table-metric-label">Data Freshness</div>
                      <div className="table-metric-value">
                        {dataFreshness === 1 ? '1 hour ago' : `${dataFreshness} hours ago`}
                      </div>
                    </div>
                  </div>
                  <div className="table-sample">
                    <div className="table-sample-header">
                      <span className="table-sample-info">Showing 10 sample rows</span>
                    </div>
                    <div className="table-sample-container">
                      <table className="sample-table">
                        <thead>
                          <tr>
                            {tableData.columns.map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {tableData.columns.map((col) => (
                                <td key={col}>{row[col]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {isFileBased && currentFile && activeTab === 'analytics' && (
            <div className="tab-panel">
              <h4 className="tab-panel-title">Data Analytics - {currentFile?.name}</h4>
              <div className="tab-panel-content">
                <div className="model-list">
                  {modelOutputs.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      className={`model-card ${selectedModelId === model.id ? 'active' : ''}`}
                      onClick={() => setSelectedModelId(model.id)}
                    >
                      <div className="model-name">{model.name}</div>
                      <div className="model-summary">{model.summary}</div>
                      <div className="model-runtime">Runtime: {model.runtime}</div>
                    </button>
                  ))}
                </div>
                <div className="model-output">
                  {selectedModel ? (
                    <>
                      <div className="model-output-header">
                        <div className="model-output-title">Model Output</div>
                        <div className="model-feedback-buttons">
                          <button
                            type="button"
                            className={`model-feedback-button thumbs-up ${modelFeedback[selectedModel.id] === 'up' ? 'active' : ''}`}
                            onClick={() => handleFeedback(selectedModel.id, 'up')}
                            title="Mark as correct"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`model-feedback-button thumbs-down ${modelFeedback[selectedModel.id] === 'down' ? 'active' : ''}`}
                            onClick={() => handleFeedback(selectedModel.id, 'down')}
                            title="Mark as incorrect"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <pre className="model-output-json">
                        {JSON.stringify(selectedModel.output || {}, null, 2)}
                      </pre>
                      <div className="model-output-footer">
                        <div className="model-metrics">
                          {Object.entries(selectedModel.metrics || {}).map(([key, value]) => (
                            <div key={key} className="model-metric">
                              <span className="model-metric-label">{key}</span>
                              <span className="model-metric-value">{value}</span>
                            </div>
                          ))}
                        </div>
                        {selectedModel.version && (
                          <div className="model-version-container">
                            <span className="model-version-label">Version</span>
                            <span className="model-version-value">
                              v{selectedModel.version}
                              {hasPipelineFeature(pipeline, 'updateModal') && hasNewerVersion(selectedModel.name, selectedModel.version) && (
                                <span 
                                  className="model-version-update-flag" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateClick(selectedModel.name, selectedModel.version)
                                  }}
                                  title={`Newer version available: v${getLatestVersion(selectedModel.name)}`}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                  </svg>
                                  Update Available
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="model-output-empty">
                      {modelOutputs.length > 0 ? 'Select a model to view output.' : 'No Data Analytics available for this file.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isFileBased && currentFile && activeTab === 'text' && (
            <div className="tab-panel">
              <h4 className="tab-panel-title">Text Extractions - {currentFile?.name}</h4>
              <div className="tab-panel-content">
                {renderModelOutput(
                  textModelOutputs,
                  selectedTextModelId,
                  setSelectedTextModelId,
                  selectedTextModel,
                  'Text Extractions'
                )}
              </div>
            </div>
          )}

          {isFileBased && currentFile && activeTab === 'entity' && (
            <div className="tab-panel">
              <h4 className="tab-panel-title">Entity Extractions - {currentFile?.name}</h4>
              <div className="tab-panel-content">
                {renderModelOutput(
                  entityModelOutputs,
                  selectedEntityModelId,
                  setSelectedEntityModelId,
                  selectedEntityModel,
                  'Entity Extractions'
                )}
              </div>
            </div>
          )}

          {isFileBased && currentFile && activeTab === 'unpack' && (
            <div className="tab-panel">
              <h4 className="tab-panel-title">Unpack - {currentFile?.name}</h4>
              <div className="tab-panel-content">
                {currentFile?.name && (currentFile.name.endsWith('.zip') || currentFile.name.endsWith('.tar') || currentFile.name.endsWith('.gz') || currentFile.type === 'zip' || currentFile.type === 'archive') ? (
                  <div className="unpack-table">
                    <div className="unpack-table-header">
                      <div className="unpack-header-cell">File</div>
                      <div className="unpack-header-cell">Unpacked Location</div>
                      <div className="unpack-header-cell">Temporary</div>
                      <div className="unpack-header-cell">Files Extracted</div>
                      <div className="unpack-header-cell">Unpacked At</div>
                      <div className="unpack-header-cell">Status</div>
                    </div>
                    <div className="unpack-table-row">
                      <div className="unpack-cell">
                        <div className="unpack-file-name">{currentFile.name}</div>
                        <div className="unpack-file-size">{currentFile.size}</div>
                      </div>
                      <div className="unpack-cell">
                        <code className="unpack-location">{currentFile?.unpackInfo?.unpackedLocation || '/tmp/unpack/' + (currentFile.id || 'file')}</code>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-badge unpack-temporary">{currentFile?.unpackInfo?.temporary !== undefined ? (currentFile.unpackInfo.temporary ? 'Yes' : 'No') : 'Yes'}</span>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-count">{currentFile?.unpackInfo?.filesExtracted ? `${currentFile.unpackInfo.filesExtracted} files` : 'N/A'}</span>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-time">
                          {currentFile?.unpackInfo?.unpackedAt ? new Date(currentFile.unpackInfo.unpackedAt).toISOString().replace('T', ' ').substring(0, 19) : 'N/A'}
                        </span>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-badge unpack-success">Completed</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="unpack-table">
                    <div className="unpack-table-header">
                      <div className="unpack-header-cell">File</div>
                      <div className="unpack-header-cell">Unpacked Location</div>
                      <div className="unpack-header-cell">Temporary</div>
                      <div className="unpack-header-cell">Files Extracted</div>
                      <div className="unpack-header-cell">Unpacked At</div>
                      <div className="unpack-header-cell">Status</div>
                    </div>
                    <div className="unpack-table-row">
                      <div className="unpack-cell">
                        <div className="unpack-file-name">{currentFile?.name || 'N/A'}</div>
                        <div className="unpack-file-size">{currentFile?.size || 'N/A'}</div>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-not-applicable">N/A</span>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-not-applicable">N/A</span>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-not-applicable">N/A</span>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-not-applicable">N/A</span>
                      </div>
                      <div className="unpack-cell">
                        <span className="unpack-badge unpack-skipped">{currentFile?.unpackInfo?.status || 'Not an archive'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isFileBased && currentFile && activeTab === 'tagging' && (
            <div className="tab-panel">
              <h4 className="tab-panel-title">Data Tagging - {currentFile?.name}</h4>
              <div className="tab-panel-content">
                <div className="tagging-section">
                  <div className="tagging-category">
                    <h5 className="tagging-category-title">Discoverability Tags</h5>
                    <div className="tagging-tags-container">
                      {dataset?.tags?.discoverability && dataset.tags.discoverability.length > 0 ? (
                        dataset.tags.discoverability.map((tag, index) => (
                          <span key={index} className="tagging-tag discoverability-tag">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <>
                          <span className="tagging-tag discoverability-tag">production</span>
                          <span className="tagging-tag discoverability-tag">validated</span>
                          <span className="tagging-tag discoverability-tag">indexed</span>
                          <span className="tagging-tag discoverability-tag">monitored</span>
                          <span className="tagging-tag discoverability-tag">compliant</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="tagging-category">
                    <h5 className="tagging-category-title">Domain Tags</h5>
                    <div className="tagging-tags-container">
                      {dataset?.tags?.domain && dataset.tags.domain.length > 0 ? (
                        dataset.tags.domain.map((tag, index) => (
                          <span key={index} className="tagging-tag domain-tag">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <>
                          <span className="tagging-tag domain-tag">{dataset?.domain || dataset?.category || dataset?.systems?.[0] || 'general'}</span>
                          {dataset?.systems && dataset.systems.length > 1 && dataset.systems.slice(1).map((system, index) => (
                            <span key={index} className="tagging-tag domain-tag">{system}</span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal.isOpen && (() => {
        const feedbackModel = findModelById(feedbackModal.modelId)
        return (
          <div className="model-feedback-modal-overlay" onClick={handleFeedbackCancel}>
            <div className="model-feedback-modal" onClick={(e) => e.stopPropagation()}>
              <div className="model-feedback-modal-header">
                <div>
                  <h3 className="model-feedback-modal-title">Why is this model output incorrect?</h3>
                  {feedbackModel && (
                    <div className="model-feedback-modal-model-info">
                      <span className="model-feedback-model-name">{feedbackModel.name}</span>
                      {feedbackModel.version && (
                        <span className="model-feedback-model-version">v{feedbackModel.version}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="model-feedback-modal-close"
                  onClick={handleFeedbackCancel}
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="model-feedback-modal-content">
                <label className="model-feedback-label" htmlFor="feedback-textarea">
                  Please provide details about what is incorrect:
                </label>
                <textarea
                  id="feedback-textarea"
                  className="model-feedback-textarea"
                  value={feedbackModal.feedbackText}
                  onChange={(e) => setFeedbackModal(prev => ({ ...prev, feedbackText: e.target.value }))}
                  placeholder="Describe what is incorrect about this model output..."
                  rows={6}
                  autoFocus
                />
              </div>
              <div className="model-feedback-modal-footer">
                <button
                  type="button"
                  className="model-feedback-button-cancel"
                  onClick={handleFeedbackCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="model-feedback-button-submit"
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackModal.feedbackText.trim()}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Update Modal */}
      {hasPipelineFeature(pipeline, 'updateModal') && updateModal.isOpen && (
        <div className="model-update-modal-overlay" onClick={handleUpdateCancel}>
          <div className="model-update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="model-update-modal-header">
              <div>
                <h3 className="model-update-modal-title">Update Model Version</h3>
                <div className="model-update-modal-info">
                  <span className="model-update-model-name">{updateModal.modelName}</span>
                  <span className="model-update-version-info">
                    v{updateModal.currentVersion} → v{updateModal.latestVersion}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="model-update-modal-close"
                onClick={handleUpdateCancel}
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="model-update-modal-content">
              <p className="model-update-modal-description">
                A newer version of this model is available. Choose where to apply the update:
              </p>
              <div className="model-update-options">
                <button
                  type="button"
                  className="model-update-option"
                  onClick={handleUpdateFile}
                >
                  <div className="model-update-option-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <span className="model-update-option-title">Update This File Only</span>
                  </div>
                  <p className="model-update-option-description">
                    Update the model version for <strong>{currentFile?.name || 'this file'}</strong> only
                  </p>
                </button>
                <button
                  type="button"
                  className="model-update-option"
                  onClick={handleUpdateDataset}
                >
                  <div className="model-update-option-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h18v18H3zM3 9h18M9 3v18"></path>
                    </svg>
                    <span className="model-update-option-title">Update Entire Dataset</span>
                  </div>
                  <p className="model-update-option-description">
                    Update the model version for all files in <strong>{dataset?.name || 'this dataset'}</strong>
                  </p>
                </button>
              </div>
            </div>
            <div className="model-update-modal-footer">
              <button
                type="button"
                className="model-update-button-cancel"
                onClick={handleUpdateCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Feedback Modal */}
      {tableFeedbackModal.isOpen && (
        <div className="model-feedback-modal-overlay" onClick={handleTableFeedbackCancel}>
          <div className="model-feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="model-feedback-modal-header">
              <div>
                <h3 className="model-feedback-modal-title">Why is this table incorrect?</h3>
                {tableFeedbackModal.tableName && (
                  <div className="model-feedback-modal-model-info">
                    <span className="model-feedback-model-name">{tableFeedbackModal.tableName}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="model-feedback-modal-close"
                onClick={handleTableFeedbackCancel}
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="model-feedback-modal-content">
              <label className="model-feedback-label" htmlFor="table-feedback-textarea">
                Please provide details about what is incorrect:
              </label>
              <textarea
                id="table-feedback-textarea"
                className="model-feedback-textarea"
                value={tableFeedbackModal.feedbackText}
                onChange={(e) => setTableFeedbackModal(prev => ({ ...prev, feedbackText: e.target.value }))}
                placeholder="Describe what is incorrect about this table..."
                rows={6}
                autoFocus
              />
            </div>
            <div className="model-feedback-modal-footer">
              <button
                type="button"
                className="model-feedback-button-cancel"
                onClick={handleTableFeedbackCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="model-feedback-button-submit"
                onClick={handleTableFeedbackSubmit}
                disabled={!tableFeedbackModal.feedbackText.trim()}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

TabsSection.displayName = 'TabsSection'

export default TabsSection
