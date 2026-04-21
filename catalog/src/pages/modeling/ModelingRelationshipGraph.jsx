import React, { useCallback, useEffect, useMemo } from 'react';
import dagre from 'dagre';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PersonOutline from '@mui/icons-material/PersonOutline';
import FlightTakeoff from '@mui/icons-material/FlightTakeoff';
import Apartment from '@mui/icons-material/Apartment';
import { Box, Paper, Typography } from '@mui/material';
import { inferTableRelationships } from './inferModelingRelationships';

/** Dagre layout box (square); visual node is a circle of this size. */
const NODE_SIZE = 48;

/** Distinct accents per table (stable hash pick). Edges stay theme-colored for readability. */
const NODE_ACCENT_PALETTE = [
  '#0ea5e9',
  '#a855f7',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#eab308',
  '#06b6d4',
];

const TABLE_RELATIONSHIP_ICONS = {
  person: PersonOutline,
  airplane: FlightTakeoff,
  building: Apartment,
};

function hashString(s) {
  let h = 5381;
  const str = String(s ?? '');
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

/** Person / airplane / building icons from name hints, else stable rotation for variety. */
function iconKindForTableName(tableName) {
  const n = String(tableName || '').toLowerCase();
  if (
    /\b(user|users|customer|customers|person|people|employee|employees|member|members|account|accounts|contact|contacts|profile|profiles|patient|patients|passenger|passengers|subscriber|subscribers|author|authors)\b/.test(
      n,
    )
  ) {
    return 'person';
  }
  if (
    /\b(flight|flights|airport|airline|airlines|aircraft|plane|trip|trips|route|routes|booking|bookings|travel|itinerary|cargo|shipment|shipments|freight)\b/.test(
      n,
    )
  ) {
    return 'airplane';
  }
  if (
    /\b(company|companies|org|organization|organizations|warehouse|warehouses|building|buildings|facility|facilities|office|offices|vendor|vendors|supplier|suppliers|store|stores|shop|shops|site|sites|location|locations|hotel|hotels|property|properties|plant|plants|branch|branches)\b/.test(
      n,
    )
  ) {
    return 'building';
  }
  const kinds = ['person', 'airplane', 'building'];
  return kinds[hashString(tableName) % 3];
}

function nodeAccentForTableName(tableName) {
  return NODE_ACCENT_PALETTE[hashString(tableName) % NODE_ACCENT_PALETTE.length];
}

function tableToNodeId(tableName) {
  return `n_${String(tableName).replace(/[^a-zA-Z0-9_]/g, '_') || 'x'}`;
}

function layoutWithDagre(nodes, edges, direction = 'LR') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 44,
    nodesep: 28,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_SIZE, height: NODE_SIZE });
  });
  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });
  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const x = Number(pos?.x ?? 0) - NODE_SIZE / 2;
    const y = Number(pos?.y ?? 0) - NODE_SIZE / 2;
    return {
      ...node,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      position: { x, y },
    };
  });
}

function ModelingTableNode({ data }) {
  const { label, palette, iconKind } = data;
  const Icon = TABLE_RELATIONSHIP_ICONS[iconKind] || TABLE_RELATIONSHIP_ICONS.building;
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          background: palette.accent,
          border: `2px solid ${palette.handleRing}`,
        }}
      />
      <div
        role="img"
        aria-label={label}
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: '50%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: palette.iconCircleBg,
          border: `1px solid ${palette.iconCircleBorder}`,
          boxShadow: `${palette.nodeShadow}, ${palette.iconCircleInset}`,
        }}
      >
        <Icon sx={{ fontSize: 22, color: palette.accent }} />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          background: palette.accent,
          border: `2px solid ${palette.handleRing}`,
        }}
      />
    </>
  );
}

const nodeTypes = { modelingTable: ModelingTableNode };

