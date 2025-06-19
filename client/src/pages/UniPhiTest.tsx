import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink } from "lucide-react";

interface UniPhiProject {
  id: string;
  name: string;
  [key: string]: any; // For additional properties
}

export default function UniPhiTest() {
  const { 
    data: projects, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<UniPhiProject[]>({
    queryKey: ['/api/uniphi/projects'],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">UniPhi Projects Integration</h1>
        <Button 
          onClick={() => refetch()} 
          className="flex items-center gap-2"
        >
          <span>Refresh Data</span>
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading UniPhi projects: {(error as Error).message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {projects?.length === 0 && !isLoading && (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No projects found in UniPhi</p>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>ID: {project.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.description && (
                    <p className="text-sm text-gray-500">{project.description}</p>
                  )}
                  {Object.entries(project)
                    .filter(([key]) => !['id', 'name', 'description'].includes(key))
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="font-medium">{key}:</span>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter>
                <a
                  href={`https://bluechp.uniphi.com.au/projects/${project.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View in UniPhi</span>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}