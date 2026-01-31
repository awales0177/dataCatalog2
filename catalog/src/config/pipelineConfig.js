/**
 * Pipeline Configuration System
 * 
 * This allows each pipeline to define:
 * - Custom component layouts
 * - Custom tabs/navigation
 * - Custom data requirements
 * - Completely different page structures
 * 
 * NOTE: This now uses pipeline UUIDs as keys. Use getPipelineConfig() helper
 * which accepts either UUID or name for backward compatibility.
 */

import { getPipelineByName } from '../utils/pipelineUtils'

// Pipeline-specific view components (can be imported)
// import PipeAView from '../components/pipelines/PipeAView'
// import PipeBView from '../components/pipelines/PipeBView'
// import PipeCView from '../components/pipelines/PipeCView'

// Pipeline configurations keyed by UUID
export const PIPELINE_CONFIG = {
  '550e8400-e29b-41d4-a716-446655440000': { // Pipe A
    // Component-based approach: Use a dedicated view component
    viewComponent: null, // null = use default layout, or import PipeAView
    
    // Layout configuration
    layout: {
      type: 'file-based', // 'file-based' | 'table-based' | 'custom'
      showFileSelector: true,
      showTableSelector: false,
      showProcessStatus: true,
      showDataProducts: true,
    },
    
    // Tab configuration
    tabs: {
      defaultTab: 'analytics',
      available: [
        { id: 'metadata', label: 'Metadata Extraction' },
        { id: 'analytics', label: 'Data Analytics' },
        { id: 'schema', label: 'Schema Extractions' },
        { id: 'text', label: 'Text Extractions' },
        { id: 'entity', label: 'Entity Extractions' },
        { id: 'unpack', label: 'Unpack' },
        { id: 'tagging', label: 'Data Tagging' },
      ]
    },
    
    // Data requirements
    dataRequirements: {
      requiresFiles: true,
      requiresTables: false,
      requiresModels: true,
    },
    
    // Custom features
    features: {
      feedbackEnabled: true, // thumbs up/down
      versionTracking: true,
      updateModal: true,
    }
  },
  
  '550e8400-e29b-41d4-a716-446655440001': { // Pipe B
    viewComponent: null, // Could be PipeBView for completely custom layout
    
    layout: {
      type: 'table-based',
      showFileSelector: false,
      showTableSelector: true,
      showProcessStatus: true,
      showDataProducts: true,
    },
    
    tabs: {
      defaultTab: 'sample',
      available: [
        { id: 'sample', label: 'Overview' },
        { id: 'tooling', label: 'Tooling' },
        { id: 'quality', label: 'Data Quality' },
        { id: 'origin', label: 'Column Origin' },
        { id: 'functions', label: 'Functions' },
      ]
    },
    
    dataRequirements: {
      requiresFiles: false,
      requiresTables: true,
      requiresModels: false,
    },
    
    features: {
      feedbackEnabled: true,
      versionTracking: false,
      updateModal: false,
    }
  },
  
  '550e8400-e29b-41d4-a716-446655440002': { // Pipe C - Zip file based
    viewComponent: null,
    
    layout: {
      type: 'zip-based', // Zip file-based pipeline
      showFileSelector: true, // Show file selector for zip contents
      showZipSelector: true, // Show zip selector above file selector
      showTableSelector: false,
      showProcessStatus: true,
      showDataProducts: true,
    },
    
    tabs: {
      defaultTab: 'extraction',
      available: [
        { id: 'metadata', label: 'Metadata Extraction' },
        { id: 'extraction', label: 'Archive Contents' },
        { id: 'analytics', label: 'Data Analytics' },
        { id: 'unpack', label: 'Unpack Details' },
        { id: 'tagging', label: 'Data Tagging' },
      ]
    },
    
    dataRequirements: {
      requiresFiles: true,
      requiresTables: false,
      requiresModels: true,
      requiresZipFiles: true, // Specifically requires zip files
    },
    
    features: {
      feedbackEnabled: true,
      versionTracking: true,
      updateModal: true,
      zipExtraction: true, // Pipeline-specific feature for zip handling
    }
  }
}

/**
 * Helper function to get pipeline configuration
 * Accepts either UUID or pipeline name for backward compatibility
 */
export const getPipelineConfig = (pipelineIdentifier) => {
  // If it's a UUID, use it directly
  if (PIPELINE_CONFIG[pipelineIdentifier]) {
    return PIPELINE_CONFIG[pipelineIdentifier]
  }
  
  // Otherwise, try to find by name
  const pipeline = getPipelineByName(pipelineIdentifier)
  if (pipeline && PIPELINE_CONFIG[pipeline.uuid]) {
    return PIPELINE_CONFIG[pipeline.uuid]
  }
  
  // Fallback to Pipe A
  return PIPELINE_CONFIG['550e8400-e29b-41d4-a716-446655440000']
}

/**
 * Helper function to check if pipeline has a feature
 * Accepts either UUID or pipeline name
 */
export const hasPipelineFeature = (pipelineIdentifier, featureName) => {
  const config = getPipelineConfig(pipelineIdentifier)
  return config.features?.[featureName] || false
}

/**
 * Helper function to get pipeline tabs
 * Accepts either UUID or pipeline name
 */
export const getPipelineTabs = (pipelineIdentifier) => {
  const config = getPipelineConfig(pipelineIdentifier)
  return config.tabs?.available || []
}

/**
 * Helper function to get default tab for pipeline
 * Accepts either UUID or pipeline name
 */
export const getPipelineDefaultTab = (pipelineIdentifier) => {
  const config = getPipelineConfig(pipelineIdentifier)
  return config.tabs?.defaultTab || 'analytics'
}
