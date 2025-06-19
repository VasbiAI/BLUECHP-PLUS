import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Settings, ExternalLink, RefreshCw } from "lucide-react";
import { UniPhiProjectsSection } from "../components/UniPhiProjects";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define schema for lookup entries
const lookupItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type LookupItem = {
  id: number;
  name: string;
  description: string | null;
};

type LookupType = 
  | "developmentTypes" 
  | "financeModels" 
  | "contractTypes" 
  | "fundingSources" 
  | "revenueStreams"
  | "documentCategories"
  | "uniphiIntegration";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LookupType>("developmentTypes");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LookupItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Handle tab selection from URL parameters (for direct navigation from other pages)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ["developmentTypes", "financeModels", "contractTypes", "fundingSources", "revenueStreams", "documentCategories"].includes(tabParam)) {
      setActiveTab(tabParam as LookupType);
    }
  }, []);

  // Form for adding new items
  const form = useForm<z.infer<typeof lookupItemSchema>>({
    resolver: zodResolver(lookupItemSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Query to fetch lookup items
  const { data: lookupItems = [], isLoading } = useQuery({
    queryKey: ['/api/admin/lookups', activeTab],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/lookups/${activeTab}`);
      return response || [];
    },
  });

  // Mutation to add new lookup item
  const addMutation = useMutation({
    mutationFn: (data: z.infer<typeof lookupItemSchema>) => {
      console.log("Adding new item:", data, "to tab:", activeTab);
      return apiRequest('POST', `/api/admin/lookups/${activeTab}`, data);
    },
    onSuccess: () => {
      console.log("Item added successfully!");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lookups', activeTab] });
      toast({
        title: "Item added",
        description: "The lookup item was added successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error adding item:", error);
      toast({
        title: "Error adding item",
        description: error.message || "There was an error adding the item",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete lookup item
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/admin/lookups/${activeTab}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lookups', activeTab] });
      toast({
        title: "Item deleted",
        description: "The lookup item was deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting item",
        description: error.message || "There was an error deleting the item",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof lookupItemSchema>) => {
    addMutation.mutate(data);
  };

  // Handle delete confirmation
  const handleDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  // Get human-readable tab name
  const getTabLabel = (tab: LookupType): string => {
    switch (tab) {
      case "developmentTypes":
        return "Development Types";
      case "financeModels":
        return "Finance Models";
      case "contractTypes":
        return "Contract Types";
      case "fundingSources":
        return "Funding Sources";
      case "revenueStreams":
        return "Revenue Streams";
      case "documentCategories":
        return "Document Categories";
      case "uniphiIntegration":
        return "UniPhi Integration";
      default:
        return tab;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500">
            Manage system settings and lookup values
          </p>
        </div>
        <Settings className="h-8 w-8 text-gray-500" />
      </div>

      <Tabs 
        defaultValue="developmentTypes" 
        className="space-y-4"
        onValueChange={(value) => setActiveTab(value as LookupType)}
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <TabsTrigger value="developmentTypes">Development Types</TabsTrigger>
          <TabsTrigger value="financeModels">Finance Models</TabsTrigger>
          <TabsTrigger value="contractTypes">Contract Types</TabsTrigger>
          <TabsTrigger value="fundingSources">Funding Sources</TabsTrigger>
          <TabsTrigger value="revenueStreams">Revenue Streams</TabsTrigger>
          <TabsTrigger value="documentCategories">Document Categories</TabsTrigger>
          <TabsTrigger value="uniphiIntegration">UniPhi Integration</TabsTrigger>
        </TabsList>

        {/* Content for each tab is the same for lookup data */}
        {["developmentTypes", "financeModels", "contractTypes", "fundingSources", "revenueStreams", "documentCategories"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{getTabLabel(tab as LookupType)}</CardTitle>
                  <CardDescription>
                    Manage available options for {getTabLabel(tab as LookupType).toLowerCase()}
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New {getTabLabel(tab as LookupType).slice(0, -1)}</DialogTitle>
                      <DialogDescription>
                        Add a new option to the {getTabLabel(tab as LookupType).toLowerCase()} list
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form 
                        onSubmit={form.handleSubmit((data) => {
                          addMutation.mutate(data);
                        })} 
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name*</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter description (optional)" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={addMutation.isPending}>
                            {addMutation.isPending ? "Adding..." : "Add Item"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : Array.isArray(lookupItems) && lookupItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lookupItems.map((item: LookupItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setItemToDelete(item);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-500">
                    No items found. Add your first {getTabLabel(tab as LookupType).slice(0, -1).toLowerCase()} using the "Add New" button.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* UniPhi Integration Tab Content */}
        <TabsContent value="uniphiIntegration" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>UniPhi Integration</CardTitle>
                <CardDescription>
                  View projects and data from the UniPhi API
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    window.open('https://bluechp.uniphi.com.au', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open UniPhi
                </Button>
                <Button 
                  onClick={() => {
                    // Refresh UniPhi data
                    queryClient.invalidateQueries({ queryKey: ['/api/uniphi/projects'] });
                    toast({
                      title: "Refreshing UniPhi data",
                      description: "Fetching the latest data from UniPhi API",
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Projects from UniPhi</h3>
                  <UniPhiProjectsSection />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}