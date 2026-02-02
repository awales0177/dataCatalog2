import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const MermaidDiagram = ({ children, className }) => {
  const mermaidRef = useRef(null);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize mermaid once
  useEffect(() => {
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
        },
        themeVariables: {
          primaryColor: '#37ABBF',
          primaryTextColor: '#fff',
          primaryBorderColor: '#37ABBF',
          lineColor: '#37ABBF',
          secondaryColor: '#f4f4f4',
          tertiaryColor: '#fff',
        },
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!mermaidRef.current || !children || !isInitialized) return;
    if (!className || !className.includes('language-mermaid')) return;

    // Convert children to string (handle both string and array)
    const mermaidCode = Array.isArray(children)
      ? children.join('')
      : String(children);
    
    const trimmedCode = mermaidCode.trim();
    
    if (!trimmedCode) return;

    // Clear previous content
    mermaidRef.current.innerHTML = '';

    // Render the mermaid diagram
    mermaid
      .render(diagramId, trimmedCode)
      .then((result) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = result.svg;
          // Make SVG responsive
          const svg = mermaidRef.current.querySelector('svg');
          if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
            svg.style.display = 'block';
            svg.style.margin = '0 auto';
          }
        }
      })
      .catch((err) => {
        console.error('Mermaid rendering error:', err);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<div style="color: #f44336; padding: 10px; border: 1px solid #f44336; border-radius: 4px; background: rgba(244, 67, 54, 0.1);">Error rendering Mermaid diagram: ${err.message}</div>`;
        }
      });
  }, [children, className, diagramId, isInitialized]);

  // Only render if this is a mermaid code block
  if (!className || !className.includes('language-mermaid')) {
    return null;
  }

  return (
    <div
      ref={mermaidRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '20px 0',
        padding: '20px',
        backgroundColor: 'transparent',
        overflow: 'auto',
        minHeight: '50px',
      }}
    />
  );
};

export default MermaidDiagram;
