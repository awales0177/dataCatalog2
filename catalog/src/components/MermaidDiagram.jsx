import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ThemeContext } from '../contexts/ThemeContext';

/** Mermaid themeVariables work best with simple colors; divider strings can be rgba. */
function buildMermaidInit(darkMode, theme) {
  const primary = theme?.primary || '#37ABBF';
  const bg = theme?.background || (darkMode ? '#121212' : '#f8f9fa');
  const card = theme?.card || (darkMode ? '#1e1e1e' : '#ffffff');
  const text = theme?.text || (darkMode ? '#e8e8ea' : '#2c3e50');
  const textSecondary = theme?.textSecondary || (darkMode ? '#9d9da3' : '#7f8c8d');
  const borderSolid = darkMode ? '#424242' : '#d0d7de';

  const flowchart = {
    useMaxWidth: true,
    htmlLabels: true,
  };

  if (!darkMode) {
    return {
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
      themeVariables: {
        primaryColor: primary,
        primaryTextColor: '#fff',
        primaryBorderColor: primary,
        lineColor: primary,
        secondaryColor: '#eef5f6',
        tertiaryColor: card,
        mainBkg: card,
        textColor: text,
        border1: borderSolid,
        clusterBkg: '#e8f4f6',
        edgeLabelBackground: card,
        titleColor: text,
        tertiaryTextColor: textSecondary,
      },
      flowchart,
    };
  }

  return {
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'dark',
    themeVariables: {
      darkMode: true,
      background: bg,
      mainBkg: card,
      primaryColor: card,
      primaryTextColor: text,
      primaryBorderColor: primary,
      lineColor: primary,
      secondaryColor: bg,
      secondaryTextColor: text,
      tertiaryColor: card,
      textColor: text,
      tertiaryTextColor: textSecondary,
      border1: borderSolid,
      clusterBkg: '#1a2e32',
      edgeLabelBackground: card,
      titleColor: text,
    },
    flowchart,
  };
}

const MermaidDiagram = ({ children, className }) => {
  const mermaidRef = useRef(null);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).slice(2, 11)}`);
  const renderNonce = useRef(0);
  const themeCtx = useContext(ThemeContext);
  const darkMode = Boolean(themeCtx?.darkMode);
  const currentTheme = themeCtx?.currentTheme;

  const initConfig = useMemo(
    () => buildMermaidInit(darkMode, currentTheme),
    [darkMode, currentTheme]
  );

  useEffect(() => {
    const el = mermaidRef.current;
    if (!el || !children) return;
    if (!className || !className.includes('language-mermaid')) return;

    const mermaidCode = Array.isArray(children) ? children.join('') : String(children);
    const trimmedCode = mermaidCode.trim();
    if (!trimmedCode) return;

    const renderId = `${diagramId}-${++renderNonce.current}`;
    let cancelled = false;

    mermaid.initialize(initConfig);

    mermaid
      .render(renderId, trimmedCode, el)
      .then((result) => {
        if (cancelled || !mermaidRef.current) return;
        mermaidRef.current.innerHTML = result.svg;
        const svg = mermaidRef.current.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
          svg.style.display = 'block';
          svg.style.margin = '0 auto';
        }
      })
      .catch((err) => {
        console.error('Mermaid rendering error:', err);
        if (cancelled || !mermaidRef.current) return;
        const msg = err?.message || String(err);
        mermaidRef.current.innerHTML = `<div style="color: #f48fb1; padding: 10px; border: 1px solid rgba(244, 143, 177, 0.5); border-radius: 4px; background: rgba(244, 143, 177, 0.08);">Error rendering Mermaid diagram: ${msg}</div>`;
      });

    return () => {
      cancelled = true;
    };
  }, [children, className, diagramId, initConfig]);

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
