import {
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon,
  Domain as DomainIcon,
  Apps as AppsIcon,
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';

export const menuItems = {
  items: [
    {
      id: "models",
      name: "Data Specifications",
      path: "/specifications",
      icon: AccountTreeIcon
    },
    {
      id: 2,
      name: "Product Agreements",
      path: "/agreements",
      icon: HandshakeIcon
    },
    {
      id: 3,
      name: "Data Domains",
      path: "/domains",
      icon: DomainIcon
    },
    {
      id: 4,
      name: "Applications",
      path: "/applications",
      icon: AppsIcon
    },
    {
      id: 5,
      name: "Lexicon",
      path: "/lexicon",
      icon: MenuBookIcon
    },
    {
      id: 6,
      name: "Reference Data",
      path: "/reference",
      icon: LibraryBooksIcon
    }
  ]
}; 