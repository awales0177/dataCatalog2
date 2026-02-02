# Pipeline Renderers

This directory contains the PipelineView wrapper component and a `renderers/` subdirectory with custom renderer components for each pipeline type.

## Directory Structure

- `PipelineView.jsx` - Main wrapper component that routes to appropriate renderer
- `renderers/` - Directory containing all custom pipeline renderers
  - `PipelineARenderer.jsx` - File-based pipeline renderer
  - `PipelineBRenderer.jsx` - Table-based pipeline renderer
  - `PipelineCRenderer.jsx` - Zip-based pipeline renderer
  - `PipelineDRenderer.jsx` - Reference data pipeline renderer

## How to Add a Custom Renderer

**Note:** All custom renderers should be created in the `renderers/` subdirectory.

### Step 1: Create Your Renderer Component

Create a new file in the `renderers/` directory (e.g., `PipelineERenderer.jsx`):

```jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const MyCustomRenderer = ({
  pipeline,
  dataset,
  files,
  selectedFile,
  currentFile,
  onFileSelect,
  tables,
  selectedTable,
  onTableSelect,
  pipelineAgreements,
  config,
}) => {
  // Your custom rendering logic here
  return (
    <Box>
      <Typography>My Custom Pipeline View</Typography>
      {/* Your custom UI */}
    </Box>
  );
};

export default MyCustomRenderer;
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

## Examples

See the `renderers/` directory for complete examples:

- **PipelineARenderer.jsx** - File-based pipeline with file selector and tabs
- **PipelineBRenderer.jsx** - Table-based pipeline with table selector and tabs
- **PipelineCRenderer.jsx** - Zip-based pipeline with metro map view toggle
- **PipelineDRenderer.jsx** - Reference data pipeline with cards, tables, and lineage

For detailed documentation on creating renderers, see `renderers/README.md`.

## Best Practices

1. **Use Theme Context**: Access `currentTheme` from `ThemeContext` for consistent styling
2. **Handle Loading States**: Show loading indicators while fetching data
3. **Error Handling**: Display user-friendly error messages
4. **Responsive Design**: Use Material-UI Grid system for responsive layouts
5. **Reusable Components**: Break down complex renderers into smaller components
