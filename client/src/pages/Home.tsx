import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Calendar,
  Folder,
  FileText,
  BarChart,
  ClipboardList,
  Building,
  Search,
  Users,
  Sparkles,
} from "lucide-react";

interface AuthStatus {
  authenticated: boolean;
  user?: any;
}

interface Project {
  id: number;
  projectName: string;
  clientName: string;
  developmentType: string;
  estimatedValue: string;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: userData, isLoading: isLoadingUser } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!userData?.authenticated,
  });

  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery<any[]>({
    queryKey: ["/api/documents"],
    enabled: !!userData?.authenticated,
  });

  const isLoading = isLoadingUser || isLoadingProjects || isLoadingDocuments;
  const isAuthenticated = userData?.authenticated || false;

  const dashboardCards = [
    {
      title: "Projects",
      description: "Manage all your development projects",
      icon: <Folder className="h-8 w-8 text-blue-500" />,
      link: "/projects",
      count: projectsData?.length || 0,
    },
    {
      title: "Document Library",
      description: "Access and edit document templates",
      icon: <FileText className="h-8 w-8 text-green-500" />,
      link: "/documents",
      count: documentsData?.length || 0,
    },
    {
      title: "Risk Register",
      description: "Monitor and mitigate project risks",
      icon: <ClipboardList className="h-8 w-8 text-amber-500" />,
      link: "/projects/1/risks",
      count: "N/A",
    },
    {
      title: "Critical Dates",
      description: "Track important project milestones",
      icon: <Calendar className="h-8 w-8 text-red-500" />,
      link: "/projects/1/critical-dates",
      count: "N/A",
    },
    {
      title: "UniPhi Integration",
      description: "Sync with UniPhi project management data",
      icon: <Building className="h-8 w-8 text-indigo-500" />,
      link: "/uniphi",
      count: "N/A",
    },
    {
      title: "Manuals",
      description: "Access property and land search information",
      icon: <Search className="h-8 w-8 text-purple-500" />,
      link: "/manuals",
      count: "N/A",
    },
  ];

  if (!isAuthenticated && !isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center">
        <div className="mb-6">
          <Sparkles className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
            BlueCHP Intelligence Platform
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Your comprehensive solution for project management, risk assessment, and property intelligence.
          </p>
        </div>
        
        <div className="flex gap-4 mt-6">
          <Link href="/auth">
            <div className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer">
              Sign In
            </div>
          </Link>
          <Link href="/register">
            <div className="px-5 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium cursor-pointer">
              Create Account
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Dashboard cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardCards.map((card, index) => (
              <Link key={index} href={card.link}>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>{card.icon}</div>
                    <div className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {card.count}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm flex-grow">{card.description}</p>
                  <div className="mt-4 text-blue-600 text-sm font-medium">Access now →</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent projects section */}
          {activeTab === "overview" && projectsData && projectsData.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estimated Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projectsData?.slice(0, 5).map((project, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            <Link href={`/projects/${project.id}`}>
                              {project.projectName}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.clientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.developmentType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.estimatedValue}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <Link href="/projects">
                    <span className="text-sm text-blue-600 font-medium hover:text-blue-800">View all projects →</span>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Quick links section */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link href="/projects/new">
                <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Folder className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-700">New Project</span>
                </div>
              </Link>
              <Link href="/documents">
                <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                  <FileText className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-700">Documents</span>
                </div>
              </Link>
              <Link href="/projects/1/risks">
                <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                  <ClipboardList className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-700">Risk Register</span>
                </div>
              </Link>
              <Link href="/projects/1/critical-dates">
                <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-700">Calendar</span>
                </div>
              </Link>
              <Link href="/manuals">
                <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Users className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-700">Manuals</span>
                </div>
              </Link>
              <Link href="/uniphi">
                <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Sparkles className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-700">UniPhi</span>
                </div>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
