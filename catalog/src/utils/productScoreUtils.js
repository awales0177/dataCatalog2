// Expected fields for data products
export const EXPECTED_PRODUCT_FIELDS = {
  // Basic Information
  name: { required: true, weight: 1 },
  description: { required: true, weight: 1 },
  category: { required: true, weight: 1 },
  provider: { required: true, weight: 1 },
  
  // Quality & Trust
  trustworthiness: { required: true, weight: 1 },
  dataQuality: { required: false, weight: 0.8 },
  freshness: { required: false, weight: 0.6 },
  
  // Documentation & Resources
  documentation: { required: true, weight: 1 },
  schema: { required: false, weight: 0.7 },
  sampleData: { required: false, weight: 0.5 },
  
  // Metadata
  tags: { required: false, weight: 0.3 },
  lastUpdated: { required: true, weight: 0.8 },
  version: { required: false, weight: 0.6 },
  
  // Usage & Metrics
  downloads: { required: false, weight: 0.4 },
  rating: { required: false, weight: 0.5 },
  usage: { required: false, weight: 0.3 }
};

// Calculate score based on expected fields for data products
export const calculateProductScore = (product) => {
  let totalWeight = 0;
  let filledWeight = 0;
  let missingFields = [];
  let filledFields = [];

  const checkField = (obj, fieldPath, fieldConfig) => {
    if (fieldConfig.required || fieldConfig.weight > 0) {
      totalWeight += fieldConfig.weight;
      
      const value = obj[fieldPath];
      let hasValue = false;
      
      // Check different types of values
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          hasValue = value.trim() !== '';
        } else if (typeof value === 'number') {
          hasValue = value >= 0;
        } else if (Array.isArray(value)) {
          hasValue = value.length > 0;
        } else if (typeof value === 'object') {
          hasValue = Object.keys(value).length > 0;
        } else {
          hasValue = true;
        }
      }
      
      if (hasValue) {
        filledWeight += fieldConfig.weight;
        filledFields.push(fieldPath);
      } else {
        missingFields.push(fieldPath);
      }
    }
  };

  // Check all expected fields
  Object.entries(EXPECTED_PRODUCT_FIELDS).forEach(([field, config]) => {
    checkField(product, field, config);
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
export const getProductQualityColor = (score, darkMode = false) => {
  if (score >= 90) return '#4CAF50'; // Green
  if (score >= 75) return '#8BC34A'; // Light Green
  if (score >= 60) return '#FFC107'; // Amber
  if (score >= 45) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

// Get quality level text
export const getProductQualityLevel = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 45) return 'Poor';
  return 'Very Poor';
};
