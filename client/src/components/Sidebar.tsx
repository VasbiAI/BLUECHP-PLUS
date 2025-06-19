import { 
  FolderIcon, 
  Settings2Icon, 
  Redo2, 
  RouteIcon,
  PaletteIcon,
  ServerIcon, 
  Webhook, 
  DatabaseIcon, 
  DropletIcon, 
  TerminalIcon, 
  CodeIcon, 
  RocketIcon, 
  SquareStack,
  XIcon
} from "lucide-react";
import { Link } from "wouter";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navItems = [
    {
      title: "Project Setup",
      items: [
        { name: "Project Structure", href: "/project-structure", icon: <FolderIcon className="h-4 w-4 mr-2" /> },
        { name: "Configuration", href: "/configuration", icon: <Settings2Icon className="h-4 w-4 mr-2" /> },
      ],
    },
    {
      title: "Frontend",
      items: [
        { name: "React Setup", href: "/frontend#react-setup", icon: <Redo2 className="h-4 w-4 mr-2" /> },
        { name: "Routing", href: "/frontend#routing", icon: <RouteIcon className="h-4 w-4 mr-2" /> },
        { name: "Tailwind CSS", href: "/frontend#tailwind", icon: <PaletteIcon className="h-4 w-4 mr-2" /> },
      ],
    },
    {
      title: "Backend",
      items: [
        { name: "Express Setup", href: "/backend#express-setup", icon: <ServerIcon className="h-4 w-4 mr-2" /> },
        { name: "API Endpoints", href: "/backend#api-endpoints", icon: <Webhook className="h-4 w-4 mr-2" /> },
      ],
    },
    {
      title: "Database",
      items: [
        { name: "PostgreSQL", href: "/database#postgresql", icon: <DatabaseIcon className="h-4 w-4 mr-2" /> },
        { name: "Drizzle ORM", href: "/database#drizzle-orm", icon: <DropletIcon className="h-4 w-4 mr-2" /> },
      ],
    },
    {
      title: "Development",
      items: [
        { name: "Scripts", href: "/project-structure#scripts", icon: <TerminalIcon className="h-4 w-4 mr-2" /> },
        { name: "Dev Environment", href: "/project-structure#dev-environment", icon: <CodeIcon className="h-4 w-4 mr-2" /> },
      ],
    },
  ];

  const sidebarClasses = open
    ? "fixed inset-0 z-50 w-full md:w-64 md:relative md:inset-auto bg-gray-900 text-white flex flex-col"
    : "hidden md:flex md:w-64 bg-gray-900 text-white flex-col z-10";

  return (
    <aside className={sidebarClasses}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-550 rounded-lg p-1">
            <SquareStack className="text-white h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">TS Stack</h1>
        </div>
        <button className="md:hidden text-gray-400 hover:text-white" onClick={onClose}>
          <XIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navItems.map((section) => (
          <div className="pb-2" key={section.title}>
            <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-2">
              {section.title}
            </p>

            {section.items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className="flex items-center px-3 py-2 text-gray-300 rounded-md hover:bg-gray-800 hover:text-white"
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Link
          href="/project-structure#deployment"
          onClick={onClose}
          className="flex items-center px-3 py-2 text-gray-300 rounded-md hover:bg-gray-800 hover:text-white"
        >
          <RocketIcon className="h-4 w-4 mr-2" />
          <span>Deployment</span>
        </Link>
      </div>
    </aside>
  );
}