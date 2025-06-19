import { useState } from "react";
import TabNavigation from "@/components/TabNavigation";
import ProjectInfo from "@/components/ProjectInfo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const Settings = () => {
  const { toast } = useToast();
  const projectId = 1; // Default to first project
  const [activeTab, setActiveTab] = useState("general");
  
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch project information');
      }
      return res.json();
    }
  });
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
  };
  
  const handleResetDefaults = () => {
    toast({
      title: "Settings reset",
      description: "Settings have been reset to defaults.",
    });
  };
  
  const handleImportCSV = () => {
    toast({
      title: "Feature coming soon",
      description: "CSV import functionality will be available in a future update.",
    });
  };
  
  return (
    <>
      <ProjectInfo projectId={projectId} />
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p className="text-neutral-500">
            Configure your risk management system and project preferences.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="riskMatrix">Risk Matrix</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure application-wide settings and display preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName" 
                      placeholder="Your name" 
                      value="Administrator"
                    />
                    <p className="text-sm text-neutral-400">
                      Your name as displayed in the system
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      value="admin@bluechp.com.au"
                    />
                    <p className="text-sm text-neutral-400">
                      Primary email for notifications
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select defaultValue="dd/mm/yyyy">
                      <SelectTrigger id="dateFormat">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Theme Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select defaultValue="light">
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <Select defaultValue="blue">
                        <SelectTrigger id="accentColor">
                          <SelectValue placeholder="Select accent color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleResetDefaults}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveSettings}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Project Settings */}
          <TabsContent value="project">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                  Configure project-specific settings and details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div>Loading project settings...</div>
                ) : project ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input 
                        id="projectName" 
                        placeholder="Project name" 
                        defaultValue={project.name}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="registerName">Register Name</Label>
                      <Input 
                        id="registerName" 
                        placeholder="Register name" 
                        defaultValue={project.registerName}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="projectManager">Project Manager</Label>
                      <Input 
                        id="projectManager" 
                        placeholder="Project manager" 
                        defaultValue={project.projectManager}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="financialOption">Financial Option</Label>
                      <Input 
                        id="financialOption" 
                        placeholder="Financial option" 
                        defaultValue={project.financialOption}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input 
                        id="organization" 
                        placeholder="Organization" 
                        defaultValue={project.organization}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="registerDate">Register Date</Label>
                      <Input 
                        id="registerDate" 
                        placeholder="Register date" 
                        defaultValue={project.registerDate}
                      />
                    </div>
                    
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="projectDescription">Project Description</Label>
                      <Textarea 
                        id="projectDescription" 
                        placeholder="Project description" 
                        rows={4}
                        defaultValue="43 - 45 Beerwah Parade development project includes construction risk management."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500">Failed to load project data</div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleResetDefaults}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveSettings}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Risk Matrix Settings */}
          <TabsContent value="riskMatrix">
            <Card>
              <CardHeader>
                <CardTitle>Risk Matrix Configuration</CardTitle>
                <CardDescription>
                  Configure the risk matrix thresholds and calculation parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-4">Risk Level Thresholds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Extreme Risk Range</Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <Input 
                            type="number" 
                            defaultValue="80" 
                            className="w-20"
                          />
                          <span>-</span>
                          <Input 
                            type="number" 
                            defaultValue="100" 
                            className="w-20"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>High Risk Range</Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <Input 
                            type="number" 
                            defaultValue="60" 
                            className="w-20"
                          />
                          <span>-</span>
                          <Input 
                            type="number" 
                            defaultValue="79" 
                            className="w-20"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Medium Risk Range</Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <Input 
                            type="number" 
                            defaultValue="40" 
                            className="w-20"
                          />
                          <span>-</span>
                          <Input 
                            type="number" 
                            defaultValue="59" 
                            className="w-20"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Low Risk Range</Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <Input 
                            type="number" 
                            defaultValue="0" 
                            className="w-20"
                          />
                          <span>-</span>
                          <Input 
                            type="number" 
                            defaultValue="39" 
                            className="w-20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Risk Calculation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="formula">Risk Calculation Formula</Label>
                      <Select defaultValue="multiply">
                        <SelectTrigger id="formula">
                          <SelectValue placeholder="Select formula" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiply">Probability × Impact</SelectItem>
                          <SelectItem value="weighted">Weighted Average</SelectItem>
                          <SelectItem value="custom">Custom Formula</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-neutral-400">
                        How risk rating is calculated
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="impactScale">Impact Scale</Label>
                      <Select defaultValue="100">
                        <SelectTrigger id="impactScale">
                          <SelectValue placeholder="Select scale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">1-10</SelectItem>
                          <SelectItem value="100">1-100</SelectItem>
                          <SelectItem value="5">1-5</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-neutral-400">
                        Scale for impact measurement
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleResetDefaults}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveSettings}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure when and how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-neutral-400">Receive notifications via email</p>
                    </div>
                    <Input type="checkbox" id="emailNotifications" className="h-4 w-8" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="riskUpdates" className="text-base">Risk Updates</Label>
                      <p className="text-sm text-neutral-400">Notify when risks are added or updated</p>
                    </div>
                    <Input type="checkbox" id="riskUpdates" className="h-4 w-8" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dueDateReminders" className="text-base">Due Date Reminders</Label>
                      <p className="text-sm text-neutral-400">Remind me of approaching due dates</p>
                    </div>
                    <Input type="checkbox" id="dueDateReminders" className="h-4 w-8" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weeklyDigest" className="text-base">Weekly Digest</Label>
                      <p className="text-sm text-neutral-400">Receive a weekly summary of risk changes</p>
                    </div>
                    <Input type="checkbox" id="weeklyDigest" className="h-4 w-8" defaultChecked />
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Notification Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="reminderDays">Reminder Days Before Due Date</Label>
                      <div className="pt-2">
                        <Slider 
                          defaultValue={[7]} 
                          max={30} 
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-neutral-400 mt-1">
                          <span>1 day</span>
                          <span>15 days</span>
                          <span>30 days</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="digestDay">Weekly Digest Day</Label>
                      <Select defaultValue="monday">
                        <SelectTrigger id="digestDay">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleResetDefaults}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveSettings}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Import/Export Settings */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Import/Export Data</CardTitle>
                <CardDescription>
                  Import and export data to and from the risk register.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Import Data</h3>
                    <p className="text-sm text-neutral-400">
                      Import risk data from a CSV file. The file should follow the template format.
                    </p>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button onClick={handleImportCSV} className="w-full">
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Import CSV
                      </Button>
                    </div>
                    <div>
                      <a href="#" className="text-blue-600 hover:underline text-sm">
                        Download CSV Template
                      </a>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Export Data</h3>
                    <p className="text-sm text-neutral-400">
                      Export all risk data to a CSV file for backup or reporting purposes.
                    </p>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button className="w-full bg-[#0066CC] hover:bg-[#0D47A1]">
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export All Risks
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button variant="outline" className="w-full">
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export Filtered Results
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Settings;
