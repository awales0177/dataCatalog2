# 🖊️ Edit Mode for Data Models

This document explains how to use the new edit mode functionality that allows users to edit data model fields directly in the web interface.

## 🎯 Overview

The edit mode provides a comprehensive form interface for editing all aspects of a data model, including:
- Basic model information (name, description, version, etc.)
- Metadata (tier, verification status)
- Changelog entries
- Resource links
- Array fields (domains, users, etc.)

## 🚀 How to Use

### 1. Accessing Edit Mode

1. **Navigate to a data model detail page** (e.g., `/models/CUST`)
2. **Click the lock/unlock icon** (🔓) in the top-right corner of the model header
3. **You'll be redirected to the edit page** (`/models/CUST/edit`)

### 2. Edit Mode Interface

The edit mode provides a user-friendly form with:

- **Form Fields**: Text inputs, textareas, dropdowns, and switches
- **Array Management**: Add/remove items from arrays (domains, users, changelog)
- **Nested Object Editing**: Expandable sections for complex data structures
- **Real-time Validation**: Immediate feedback on field changes
- **Change Tracking**: Visual indicators for modified fields

### 3. Field Types

#### Text Fields
- **Single Line**: Name, shortName, version, owner
- **Multi-line**: Description, extendedDescription
- **URLs**: Documentation, git repository links

#### Selection Fields
- **Dropdown**: Tier (Gold/Silver/Bronze)
- **Toggle Switch**: Verified status

#### Array Fields
- **Domains**: Add/remove domain categories
- **Users**: Add/remove user applications
- **Changelog**: Add/remove version entries
- **Changes**: Add/remove change descriptions

#### Object Fields
- **Metadata**: Tier and verification settings
- **Resources**: Code, documentation, tools, git, validation
- **Changelog Entries**: Version, date, and changes

### 4. Saving Changes

1. **Make your edits** to any fields
2. **Click "Save Changes"** button
3. **Wait for confirmation** (success message appears)
4. **You'll be redirected** back to the view mode

### 5. Canceling Changes

1. **Click "Cancel"** button
2. **If you have unsaved changes**, a confirmation dialog appears
3. **Choose to continue editing** or discard changes

## 🔧 Technical Implementation

### Frontend Components

- **`EditDataModelDetailPage.js`**: Main edit interface component
- **Dynamic field rendering** based on data types
- **Real-time change tracking** and validation
- **Responsive form layout** with Material-UI components

### Backend API

- **`PUT /api/models/{shortName}`**: Update model endpoint
- **Automatic field validation** and error handling
- **Cache invalidation** after successful updates
- **File persistence** in test mode

### Data Flow

1. **Load Model**: Fetch current model data from API
2. **Create Copy**: Deep copy for editing (preserves original)
3. **Track Changes**: Monitor field modifications
4. **Validate Data**: Ensure data integrity
5. **Send Update**: POST changes to API endpoint
6. **Update Cache**: Invalidate cached data
7. **Redirect**: Return to view mode

## 📱 User Interface Features

### Header Section
- **Edit Title**: Shows "Edit: [Model Name]"
- **Model Short Name**: Displays below title
- **Action Buttons**: Cancel and Save Changes

### Form Layout
- **Two-Column Grid**: Responsive layout for different screen sizes
- **Sectioned Content**: Organized by data category
- **Expandable Sections**: Accordion-style for complex data

### Interactive Elements
- **Add/Remove Buttons**: For array fields
- **Expand/Collapse**: For nested objects
- **Field Validation**: Real-time feedback
- **Change Indicators**: Visual cues for modifications

## 🎨 Styling and Theme

### Material-UI Integration
- **Consistent with app theme**: Light/dark mode support
- **Responsive design**: Mobile-first approach
- **Accessibility**: Proper labels and ARIA attributes

### Visual Feedback
- **Primary colors**: For interactive elements
- **Hover effects**: Button and field interactions
- **Loading states**: Save operation feedback
- **Success/Error messages**: Toast notifications

## 🔒 Security and Validation

### Input Validation
- **Required fields**: Essential data validation
- **Data types**: Proper field type checking
- **Length limits**: Reasonable input constraints
- **Format validation**: URL and email validation

### Change Protection
- **Unsaved changes warning**: Prevents accidental data loss
- **Confirmation dialogs**: For destructive actions
- **Field-level validation**: Immediate feedback
- **Error handling**: Graceful failure management

## 🧪 Testing

### Test Script
Run the included test script to verify API functionality:

```bash
cd api
python test_edit_mode.py
```

### Manual Testing
1. **Start API in test mode**:
   ```bash
   export TEST_MODE=true
   python main.py
   ```

2. **Navigate to edit mode** in the web interface
3. **Make changes** to various fields
4. **Save and verify** changes persist
5. **Test error scenarios** (invalid data, network issues)

## 🐛 Troubleshooting

### Common Issues

#### Edit Button Not Visible
- **Check route configuration** in `App.js`
- **Verify component import** is correct
- **Check browser console** for JavaScript errors

#### Save Fails
- **Verify API is running** on correct port
- **Check API mode** (test mode recommended for development)
- **Review network tab** for API request details
- **Check API logs** for error messages

#### Changes Don't Persist
- **Ensure test mode** is enabled for local development
- **Check file permissions** for `_data` directory
- **Verify API endpoint** is working correctly
- **Check cache invalidation** is functioning

### Debug Information

#### Frontend Debug
- **Browser console**: JavaScript errors and logs
- **Network tab**: API request/response details
- **React DevTools**: Component state inspection

#### Backend Debug
- **API logs**: Request processing details
- **Debug endpoints**: `/api/debug/mode`, `/api/debug/cache`
- **File system**: Check `_data` directory contents

## 🚀 Future Enhancements

### Planned Features
- **Real-time collaboration**: Multiple users editing simultaneously
- **Version control**: Git integration for change tracking
- **Approval workflow**: Manager review before saving
- **Audit trail**: Complete change history
- **Bulk editing**: Edit multiple models at once

### Technical Improvements
- **Offline support**: Local storage for unsaved changes
- **Auto-save**: Periodic saving of work in progress
- **Conflict resolution**: Handle concurrent edits
- **Performance optimization**: Lazy loading for large models
- **Mobile optimization**: Touch-friendly interface

## 📚 API Reference

### Update Model Endpoint

```http
PUT /api/models/{shortName}
Content-Type: application/json

{
  "shortName": "CUST",
  "modelData": {
    "name": "Updated Customer Model",
    "description": "New description",
    "meta": {
      "tier": "gold",
      "verified": true
    }
  }
}
```

### Response Format

```json
{
  "message": "Model updated successfully",
  "shortName": "CUST",
  "updated": true,
  "lastUpdated": "2024-01-15"
}
```

### Error Responses

```json
{
  "detail": "Model with short name 'INVALID' not found"
}
```

## 🤝 Contributing

### Development Setup
1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm start`
4. **Start API in test mode**: `export TEST_MODE=true && python main.py`

### Code Style
- **React hooks**: Use functional components with hooks
- **Material-UI**: Follow MUI design patterns
- **Error handling**: Comprehensive error management
- **Accessibility**: WCAG compliance standards

### Testing
- **Unit tests**: Component and function testing
- **Integration tests**: API endpoint testing
- **E2E tests**: Full user workflow testing
- **Performance tests**: Load and stress testing

## 📄 License

This feature is part of the Data Catalog project and follows the same licensing terms.
