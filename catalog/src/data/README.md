# Graph Data System

This directory contains centralized graph data patterns and utilities for chart generation across the application.

## Files

- `graphData.js` - Main graph data patterns and utilities
- `theme.json` - Theme configuration
- `termConfig.js` - Terminology configuration

## Usage

### Basic Usage

```javascript
import { generateUsageData, getUsageColor, getAllPatterns } from '../data/graphData';

// Generate usage data for an item
const usageDataResult = generateUsageData(item);
const usageData = usageDataResult.data;

// Get color based on usage level
const usageColor = getUsageColor(usageData);

// Get all available patterns
const patterns = getAllPatterns();
```

### Advanced Usage

```javascript
import { generateUsageData, getPatternsByCategory } from '../data/graphData';

// Generate data with specific pattern
const usageDataResult = generateUsageData(item, 1); // Use pattern ID 1

// Get patterns by category
const highActivityPatterns = getPatternsByCategory('high-activity');
```

## Graph Patterns

The system includes 7 different usage patterns:

1. **High Activity with Spikes** - High usage with periodic spikes
2. **Steady High Usage** - Consistently high usage with minor fluctuations
3. **Low Activity with Peaks** - Low baseline with occasional high peaks
4. **Erratic Pattern** - Highly variable usage with unpredictable patterns
5. **Gradual Increase** - Steadily increasing usage over time
6. **Gradual Decrease** - Steadily decreasing usage over time
7. **High Activity with Consistent Peaks** - High usage with regular peak patterns

## Configuration

You can customize the graph data by modifying the `graphPatterns` object in `graphData.js`:

- `chartConfig.points` - Number of data points (default: 20)
- `chartConfig.minValue` - Minimum value (default: 5)
- `chartConfig.maxValue` - Maximum value (default: 95)
- `usageThresholds` - Thresholds for color coding
- `usageColors` - Color mapping for different usage levels

## Benefits

- **Centralized**: All graph patterns in one place
- **Reusable**: Easy to use across different components
- **Configurable**: Customizable patterns and thresholds
- **Consistent**: Same patterns and colors across the app
- **Maintainable**: Easy to add new patterns or modify existing ones
