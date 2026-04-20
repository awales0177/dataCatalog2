import {
  FiHome,
  FiTool,
} from 'react-icons/fi';
import { MdHandshake, MdDomain } from "react-icons/md";
import { AiOutlineAppstore } from "react-icons/ai";
import { PiGraph } from "react-icons/pi";
import {
  Policy as PolicyIcon,
  MenuBook as MenuBookIcon,
  BarChart as BarChartIcon,
  Gavel as DataRulesIcon,
  WorkspacesOutlined as WorkspacesIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

/** Basket SVG used by query workbench UI (matches UUX dh). */
export const BasketIcon = ({ style }) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    style={{ width: '1.35rem', height: '1.35rem', ...style }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 10L18.5145 17.4276C18.3312 18.3439 18.2396 18.8021 18.0004 19.1448C17.7894 19.447 17.499 19.685 17.1613 19.8326C16.7783 20 16.3111 20 15.3766 20H8.62337C7.6889 20 7.22166 20 6.83869 19.8326C6.50097 19.685 6.2106 19.447 5.99964 19.1448C5.76041 18.8021 5.66878 18.3439 5.48551 17.4276L4 10M20 10H18M20 10H21M4 10H3M4 10H6M6 10H18M6 10L9 4M18 10L15 4M9 13V16M12 13V16M15 13V16"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const drawerWidth = 280;
export const collapsedDrawerWidth = 72;

/** Shown beside the lotus mark when the sidebar is expanded (desktop or mobile drawer). */
export const SIDEBAR_APP_TITLE = 'APP NAME';

/** Floating sidebar: inset from viewport (px) — UUX dh */
export const sidebarFloatInset = 16;
/** Extra offset below viewport top (was used with app bar;0 when using sidebar-only shell) */
export const sidebarBottomLift = 0;

export const sidebarContentGap = 14;
export const sidebarBorderRadius = 16;

/** Total horizontal space reserved left of main (floating rail + gap) */
export const mainColumnOffsetPx = (isCollapsed) =>
  sidebarFloatInset + (isCollapsed ? collapsedDrawerWidth : drawerWidth) + sidebarContentGap;

// Define where the dividers should appear in the navigation

export const menuItems = [
  {
    name: 'Home',
    path: '/',
    icon: <FiHome />,
    id: 'home'
  },
  {
    name: 'Data Models',
    path: '/models',
    icon: <PiGraph />,
    id: 'models',
  },
  {
    name: 'Rules',
    path: '/rules',
    icon: <DataRulesIcon />,
    id: 'rules',
    editorOnly: true
  },
  {
    name: 'Toolkit',
    path: '/toolkit',
    icon: <FiTool />,
    id: 'toolkit',
  },
  {
    name: 'Data Teams',
    path: '/applications',
    icon: <AiOutlineAppstore />,
    id: 'applications'
  },
  {
    name: 'Product Agreements',
    path: '/agreements',
    icon: <MdHandshake />,
    id: 'agreements'
  },
  {
    name: 'Data Standards',
    path: '/standards',
    icon: <PolicyIcon />,
    id: 'policies',
    beta: true
  },
  {
    name: 'Data Domains',
    path: '/domains',
    icon: <MdDomain />,
    id: 'domains',
  },
  {
    name: 'Glossary',
    path: '/glossary',
    icon: <MenuBookIcon />,
    id: 'glossary'
  },
  {
    name: 'Statistics',
    path: '/statistics',
    icon: <BarChartIcon />,
    id: 'statistics',
    adminOnly: true
  },
  {
    name: 'Workspaces',
    path: '/workspaces',
    icon: <WorkspacesIcon />,
    id: 'workspaces'
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    id: 'settings'
  },
];
