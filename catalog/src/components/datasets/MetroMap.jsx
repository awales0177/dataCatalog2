import React, { useState, useEffect, useRef, useCallback } from 'react'
import './MetroMap.css'

const MetroMap = ({ stepCompletionStatus = null, viewToggle = null }) => {
  const [hoverInfo, setHoverInfo] = useState(null)
  const svgContainerRef = useRef(null)
  
  // Default step completion status (uses "complete" or "running")
  // Can include runtime: { status: 'complete', runtime: '1h 30m' }
  const defaultStepStatus = {
    'Data Collection': { status: 'complete', runtime: '1h 30m' },
    'Data Validation': { status: 'complete', runtime: '45m' },
    'Data Transformation': { status: 'complete', runtime: '2h' },
    'Data Storage': { status: 'pending', runtime: '30m' },
    'Data Analysis': { status: 'complete', runtime: '1h 15m' },
    'Quality Assurance': { status: 'running', runtime: '40m' },
    'Completion': { status: 'pending', runtime: '15m' }
  }
  
  // Use provided status or default
  const stepStatus = stepCompletionStatus || defaultStepStatus
  
  // Helper to get status value (handles both object and string formats for backward compatibility)
  const getStepStatus = useCallback((stepName) => {
    const step = stepStatus[stepName]
    if (typeof step === 'object' && step !== null) {
      return step.status || 'pending'
    }
    return step || 'pending'
  }, [stepStatus])
  
  // Helper to get runtime value
  const getStepRuntime = useCallback((stepName) => {
    const step = stepStatus[stepName]
    if (typeof step === 'object' && step !== null) {
      return step.runtime || null
    }
    return null
  }, [stepStatus])
  
  // Helper to format runtime for display
  const formatRuntime = (runtime) => {
    if (!runtime) return 'N/A'
    
    // Parse runtime string (e.g., "1h 30m", "45m", "2h", "1d 2h")
    const daysMatch = runtime.match(/(\d+)d/)
    const hoursMatch = runtime.match(/(\d+)h/)
    const minsMatch = runtime.match(/(\d+)m/)
    
    const days = daysMatch ? parseInt(daysMatch[1]) : 0
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0
    const mins = minsMatch ? parseInt(minsMatch[1]) : 0
    
    const parts = []
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hr' : 'hrs'}`)
    if (mins > 0) parts.push(`${mins} ${mins === 1 ? 'min' : 'mins'}`)
    
    return parts.length > 0 ? parts.join(' ') : runtime
  }

  useEffect(() => {
    // Hide tooltip on scroll
    const handleScroll = () => {
      setHoverInfo(null)
    }
    
    // Check if mouse is over any interactive element
    const handleMouseMove = (e) => {
      if (!hoverInfo) return
      
      const target = e.target
      const isOverInteractiveElement = 
        target.classList.contains('metro-line') ||
        target.classList.contains('metro-station-hover') ||
        target.classList.contains('metro-station-label') ||
        target.tagName === 'image' ||
        target.getAttribute('data-input-id') ||
        target.closest('[data-station-id]') ||
        target.closest('[data-input-id]')
      
      if (!isOverInteractiveElement) {
        // Mouse is not over any interactive element, clear tooltip
        setHoverInfo(null)
      }
    }
    
    window.addEventListener('scroll', handleScroll, true)
    document.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [hoverInfo])

  useEffect(() => {
    const container = svgContainerRef.current
    if (!container) return

    fetch('/metro.svg')
      .then(response => response.text())
      .then(svgText => {
        container.innerHTML = svgText
        
        const svg = container.querySelector('svg')
        if (!svg) return
        
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
        svg.style.width = '100%'
        svg.style.height = 'auto'
        svg.style.maxHeight = '200px'
        svg.style.display = 'block'
        svg.style.overflow = 'visible'
        
        // Define data processing step labels for each station (must match stepStatus keys)
        const stepLabels = [
          'Data Collection',
          'Data Validation',
          'Data Transformation',
          'Data Storage',
          'Data Analysis',
          'Quality Assurance',
          'Completion'
        ]
        
        // Get all station positions and map them to their step labels
        const stationPositions = []
        svg.querySelectorAll('image').forEach((img, idx) => {
          const x = parseFloat(img.getAttribute('x') || 0)
          const y = parseFloat(img.getAttribute('y') || 0)
          const stepName = stepLabels[idx] || `Step ${idx + 1}`
          stationPositions.push({ index: idx, x, y, stepName })
        })
        
        // Sort stations by x position to determine order (left to right)
        stationPositions.sort((a, b) => {
          // If y positions are very different, they're on different rows
          if (Math.abs(a.y - b.y) > 30) {
            return a.y - b.y // Top row first
          }
          return a.x - b.x // Then by x position
        })
        
        const paths = svg.querySelectorAll('path[stroke]')
        paths.forEach((path) => {
          const originalStrokeWidth = path.getAttribute('stroke-width') || '10'
          const originalStroke = path.getAttribute('stroke') || '#24b064'
          
          path.setAttribute('class', 'metro-line')
          path.setAttribute('data-line-group', 'green-line')
          path.setAttribute('data-original-stroke-width', originalStrokeWidth)
          path.setAttribute('data-original-stroke', originalStroke)
          
          // Get path end coordinates to determine which station it connects to
          const pathD = path.getAttribute('d') || ''
          const pathEndMatch = pathD.match(/L\s+(\d+\.?\d*)\s+(\d+\.?\d*)$/)
          
          if (pathEndMatch) {
            const endX = parseFloat(pathEndMatch[1])
            const endY = parseFloat(pathEndMatch[2])
            
            // Find which station this path connects to (check end point)
            const endStation = stationPositions.find(pos => {
              const stationCenterX = pos.x + 15 // Station images are ~30px wide, center is x + 15
              const stationCenterY = pos.y + 15
              return Math.abs(endX - stationCenterX) < 50 && Math.abs(endY - stationCenterY) < 50
            })
            
            // Check if the step this path connects to is complete or running
            // Lines leading to complete or running steps should be solid
            const endStepStatus = endStation ? getStepStatus(endStation.stepName) : 'complete'
            const isStepActive = endStepStatus === 'complete' || endStepStatus === 'running' || endStepStatus === 'backlog'
            
            if (isStepActive) {
              // Step is complete or running - make line solid
              path.setAttribute('stroke', originalStroke)
              path.setAttribute('stroke-opacity', '1')
              path.style.opacity = '1'
              path.style.cursor = 'pointer'
            } else {
              // Step is pending/not started - make line translucent but still block underlying content
              path.setAttribute('stroke', originalStroke)
              path.setAttribute('stroke-opacity', '0.3')
              path.style.opacity = '1' // Keep element fully opaque to block content behind
              path.style.cursor = 'default'
            }
          } else {
            // Fallback: make all paths solid if we can't determine connection
            path.setAttribute('stroke', originalStroke)
            path.style.opacity = '1'
            path.style.cursor = 'pointer'
          }
          
          path.style.transition = 'all 0.2s ease'
          
          path.addEventListener('mouseenter', (e) => {
            // Only show hover for solid (non-translucent) paths
            if (e.target.style.opacity !== '0.3') {
              setHoverInfo({
                type: 'line',
                id: 'green-line',
                color: 'Pipeline C',
                x: e.clientX,
                y: e.clientY
              })
              e.target.setAttribute('stroke-width', String(parseFloat(originalStrokeWidth) + 3))
              e.target.style.filter = 'brightness(1.2) drop-shadow(0 0 4px currentColor)'
            }
          })
          
          path.addEventListener('mouseleave', (e) => {
            // Reset hover for all paths
            const originalWidth = e.target.getAttribute('data-original-stroke-width')
            e.target.setAttribute('stroke-width', originalWidth)
            e.target.style.filter = ''
            // Always clear tooltip on mouseleave
            setHoverInfo(null)
          })
        })
        
        const images = svg.querySelectorAll('image')
        images.forEach((image, index) => {
          const x = parseFloat(image.getAttribute('x') || 0)
          const y = parseFloat(image.getAttribute('y') || 0)
          const width = parseFloat(image.getAttribute('width') || 30)
          const height = parseFloat(image.getAttribute('height') || 30)
          
          // Get the step name for this station
          const stepName = stepLabels[index] || `Step ${index + 1}`
          const stepStatusValue = getStepStatus(stepName)
          const stepRuntime = getStepRuntime(stepName)
          const isStepComplete = stepStatusValue === 'complete'
          const isCurrentStep = stepStatusValue === 'running'
          const isBacklog = stepStatusValue === 'backlog'
          
          // Create a label text element for this station (step name)
          const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          const label = stepName
          labelText.textContent = label
          labelText.setAttribute('x', x + width / 2)
          labelText.setAttribute('y', y + height + 18)
          labelText.setAttribute('text-anchor', 'middle')
          labelText.setAttribute('class', 'metro-station-label')
          labelText.setAttribute('data-station-index', index)
          labelText.style.fontSize = '11px'
          labelText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif'
          labelText.style.fontWeight = '500'
          
          // Style label based on status
          if (isCurrentStep) {
            labelText.style.fill = '#ff9500' // Orange for current step
          } else if (isStepComplete) {
            labelText.style.fill = '#000000' // Black for completed
          } else if (isBacklog) {
            labelText.style.fill = '#2196f3' // Blue for backlog
          } else {
            labelText.style.fill = '#999999' // Gray for incomplete
          }
          labelText.style.pointerEvents = 'none'
          
          // Insert step name label after the image
          const parent = image.parentNode
          if (parent) {
            parent.insertBefore(labelText, image.nextSibling)
          }
          
          // Create a runtime text element below the step name (only for complete or running steps)
          if (isStepComplete || isCurrentStep) {
            const runtimeText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            const formattedRuntime = formatRuntime(stepRuntime)
            runtimeText.textContent = formattedRuntime
            runtimeText.setAttribute('x', x + width / 2)
            runtimeText.setAttribute('y', y + height + 32)
            runtimeText.setAttribute('text-anchor', 'middle')
            runtimeText.setAttribute('class', 'metro-station-runtime')
            runtimeText.setAttribute('data-station-index', index)
            runtimeText.style.fontSize = '9px'
            runtimeText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif'
            runtimeText.style.fontWeight = '400'
            runtimeText.style.fill = '#666666'
            runtimeText.style.pointerEvents = 'none'
            
            // Insert runtime label after the step name label
            if (parent) {
              parent.insertBefore(runtimeText, labelText.nextSibling)
            }
          }
          
          // Style the station image based on completion status
          if (isCurrentStep) {
            // Current step - orange
            image.style.opacity = '1'
            image.style.filter = 'drop-shadow(0 0 8px #ff9500) brightness(1.1)'
            image.style.transition = 'filter 0.3s ease'
          } else if (isStepComplete) {
            // Completed step - green
            image.style.opacity = '1'
            image.style.filter = 'drop-shadow(0 0 6px #24b064)'
          } else if (isBacklog) {
            // Backlog step - blue
            image.style.opacity = '1'
            image.style.filter = 'drop-shadow(0 0 6px #2196f3)'
            image.style.transition = 'filter 0.3s ease'
          } else {
            // Incomplete step - translucent but still block underlying content
            // Use opacity on the image itself for translucency, but keep element in DOM for layering
            image.style.opacity = '0.3'
            image.style.filter = 'grayscale(100%)'
            // Ensure the image still blocks content behind it by keeping it in the render stack
            image.style.pointerEvents = 'auto'
            
            // Add a semi-transparent background rect behind incomplete images to block underlying content
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            bgRect.setAttribute('x', x - 2)
            bgRect.setAttribute('y', y - 2)
            bgRect.setAttribute('width', width + 4)
            bgRect.setAttribute('height', height + 4)
            bgRect.setAttribute('fill', '#fafafa') // Match site background
            bgRect.setAttribute('fill-opacity', '0.7') // Semi-transparent but blocks content
            bgRect.setAttribute('rx', '4')
            bgRect.style.pointerEvents = 'none'
            bgRect.setAttribute('class', 'metro-station-bg')
            
            // Insert background rect before the image
            if (parent) {
              parent.insertBefore(bgRect, image)
            }
          }
          
          // Create a larger rect for better hover detection (invisible)
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          rect.setAttribute('x', x - 5)
          rect.setAttribute('y', y - 5)
          rect.setAttribute('width', width + 10)
          rect.setAttribute('height', height + 10)
          rect.setAttribute('fill', 'transparent')
          rect.setAttribute('stroke', 'none')
          rect.setAttribute('class', 'metro-station-hover')
          rect.setAttribute('data-station-id', `station-${index}`)
          rect.setAttribute('data-station-index', index)
          rect.style.cursor = (isStepComplete || isCurrentStep) ? 'pointer' : 'default'
          rect.style.pointerEvents = 'all'
          rect.style.opacity = '0'
          
          // Insert rect before the image so it's behind but captures hover
          if (parent) {
            parent.insertBefore(rect, image)
          }
          
          // Also add hover to the image itself as backup
          image.style.cursor = (isStepComplete || isCurrentStep) ? 'pointer' : 'default'
          image.setAttribute('data-station-id', `station-${index}`)
          image.setAttribute('data-station-index', index)
          
          const handleMouseEnter = (e) => {
            // Only show hover for completed or current steps
            if (!isStepComplete && !isCurrentStep) return
            
            const target = e.target
            const stationIndex = parseInt(target.getAttribute('data-station-index') || index)
            setHoverInfo({
              type: 'station',
              id: `station-${stationIndex}`,
              name: stepName,
              status: stepStatusValue,
              runtime: stepRuntime,
              x: e.clientX,
              y: e.clientY
            })
            // Only highlight the image, never the rect
            if (image) {
              if (isCurrentStep) {
                // Current step - enhance orange glow
                image.style.filter = 'drop-shadow(0 0 12px #ff9500) brightness(1.2)'
              } else if (isStepComplete) {
                // Completed step - enhance green glow
                image.style.filter = 'drop-shadow(0 0 10px #24b064) brightness(1.1)'
              }
              image.style.transition = 'filter 0.2s ease'
            }
          }
          
          const handleMouseLeave = (e) => {
            // Reset the image to its completion status styling
            if (image) {
              if (isCurrentStep) {
                image.style.filter = 'drop-shadow(0 0 8px #ff9500) brightness(1.1)'
              } else if (isStepComplete) {
                image.style.filter = 'drop-shadow(0 0 6px #24b064)'
              } else {
                image.style.filter = 'grayscale(100%)'
              }
            }
            // Always clear tooltip when leaving station
            setHoverInfo(null)
          }
          
          // Add listeners to both the rect (expanded hover area) and the image
          // This ensures we catch hover events properly and clear tooltip when leaving either
          rect.addEventListener('mouseenter', handleMouseEnter)
          rect.addEventListener('mouseleave', handleMouseLeave)
          image.addEventListener('mouseenter', handleMouseEnter)
          image.addEventListener('mouseleave', handleMouseLeave)
        })
        
        // Handle input files (rect elements with text)
        const rects = svg.querySelectorAll('rect[pointer-events="all"]')
        rects.forEach((rect, index) => {
          // Check if this rect contains text (like "Input")
          const parent = rect.parentNode
          const hasText = parent && (
            parent.querySelector('text') || 
            parent.querySelector('foreignObject') ||
            parent.textContent.includes('Input')
          )
          
          if (hasText) {
            const x = parseFloat(rect.getAttribute('x') || 0)
            const y = parseFloat(rect.getAttribute('y') || 0)
            const width = parseFloat(rect.getAttribute('width') || 0)
            const height = parseFloat(rect.getAttribute('height') || 0)
            
            // Create a larger invisible hover area for better detection
            const hoverRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            hoverRect.setAttribute('x', x - 5)
            hoverRect.setAttribute('y', y - 5)
            hoverRect.setAttribute('width', width + 10)
            hoverRect.setAttribute('height', height + 10)
            hoverRect.setAttribute('fill', 'transparent')
            hoverRect.setAttribute('stroke', 'none')
            hoverRect.setAttribute('data-input-id', `input-${index}`)
            hoverRect.style.cursor = 'pointer'
            hoverRect.style.pointerEvents = 'all'
            hoverRect.style.opacity = '0'
            
            // Insert before the original rect
            const parent = rect.parentNode
            if (parent) {
              parent.insertBefore(hoverRect, rect)
            }
            
            // Make sure the original rect is also hoverable
            rect.style.cursor = 'pointer'
            rect.setAttribute('data-input-id', `input-${index}`)
            
            const handleInputEnter = (e) => {
              setHoverInfo({
                type: 'input',
                id: `input-${index}`,
                name: 'Input Files',
                x: e.clientX,
                y: e.clientY
              })
              // Highlight the original rect slightly
              if (rect) {
                rect.style.fill = 'rgba(0, 123, 255, 0.1)'
              }
            }
            
            const handleInputLeave = (e) => {
              if (rect) {
                rect.style.fill = 'none'
              }
              // Always clear tooltip when leaving input
              setHoverInfo(null)
            }
            
            // Only add listeners to the hoverRect (inserted before, so it's the hover target)
            hoverRect.addEventListener('mouseenter', handleInputEnter)
            hoverRect.addEventListener('mouseleave', handleInputLeave)
          }
        })
      })
      .catch(error => {
        console.error('Error loading metro.svg:', error)
      })
  }, [stepStatus, getStepStatus, getStepRuntime])

  return (
    <div className="metro-map-wrapper">
      <div className="metro-map-header">
        <h3 className="section-title">Data Flow Map</h3>
        {viewToggle && <div className="metro-map-header-toggle">{viewToggle}</div>}
      </div>
      <div 
        ref={svgContainerRef}
        className="metro-map-svg-container"
      />
      {hoverInfo && (
        <div
          className="metro-map-tooltip"
          style={{
            left: `${hoverInfo.x + 10}px`,
            top: `${hoverInfo.y - 10}px`
          }}
        >
          {hoverInfo.type === 'line' ? (
            <div>
              <strong>{hoverInfo.color}</strong>
              <div className="tooltip-subtitle"></div>
            </div>
          ) : hoverInfo.type === 'input' ? (
            <div>
              <strong>{hoverInfo.name}</strong>
              <div className="tooltip-subtitle"></div>
            </div>
          ) : (
            <div>
              <strong>{hoverInfo.name}</strong>
              {(hoverInfo.status || hoverInfo.runtime) && (
                <div className="tooltip-subtitle">
                  {hoverInfo.status && (
                    <span style={{ 
                      textTransform: 'capitalize',
                      color: hoverInfo.status === 'running' ? '#ff9500' : 
                             hoverInfo.status === 'complete' ? '#24b064' : '#999999',
                      marginRight: hoverInfo.runtime ? '8px' : '0'
                    }}>
                      {hoverInfo.status}
                    </span>
                  )}
                  {hoverInfo.runtime && (
                    <span style={{ color: '#999' }}>
                      {hoverInfo.status ? '•' : ''} {formatRuntime(hoverInfo.runtime)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MetroMap
