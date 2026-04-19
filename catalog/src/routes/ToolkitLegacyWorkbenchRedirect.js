import { Navigate, useParams, useLocation } from 'react-router-dom';

/**
 * Legacy hub URLs:
 * - /toolkit/toolkit/:id (duplicate segment)
 * - /toolkit/workbench/:id (older naming)
 * New: /toolkit/:id
 */
export default function ToolkitLegacyWorkbenchRedirect() {
  const { toolkitId } = useParams();
  const location = useLocation();
  const path = location.pathname;
  const prefixes = [`/toolkit/workbench/${toolkitId}`, `/toolkit/toolkit/${toolkitId}`];
  let suffix = '';
  for (const p of prefixes) {
    if (path.startsWith(p)) {
      suffix = path.slice(p.length);
      break;
    }
  }
  return <Navigate replace to={`/toolkit/${toolkitId}${suffix}${location.search}`} />;
}
