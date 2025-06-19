import { Link, useLocation } from "wouter";

const TabNavigation = () => {
  const [location] = useLocation();
  
  const tabs = [
    { path: "/", label: "Risk Register", icon: "clipboard-list" },
    { path: "/issues", label: "Issues Register", icon: "alert-circle" },
    { path: "/critical-dates", label: "Critical Dates", icon: "calendar-alt" },
    { path: "/rating-legend", label: "Rating Legend", icon: "info-circle" },
    { path: "/analytics", label: "Analytics", icon: "chart-line" },
    { path: "/settings", label: "Settings", icon: "cog" },
  ];
  
  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <nav className="flex overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = tab.path === location;
            return (
              <Link 
                key={tab.path} 
                href={tab.path}
                className={`px-4 py-3 font-medium flex items-center transition-colors ${
                  isActive
                    ? "text-[#0066CC] border-b-2 border-[#0066CC]"
                    : "text-neutral-300 hover:text-neutral-400 border-b-2 border-transparent hover:border-neutral-200"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  {tab.icon === "clipboard-list" && (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="8" y1="10" x2="16" y2="10" />
                      <line x1="8" y1="14" x2="16" y2="14" />
                      <line x1="8" y1="18" x2="12" y2="18" />
                    </>
                  )}
                  {tab.icon === "calendar-alt" && (
                    <>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </>
                  )}
                  {tab.icon === "chart-line" && (
                    <>
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </>
                  )}
                  {tab.icon === "alert-circle" && (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </>
                  )}
                  {tab.icon === "info-circle" && (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </>
                  )}
                  {tab.icon === "cog" && (
                    <>
                      <path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10" />
                      <path d="M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3" />
                    </>
                  )}
                </svg>
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;
