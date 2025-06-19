import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectInfoProps {
  projectId: number;
}

const ProjectInfo = ({ projectId }: ProjectInfoProps) => {
  const { data: project, isLoading, isError } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch project information');
      }
      return res.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="bg-[#0066CC] text-white py-3">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 bg-white/20 mb-1" />
                <Skeleton className="h-5 w-40 bg-white/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (isError || !project) {
    return (
      <div className="bg-[#0066CC] text-white py-3">
        <div className="container mx-auto px-4">
          <div className="text-center">
            Error loading project information
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#0066CC] text-white py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between">
          <div className="mb-2 lg:mb-0">
            <span className="font-semibold">Project:</span> 
            <span> {project.name}</span>
          </div>
          <div className="mb-2 lg:mb-0">
            <span className="font-semibold">Register:</span> 
            <span> {project.registerName}</span>
          </div>
          <div className="mb-2 lg:mb-0">
            <span className="font-semibold">Financial Option:</span> 
            <span> {project.financialOption}</span>
          </div>
          <div className="mb-2 lg:mb-0">
            <span className="font-semibold">Project Manager:</span> 
            <span> {project.projectManager}</span>
          </div>
          <div>
            <span className="font-semibold">Register Date:</span> 
            <span> {project.registerDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfo;
