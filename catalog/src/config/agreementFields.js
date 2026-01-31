// Agreement fields configuration
// This file can be edited as YAML and converted, or edited directly as JS
// Format: field1 at top level with name, jsonKey, and options

export const agreementFieldsConfig = {
  field1: {
    name: "NetworkS",
    jsonKey: "network",
    options: [
      { value: "internet", label: "Internet", color: "#4caf50" },
      { value: "intranet", label: "Intranet", color: "#2196f3" }
    ]
  }
};