function RelationshipGraphCanvas({ modelItems, datasets, darkMode, theme }) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const graph = useMemo(() => inferTableRelationships(modelItems, datasets), [modelItems, datasets]);

  const palette = useMemo(() => {
    const accent = theme?.primary || '#0b87b4';
    if (darkMode) {
      return {
        accent,
        handleRing: '#1a1a1e',
        nodeShadow: '0 6px 18px rgba(0,0,0,0.45)',
        iconCircleBg: 'rgba(255,255,255,0.07)',
        iconCircleBorder: 'rgba(255,255,255,0.14)',
        iconCircleInset: '0 0 0 1px rgba(0,0,0,0.35) inset',
        edge: alphaMix(accent, 0.88),
        label: 'rgba(255,255,255,0.78)',
        labelBg: 'rgba(18,18,22,0.94)',
        dot: 'rgba(255,255,255,0.06)',
      };
    }
    return {
      accent,
      handleRing: '#ffffff',
      nodeShadow: '0 6px 16px rgba(15, 35, 52, 0.14)',
      iconCircleBg: alphaMix(accent, 0.1),
      iconCircleBorder: alphaMix(accent, 0.22),
      iconCircleInset: '0 0 0 1px rgba(255,255,255,0.85) inset',
      edge: alphaMix(accent, 0.92),
      label: theme?.textSecondary || '#52525b',
      labelBg: 'rgba(255,255,255,0.96)',
      dot: 'rgba(0,0,0,0.055)',
    };
  }, [darkMode, theme]);

  const rebuild = useCallback(() => {
    if (!graph.nodes.length) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rfNodes = graph.nodes.map((name) => {
      const accent = nodeAccentForTableName(name);
      return {
        id: tableToNodeId(name),
        type: 'modelingTable',
        position: { x: 0, y: 0 },
        data: {
          label: name,
          iconKind: iconKindForTableName(name),
          palette: {
            accent,
            handleRing: palette.handleRing,
            nodeShadow: palette.nodeShadow,
            iconCircleBg: darkMode ? alphaMix(accent, 0.24) : alphaMix(accent, 0.12),
            iconCircleBorder: darkMode ? alphaMix(accent, 0.55) : alphaMix(accent, 0.3),
            iconCircleInset: palette.iconCircleInset,
          },
        },
      };
    });

    const rfEdges = graph.edges.map((e, i) => ({
      id: `e_${i}_${tableToNodeId(e.from)}_${tableToNodeId(e.to)}`,
      source: tableToNodeId(e.from),
      target: tableToNodeId(e.to),
      type: 'smoothstep',
      animated: false,
      label: e.via,
      style: {
        stroke: palette.edge,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: palette.edge,
        width: 20,
        height: 20,
      },
      labelStyle: {
        fill: palette.label,
        fontWeight: 600,
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      },
      labelBgStyle: {
        fill: palette.labelBg,
        fillOpacity: 1,
      },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 6,
    }));

    const layouted = layoutWithDagre(rfNodes, rfEdges, 'LR');
    setNodes(layouted);
    setEdges(rfEdges);
  }, [graph, palette, darkMode, setNodes, setEdges]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  useEffect(() => {
    if (!nodes.length) return;
    const t = requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 220, maxZoom: 1.2 });
    });
    return () => cancelAnimationFrame(t);
  }, [nodes, fitView]);

  if (!graph.nodes.length) return null;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll
      zoomOnScroll
      zoomOnPinch
      minZoom={0.35}
      maxZoom={1.35}
      proOptions={{ hideAttribution: true }}
      elevateEdgesOnSelect={false}
    >
      <Background id="modeling-bg" gap={14} size={1} color={palette.dot} />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}

function alphaMix(hex, alpha) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return hex || '#0b87b4';
  }
  let r;
  let g;
  let b;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Node–edge graph of inferred FK relationships (React Flow + Dagre), themed for the modeling modal.
 */
export default function ModelingRelationshipGraph({ modelItems, datasets, darkMode, theme }) {
  const graph = useMemo(() => inferTableRelationships(modelItems, datasets), [modelItems, datasets]);

  if (!graph.nodes.length) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 1.5,
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : theme?.border || 'rgba(0,0,0,0.1)'}`,
        bgcolor: darkMode ? 'rgba(0,0,0,0.25)' : theme?.card || 'rgba(255,255,255,0.96)',
        overflow: 'hidden',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme?.text, px: 1.5, pt: 1.25, pb: 0.5 }}>
        Table relationships
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: darkMode ? 'rgba(255,255,255,0.55)' : theme?.textSecondary,
          display: 'block',
          px: 1.5,
          pb: 1,
        }}
      >
        {graph.edges.length > 0
          ? 'Inferred links from foreign-key-style columns and optional API metadata. Pan and scroll to zoom.'
          : 'No links detected yet. Add related tables (e.g. orders + customers) or FK metadata on columns.'}
      </Typography>
      <Box sx={{ height: 280, width: '100%', position: 'relative' }}>
        <ReactFlowProvider>
          <RelationshipGraphCanvas
            modelItems={modelItems}
            datasets={datasets}
            darkMode={darkMode}
            theme={theme}
          />
        </ReactFlowProvider>
      </Box>
    </Paper>
  );
}
