// Graph data patterns for usage charts
export const graphPatterns = {
  // Pattern configurations for different chart types
  usagePatterns: [
    {
      id: 0,
      name: "High Activity with Spikes",
      description: "High usage with periodic spikes",
      formula: (x) => 60 + Math.sin(x * Math.PI * 4) * 20 + Math.sin(x * Math.PI * 12) * 8 + (Math.random() - 0.5) * 10,
      color: "#e74c3c", // Red
      category: "high-activity"
    },
    {
      id: 1,
      name: "Steady High Usage",
      description: "Consistently high usage with minor fluctuations",
      formula: (x) => 85 + Math.sin(x * Math.PI * 2) * 8 + Math.sin(x * Math.PI * 8) * 4 + (Math.random() - 0.5) * 4,
      color: "#27ae60", // Green
      category: "steady-high"
    },
    {
      id: 2,
      name: "Low Activity with Peaks",
      description: "Low baseline with occasional high peaks",
      formula: (x) => 25 + Math.sin(x * Math.PI * 3) * 15 + Math.sin(x * Math.PI * 15) * 12 + (Math.random() - 0.5) * 8,
      color: "#f39c12", // Orange
      category: "low-with-peaks"
    },
    {
      id: 3,
      name: "Erratic Pattern",
      description: "Highly variable usage with unpredictable patterns",
      formula: (x) => 40 + Math.sin(x * Math.PI * 6) * 25 + Math.sin(x * Math.PI * 18) * 15 + (Math.random() - 0.5) * 15,
      color: "#9b59b6", // Purple
      category: "erratic"
    },
    {
      id: 4,
      name: "Gradual Increase",
      description: "Steadily increasing usage over time",
      formula: (x) => 20 + x * 40 + Math.sin(x * Math.PI * 5) * 10 + (Math.random() - 0.5) * 8,
      color: "#3498db", // Blue
      category: "increasing"
    },
    {
      id: 5,
      name: "Gradual Decrease",
      description: "Steadily decreasing usage over time",
      formula: (x) => 80 - x * 30 + Math.sin(x * Math.PI * 4) * 12 + (Math.random() - 0.5) * 6,
      color: "#e67e22", // Dark Orange
      category: "decreasing"
    },
    {
      id: 6,
      name: "High Activity with Consistent Peaks",
      description: "High usage with regular peak patterns",
      formula: (x) => 85 + Math.sin(x * Math.PI * 3) * 10 + Math.sin(x * Math.PI * 9) * 5 + (Math.random() - 0.5) * 3,
      color: "#2ecc71", // Light Green
      category: "high-consistent"
    }
  ],

  // Default pattern for fallback
  defaultPattern: {
    id: -1,
    name: "Default Pattern",
    description: "Standard usage pattern",
    formula: (x) => 50 + Math.sin(x * Math.PI * 3) * 20 + (Math.random() - 0.5) * 10,
    color: "#95a5a6", // Gray
    category: "default"
  },

  // Chart configuration
  chartConfig: {
    points: 20,
    minValue: 5,
    maxValue: 95,
    smoothing: true
  },

  // Color mapping for usage levels
  usageColors: {
    low: "#e74c3c",      // Red
    medium: "#f39c12",   // Orange
    high: "#27ae60",     // Green
    veryHigh: "#2ecc71"  // Light Green
  },

  // Usage level thresholds
  usageThresholds: {
    low: 30,
    medium: 60,
    high: 80
  }
};

// Helper function to generate usage data based on pattern
export const generateUsageData = (item, patternId = null) => {
  const { points, minValue, maxValue } = graphPatterns.chartConfig;
  const data = [];
  
  // Determine pattern to use
  let pattern;
  if (patternId !== null && patternId >= 0 && patternId < graphPatterns.usagePatterns.length) {
    pattern = graphPatterns.usagePatterns[patternId];
  } else {
    // Use item properties to determine pattern
    const seed = (item.id?.charCodeAt(0) || 0) + (item.name?.length || 0);
    const patternIndex = seed % graphPatterns.usagePatterns.length;
    pattern = graphPatterns.usagePatterns[patternIndex];
  }
  
  // Generate data points
  for (let i = 0; i < points; i++) {
    const x = i / (points - 1);
    const value = pattern.formula(x);
    
    // Ensure value stays within bounds
    data.push(Math.max(minValue, Math.min(maxValue, value)));
  }
  
  return {
    data,
    pattern,
    metadata: {
      points: data.length,
      average: data.reduce((sum, val) => sum + val, 0) / data.length,
      min: Math.min(...data),
      max: Math.max(...data)
    }
  };
};

// Helper function to get usage color based on average value
export const getUsageColor = (data, thresholds = graphPatterns.usageThresholds) => {
  const average = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  if (average >= thresholds.high) return graphPatterns.usageColors.veryHigh;
  if (average >= thresholds.medium) return graphPatterns.usageColors.high;
  if (average >= thresholds.low) return graphPatterns.usageColors.medium;
  return graphPatterns.usageColors.low;
};

// Helper function to get all available patterns
export const getAllPatterns = () => {
  return graphPatterns.usagePatterns;
};

// Helper function to get pattern by category
export const getPatternsByCategory = (category) => {
  return graphPatterns.usagePatterns.filter(pattern => pattern.category === category);
};
