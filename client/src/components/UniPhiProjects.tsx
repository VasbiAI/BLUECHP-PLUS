
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Database, Calendar, User, FileText, ExternalLink } from "lucide-react";

// UniPhi Project interface
interface UniPhiProject {
  ID: number;
  ProjID: string;
  Name: string;
  Description?: string;
  Status?: string;
  StartDate?: string;
  EndDate?: string;
  [key: string]: any; // For any additional properties
}

export const UniPhiProjectsSection = () => {
  const { 
    data: projects, 
    isLoading, 
    isError, 
    error 
  } = useQuery<UniPhiProject[]>({
    queryKey: ['/api/uniphi/projects'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error fetching UniPhi projects</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
              <p className="mt-1 text-xs text-red-600">Verify that you're using the correct API endpoint (ProjectShow) and that your OAuth credentials are valid.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No projects found in UniPhi</p>
        <p className="text-sm text-gray-400 mt-2">Check your connection to the UniPhi API</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div key={project.ID} className="border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-blue-50 p-4 border-b">
            <h4 className="font-semibold text-lg truncate">{project.Name}</h4>
            <p className="text-sm text-gray-500 mt-1">ID: {project.ProjID}</p>
          </div>
          <div className="p-4 space-y-3">
            {project.Description && (
              <p className="text-sm text-gray-700">{project.Description}</p>
            )}
            
            <div className="space-y-2">
              {project.Status && (
                <div className="flex items-center text-sm">
                  <div className={`h-2 w-2 rounded-full mr-2 ${
                    project.Status.toLowerCase().includes('active') ? 'bg-green-500' : 
                    project.Status.toLowerCase().includes('complete') ? 'bg-blue-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-gray-700">Status: {project.Status}</span>
                </div>
              )}
              
              {project.StartDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-gray-500" />
                  <span className="text-gray-700">Started: {new Date(project.StartDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {project.EndDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-gray-500" />
                  <span className="text-gray-700">Due: {new Date(project.EndDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {project.Manager && (
                <div className="flex items-center text-sm">
                  <User className="h-3.5 w-3.5 mr-2 text-gray-500" />
                  <span className="text-gray-700">Manager: {project.Manager}</span>
                </div>
              )}
              
              {project.DocumentCount && (
                <div className="flex items-center text-sm">
                  <FileText className="h-3.5 w-3.5 mr-2 text-gray-500" />
                  <span className="text-gray-700">Documents: {project.DocumentCount}</span>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-gray-50 border-t flex justify-end">
            <a 
              href={`https://bluechp.uniphi.com.au/projects/${project.ProjID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              View in UniPhi
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UniPhiProjectsSection;
