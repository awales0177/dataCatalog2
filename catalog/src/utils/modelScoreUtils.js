// Expected fields for data model specifications
export const EXPECTED_MODEL_FIELDS = {
  // Basic Information
  name: { required: true, weight: 1 },
  shortName: { required: true, weight: 1 },
  version: { required: true, weight: 1 },
  description: { required: true, weight: 1 },
  extendedDescription: { required: false, weight: 0.5 },
  
  // Ownership & Maintenance
  owner: { required: true, weight: 1 },
  specMaintainer: { required: true, weight: 1 },
  maintainerEmail: { required: true, weight: 1 },
  
  // Classification
  domain: { required: true, weight: 1 },
  referenceData: { required: false, weight: 0.5 },
  
  // Metadata
  meta: {
    tier: { required: true, weight: 1 },
    verified: { required: false, weight: 0.5 }
  },
  
  // Documentation & Resources
  resources: {
    code: { required: false, weight: 0.5 },
    documentation: { required: true, weight: 1 },
    rules: { required: false, weight: 0.5 },
    tools: { required: false, weight: 0.3 },
    git: { required: false, weight: 0.5 },
    validation: { required: false, weight: 0.5 }
  },
  
  // Change Management
  changelog: { required: true, weight: 1 },
  
  // Usage & Relationships
  users: { required: false, weight: 0.3 }
};

// Calculate score based on expected fields rather than actual JSON fields
export const calculateModelScore = (model) => {
  let totalWeight = 0;
  let filledWeight = 0;
  let missingFields = [];
  let filledFields = [];

  const checkField = (obj, fieldPath, fieldConfig, parentPath = '') => {
    const currentPath = parentPath ? `${parentPath}.${fieldPath}` : fieldPath;
    
    if (fieldConfig.required || fieldConfig.weight > 0) {
      totalWeight += fieldConfig.weight;
      
      const value = obj[fieldPath];
      const hasValue = value !== null && value !== undefined && value !== '';
      
      if (hasValue) {
        filledWeight += fieldConfig.weight;
        filledFields.push(currentPath);
      } else {
        missingFields.push(currentPath);
      }
    }
  };

  // Check basic fields
  Object.entries(EXPECTED_MODEL_FIELDS).forEach(([field, config]) => {
    if (typeof config === 'object' && config.weight !== undefined) {
      // This is a nested field group
      if (field === 'meta' || field === 'resources') {
        Object.entries(config).forEach(([nestedField, nestedConfig]) => {
          checkField(model, nestedField, nestedConfig, field);
        });
      } else {
        // This is a simple field
        checkField(model, field, config);
      }
    }
  });

  const score = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;

  return {
    score,
    missingFields,
    filledFields,
    totalWeight,
    filledWeight
  };
};

// Get quality color based on score
export const getModelQualityColor = (score, darkMode = false) => {
  if (score >= 90) return '#4CAF50'; // Green
  if (score >= 75) return '#8BC34A'; // Light Green
  if (score >= 60) return '#FFC107'; // Amber
  if (score >= 45) return '#FF9800'; // Orange
  return '#F44336'; // Red
};
