import {
  FiHome,
  FiTool,
} from 'react-icons/fi';
import { MdHandshake, MdDomain } from "react-icons/md";
import { AiOutlineAppstore } from "react-icons/ai";
import { IoIosApps } from "react-icons/io";
import { PiGraph } from "react-icons/pi";
import { Policy as PolicyIcon, MenuBook as MenuBookIcon, BarChart as BarChartIcon, Rule as RuleIcon, LibraryBooks as LibraryBooksIcon } from '@mui/icons-material';

// Pipe SVG Icon Component
const PipelineIcon = ({ style }) => (
  <svg
    fill="currentColor"
    viewBox="0 0 512 512"
    style={{ width: '1.35rem', height: '1.35rem', ...style }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M490.057,149.943H409.6v37.847v187.62v37.847h80.457c12.12,0,21.943-9.825,21.943-21.943V171.886 C512,159.767,502.177,149.943,490.057,149.943z"/>
    <path d="M21.943,149.943C9.826,149.943,0,159.767,0,171.886v219.429c0,12.118,9.826,21.943,21.943,21.943H102.4V375.41V187.79 v-37.847H21.943z"/>
    <path d="M277.943,186.514v-43.886h21.943c12.12,0,21.943-9.825,21.943-21.943c0-12.118-9.823-21.943-21.943-21.943H256h-43.886 c-12.117,0-21.943,9.825-21.943,21.943c0,12.118,9.826,21.943,21.943,21.943h21.943v43.886h-87.771v190.171h219.429V186.514 H277.943z"/>
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
    name: 'Data Models',
    path: '/models',
    icon: <PiGraph />,
    id: 'models'
  },
  {
    name: 'Rule Builder',
    path: '/rules',
    icon: <RuleIcon />,
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
    name: 'Pipelines',
    path: '/pipelines',
    icon: <PipelineIcon />,
    id: 'pipelines',
    beta: true
  },
  {
    name: 'Products',
    path: '/data-products',
    icon: <LibraryBooksIcon />,
    id: 'data-products',
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
    name: 'Data Policies',
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
];
