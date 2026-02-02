/**
 * Pipeline Utilities
 * 
 * Helper functions for working with pipelines using UUIDs
 * Updated to use hardcoded data instead of API
 */

import pipelinesData from '../data/pipelines.json';

let pipelinesCache = null;

// Initialize cache immediately with hardcoded data
try {
  pipelinesCache = Array.isArray(pipelinesData) ? pipelinesData : (pipelinesData.pipelines || []);
} catch (error) {
  console.error('Error initializing pipelines cache:', error);
  pipelinesCache = [];
}

/**
 * Get all pipelines (cached)
 */
export const getPipelines = async () => {
  if (!pipelinesCache) {
    try {
      // Use hardcoded pipelines data
      pipelinesCache = Array.isArray(pipelinesData) ? pipelinesData : (pipelinesData.pipelines || []);
    } catch (error) {
      console.error('Error loading pipelines:', error);
      pipelinesCache = [];
    }
  }
  return pipelinesCache;
};

/**
 * Get pipeline by UUID
 */
export const getPipelineByUuid = async (uuid) => {
  const pipelines = await getPipelines();
  return pipelines.find(p => p.uuid === uuid);
};

/**
 * Get pipeline by name (for backward compatibility)
 */
export const getPipelineByName = async (name) => {
  const pipelines = await getPipelines();
  return pipelines.find(p => p.name === name);
};

/**
 * Get pipeline name by UUID (synchronous version for immediate use)
 */
export const getPipelineName = (uuid) => {
  if (!uuid) return 'Unknown Pipeline';
  // Try to get from cache first
  if (pipelinesCache) {
    const pipeline = pipelinesCache.find(p => p.uuid === uuid);
    if (pipeline) return pipeline.name;
  }
  // If not in cache, return UUID as fallback
  return uuid;
};

/**
 * Get pipeline UUID by name (async)
 */
export const getPipelineUuid = async (name) => {
  const pipeline = await getPipelineByName(name);
  return pipeline ? pipeline.uuid : null;
};

/**
 * Get pipeline UUID by name (synchronous - uses cache)
 */
export const getPipelineUuidSync = (name) => {
  if (!name) return null;
  if (!pipelinesCache) return null;
  const pipeline = pipelinesCache.find(p => p.name === name);
  return pipeline ? pipeline.uuid : null;
};

/**
 * Convert pipeline names to UUIDs in an array
 */
export const convertPipelineNamesToUuids = async (names) => {
  if (!names || !Array.isArray(names)) return [];
  return Promise.all(names.map(async (name) => {
    const uuid = await getPipelineUuid(name);
    return uuid || name; // Fallback to name if not found
  }));
};

/**
 * Convert pipeline UUIDs to names in an array
 */
export const convertPipelineUuidsToNames = async (uuids) => {
  if (!uuids || !Array.isArray(uuids)) return [];
  const pipelines = await getPipelines();
  return uuids.map(uuid => {
    const pipeline = pipelines.find(p => p.uuid === uuid);
    return pipeline ? pipeline.name : uuid;
  });
};

/**
 * Check if a value is a UUID (basic check)
 */
export const isUuid = (value) => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Initialize pipelines cache (call this on app load)
 */
export const initializePipelines = () => {
  // Synchronously initialize cache with hardcoded data
  if (!pipelinesCache) {
    try {
      pipelinesCache = Array.isArray(pipelinesData) ? pipelinesData : (pipelinesData.pipelines || []);
    } catch (error) {
      console.error('Error initializing pipelines:', error);
      pipelinesCache = [];
    }
  }
};
