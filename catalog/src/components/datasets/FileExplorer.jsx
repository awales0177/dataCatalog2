import React, { useState, useMemo } from 'react'
import './FileExplorer.css'

const FileExplorer = ({ files, selectedFile, onFileSelect, onFileOpen }) => {
  // Build directory tree and flat file map
  const { directoryTree } = useMemo(() => {
    const tree = {}
    const map = {}
    
    files.forEach(file => {
      const path = file.path || file.name || ''
      const parts = path.split('/').filter(p => p.length > 0)
      
      if (parts.length === 0) {
        // Root file
        if (!tree._files) {
          tree._files = []
        }
        tree._files.push(file)
        map[file.id] = { ...file, fullPath: '', folderPath: '' }
        return
      }
      
      const fileName = parts.pop()
      let current = tree
      const folderPath = parts.join('/')
      
      // Build tree structure
      parts.forEach(part => {
        if (!current[part]) {
          current[part] = { type: 'folder', name: part, children: {}, files: [] }
        }
        if (!current[part].children) {
          current[part].children = {}
        }
        current = current[part].children
      })
      
      // Add file to current directory
      if (!current._files) {
        current._files = []
      }
      const fileWithPath = { ...file, fileName, folderPath }
      current._files.push(fileWithPath)
      map[file.id] = { ...file, fileName, fullPath: path, folderPath }
    })
    
    return { directoryTree: tree }
  }, [files])
  
  // Current path navigation (array of folder names)
  const [currentPath, setCurrentPath] = useState([])
  
  // Get current directory contents
  const currentContents = useMemo(() => {
    let current = directoryTree
    
    // Navigate to current path
    currentPath.forEach(folderName => {
      if (current[folderName] && current[folderName].children) {
        current = current[folderName].children
      }
    })
    
    const contents = []
    
    // Add folders
    Object.keys(current)
      .filter(key => key !== '_files' && current[key].type === 'folder')
      .sort()
      .forEach(folderName => {
        contents.push({
          type: 'folder',
          name: folderName,
          path: [...currentPath, folderName]
        })
      })
    
    // Add files
    if (current._files) {
      current._files.forEach(file => {
        contents.push({
          type: 'file',
          ...file
        })
      })
    }
    
    return contents.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }, [directoryTree, currentPath])
  
  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath)
  }
  
  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
    }
  }
  
  const navigateToRoot = () => {
    setCurrentPath([])
  }
  
  // Build sidebar tree
  const renderSidebarTree = (node, path = []) => {
    const items = []
    
    Object.keys(node)
      .filter(key => key !== '_files' && node[key].type === 'folder')
      .sort()
      .forEach(folderName => {
        const folder = node[folderName]
        const folderPath = [...path, folderName]
        const isCurrent = JSON.stringify(folderPath) === JSON.stringify(currentPath)
        
        items.push(
          <div
            key={folderName}
            className={`sidebar-folder ${isCurrent ? 'active' : ''}`}
            onClick={() => navigateToFolder(folderPath)}
            role="button"
            tabIndex={0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{folderName}</span>
          </div>
        )
        
        // Recursively render children
        if (folder.children) {
          const children = renderSidebarTree(folder.children, folderPath)
          if (children.length > 0) {
            items.push(
              <div key={`${folderName}-children`} className="sidebar-folder-children">
                {children}
              </div>
            )
          }
        }
      })
    
    return items
  }
  
  return (
    <div className="file-explorer-native">
      {/* Sidebar */}
      <div className="explorer-sidebar">
        <div className="sidebar-header">Folders</div>
        <div className="sidebar-content">
          <div
            className={`sidebar-folder ${currentPath.length === 0 ? 'active' : ''}`}
            onClick={navigateToRoot}
            role="button"
            tabIndex={0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Root</span>
          </div>
          {renderSidebarTree(directoryTree)}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="explorer-main">
        {/* Breadcrumb */}
        <div className="explorer-breadcrumb">
          <button
            className="breadcrumb-button"
            onClick={navigateToRoot}
            disabled={currentPath.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </button>
          {currentPath.length > 0 && (
            <button
              className="breadcrumb-button"
              onClick={navigateUp}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
            </button>
          )}
          <div className="breadcrumb-path">
            {currentPath.length === 0 ? (
              <span className="breadcrumb-segment active">Root</span>
            ) : (
              <>
                <span
                  className="breadcrumb-segment"
                  onClick={navigateToRoot}
                  role="button"
                >
                  Root
                </span>
                {currentPath.map((folder, index) => (
                  <React.Fragment key={index}>
                    <span className="breadcrumb-separator">/</span>
                    <span
                      className={`breadcrumb-segment ${index === currentPath.length - 1 ? 'active' : ''}`}
                      onClick={() => navigateToFolder(currentPath.slice(0, index + 1))}
                      role="button"
                    >
                      {folder}
                    </span>
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>
        
        {/* File List */}
        <div className="explorer-content">
          {currentContents.length === 0 ? (
            <div className="explorer-empty">This folder is empty</div>
          ) : (
            <div className="explorer-items">
              {currentContents.map((item, index) => {
                if (item.type === 'folder') {
                  return (
                    <div
                      key={`folder-${item.name}`}
                      className="explorer-item explorer-folder-item"
                      onClick={() => navigateToFolder(item.path)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigateToFolder(item.path)
                        }
                      }}
                    >
                      <div className="explorer-item-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                      <div className="explorer-item-name">{item.name}</div>
                    </div>
                  )
                } else {
                  const isSelected = selectedFile === item.id
                  return (
                    <div
                      key={item.id}
                      className={`explorer-item explorer-file-item ${isSelected ? 'active' : ''}`}
                      onClick={() => onFileSelect(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onFileSelect(item.id)
                        }
                      }}
                    >
                      <div className="explorer-item-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <div className="explorer-item-name">{item.fileName || item.name}</div>
                      <div className="explorer-item-meta">{item.size || ''}</div>
                      <button
                        type="button"
                        className="explorer-item-open"
                        aria-label={`Open ${item.fileName || item.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onFileSelect(item.id)
                          onFileOpen(item.id)
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 3h7v7"></path>
                          <path d="M10 14L21 3"></path>
                          <path d="M21 14v7h-7"></path>
                          <path d="M3 10V3h7"></path>
                        </svg>
                      </button>
                    </div>
                  )
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileExplorer
