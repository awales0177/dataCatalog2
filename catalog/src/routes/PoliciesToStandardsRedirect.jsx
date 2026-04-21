import { Navigate, useLocation } from 'react-router-dom';

export default function PoliciesToStandardsRedirect() {
  const { pathname, search } = useLocation();
  const to = `${pathname.replace(/^\/policies/, '/standards')}${search}`;
  return <Navigate to={to} replace />;
}
