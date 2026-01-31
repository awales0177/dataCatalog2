import React, { useEffect, useMemo, useState } from 'react'
import { FileRendererSkeleton } from './skeletons'
import './FileRenderer.css'

const IMAGE_TYPES = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'image'])
const TEXT_TYPES = new Set(['txt', 'text'])
const TABULAR_TYPES = new Set(['csv', 'xlsx', 'xls'])
const XLS_TYPES = new Set(['xls', 'xlsx'])
const AUDIO_TYPES = new Set(['mp3', 'wav', 'ogg', 'audio'])
const VIDEO_TYPES = new Set(['mp4', 'mov', 'webm', 'video'])
const PPT_TYPES = new Set(['ppt', 'pptx'])
const DOCX_TYPES = new Set(['docx'])

const normalizeType = (file) => {
  if (!file) return ''
  if (file.type) return file.type.toLowerCase()
  const name = file.name || ''
  const ext = name.includes('.') ? name.split('.').pop() : ''
  return ext.toLowerCase()
}

const parseCsv = (content) => {
  const lines = content.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(cell => cell.trim())
  const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
  return { headers, rows }
}

const buildMockTable = (file) => {
  const rawColumns = file?.schema?.columns
  const headers = rawColumns?.length
    ? rawColumns.map(col => typeof col === 'string' ? col : col.name)
    : ['column_1', 'column_2', 'column_3']
  const rows = Array.from({ length: 5 }, (_, rowIndex) =>
    headers.map((header, colIndex) => `${header}_${rowIndex + 1 + colIndex}`)
  )
  return { headers, rows }
}

const FileRenderer = React.memo(function FileRenderer({ file }) {
  const [textContent, setTextContent] = useState('')
  const [csvData, setCsvData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [viewAsText, setViewAsText] = useState(false)
  const [textModeContent, setTextModeContent] = useState('')
  const [textModeLoading, setTextModeLoading] = useState(false)

  const normalizedType = useMemo(() => normalizeType(file), [file])

  // Reset view as text when file changes
  useEffect(() => {
    setViewAsText(false)
    setTextModeContent('')
    setTextModeLoading(false)
  }, [file?.id, file?.url])
  const isLocalAsset = useMemo(() => {
    if (!file?.url) return true
    if (file.url.startsWith('blob:')) return true
    try {
      const parsed = new URL(file.url)
      return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    } catch (error) {
      return true
    }
  }, [file?.url])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const loadText = async () => {
      if (!file?.url) {
        if (TABULAR_TYPES.has(normalizedType)) {
          setCsvData(buildMockTable(file))
        }
        if (TEXT_TYPES.has(normalizedType)) {
          const fallbackText = file?.name
            ? `Preview for ${file.name}\n\nNo file URL is available in this dataset.`
            : 'Preview not available for this file.'
          setTextContent(fallbackText)
        }
        return
      }
      if (!(normalizedType === 'json' || normalizedType === 'csv' || TEXT_TYPES.has(normalizedType))) {
        return
      }

      setIsLoading(true)
      setLoadError('')
      setTextContent('')
      setCsvData(null)

      try {
        const response = await fetch(file.url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Unable to load file content.')
        }
        const content = await response.text()

        if (!isMounted) return

        if (normalizedType === 'json') {
          try {
            const parsed = JSON.parse(content)
            setTextContent(JSON.stringify(parsed, null, 2))
          } catch (error) {
            setTextContent(content)
          }
        } else if (normalizedType === 'csv') {
          setCsvData(parseCsv(content))
        } else {
          setTextContent(content)
        }
      } catch (error) {
        if (!isMounted) return
        if (error.name !== 'AbortError') {
          setLoadError('Preview not available for this file.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadText()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [file, normalizedType])

  if (!file) {
    return (
      <div className="file-renderer">
        <div className="file-renderer-header">
          <h4 className="file-renderer-title">File Preview</h4>
        </div>
        <div className="file-renderer-empty">
          Select a file and click the open icon to preview it here.
        </div>
      </div>
    )
  }

  return (
    <div className="file-renderer">
      <div className="file-renderer-header">
        <h4 className="file-renderer-title">File Preview</h4>
        {file.url && (
          <div className="file-renderer-actions">
            <button
              className="file-renderer-button"
              onClick={() => {
                setViewAsText(!viewAsText)
                if (!viewAsText && !textModeContent && file.url) {
                  setTextModeLoading(true)
                  fetch(file.url)
                    .then(response => response.text())
                    .then(content => {
                      setTextModeContent(content)
                      setTextModeLoading(false)
                    })
                    .catch(error => {
                      setTextModeContent('Unable to load file as text.')
                      setTextModeLoading(false)
                    })
                }
              }}
            >
              {viewAsText ? 'View as file' : 'View as text'}
            </button>
            <a className="file-renderer-button" href={file.url} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
            <a
              className="file-renderer-button"
              href={file.url}
              download={file.name}
            >
              Download
            </a>
          </div>
        )}
      </div>

      {viewAsText ? (
        <div className="file-renderer-text-content">
          {textModeLoading ? (
            <FileRendererSkeleton />
          ) : (
            <pre className="file-renderer-text-pre">{textModeContent || 'No content available.'}</pre>
          )}
        </div>
      ) : isLoading ? (
        <FileRendererSkeleton />
      ) : loadError ? (
        <div className="file-renderer-empty">{loadError}</div>
      ) : normalizedType === 'pdf' && file.url ? (
        <iframe className="file-renderer-frame" src={file.url} title={file.name} />
      ) : file.url && IMAGE_TYPES.has(normalizedType) ? (
        <div className="file-renderer-image">
          <img src={file.url} alt={file.name} />
        </div>
      ) : file.url && DOCX_TYPES.has(normalizedType) ? (
        isLocalAsset ? (
          <div className="file-renderer-empty">
            DOCX preview requires a publicly accessible URL. Download the file to view it locally.
          </div>
        ) : (
          <iframe
            className="file-renderer-frame"
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
            title={file.name}
          />
        )
      ) : file.url && PPT_TYPES.has(normalizedType) ? (
        isLocalAsset ? (
          <div className="file-renderer-empty">
            PPT preview requires a publicly accessible URL. Download the file to view it locally.
          </div>
        ) : (
          <iframe
            className="file-renderer-frame"
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
            title={file.name}
          />
        )
      ) : file.url && XLS_TYPES.has(normalizedType) ? (
        isLocalAsset ? (
          <div className="file-renderer-empty">
            XLS preview requires a publicly accessible URL. Download the file to view it locally.
          </div>
        ) : (
          <iframe
            className="file-renderer-frame"
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
            title={file.name}
          />
        )
      ) : file.url && AUDIO_TYPES.has(normalizedType) ? (
        <div className="file-renderer-media">
          <audio controls src={file.url}>
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : file.url && VIDEO_TYPES.has(normalizedType) ? (
        <div className="file-renderer-media">
          <video controls src={file.url} />
        </div>
      ) : TABULAR_TYPES.has(normalizedType) && csvData ? (
        <div className="file-renderer-table">
          <table>
            <thead>
              <tr>
                {csvData.headers.map((header, index) => (
                  <th key={`${header}-${index}`}>{header || `Column ${index + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.rows.slice(0, 20).map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : textContent ? (
        <pre className="file-renderer-text">{textContent}</pre>
      ) : (
        <div className="file-renderer-empty">Preview not available for this file type.</div>
      )}
    </div>
  )
})

FileRenderer.displayName = 'FileRenderer'

export default FileRenderer
