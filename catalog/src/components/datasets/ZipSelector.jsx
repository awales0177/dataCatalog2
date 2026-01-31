import React, { useState, useMemo } from 'react'
import './ZipSelector.css'

const ZipSelector = ({ pipeline, files, selectedZip, onZipSelect }) => {
  const [zipSearchQuery, setZipSearchQuery] = useState('')

  // Filter files to only show zip files
  const zipFiles = useMemo(() => {
    if (!files || files.length === 0) return []
    return files.filter(file => {
      const fileType = file.type?.toLowerCase() || ''
      const fileName = file.name?.toLowerCase() || ''
      return fileType === 'zip' || 
             fileName.endsWith('.zip') || 
             fileName.endsWith('.rar') || 
             fileName.endsWith('.7z') ||
             fileName.endsWith('.tar') ||
             fileName.endsWith('.gz')
    })
  }, [files])

  // Filter zip files by search query
  const filteredZipFiles = useMemo(() => {
    if (!zipSearchQuery.trim()) return zipFiles
    
    const query = zipSearchQuery.toLowerCase()
    return zipFiles.filter(file => {
      const name = file.name?.toLowerCase() || ''
      const s3Path = file.s3Path?.toLowerCase() || ''
      return name.includes(query) || s3Path.includes(query)
    })
  }, [zipFiles, zipSearchQuery])

  const handleZipClick = (zipId) => {
    onZipSelect(zipId)
  }

  return (
    <div className="zip-selector-container">
      <div className="zip-selector-header">
        <h3 className="zip-selector-title">Select Archive</h3>
        <div className="zip-selector-search">
          <input
            type="text"
            placeholder="Search archives..."
            value={zipSearchQuery}
            onChange={(e) => setZipSearchQuery(e.target.value)}
            className="zip-selector-search-input"
          />
        </div>
      </div>

      <div className="zip-selector-list">
        {filteredZipFiles.length > 0 ? (
          filteredZipFiles.map((zipFile) => (
            <div
              key={zipFile.id}
              className={`zip-selector-item ${selectedZip === zipFile.id ? 'selected' : ''}`}
              onClick={() => handleZipClick(zipFile.id)}
            >
              <div className="zip-selector-item-content">
                <div className="zip-selector-item-name">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {zipFile.name || 'Unknown Archive'}
                </div>
                <div className="zip-selector-item-meta">
                  <span className="zip-selector-size">{zipFile.size}</span>
                  {zipFile.unpackInfo && (
                    <span className="zip-selector-files-count">
                      {zipFile.unpackInfo.filesExtracted || 0} files
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="zip-selector-empty">
            {zipSearchQuery ? 'No archives found matching your search.' : 'No archives available.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default ZipSelector
