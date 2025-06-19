import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddressAutofill from "@/components/AddressAutofill";

import { ArrowLeft, Building, CalendarRange, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Project creation schema
const projectSchema = z.object({
  projectName: z.string().min(3, "Project name must be at least 3 characters"),
  projectDescription: z.string().optional(),
  clientName: z.string().min(2, "Client name is required"),
  // Address fields
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional().default("Australia"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  // Project details
  developmentType: z.string().min(1, "Development type is required"),
  financeModel: z.string().min(1, "Finance model is required"),
  contractType: z.string().min(1, "Contract type is required"),
  fundingSource: z.string().optional(),
  revenueStream: z.string().optional(),
  estimatedValue: z.string().min(1, "Estimated value is required"),
  estimatedCompletionDate: z.string().min(1, "Estimated completion date is required"),
  includeCommercialStructure: z.boolean().default(true),
  includeFundingDiagram: z.boolean().default(true),
  requiresRiskMitigation: z.boolean().default(true),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProject() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: "",
      projectDescription: "",
      clientName: "",
      // Address fields
      address: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Australia",
      latitude: "",
      longitude: "",
      // Project details
      developmentType: "",
      financeModel: "",
      contractType: "",
      fundingSource: "",
      revenueStream: "",
      estimatedValue: "",
      estimatedCompletionDate: new Date().toISOString().split("T")[0],
      includeCommercialStructure: true,
      includeFundingDiagram: true,
      requiresRiskMitigation: true,
    },
  });

  // Address autofill is now handled by the AddressAutofill component

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormValues) => 
      apiRequest('POST', '/api/projects', data),
    onSuccess: (response: any) => {
      toast({
        title: "Project created",
        description: "Your new project has been created successfully",
      });
      // Navigate to the new project page
      navigate(`/project/${response.id}`);
    },
    onError: (error: any) => {
      console.error("Project creation error:", error);
      toast({
        title: "Project creation failed",
        description: error.message || "There was an error creating your project",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ProjectFormValues) => {
    createProjectMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-gray-500">
            Set up a new development project with all required information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Enter the core information about your new development project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a brief description of the project"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Project Address</FormLabel>
                      <FormControl>
                        <AddressAutofill form={form} />
                      </FormControl>
                      <FormDescription>
                        Start typing an address to see suggestions from Google Places
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </div>

                  <FormField
                    control={form.control}
                    name="developmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Development Type*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Residential">Residential</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                            <SelectItem value="Community Housing">Community Housing</SelectItem>
                            <SelectItem value="Affordable Housing">Affordable Housing</SelectItem>
                            <SelectItem value="Specialist Disability Accommodation">Specialist Disability Accommodation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="financeModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finance Model*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select finance model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Development Loan">Development Loan</SelectItem>
                              <SelectItem value="Construction Finance">Construction Finance</SelectItem>
                              <SelectItem value="Joint Venture">Joint Venture</SelectItem>
                              <SelectItem value="Government Grant">Government Grant</SelectItem>
                              <SelectItem value="Self-Funded">Self-Funded</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Type*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select contract type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Fixed Price">Fixed Price</SelectItem>
                              <SelectItem value="Cost Plus">Cost Plus</SelectItem>
                              <SelectItem value="Design and Construct">Design and Construct</SelectItem>
                              <SelectItem value="GMP">Guaranteed Maximum Price</SelectItem>
                              <SelectItem value="Construction Management">Construction Management</SelectItem>
                              <SelectItem value="Early Contractor Involvement">Early Contractor Involvement</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fundingSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Source</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select funding source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Private Investment">Private Investment</SelectItem>
                              <SelectItem value="Bank Loan">Bank Loan</SelectItem>
                              <SelectItem value="Venture Capital">Venture Capital</SelectItem>
                              <SelectItem value="Government Funding">Government Funding</SelectItem>
                              <SelectItem value="Crowdfunding">Crowdfunding</SelectItem>
                              <SelectItem value="Corporate Sponsorship">Corporate Sponsorship</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="revenueStream"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revenue Stream</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select revenue stream" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Rental Income">Rental Income</SelectItem>
                              <SelectItem value="Property Sales">Property Sales</SelectItem>
                              <SelectItem value="Service Fees">Service Fees</SelectItem>
                              <SelectItem value="Leasing">Leasing</SelectItem>
                              <SelectItem value="Management Fees">Management Fees</SelectItem>
                              <SelectItem value="Mixed Revenue">Mixed Revenue</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="estimatedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Value*</FormLabel>
                          <FormControl>
                            <Input placeholder="$5,000,000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedCompletionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Completion Date*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hidden fields for latitude and longitude */}
                  <input type="hidden" {...form.register("latitude")} />
                  <input type="hidden" {...form.register("longitude")} />

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="includeCommercialStructure"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Commercial Structure</FormLabel>
                            <FormDescription>
                              Add commercial structure information to this project
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeFundingDiagram"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Funding Diagram</FormLabel>
                            <FormDescription>
                              Add funding diagram to project documentation
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiresRiskMitigation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Requires Risk Mitigation</FormLabel>
                            <FormDescription>
                              Create risk register and mitigation strategies for this project
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/projects")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createProjectMutation.isPending}
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-500">
              <p>
                Create a new development project with all necessary details to 
                generate appropriate documentation.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-black">Documentation Templates</p>
                    <p>We'll set up all required documents based on your project type</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarRange className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-black">Critical Dates</p>
                    <p>Key milestones will be added to your project calendar</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-gray-500">
                Need assistance setting up your project? Contact our support team for help.
              </p>
              <Button variant="link" className="px-0 mt-2">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}