import {
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon,
  Domain as DomainIcon,
  Apps as AppsIcon,
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
} from '@mui/icons-material';

export const menuItems = {
  items: [
    {
      id: 1,
      name: "Data Models",
      path: "/models",
      icon: AccountTreeIcon
    },
    {
      id: 2,
      name: "Data Contracts",
      path: "/contracts",
      icon: DescriptionIcon
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