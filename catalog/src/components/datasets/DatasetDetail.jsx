import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDatasetSelection } from '../../hooks/useDatasetSelection'
import { useDatasetUI } from '../../hooks/useDatasetUI'
import PipelineView from './pipelines/PipelineView'
import { getPipelineName, initializePipelines } from '../../utils/pipelineUtils'
import catalogIcon from '../../imgs/catalog.png'
import datasetsData from '../../data/datasets.json'
import './DatasetDetail.css'

function DatasetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const datasetId = parseInt(id)
  
  // State
  const [dataset, setDataset] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Custom hooks
  const {
    selectedPipeline,
    setSelectedPipeline,
    selectedFile,
    setSelectedFile,
    selectedTable,
    setSelectedTable,
    selectedZip,
    setSelectedZip,
    selectedVersion,
    setSelectedVersion,
    clearSelection,
  } = useDatasetSelection(dataset)
  
  const {
    notificationModal,
    setNotificationModal,
  } = useDatasetUI()
  
  // Initialize pipelines cache and load dataset
  useEffect(() => {
    const loadData = () => {
      try {
        setIsLoading(true)
        // Initialize pipelines cache first so pipeline names are available
        initializePipelines()
        if (datasetId) {
          const datasetsArray = Array.isArray(datasetsData) ? datasetsData : []
          const data = datasetsArray.find(d => d.id === datasetId)
          setDataset(data || null)
        }
      } catch (error) {
        console.error('Error loading dataset:', error)
        setDataset(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (datasetId) {
      loadData()
    }
  }, [datasetId])
  
  // Clear selections when dataset changes
  useEffect(() => {
    if (datasetId) {
      clearSelection()
    }
  }, [datasetId, clearSelection])
  
  // Calculate notification counts
  const notificationCounts = useMemo(() => {
    const notifications = dataset?.notifications || []
    return {
      warnings: notifications.filter(n => n.type === 'warning').length,
      errors: notifications.filter(n => n.type === 'error').length
    }
  }, [dataset?.notifications])
  
  // Get filtered notifications for modal
  const filteredNotifications = useMemo(() => {
    if (!notificationModal || !dataset?.notifications) return []
    return dataset.notifications.filter(n => n.type === notificationModal)
  }, [notificationModal, dataset?.notifications])
  
  // Get pipeline name for display
  const selectedPipelineName = useMemo(() => {
    return getPipelineName(selectedPipeline)
  }, [selectedPipeline])
  
  // Memoize resolveFileUrl to avoid recreating it on every render
  const resolveFileUrl = useMemo(() => {
    return (filePath) => {
      if (!filePath) return null
      
      // Use dataset's dataFolder if available, otherwise fall back to data/
      const baseFolder = dataset?.dataFolder || 'data'
      
      // If path already includes the folder, use it as-is
      if (filePath.startsWith('data/')) {
        return `/${filePath}`
      }
      
      // If path is just a filename, use the dataset's folder
      if (!filePath.includes('/')) {
        return `/${baseFolder}/${filePath}`
      }
      
      // For other paths, try to construct URL
      // If it's a relative path, prepend with /
      if (!filePath.startsWith('http') && !filePath.startsWith('/')) {
        return `/${filePath}`
      }
      
      return filePath
    }
  }, [dataset?.dataFolder])

  const files = React.useMemo(() => {
    if (!dataset?.files || dataset.files.length === 0) {
      return []
    }

    return dataset.files.map((file, index) => {
      const inferredType = file.type || (file.name?.split('.').pop() || 'file')
      const fallbackName = `${dataset?.name?.split(' ')[0] || 'dataset'}_file_${index + 1}.${inferredType}`
      const fileUrl = file.path ? resolveFileUrl(file.path) : null

      // Use S3 path from file, or construct from path, or use s3Location
      const s3Path = file.s3Path || file.s3Location || (file.path 
        ? `s3://tracer-prod/${file.path}` 
        : `s3://tracer-prod/data/${file.name || fallbackName}`)

      return {
        id: file.id || `file-${index + 1}`,
        name: file.name || fallbackName,
        type: inferredType,
        size: file.size || '0 MB',
        records: typeof file.records === 'number' ? file.records : 0,
        lastModified: file.lastModified || new Date().toISOString().split('T')[0],
        path: file.path || file.name || fallbackName,
        s3Path: s3Path,
        url: fileUrl,
        tags: file.tags || [],
        analytics: file.analytics || null,
        textExtractions: file.textExtractions || [],
        entities: file.entities || null,
        schema: file.schema || null,
        products: file.products || [],
        logs: file.logs || [],
        createdTime: file.createdTime,
        lastAccessedTime: file.lastAccessedTime,
        ingestedTime: file.ingestedTime,
        fileHash: file.fileHash,
        fileUuid: file.fileUuid,
        schemaInfo: file.schemaInfo,
        modelOutputs: file.modelOutputs || [],
        unpackInfo: file.unpackInfo
      }
    })
  }, [dataset?.files, dataset?.name, resolveFileUrl])
  
  // Calculate file type counts
  const fileTypeCounts = React.useMemo(() => {
    const counts = {}
    files.forEach(file => {
      const type = file.type.toLowerCase()
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [files])

  const pipelineAgreements = React.useMemo(() => {
    // Use agreements from dataset if available
    if (dataset?.agreements && dataset.agreements.length > 0) {
      return dataset.agreements
    }
    // Fallback: return empty array if no agreements defined
    return []
  }, [dataset?.agreements])

  const availableVersions = React.useMemo(() => {
    const versions = new Set()
    pipelineAgreements.forEach((agreement) => {
      if (agreement.version) {
        versions.add(agreement.version)
      }
    })
    return Array.from(versions)
  }, [pipelineAgreements])

  // Update selected version when pipeline or agreements change
  useEffect(() => {
    const currentAgreement = pipelineAgreements.find((agreement) => {
      return agreement.pipeline === selectedPipeline || agreement.pipeline === selectedPipelineName
    })
    const newVersion = currentAgreement?.version || availableVersions[0] || ''
    if (newVersion !== selectedVersion) {
      setSelectedVersion(newVersion)
    }
    // Note: selectedVersion intentionally excluded from deps - we check it in the condition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineAgreements, selectedPipeline, selectedPipelineName, availableVersions])

  if (!dataset) {
    if (isLoading) {
      return (
        <div className="dataset-detail">
          <div className="detail-wrapper">
            <div className="detail-content">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-message">Loading dataset...</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="dataset-detail">
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate('/pipelines')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        </div>
        <div className="not-found">Dataset not found</div>
      </div>
    )
  }

  return (
    <div className="dataset-detail">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/pipelines')} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      <div className="detail-wrapper">
        <div className="detail-content">
          <div className="detail-title-section">
            <div className="detail-top-bar">
              <div className="detail-title-group">
                <h1 className="detail-title">{dataset.name}</h1>
                <div className="detail-id-group">
                  <span className="detail-id">ID: {dataset.id}</span>
                </div>
                <div className="detail-filters-inline">
                  <div className="pipeline-selector-inline">
                    <label className="pipeline-selector-label-inline">Pipeline</label>
                    <select
                      className="pipeline-select-inline"
                      value={selectedPipeline}
                      onChange={(e) => setSelectedPipeline(e.target.value)}
                    >
                      {dataset.systems && dataset.systems.length > 0 ? (
                        dataset.systems.map((pipelineUuid) => (
                          <option key={pipelineUuid} value={pipelineUuid}>
                            {getPipelineName(pipelineUuid)}
                          </option>
                        ))
                      ) : (
                        <option value="">No pipelines</option>
                      )}
                    </select>
                  </div>
                  <div className="pipeline-selector-inline version-selector-inline">
                    <label className="pipeline-selector-label-inline">Version</label>
                    <select
                      className="pipeline-select-inline"
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                    >
                      {availableVersions.length > 0 ? (
                        availableVersions.map((version) => (
                          <option key={version} value={version}>
                            {version}
                          </option>
                        ))
                      ) : (
                        <option value="">No versions</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div className="status-stack">
                <span className={`status-badge status-${dataset.status?.toLowerCase() || 'unknown'}`}>
                  {dataset.status || 'Unknown'}
                </span>
                <div className="notification-icons">
                  {notificationCounts.warnings > 0 && (
                    <button
                      type="button"
                      className="notification-icon-button warning"
                      onClick={() => setNotificationModal('warning')}
                      aria-label={`${notificationCounts.warnings} warnings`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <span className="notification-badge-count">{notificationCounts.warnings}</span>
                    </button>
                  )}
                  {notificationCounts.errors > 0 && (
                    <button
                      type="button"
                      className="notification-icon-button error"
                      onClick={() => setNotificationModal('error')}
                      aria-label={`${notificationCounts.errors} errors`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span className="notification-badge-count">{notificationCounts.errors}</span>
                    </button>
                  )}
                </div>
                <div className="detail-catalog-links">
                  {dataset.catalogUrl && (
                    <a
                      className="status-catalog-link"
                      href={dataset.catalogUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open catalog entry"
                    >
                      <img src={catalogIcon} alt="" className="catalog-icon-image" />
                      <span className="status-catalog-label">Catalog</span>
                    </a>
                  )}
                  {dataset.dataLakeUrl && (
                    <a
                      className="status-catalog-link"
                      href={dataset.dataLakeUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open data lake entry"
                    >
                      <img src={catalogIcon} alt="" className="catalog-icon-image" />
                      <span className="status-catalog-label">Data Lake</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline View - Handles all pipeline-specific rendering */}
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-message">Loading dataset content...</p>
            </div>
          ) : (
            <PipelineView
              pipeline={selectedPipeline}
              dataset={dataset}
              files={files}
              selectedFile={selectedFile}
              onFileSelect={(fileId) => {
                setSelectedFile(fileId)
              }}
              selectedZip={selectedZip}
              onZipSelect={(zipId) => {
                setSelectedZip(zipId)
              }}
              tables={dataset?.tables || []}
              selectedTable={selectedTable}
              onTableSelect={(tableName) => {
                setSelectedTable(tableName)
              }}
              pipelineAgreements={pipelineAgreements}
            />
          )}
        </div>
      </div>

      {/* Notification Modal */}
      {notificationModal && (
        <div className="notification-modal-overlay" onClick={() => setNotificationModal(null)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <h3 className="notification-modal-title">
                {notificationModal === 'warning' ? 'Warnings' : 'Errors'}
                <span className="notification-modal-count"> ({filteredNotifications.length})</span>
              </h3>
              <button
                className="notification-modal-close"
                onClick={() => setNotificationModal(null)}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="notification-modal-content">
              {filteredNotifications.length > 0 ? (
                <div className="notification-modal-table">
                  <div className="notification-modal-table-header">
                    <div className="notification-modal-header-cell">Type</div>
                    <div className="notification-modal-header-cell">Message</div>
                    <div className="notification-modal-header-cell">Timestamp</div>
                    <div className="notification-modal-header-cell">Status</div>
                  </div>
                  {filteredNotifications.map((notification, index) => (
                    <div key={index} className="notification-modal-table-row">
                      <div className="notification-modal-cell">
                        <span className={`notification-badge notification-${notification.type}`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </span>
                      </div>
                      <div className="notification-modal-cell">
                        <span className="notification-message">{notification.message || `${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} notification`}</span>
                      </div>
                      <div className="notification-modal-cell">
                        <span className="notification-timestamp">
                          {notification.timestamp ? notification.timestamp.replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19)}
                        </span>
                      </div>
                      <div className="notification-modal-cell">
                        <span className="notification-status">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="notification-modal-empty">No {notificationModal}s found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatasetDetail
