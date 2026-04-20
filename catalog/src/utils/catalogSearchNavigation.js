/**
 * Route + display helpers for catalog search hits (shared by Global Search and pin dialog).
 */

export function getSearchResultTitle(item) {
  return String(item.name || item.shortName || item.title || item.term || item.id || 'Untitled');
}

export function getSearchResultDescription(item) {
  return String(item.description || item.extendedDescription || item.definition || item.status || '');
}

export function getSearchTypeLabel(type) {
  const labelMap = {
    models: 'Data Model',
    dataAgreements: 'Agreement',
    domains: 'Domain',
    applications: 'Application',
    toolkit: 'Toolkit',
    policies: 'Data Standard',
    lexicon: 'Lexicon',
    glossary: 'Glossary',
  };
  return labelMap[type] || type || 'Item';
}

/** React-router path for a search result row (`_search_type` + indexed fields). */
export function getSearchResultPath(item, type) {
  let id;
  switch (type) {
    case 'models':
      id = item.uuid || item.shortName || item.id || item.name;
      return `/models/${encodeURIComponent(id)}`;
    case 'dataAgreements':
      id = item.uuid || item.id || item.shortName || item.name;
      return `/agreements/${encodeURIComponent(id)}`;
    case 'domains':
      return `/domains`;
    case 'applications':
      return `/applications`;
    case 'glossary':
      id = item.uuid || item.id;
      return id ? `/glossary/${encodeURIComponent(id)}/edit` : `/glossary`;
    case 'toolkit':
      id = item.uuid || item.id || item.shortName || item.name;
      if (item._toolkit_type === 'toolkits') {
        return id ? `/toolkit/${encodeURIComponent(id)}` : `/toolkit`;
      }
      if (item._toolkit_type === 'containers') {
        return `/toolkit/container/${encodeURIComponent(id)}`;
      }
      if (item._toolkit_type === 'functions') {
        return `/toolkit/function/${encodeURIComponent(id)}`;
      }
      if (item._toolkit_type === 'infrastructure' || item._toolkit_type === 'terraform') {
        return `/toolkit/infrastructure/${encodeURIComponent(id)}`;
      }
      if (item.dockerfile || item.dockerCompose) {
        return `/toolkit/container/${encodeURIComponent(id)}`;
      }
      if (item.mainTf || item.variablesTf || item.outputsTf || item.provider) {
        return `/toolkit/infrastructure/${encodeURIComponent(id)}`;
      }
      if (item.code || item.parameters || item.language) {
        return `/toolkit/function/${encodeURIComponent(id)}`;
      }
      if (item.type === 'functions') {
        return `/toolkit/function/${encodeURIComponent(id)}`;
      }
      if (item.type === 'containers') {
        return `/toolkit/container/${encodeURIComponent(id)}`;
      }
      if (item.type === 'infrastructure') {
        return `/toolkit/infrastructure/${encodeURIComponent(id)}`;
      }
      return `/toolkit`;
    case 'policies': {
      const pid = item.uuid || item.id;
      return pid ? `/policies/edit/${encodeURIComponent(pid)}` : `/policies`;
    }
    case 'lexicon':
      return `/glossary`;
    default:
      id = item.id || item.shortName || item.name;
      return '/';
  }
}
