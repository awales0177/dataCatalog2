import React, { useState, useMemo, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { ThemeContext } from '../../contexts/ThemeContext';
import catalogImage from '../../imgs/catalog.png';
import './DatasetSelector.css';

const DatasetSelector = ({ datasets = [], selectedDataset, onDatasetSelect }) => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const datasetsPerPage = 5;

  // Filter datasets based on search query
  const filteredDatasets = useMemo(() => {
    if (!searchQuery) return datasets;
    const query = searchQuery.toLowerCase();
    return datasets.filter(dataset => 
      dataset.name?.toLowerCase().includes(query) ||
      dataset.description?.toLowerCase().includes(query) ||
      dataset.id?.toLowerCase().includes(query)
    );
  }, [datasets, searchQuery]);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredDatasets.length / datasetsPerPage);
  const startIndex = (currentPage - 1) * datasetsPerPage;
  const endIndex = startIndex + datasetsPerPage;
  const paginatedDatasets = filteredDatasets.slice(startIndex, endIndex);
  
  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDatasetClick = (dataset) => {
    if (onDatasetSelect) {
      onDatasetSelect(dataset.id);
    }
  };

  const handleViewDataset = (dataset, event) => {
    event.stopPropagation();
    navigate(`/datasets/${dataset.id}`);
  };

  const handleViewPipelines = (dataset, event) => {
    event.stopPropagation();
    if (dataset.systems && dataset.systems.length > 0) {
      const pipelineUuid = dataset.systems[0];
      navigate(`/pipelines/datasets/${dataset.id}?pipeline=${pipelineUuid}`);
    } else {
      navigate(`/pipelines`);
    }
  };

  const handleViewInCatalog = (dataset, event) => {
    event.stopPropagation();
    // Navigate to datasets page with this dataset selected or highlighted
    navigate(`/datasets/${dataset.id}`);
  };

  const handleViewInDremio = (dataset, event) => {
    event.stopPropagation();
    // Open Dremio query interface for this dataset
    // You can customize this URL based on your Dremio setup
    const dremioUrl = dataset.s3Location 
      ? `https://dremio.example.com/query?path=${encodeURIComponent(dataset.s3Location)}`
      : `https://dremio.example.com/datasets/${dataset.id}`;
    window.open(dremioUrl, '_blank', 'noopener,noreferrer');
  };

  if (!datasets || datasets.length === 0) {
    return null;
  }

  return (
    <div className="detail-section dataset-selector-section">
      <div className="dataset-selector-header">
        <h3 className="section-title">Dataset Selector ({datasets.length})</h3>
      </div>
      <div className="dataset-selector-list-container">
        <div className="dataset-selector-main">
          <div className="dataset-search-wrapper">
            <svg className="dataset-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="dataset-search-input"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="dataset-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          <div className="dataset-selector">
            {filteredDatasets.length > 0 ? (
              <>
                {paginatedDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className={`dataset-item ${selectedDataset === dataset.id ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDatasetClick(dataset)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleDatasetClick(dataset);
                      }
                    }}
                  >
                    <div className="dataset-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    <div className="dataset-info">
                      <div className="dataset-name">{dataset.name || dataset.id}</div>
                      <div className="dataset-meta">
                        {dataset.description && (
                          <span className="dataset-description">{dataset.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="dataset-actions">
                      {dataset.systems && dataset.systems.length > 0 && (
                        <Tooltip title="View Pipeline Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={(event) => handleViewPipelines(dataset, event)}
                            className="dataset-action-button"
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: currentTheme.background,
                              border: `1px solid ${currentTheme.border}`,
                              borderRadius: '50%',
                              '&:hover': {
                                borderColor: '#37ABBF',
                                bgcolor: '#37ABBF20',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <img
                              src="/pipe-svgrepo-com.svg"
                              alt="Pipeline"
                              style={{
                                width: 18,
                                height: 18,
                                filter: currentTheme.darkMode ? 'invert(1)' : 'none',
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View in Catalog" arrow placement="top">
                        <IconButton
                          size="small"
                          onClick={(event) => handleViewInCatalog(dataset, event)}
                          className="dataset-action-button"
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: currentTheme.background,
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '50%',
                            '&:hover': {
                              borderColor: '#37ABBF',
                              bgcolor: '#37ABBF20',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <img
                            src={catalogImage}
                            alt="Catalog"
                            style={{
                              width: 18,
                              height: 18,
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View in Dremio" arrow placement="top">
                        <IconButton
                          size="small"
                          onClick={(event) => handleViewInDremio(dataset, event)}
                          className="dataset-action-button"
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: currentTheme.background,
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '50%',
                            '&:hover': {
                              borderColor: '#37ABBF',
                              bgcolor: '#37ABBF20',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <img
                            src="/dremio.png"
                            alt="Dremio"
                            style={{
                              width: 18,
                              height: 18,
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="dataset-pagination">
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
                      <span className="pagination-count">({filteredDatasets.length} datasets)</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="dataset-no-results">
                <p>No datasets found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

DatasetSelector.displayName = 'DatasetSelector';

export default DatasetSelector;
