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

// Import custom renderers from renderers folder
import PipelineARenderer from '../components/datasets/pipelines/renderers/PipelineARenderer'
import PipelineBRenderer from '../components/datasets/pipelines/renderers/PipelineBRenderer'
import PipelineCRenderer from '../components/datasets/pipelines/renderers/PipelineCRenderer'
import PipelineDRenderer from '../components/datasets/pipelines/renderers/PipelineDRenderer'

/**
 * Pipeline Renderer Registry
 * 
 * This registry makes it easy to add custom renderers for each pipeline.
 * Simply import your renderer component and add it to this object.
 * 
 * To add a new custom renderer:
 * 1. Create your renderer component in components/datasets/pipelines/renderers/
 * 2. Import it at the top of this file
 * 3. Add it to PIPELINE_RENDERERS with the pipeline UUID as the key
 * 4. Set viewComponent in the pipeline config to use the renderer
 */
export const PIPELINE_RENDERERS = {
  '550e8400-e29b-41d4-a716-446655440000': PipelineARenderer, // Pipe A
  '550e8400-e29b-41d4-a716-446655440001': PipelineBRenderer, // Pipe B
  '550e8400-e29b-41d4-a716-446655440002': PipelineCRenderer, // Pipe C
  '550e8400-e29b-41d4-a716-446655440003': PipelineDRenderer, // Pipe D
  // Add more custom renderers here:
  // '550e8400-e29b-41d4-a716-446655440004': YourCustomRenderer,
}

// Pipeline configurations keyed by UUID
export const PIPELINE_CONFIG = {
  '550e8400-e29b-41d4-a716-446655440000': { // Pipe A
    // Use custom renderer from registry
    viewComponent: PIPELINE_RENDERERS['550e8400-e29b-41d4-a716-446655440000'],
    
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
    // Use custom renderer from registry
    viewComponent: PIPELINE_RENDERERS['550e8400-e29b-41d4-a716-446655440001'],
    
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
    // Use custom renderer from registry
    viewComponent: PIPELINE_RENDERERS['550e8400-e29b-41d4-a716-446655440002'],
    
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
  },
  
  '550e8400-e29b-41d4-a716-446655440003': { // Pipe D - Reference Data Tracking
    // Use custom renderer from registry
    viewComponent: PIPELINE_RENDERERS['550e8400-e29b-41d4-a716-446655440003'],
    
    layout: {
      type: 'reference-data',
      showFileSelector: false,
      showTableSelector: false,
      showZipSelector: false,
      showProcessStatus: true,
      showDataProducts: true,
    },
    
    tabs: {
      defaultTab: 'overview',
      available: [
        { id: 'overview', label: 'Reference Data Overview' },
        { id: 'lineage', label: 'Data Lineage' },
        { id: 'sources', label: 'Source Datasets' },
      ]
    },
    
    dataRequirements: {
      requiresFiles: false,
      requiresTables: false,
      requiresModels: false,
      requiresReferenceData: true, // Specifically requires reference data
    },
    
    features: {
      feedbackEnabled: true,
      versionTracking: true,
      updateModal: false,
      referenceDataTracking: true, // Pipeline-specific feature for reference data
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
 * Helper function to get a custom renderer for a pipeline
 * This makes it easy to retrieve custom renderers from the registry
 */
export const getPipelineRenderer = (pipelineIdentifier) => {
  const config = getPipelineConfig(pipelineIdentifier)
  
  // If viewComponent is set and it's a function/component, return it
  if (config.viewComponent && typeof config.viewComponent === 'function') {
    return config.viewComponent
  }
  
  // Otherwise, try to get from registry by UUID
  if (typeof pipelineIdentifier === 'string') {
    // Try direct UUID lookup
    if (PIPELINE_RENDERERS[pipelineIdentifier]) {
      return PIPELINE_RENDERERS[pipelineIdentifier]
    }
    
    // Try to find by name and get UUID
    const pipeline = getPipelineByName(pipelineIdentifier)
    if (pipeline && PIPELINE_RENDERERS[pipeline.uuid]) {
      return PIPELINE_RENDERERS[pipeline.uuid]
    }
  }
  
  return null
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
