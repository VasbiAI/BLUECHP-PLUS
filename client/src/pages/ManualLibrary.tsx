import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  FileText,
  Book,
  Search,
  Filter,
  Plus,
  Grid,
  LayoutList,
  Edit,
  MoreHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Types
interface Manual {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ManualLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newManual, setNewManual] = useState({ title: "", description: "" });
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch manuals from API
  const { data: manuals = [], isLoading: isLoadingManuals, refetch: refetchManuals } = useQuery<Manual[]>({
    queryKey: ["/api/manuals"],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/manuals');
        return response || [];
      } catch (error) {
        console.error("Error fetching manuals:", error);
        return [];
      }
    },
  });

  // Filter manuals based on search query
  const filteredManuals = manuals.filter(
    (manual) =>
      manual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (manual.description && manual.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Create a new manual
  const handleCreateManual = async () => {
    if (!newManual.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the manual.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('POST', '/api/manuals', newManual);
      
      toast({
        title: "Manual Created",
        description: "The manual has been created successfully.",
      });
      
      // Reset form and close dialog
      setNewManual({ title: "", description: "" });
      setIsCreateDialogOpen(false);
      
      // Refetch manuals to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/manuals"] });
    } catch (error) {
      console.error("Error creating manual:", error);
      toast({
        title: "Error",
        description: "Failed to create manual. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manuals</h1>
            <p className="text-muted-foreground">
              Create and manage construction process manuals
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Manual</DialogTitle>
                <DialogDescription>
                  Create a new manual to organize construction process documentation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter manual title"
                    value={newManual.title}
                    onChange={(e) => setNewManual({ ...newManual, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter manual description"
                    value={newManual.description}
                    onChange={(e) => setNewManual({ ...newManual, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateManual}>Create Manual</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search manuals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "grid" | "list")}
              className="hidden md:block"
            >
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <LayoutList className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="p-4 min-h-[300px]">
            {isLoadingManuals ? (
              <div className="h-52 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading manuals...</p>
                </div>
              </div>
            ) : filteredManuals.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredManuals.map((manual) => (
                    <Card key={manual.id} className="overflow-hidden hover:border-blue-200 transition-colors">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-gray-100">
                            <Book className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1" title={manual.title}>
                              {manual.title}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Updated {formatDate(manual.updatedAt)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        {manual.description && (
                          <p className="text-sm text-gray-600 line-clamp-2" title={manual.description}>
                            {manual.description}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 flex items-center gap-1"
                            onClick={() => navigate(`/manuals/${manual.id}`)}
                          >
                            <Book className="h-4 w-4" />
                            Open
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 flex items-center gap-1"
                            onClick={() => {
                              toast({
                                title: "Coming Soon",
                                description: "Edit functionality will be available in the next update.",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                toast({
                                  title: "Coming Soon",
                                  description: "Delete functionality will be available in the next update.",
                                });
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
                    <div className="col-span-5">Title</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2 text-center">Last Updated</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="divide-y">
                    {filteredManuals.map((manual) => (
                      <div
                        key={manual.id}
                        className="grid grid-cols-12 p-3 text-sm items-center hover:bg-muted/50 transition-colors"
                      >
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="p-2 rounded-md bg-gray-100">
                            <Book className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium line-clamp-1">{manual.title}</h4>
                          </div>
                        </div>
                        <div className="col-span-4 text-sm text-gray-600 line-clamp-1">
                          {manual.description || "No description"}
                        </div>
                        <div className="col-span-2 text-sm text-gray-500 text-center">
                          {formatDate(manual.updatedAt)}
                        </div>
                        <div className="col-span-1 flex justify-end items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 flex items-center gap-1"
                            onClick={() => navigate(`/manuals/${manual.id}`)}
                          >
                            <Book className="h-4 w-4" />
                            Open
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 flex items-center gap-1"
                            onClick={() => {
                              toast({
                                title: "Coming Soon",
                                description: "Edit functionality will be available in the next update.",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="h-52 flex items-center justify-center mt-6">
                <div className="text-center">
                  <Book className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No manuals found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery.trim() ? "No manuals match your search query." : "You haven't created any manuals yet."}
                  </p>
                  {searchQuery.trim() ? (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  ) : (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Create Manual
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualLibrary;