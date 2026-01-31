import React, { useState, useMemo, useEffect } from 'react'
import FileExplorer from './FileExplorer'
import FileRenderer from './FileRenderer'
import { getPipelineConfig } from '../../config/pipelineConfig'
import './FileSelector.css'

const FileSelector = React.memo(({ pipeline, files = [], onFileSelect, selectedFile }) => {
  const [fileViewMode, setFileViewMode] = useState('list')
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [openFileId, setOpenFileId] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const filesPerPage = 5

  // Extract all unique tags from files
  const availableTags = useMemo(() => {
    const tagSet = new Set()
    files.forEach(file => {
      if (file.tags && Array.isArray(file.tags)) {
        file.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [files])

  // Filter files based on search query and selected tags
  const filteredFiles = useMemo(() => {
    let filtered = files

    // Filter by search query
    if (fileSearchQuery) {
      const query = fileSearchQuery.toLowerCase()
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query)
      )
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(file => {
        if (!file.tags || !Array.isArray(file.tags)) return false
        return selectedTags.some(tag => file.tags.includes(tag))
      })
    }

    return filtered
  }, [files, fileSearchQuery, selectedTags])
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
  const startIndex = (currentPage - 1) * filesPerPage
  const endIndex = startIndex + filesPerPage
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex)
  
  // Reset to page 1 when search query or tags change
  useEffect(() => {
    setCurrentPage(1)
  }, [fileSearchQuery, selectedTags])

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearAllTags = () => {
    setSelectedTags([])
  }

  const openFile = files.find(f => f.id === openFileId) || null

  // Check if this pipeline should show file selector
  const config = getPipelineConfig(pipeline)
  if (!config.layout?.showFileSelector) {
    return null
  }

  return (
    <div className="detail-section file-selector-section">
      <div className="file-selector-header">
        <h3 className="section-title">File Selector ({files.length})</h3>
        <div className="file-view-toggle">
          <button
            type="button"
            className={`file-view-toggle-button ${fileViewMode === 'list' ? 'active' : ''}`}
            onClick={() => setFileViewMode('list')}
            aria-label="List view"
            title="List view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          <button
            type="button"
            className={`file-view-toggle-button ${fileViewMode === 'explorer' ? 'active' : ''}`}
            onClick={() => setFileViewMode('explorer')}
            aria-label="Explorer view"
            title="Explorer view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
      </div>
      {fileViewMode === 'list' && (
        <div className="file-selector-list-container">
          {availableTags.length > 0 && (
            <div className="file-tag-filter-sidebar">
              <div className="file-tag-filter-header">
                <h4 className="file-tag-filter-title">Filter by Tags</h4>
                {selectedTags.length > 0 && (
                  <button
                    className="file-tag-filter-clear"
                    onClick={clearAllTags}
                    aria-label="Clear all tags"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="file-tag-filter-list">
                {availableTags.map(tag => (
                  <label key={tag} className="file-tag-filter-item">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className="file-tag-checkbox"
                    />
                    <span className="file-tag-label">{tag}</span>
                    <span className="file-tag-count">
                      ({files.filter(f => f.tags && f.tags.includes(tag)).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="file-selector-main">
            <div className="file-search-wrapper">
              <svg className="file-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="file-search-input"
                placeholder="Search files..."
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
              />
              {fileSearchQuery && (
                <button
                  className="file-search-clear"
                  onClick={() => setFileSearchQuery('')}
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            <div className="file-selector">
            {filteredFiles.length > 0 ? (
              <>
                {paginatedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`file-item ${selectedFile === file.id ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onFileSelect(file.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onFileSelect(file.id)
                      }
                    }}
                  >
                    <div className="file-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        <span className="file-s3-path">{file.s3Path || `s3://tracer-prod/${file.path || file.name}`}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="file-open-button"
                      aria-label={`Open ${file.name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onFileSelect(file.id)
                        setOpenFileId(file.id)
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3h7v7"></path>
                        <path d="M10 14L21 3"></path>
                        <path d="M21 14v7h-7"></path>
                        <path d="M3 10V3h7"></path>
                      </svg>
                    </button>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="file-pagination">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6"/>
                        </svg>
                      </button>
                      <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    </div>
                    <div className="pagination-info">
                      <span>Page {currentPage} of {totalPages}</span>
                      <span className="pagination-count">({filteredFiles.length} files)</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="file-no-results">
                <p>No files found matching "{fileSearchQuery}"</p>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
      {fileViewMode === 'explorer' && (
        <FileExplorer
          files={filteredFiles}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          onFileOpen={(fileId) => {
            onFileSelect(fileId)
            setOpenFileId(fileId)
          }}
        />
      )}
      <FileRenderer file={openFile} />
    </div>
  )
})

FileSelector.displayName = 'FileSelector'

export default FileSelector
