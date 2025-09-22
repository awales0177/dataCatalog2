import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const LineageDiagram = ({ 
  upstream = [], 
  downstream = [], 
  currentItem = {}, 
  currentTheme = {},
  height = '400px' 
}) => {
  const diagramRef = useRef(null);

  useEffect(() => {
    // Initialize Mermaid with dark mode support
    mermaid.initialize({
      startOnLoad: false,
      theme: currentTheme.darkMode ? 'dark' : 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: false,
        curve: 'linear'
      },
      themeVariables: {
        primaryColor: currentTheme.primary || '#1976d2',
        primaryTextColor: currentTheme.text || (currentTheme.darkMode ? '#ffffff' : '#000000'),
        lineColor: currentTheme.textSecondary || (currentTheme.darkMode ? '#cccccc' : '#666666'),
        secondaryColor: currentTheme.card || (currentTheme.darkMode ? '#2d2d2d' : '#ffffff'),
        background: currentTheme.background || (currentTheme.darkMode ? '#1a1a1a' : '#ffffff'),
        nodeBkg: currentTheme.card || (currentTheme.darkMode ? '#2d2d2d' : '#ffffff'),
        nodeBorder: currentTheme.border || (currentTheme.darkMode ? '#444444' : '#e0e0e0'),
        clusterBkg: currentTheme.background || (currentTheme.darkMode ? '#1a1a1a' : '#f5f5f5'),
        clusterBorder: currentTheme.border || (currentTheme.darkMode ? '#444444' : '#e0e0e0')
      }
    });

    const generateMermaidDiagram = () => {
      if (!upstream.length && !downstream.length) {
        const primaryColor = currentTheme.primary?.replace('#', '') || '1976d2';
        const cardColor = currentTheme.darkMode ? '2d2d2d' : 'ffffff';
        const borderColor = currentTheme.darkMode ? '444444' : 'e0e0e0';
        const textColor = currentTheme.darkMode ? 'ffffff' : '000000';
        
        return `
          graph LR
            A["${currentItem.name || 'Current Item'}"] 
            A --> B["No lineage data available"]
            style A fill:#${primaryColor},stroke:#333,stroke-width:2px,color:#fff
            style B fill:#${cardColor},stroke:#${borderColor},stroke-width:1px,color:#${textColor}
        `;
      }

      let diagram = 'graph LR\n';
      const nodeIds = new Map();
      let nodeCounter = 0;

      // Helper function to create safe node IDs
      const createNodeId = (name) => {
        const safeId = `node_${nodeCounter++}`;
        nodeIds.set(safeId, name);
        return safeId;
      };

      // Create current item node
      const currentId = createNodeId(currentItem.name || 'Current Item');
      diagram += `    ${currentId}["${currentItem.name || 'Current Item'}"]\n`;

      // Add upstream nodes and connections (simplified)
      upstream.forEach((item, index) => {
        const upstreamId = createNodeId(item.name);
        diagram += `    ${upstreamId}["${item.name}"]\n`;
        diagram += `    ${upstreamId} --> ${currentId}\n`;
      });

      // Add downstream nodes and connections (simplified)
      downstream.forEach((item, index) => {
        const downstreamId = createNodeId(item.name);
        diagram += `    ${downstreamId}["${item.name}"]\n`;
        diagram += `    ${currentId} --> ${downstreamId}\n`;
      });

      // Add dark mode friendly styling
      const primaryColor = currentTheme.primary?.replace('#', '') || '1976d2';
      const upstreamColor = currentTheme.darkMode ? '1e3a8a' : 'e3f2fd';
      const upstreamBorder = currentTheme.darkMode ? '3b82f6' : '1976d2';
      const downstreamColor = currentTheme.darkMode ? '581c87' : 'f3e5f5';
      const downstreamBorder = currentTheme.darkMode ? 'a855f7' : '7b1fa2';
      const textColor = currentTheme.darkMode ? 'ffffff' : '000000';
      
      diagram += `\n    style ${currentId} fill:#${primaryColor},stroke:#333,stroke-width:3px,color:#fff\n`;
      
      // Style upstream nodes with dark mode support
      upstream.forEach((item, index) => {
        const upstreamId = `node_${index}`;
        diagram += `    style ${upstreamId} fill:#${upstreamColor},stroke:#${upstreamBorder},stroke-width:2px,color:#${textColor}\n`;
      });

      // Style downstream nodes with dark mode support
      downstream.forEach((item, index) => {
        const downstreamId = `node_${upstream.length + index}`;
        diagram += `    style ${downstreamId} fill:#${downstreamColor},stroke:#${downstreamBorder},stroke-width:2px,color:#${textColor}\n`;
      });

      return diagram;
    };

    const renderDiagram = async () => {
      if (diagramRef.current) {
        try {
          const diagramDefinition = generateMermaidDiagram();
          const { svg } = await mermaid.render(`lineage-${Date.now()}`, diagramDefinition);
          diagramRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Error rendering Mermaid diagram:', error);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = `
              <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: ${height}; 
                background: ${currentTheme.card || '#ffffff'}; 
                border: 1px solid ${currentTheme.border || '#e0e0e0'}; 
                border-radius: 8px;
                color: ${currentTheme.textSecondary || '#666666'};
                font-family: Arial, sans-serif;
              ">
                Error rendering lineage diagram
              </div>
            `;
          }
        }
      }
    };

    renderDiagram();
  }, [upstream, downstream, currentItem, currentTheme]);

  return (
    <div 
      ref={diagramRef}
      style={{ 
        width: '100%', 
        height: height,
        backgroundColor: currentTheme.background || '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

export default LineageDiagram;
