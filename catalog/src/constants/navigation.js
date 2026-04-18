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

/** Basket SVG used by Agora query UI (matches UUX dh). */
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

// Define where the dividers should appear in the navigation

export const menuItems = [
  {
    name: 'Home',
    path: '/',
    icon: <FiHome />,
    id: 'home'
  },
  {
    name: 'Workspaces',
    path: '/workspaces',
    icon: <WorkspacesIcon />,
    id: 'workspaces'
  },
  {
    name: 'Data Models',
    path: '/models',
    icon: <PiGraph />,
    id: 'models'
  },
  {
    name: 'Data Rules',
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
    beta: true
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
    path: '/policies',
    icon: <PolicyIcon />,
    id: 'policies',
    beta: true
  },
  {
    name: 'Data Domains',
    path: '/domains',
    icon: <MdDomain />,
    id: 'domains',
    beta: true
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
    name: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    id: 'settings'
  },
];
