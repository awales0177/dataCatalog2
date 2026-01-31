import { useState, useEffect, useCallback } from 'react';
import { getPipelineUuid } from '../utils/pipelineUtils';

// Load initial pipeline from localStorage
const getInitialPipeline = async (dataset) => {
  if (!dataset) return '';
  
  try {
    const cached = localStorage.getItem('tracerFilters');
    if (cached) {
      const parsed = JSON.parse(cached);
      const cachedPipeline = parsed.pipelineFilter;
      if (cachedPipeline && cachedPipeline !== 'All') {
        // If it's a UUID, check if it's in systems
        if (dataset.systems?.includes(cachedPipeline)) {
          return cachedPipeline;
        }
        // If it's a name, convert to UUID
        const uuid = await getPipelineUuid(cachedPipeline);
        if (uuid && dataset.systems?.includes(uuid)) {
          return uuid;
        }
      }
    }
  } catch (error) {
    console.error('Error loading cached pipeline:', error);
  }
  // Fall back to first system in dataset
  return dataset.systems?.[0] || '';
};

export const useDatasetSelection = (dataset) => {
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedZip, setSelectedZip] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('');

  // Initialize pipeline when dataset loads
  useEffect(() => {
    const initialize = async () => {
      if (dataset && !selectedPipeline) {
        const initialPipeline = await getInitialPipeline(dataset);
        setSelectedPipeline(initialPipeline);
      } else if (dataset && selectedPipeline && !dataset.systems?.includes(selectedPipeline)) {
        // If selected pipeline is not in dataset's systems, reset to first system
        setSelectedPipeline(dataset.systems?.[0] || '');
      }
    };
    initialize();
  }, [dataset, selectedPipeline]);

  const handleSetSelectedPipeline = useCallback((pipeline) => {
    setSelectedPipeline(pipeline);
    // Save to localStorage
    try {
      const cached = localStorage.getItem('tracerFilters');
      const parsed = cached ? JSON.parse(cached) : {};
      parsed.pipelineFilter = pipeline;
      localStorage.setItem('tracerFilters', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving pipeline selection:', error);
    }
  }, []);

  const handleSetSelectedZip = useCallback((zipId) => {
    setSelectedZip(zipId);
    // Clear file selection when zip changes
    if (zipId) {
      setSelectedFile(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setSelectedTable(null);
    setSelectedZip(null);
  }, []);

  return {
    selectedPipeline,
    setSelectedPipeline: handleSetSelectedPipeline,
    selectedFile,
    setSelectedFile,
    selectedTable,
    setSelectedTable,
    selectedZip,
    setSelectedZip: handleSetSelectedZip,
    selectedVersion,
    setSelectedVersion,
    clearSelection,
  };
};
