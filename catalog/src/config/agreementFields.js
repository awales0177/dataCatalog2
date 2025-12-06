// Agreement fields configuration
// This file can be edited as YAML and converted, or edited directly as JS
// Format: field1 and field2 at top level, each with name, jsonKey, and options

export const agreementFieldsConfig = {
  field1: {
    name: "NetworkS",
    jsonKey: "network",
    options: [
      { value: "internet", label: "Internet", color: "#4caf50" },
      { value: "intranet", label: "Intranet", color: "#2196f3" }
    ]
  },
  field2: {
    name: "Sensitivity Level",
    jsonKey: "sensitivityLevel",
    options: [
      { value: "public", label: "Public", color: "#4caf50" },
      { value: "internal", label: "Internal", color: "#ff9800" },
      { value: "confidential", label: "Confidential", color: "#f44336" },
      { value: "highly_sensitive", label: "Highly Sensitive", color: "#9c27b0" }
    ]
  }
};

