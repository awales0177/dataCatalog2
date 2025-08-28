import {
  FiHome,
  FiTool,
} from 'react-icons/fi';
import { MdHandshake, MdDomain } from "react-icons/md";
import { AiOutlineAppstore } from "react-icons/ai";
import { IoIosApps } from "react-icons/io";
import { PiGraph } from "react-icons/pi";
import { Policy as PolicyIcon } from '@mui/icons-material';

export const drawerWidth = 280;
export const collapsedDrawerWidth = 56;

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
    name: 'Toolkit',
    path: '/toolkit',
    icon: <FiTool />,
    id: 'toolkit'
  },
  {
    name: 'Reference Data',
    path: '/reference',
    icon: <IoIosApps />,
    id: 'reference'
  },
  {
    name: 'Data Applications',
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
    id: 'policies'
  },
  {
    name: 'Data Domains',
    path: '/domains',
    icon: <MdDomain />,
    id: 'domains'
  },
];
