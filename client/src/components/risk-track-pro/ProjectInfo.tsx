import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectInfoProps {
  projectId?: string;
}

interface Project {
  id: number;
  projectName: string;
  clientName: string;
  address: string;
  estimatedValue: string;
  estimatedCompletionDate: string;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({ projectId }) => {
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await axios.get<Project>(`/api/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex-1">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex-1 mt-4 md:mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="p-4">
          <p>Project information not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{project.projectName}</h2>
            <p className="text-gray-500 mb-4">{project.clientName}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Location</span>
                <p>{project.address || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Estimated Value</span>
                <p>{project.estimatedValue || 'Not specified'}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 mt-4 md:mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Estimated Completion</span>
                <p>{project.estimatedCompletionDate || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Project ID</span>
                <p>{project.id}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInfo;