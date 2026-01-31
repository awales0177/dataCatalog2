import React from 'react'
import './FileRendererSkeleton.css'

const FileRendererSkeleton = () => {
  return (
    <div className="file-renderer skeleton-file-renderer">
      <div className="file-renderer-header">
        <div className="skeleton-pulse skeleton-renderer-title" style={{ width: '200px', height: '0.875rem' }} />
        <div className="file-renderer-actions">
          <div className="skeleton-pulse skeleton-renderer-link" style={{ width: '80px', height: '0.8125rem' }} />
          <div className="skeleton-pulse skeleton-renderer-button" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
          <div className="skeleton-pulse skeleton-renderer-button" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
        </div>
      </div>
      <div className="file-renderer-content skeleton-renderer-content">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-pulse skeleton-content-line" style={{ width: `${95 - i * 2}%`, height: '1.5rem', marginBottom: '0.75rem' }} />
        ))}
      </div>
    </div>
  )
}

export default FileRendererSkeleton
