# Pipeline Renderers

This directory contains custom renderer components for each pipeline type. Each pipeline now has its own dedicated renderer component for better organization and maintainability.

## Renderer Components

- **PipelineARenderer.jsx** - File-based pipeline for processing documents and files
- **PipelineBRenderer.jsx** - Table-based pipeline for processing structured data tables
- **PipelineCRenderer.jsx** - Zip-based pipeline for processing archived/compressed files
- **PipelineDRenderer.jsx** - Reference data tracking pipeline

## How to Add a New Custom Renderer

### Step 1: Create Your Renderer Component

Create a new file in this directory (e.g., `PipelineERenderer.jsx`):

```jsx
/**
 * Pipeline E - Your Pipeline Type Renderer
 * 
 * Description of what this pipeline does.
 */

import React, { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { ThemeContext } from '../../../../contexts/ThemeContext';
import ProcessStatus from '../../ProcessStatus';
import ETLOverview from '../../ETLOverview';

const PipelineERenderer = ({
  pipeline,
  dataset,
  files,
  selectedFile,
  currentFile,
  onFileSelect,
  selectedZip,
  onZipSelect,
  tables,
  selectedTable,
  onTableSelect,
  pipelineAgreements,
  config,
}) => {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Your custom rendering logic here */}
      <Typography variant="h4">Pipeline E View</Typography>
      {/* Add your components */}
    </Box>
  );
};

export default PipelineERenderer;
```

### Step 2: Register the Renderer

1. Open `catalog/src/config/pipelineConfig.js`
2. Import your renderer at the top:
   ```javascript
   import PipelineERenderer from '../components/datasets/pipelines/renderers/PipelineERenderer'
   ```
3. Add it to the `PIPELINE_RENDERERS` registry:
   ```javascript
   export const PIPELINE_RENDERERS = {
     '550e8400-e29b-41d4-a716-446655440000': PipelineARenderer, // Pipe A
     '550e8400-e29b-41d4-a716-446655440001': PipelineBRenderer, // Pipe B
     '550e8400-e29b-41d4-a716-446655440002': PipelineCRenderer, // Pipe C
     '550e8400-e29b-41d4-a716-446655440003': PipelineDRenderer, // Pipe D
     'your-pipeline-uuid': PipelineERenderer, // Your new pipeline
   }
   ```

### Step 3: Configure the Pipeline

Add your pipeline configuration to `PIPELINE_CONFIG`:

```javascript
'your-pipeline-uuid': {
  // Use custom renderer from registry
  viewComponent: PIPELINE_RENDERERS['your-pipeline-uuid'],
  
  layout: {
    type: 'custom',
    showFileSelector: false,
    showTableSelector: false,
    showProcessStatus: true,
    showDataProducts: true,
  },
  
  tabs: {
    defaultTab: 'overview',
    available: [
      { id: 'overview', label: 'Overview' },
      // Add your custom tabs
    ]
  },
  
  dataRequirements: {
    requiresFiles: false,
    requiresTables: false,
    requiresModels: false,
  },
  
  features: {
    feedbackEnabled: true,
    versionTracking: true,
    updateModal: false,
  }
}
```

### Step 4: Add Pipeline to pipelines.json

Add your pipeline definition to `api/_data/pipelines.json`:

```json
{
  "uuid": "your-pipeline-uuid",
  "name": "Your Pipeline Name",
  "type": "custom",
  "description": "Description of your pipeline"
}
```

## Available Props

Your custom renderer will receive these props:

- `pipeline` - The pipeline object from pipelines.json
- `dataset` - The current dataset being viewed
- `files` - Array of files associated with the dataset
- `selectedFile` - Currently selected file ID
- `currentFile` - Currently selected file object
- `onFileSelect` - Function to call when a file is selected
- `selectedZip` - Currently selected zip file ID (for zip-based pipelines)
- `onZipSelect` - Function to call when a zip file is selected
- `tables` - Array of tables associated with the dataset
- `selectedTable` - Currently selected table
- `onTableSelect` - Function to call when a table is selected
- `pipelineAgreements` - Agreements related to this pipeline
- `config` - The pipeline configuration object

## Available Shared Components

You can import and use these shared components in your renderers:

- `ProcessStatus` - Shows pipeline process steps and status
- `ETLOverview` - Shows ETL overview information
- `FileSelector` - File selection component
- `TableSelector` - Table selection component
- `ZipSelector` - Zip file selection component
- `TabsSection` - Tabbed content section
- `MetroMap` - Metro map visualization (used in Pipeline C)

## Examples

### Pipeline A (File-Based)
- Uses `FileSelector` for file selection
- Uses `TabsSection` for tabbed content
- Shows `ProcessStatus` and `ETLOverview`

### Pipeline B (Table-Based)
- Uses `TableSelector` for table selection
- Uses `TabsSection` for tabbed content
- Shows `ProcessStatus` and `ETLOverview`

### Pipeline C (Zip-Based)
- Uses `ZipSelector` and `FileSelector` for zip and file selection
- Features `MetroMap` with view toggle
- Uses `TabsSection` for tabbed content
- Shows `ProcessStatus` and `ETLOverview`

### Pipeline D (Reference Data)
- Custom reference data display with cards and tables
- Shows detailed lineage and source dataset information
- Uses `ProcessStatus` and `ETLOverview`

## Best Practices

1. **Use Theme Context**: Access `currentTheme` from `ThemeContext` for consistent styling
2. **Handle Loading States**: Show loading indicators while fetching data
3. **Error Handling**: Display user-friendly error messages
4. **Responsive Design**: Use Material-UI Grid system for responsive layouts
5. **Reusable Components**: Import and use shared components when possible
6. **Consistent Structure**: Follow the same structure as existing renderers for consistency
