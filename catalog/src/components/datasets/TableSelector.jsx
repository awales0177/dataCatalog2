import React, { useState, useMemo, useEffect } from 'react'
import { getPipelineConfig } from '../../config/pipelineConfig'
import './TableSelector.css'

const TableSelector = ({ pipeline, tables = [], onTableSelect, selectedTable }) => {
  const [tableSearchQuery, setTableSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const tablesPerPage = 10

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    if (!tableSearchQuery) return tables
    const query = tableSearchQuery.toLowerCase()
    return tables.filter(table => 
      table.name.toLowerCase().includes(query) ||
      table.s3Location?.toLowerCase().includes(query)
    )
  }, [tables, tableSearchQuery])
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredTables.length / tablesPerPage)
  const startIndex = (currentPage - 1) * tablesPerPage
  const endIndex = startIndex + tablesPerPage
  const paginatedTables = filteredTables.slice(startIndex, endIndex)
  
  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [tableSearchQuery])

  // Check if this pipeline should show table selector
  const config = getPipelineConfig(pipeline)
  if (!config.layout?.showTableSelector) {
    return null
  }

  return (
    <div className="detail-section table-selector-section">
      <div className="table-selector-header">
        <h3 className="section-title">Table Selector ({tables.length})</h3>
      </div>
      <div className="table-search-wrapper">
        <svg className="table-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          className="table-search-input"
          placeholder="Search tables..."
          value={tableSearchQuery}
          onChange={(e) => setTableSearchQuery(e.target.value)}
        />
        {tableSearchQuery && (
          <button
            className="table-search-clear"
            onClick={() => setTableSearchQuery('')}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      <div className="table-selector">
        {filteredTables.length > 0 ? (
          <>
            <div className="table-chips-container">
              {paginatedTables.map((table, index) => (
                <button
                  key={index}
                  type="button"
                  className={`table-chip ${selectedTable === table.name ? 'active' : ''}`}
                  onClick={() => onTableSelect(table.name)}
                >
                  {table.name}
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="table-pagination">
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
                  <span className="pagination-count">({filteredTables.length} tables)</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="table-no-results">
            <p>No tables found matching "{tableSearchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TableSelector
