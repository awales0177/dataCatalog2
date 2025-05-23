export const termConfig = {
  // Main Categories
  dataModels: {
    displayName: "Data Specifications",
    description: "Structured representations of data entities and their relationships",
    icon: "StorageIcon",
    shortDescription: "Data structure definitions"
  },
  dataAgreements: {
    displayName: "Product Agreements",
    description: "Product agreements and compliance",
    icon: "DescriptionIcon",
    shortDescription: "Product agreements"
  },
  dataDomains: {
    displayName: "Data Domains",
    description: "Logical groupings of related data models and business concepts",
    icon: "DomainIcon",
    shortDescription: "Business domain groupings"
  },
  applications: {
    displayName: "Applications",
    description: "Software systems that consume or produce data",
    icon: "AppsIcon",
    shortDescription: "Data applications"
  },
  lexicons: {
    displayName: "Lexicon",
    description: "Standardized terminology and definitions for business terms",
    icon: "MenuBookIcon",
    shortDescription: "Business terminology"
  },
  referenceData: {
    displayName: "Reference Data",
    description: "Standardized codes, values, and classifications used across the organization",
    icon: "LibraryBooksIcon",
    shortDescription: "Standard codes and values"
  },

  // Roles and Teams
  modelMaintainer: {
    displayName: "Specification Maintainer",
    description: "Person responsible for the ongoing maintenance and updates of a data specification",
    icon: "PersonIcon",
    shortDescription: "Specification maintenance owner"
  },
  producerTeam: {
    displayName: "Producer Team",
    description: "Team responsible for creating and maintaining the source data",
    icon: "GroupIcon",
    shortDescription: "Data producers"
  },
  validator: {
    displayName: "Validator",
    description: "Person or team responsible for validating data quality and compliance",
    icon: "VerifiedIcon",
    shortDescription: "Data quality validator"
  },
  consumerTeam: {
    displayName: "Consumer Team",
    description: "Team that uses the data for business operations or analytics",
    icon: "GroupIcon",
    shortDescription: "Data consumers"
  },

  // Data Model Properties
  modelId: {
    displayName: "Specification ID",
    description: "Unique identifier for the data specification",
    shortDescription: "Specification identifier"
  },
  modelName: {
    displayName: "Specification Name",
    description: "Full name of the data specification",
    shortDescription: "Specification name"
  },
  modelShortName: {
    displayName: "Short Name",
    description: "Abbreviated identifier for the data specification",
    shortDescription: "Specification short code"
  },
  modelVersion: {
    displayName: "Version",
    description: "Current version of the data specification",
    shortDescription: "Specification version"
  },
  modelStatus: {
    displayName: "Status",
    description: "Current state of the data specification (Draft, Active, Deprecated)",
    shortDescription: "Specification status"
  },
  modelTags: {
    displayName: "Tags",
    description: "Keywords for categorizing and searching the model",
    shortDescription: "Model categories"
  },

  // Agreement Properties
  agreementId: {
    displayName: "Agreement ID",
    description: "Unique identifier for the data agreement",
    shortDescription: "Agreement identifier"
  },
  agreementName: {
    displayName: "Agreement Name",
    description: "Full name of the data agreement",
    shortDescription: "Agreement name"
  },
  agreementVersion: {
    displayName: "Version",
    description: "Current version of the data agreement",
    shortDescription: "Agreement version"
  },
  agreementStatus: {
    displayName: "Status",
    description: "Current state of the data agreement",
    shortDescription: "Agreement status"
  },
  agreementType: {
    displayName: "Type",
    description: "Type of the data agreement",
    shortDescription: "Agreement type"
  },

  // Domain Properties
  domainId: {
    displayName: "Domain ID",
    description: "Unique identifier for the data domain",
    shortDescription: "Domain identifier"
  },
  domainName: {
    displayName: "Domain Name",
    description: "Full name of the data domain",
    shortDescription: "Domain name"
  },
  domainDescription: {
    displayName: "Description",
    description: "Detailed explanation of the data domain's purpose and scope",
    shortDescription: "Domain purpose"
  },

  // Application Properties
  applicationId: {
    displayName: "Application ID",
    description: "Unique identifier for the application",
    shortDescription: "App identifier"
  },
  applicationName: {
    displayName: "Application Name",
    description: "Full name of the application",
    shortDescription: "App name"
  },
  applicationType: {
    displayName: "Type",
    description: "Category of the application (Source, Consumer, Both)",
    shortDescription: "App category"
  },

  // Lexicon Properties
  termId: {
    displayName: "Term ID",
    description: "Unique identifier for the business term",
    shortDescription: "Term identifier"
  },
  termName: {
    displayName: "Term",
    description: "Business term or concept",
    shortDescription: "Business term"
  },
  termDefinition: {
    displayName: "Definition",
    description: "Detailed explanation of the business term",
    shortDescription: "Term meaning"
  },

  // Reference Data Properties
  referenceId: {
    displayName: "Reference ID",
    description: "Unique identifier for the reference data item",
    shortDescription: "Reference identifier"
  },
  referenceName: {
    displayName: "Name",
    description: "Name of the reference data item",
    shortDescription: "Reference name"
  },
  referenceType: {
    displayName: "Type",
    description: "Category of the reference data (Code, Value, Classification)",
    shortDescription: "Reference category"
  }
};

// Helper function to get display name
export const getDisplayName = (term) => {
  return termConfig[term]?.displayName || term;
};

// Helper function to get description
export const getDescription = (term) => {
  return termConfig[term]?.description || '';
};

// Helper function to get short description
export const getShortDescription = (term) => {
  return termConfig[term]?.shortDescription || '';
};

// Helper function to get icon
export const getIcon = (term) => {
  return termConfig[term]?.icon || 'DefaultIcon';
};

// Export all terms as an array for easy iteration
export const allTerms = Object.keys(termConfig);

// Export categories for grouping
export const categories = {
  mainCategories: ['dataModels', 'dataAgreements', 'dataDomains', 'applications', 'lexicons', 'referenceData'],
  roles: ['modelMaintainer', 'producerTeam', 'validator', 'consumerTeam'],
  modelProperties: ['modelId', 'modelName', 'modelShortName', 'modelVersion', 'modelStatus', 'modelTags'],
  agreementProperties: ['agreementId', 'agreementName', 'agreementVersion', 'agreementStatus', 'agreementType'],
  domainProperties: ['domainId', 'domainName', 'domainDescription'],
  applicationProperties: ['applicationId', 'applicationName', 'applicationType'],
  lexiconProperties: ['termId', 'termName', 'termDefinition'],
  referenceProperties: ['referenceId', 'referenceName', 'referenceType']
}; 