
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Database, FileText, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiEndpoint {
  name: string;
  description?: string;
}

interface EndpointSchema {
  properties: Record<string, any>;
  required?: string[];
  type: string;
}

export default function UniPhiApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [availableEndpoints, setAvailableEndpoints] = useState<ApiEndpoint[]>([
    { name: "Project", description: "Get all projects" },
    { name: "ProjectShow", description: "Get a specific project" },
    { name: "Document", description: "Get all documents" },
    { name: "DocumentShow", description: "Get a specific document" },
    // Add more endpoints as you discover them
  ]);

  // Fetch endpoint schema
  const endpointSchemaQuery = useQuery({
    queryKey: ['/api/uniphi/schema', selectedEndpoint],
    queryFn: async () => {
      if (!selectedEndpoint) return null;
      try {
        return await apiRequest('GET', `/api/uniphi/schema/${selectedEndpoint}`);
      } catch (error) {
        console.error("Error fetching schema:", error);
        return { error: true, message: error.message || "Failed to load schema" };
      }
    },
    enabled: !!selectedEndpoint,
  });

  // Fetch example data
  const endpointDataQuery = useQuery({
    queryKey: ['/api/uniphi/endpoint-data', selectedEndpoint],
    queryFn: async () => {
      if (!selectedEndpoint) return null;
      try {
        if (selectedEndpoint === "Project") {
          return await apiRequest('GET', `/api/uniphi/projects`);
        } else {
          // For other endpoints, you'd need to implement the corresponding API routes
          return { message: "API route not implemented yet" };
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        return { error: true, message: error.message || "Failed to load data" };
      }
    },
    enabled: !!selectedEndpoint,
  });

  // Function to analyze all endpoints (could be implemented to scan all endpoints)
  const analyzeAllEndpoints = () => {
    // This would require implementing server-side logic to scan all endpoints
    console.log("Analyzing all endpoints - not yet implemented");
  };

  // Generate a fields view from schema
  const renderSchemaFields = (schema: any) => {
    if (!schema || schema.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {schema?.message || "Failed to load schema. Error: Error 500: Internal Server Error"}
          </AlertDescription>
        </Alert>
      );
    }

    if (schema.properties) {
      return (
        <div className="space-y-4">
          {Object.entries(schema.properties).map(([key, value]: [string, any]) => (
            <div key={key} className="border-b pb-2">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{key}</h3>
                  <p className="text-sm text-muted-foreground">{value.type || "unknown type"}</p>
                </div>
                {schema.required?.includes(key) && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                )}
              </div>
              {value.description && <p className="text-sm mt-1">{value.description}</p>}
            </div>
          ))}
        </div>
      );
    }

    return <p>No schema properties available.</p>;
  };

  // Render raw data sample
  const renderRawData = (data: any) => {
    if (!data) return <p>No data available</p>;
    if (data.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{data.message}</AlertDescription>
        </Alert>
      );
    }

    return (
      <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px] text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">UniPhi API Explorer</h1>
        <p className="text-muted-foreground">
          Explore and analyze the schema for UniPhi API endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Endpoints list */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              Select an endpoint to explore its schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={selectedEndpoint || ""}
                onValueChange={(value) => setSelectedEndpoint(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {availableEndpoints.map((endpoint) => (
                    <SelectItem key={endpoint.name} value={endpoint.name}>
                      {endpoint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={analyzeAllEndpoints}
              >
                <Search className="h-4 w-4" />
                Analyze All Endpoints
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main content - Endpoint details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              Endpoint: {selectedEndpoint || "None selected"}
            </CardTitle>
            <CardDescription>
              Schema details and field information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedEndpoint ? (
              <div className="text-center py-8 text-muted-foreground">
                Select an endpoint from the sidebar to view its schema
              </div>
            ) : (
              <Tabs defaultValue="schema">
                <TabsList className="mb-4">
                  <TabsTrigger value="schema" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Schema
                  </TabsTrigger>
                  <TabsTrigger value="fields" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Fields
                  </TabsTrigger>
                  <TabsTrigger value="data" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Raw API Data
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="schema">
                  {endpointSchemaQuery.isLoading ? (
                    <p>Loading schema...</p>
                  ) : endpointSchemaQuery.isError || (endpointSchemaQuery.data?.error) ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Failed to load schema. Error: Error 500: Internal Server Error
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px] text-xs">
                      {JSON.stringify(endpointSchemaQuery.data, null, 2)}
                    </pre>
                  )}
                </TabsContent>

                <TabsContent value="fields">
                  {endpointSchemaQuery.isLoading ? (
                    <p>Loading fields...</p>
                  ) : (
                    renderSchemaFields(endpointSchemaQuery.data)
                  )}
                </TabsContent>

                <TabsContent value="data">
                  {endpointDataQuery.isLoading ? (
                    <p>Loading data...</p>
                  ) : (
                    renderRawData(endpointDataQuery.data)
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
