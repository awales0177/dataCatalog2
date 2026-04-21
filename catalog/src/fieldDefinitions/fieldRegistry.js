/**
 * Central definitions for catalog fields shown on read-only (detail) pages.
 * Keys are stable IDs; use them with <FieldInfoIcon fieldId="…" /> next to labels.
 * Add new entries here as you document more UI fields (edit pages excluded for now).
 */
export const FIELD_REGISTRY = {
  // —— Data model (detail) ——
  'dataModel.section.description': {
    label: 'Description',
    description:
      'Narrative summary of what the model represents, how it is used, and how it fits in the data landscape.',
  },
  'dataModel.section.domains': {
    label: 'Domains',
    description: 'Business or subject-area domains this model is associated with for discovery and governance.',
  },
  'dataModel.section.referenceData': {
    label: 'Reference data',
    description: 'Reference tables or datasets that this model depends on or aligns with.',
  },
  'dataModel.section.users': {
    label: 'Users',
    description: 'Teams, roles, or stakeholder groups that consume or rely on this model.',
  },
  'dataModel.metadataScore': {
    label: 'Metadata score',
    description:
      'Completeness of catalog metadata for this model. Higher scores mean more of the expected fields are filled in.',
  },
  'dataModel.spec.latestVersion': {
    label: 'Latest version',
    description: 'Current version identifier of the model specification as published in the catalog.',
  },
  'dataModel.spec.specificationMaintainer': {
    label: 'Specification maintainer',
    description:
      'Team or application responsible for keeping the model specification accurate and up to date.',
  },
  'dataModel.spec.lastUpdated': {
    label: 'Last updated',
    description: 'When the model record or specification was last changed in the catalog.',
  },
  'dataModel.spec.tier': {
    label: 'Tier',
    description:
      'Quality or certification tier (for example gold, silver, bronze) used to signal maturity or approval level.',
  },
  'dataModel.field.sensitivityLevel': {
    label: 'Sensitivity level',
    description: 'Classification of how sensitive the underlying data is (for example public, internal, restricted).',
  },
  'dataModel.versionHistory.entryVersion': {
    label: 'Version',
    description: 'Specification version this history entry refers to.',
  },
  'dataModel.versionHistory.fieldChanges': {
    label: 'Field changes',
    description: 'Structured list of which attributes changed between versions.',
  },

  // —— Toolkit / workbench technology (detail) ——
  'toolkit.technology.evalPros': {
    label: 'Pros',
    description: 'Positive evaluation notes or strengths called out for this technology.',
  },
  'toolkit.technology.evalCons': {
    label: 'Cons',
    description: 'Risks, limitations, or drawbacks noted during evaluation.',
  },
  'toolkit.technology.languages': {
    label: 'Languages',
    description: 'Programming or query languages commonly used with this technology.',
  },
  'toolkit.technology.maintainer': {
    label: 'Maintainer',
    description: 'Team or application responsible for this technology in the workbench.',
  },
  'toolkit.technology.lastUpdated': {
    label: 'Last updated',
    description: 'When this technology entry was last updated.',
  },
  'toolkit.technology.version': {
    label: 'Version',
    description: 'Reported version of the technology or integration in use.',
  },
  'toolkit.technology.rolesSection': {
    label: 'Roles',
    description:
      'Operational context for this technology: who maintains it, when it was last updated, and which version is in use.',
  },
  'toolkit.technology.links': {
    label: 'Links',
    description:
      'Curated links with custom titles (for example documentation or runbooks), edited on the toolkit page and shown in this panel.',
  },

  // —— Toolkit catalog items (infrastructure, container, function, etc.) ——
  'catalog.item.provider': {
    label: 'Provider',
    description: 'Vendor, runtime, or tooling provider (for example terraform, cloud vendor).',
  },
  'catalog.item.type': {
    label: 'Type',
    description: 'Kind of asset (for example container image type or runtime).',
  },
  'catalog.item.category': {
    label: 'Category',
    description: 'Grouping used to browse and filter similar catalog items.',
  },
  'catalog.item.lastUpdated': {
    label: 'Last updated',
    description: 'When this catalog item was last modified.',
  },
  'catalog.item.usageInstructions': {
    label: 'Usage instructions',
    description: 'How teams should use or adopt this item safely and consistently.',
  },

  // —— Dataset (detail) ——
  'dataset.records': {
    label: 'Records',
    description: 'Approximate row or record count for this dataset.',
  },
  'dataset.size': {
    label: 'Size',
    description: 'Storage footprint or scale indicator for the dataset.',
  },
  'dataset.complexity': {
    label: 'Complexity',
    description: 'Relative complexity of the dataset or its pipelines.',
  },
  'dataset.periodicity': {
    label: 'Periodicity',
    description: 'How often the dataset is refreshed or produced.',
  },
  'dataset.lastUpdated': {
    label: 'Last updated',
    description: 'When the dataset metadata or snapshot was last updated.',
  },
  'dataset.section.pipelines': {
    label: 'Pipelines',
    description: 'Data pipelines or systems that produce or feed this dataset.',
  },
  'dataset.etl.poc': {
    label: 'POC',
    description: 'Point of contact for ETL or pipeline questions.',
  },
  'dataset.etl.organization': {
    label: 'Organization',
    description: 'Owning organization for the ETL or platform work.',
  },
  'dataset.etl.platform': {
    label: 'Platform',
    description: 'Execution or orchestration platform for the ETL workload.',
  },
  'dataset.etl.avgRuntime': {
    label: 'Average runtime',
    description: 'Typical duration of a pipeline run that touches this dataset.',
  },

  // —— Product agreement (detail) ——
  'productAgreement.parties': {
    label: 'Parties',
    description:
      'Applications or teams on the other side of the data exchange relative to the agreement owner—producers, consumers, or both.',
  },
  'productAgreement.versionHealth': {
    label: 'Version health',
    description:
      'How closely delivered model versions track the latest catalog model version; lower health may indicate the agreement is behind.',
  },
  'productAgreement.modelVersionsDelivered': {
    label: 'Model versions delivered',
    description: 'Model specification versions that this agreement currently covers or has committed to deliver.',
  },
  'productAgreement.latestModelVersion': {
    label: 'Latest model version',
    description: 'The newest version of the data model in the catalog (baseline for comparison).',
  },
  'productAgreement.section.dataFlow': {
    label: 'Data flow',
    description: 'Producer → model → consumer relationship for this agreement.',
  },
  'productAgreement.flow.producer': {
    label: 'Producer',
    description: 'Source application or team that supplies the data product under this agreement.',
  },
  'productAgreement.flow.model': {
    label: 'Model',
    description: 'The data model that defines structure and rules for the exchanged data.',
  },
  'productAgreement.flow.consumer': {
    label: 'Consumer',
    description: 'Downstream application or team that receives or uses the data product.',
  },
  'productAgreement.section.roles': {
    label: 'Roles & responsibilities',
    description: 'Who owns specification maintenance, validation, and which systems produce or consume the data.',
  },
  'productAgreement.table.role': {
    label: 'Role',
    description: 'Named responsibility in the agreement (for example maintainer, producer, validator).',
  },
  'productAgreement.table.team': {
    label: 'Team',
    description: 'Team or application assigned to that role.',
  },
  'productAgreement.role.parentSystem': {
    label: 'Parent system',
    description: 'Higher-level system or portfolio context for the associated data model.',
  },
  'productAgreement.role.specificationMaintainer': {
    label: 'Specification maintainer',
    description: 'Party responsible for keeping the model specification accurate for this agreement.',
  },
  'productAgreement.role.dataProducer': {
    label: 'Data producer',
    description: 'Systems or teams that generate or publish the data covered by the agreement.',
  },
  'productAgreement.role.dataValidator': {
    label: 'Data validator',
    description: 'Party responsible for checking data quality or conformance.',
  },
  'productAgreement.role.dataConsumer': {
    label: 'Data consumer',
    description: 'Systems or teams that ingest or depend on the delivered data.',
  },
  'productAgreement.section.todo': {
    label: 'TODO',
    description: 'Open follow-ups or actions tracked for this agreement.',
  },
  'productAgreement.section.changelog': {
    label: 'Changelog',
    description: 'Manually recorded release notes or notable changes for this agreement.',
  },
  'productAgreement.section.versionHistory': {
    label: 'Version history',
    description: 'Automatically tracked edits to the agreement record over time.',
  },
  'productAgreement.versionHistory.fieldChanges': {
    label: 'Field changes',
    description: 'Before-and-after values for fields that changed in a given history entry.',
  },
  'productAgreement.section.agreementInfo': {
    label: 'Agreement information',
    description: 'Contract metadata: versions, delivery terms, location, and lifecycle dates.',
  },
  'productAgreement.agreementVersion': {
    label: 'Agreement version',
    description: 'Version of the agreement document or contract itself (distinct from model version).',
  },
  'productAgreement.modelName': {
    label: 'Model name',
    description: 'Short name of the catalog data model tied to this agreement.',
  },
  'productAgreement.modelVersionDelivered': {
    label: 'Model version delivered',
    description: 'Which model specification version(s) the parties have committed to under this agreement.',
  },
  'productAgreement.fileFormat': {
    label: 'File format',
    description: 'Expected interchange format for delivered data (when applicable).',
  },
  'productAgreement.deliveryFrequency': {
    label: 'Delivery frequency',
    description: 'How often data is delivered or refreshed under the agreement.',
  },
  'productAgreement.location': {
    label: 'Location',
    description: 'Where data is stored or made available (for example buckets, paths, or regions).',
  },
  'productAgreement.field.network': {
    label: 'Network',
    description: 'Network path classification for how data moves (for example internet vs intranet), per agreement configuration.',
  },
  'productAgreement.startDate': {
    label: 'Start date',
    description: 'When the agreement becomes effective.',
  },
  'productAgreement.endDate': {
    label: 'End date',
    description: 'When the agreement ends or is up for renewal; may be empty if ongoing.',
  },
  'productAgreement.lastUpdated': {
    label: 'Last updated',
    description: 'When this agreement record was last modified in the catalog.',
  },
  'productAgreement.dataStandards': {
    label: 'Data standards',
    description: 'Linked data policies or standards this agreement must follow.',
  },
};

export function getFieldDefinition(fieldId) {
  if (!fieldId || typeof fieldId !== 'string') return null;
  return FIELD_REGISTRY[fieldId] ?? null;
}
