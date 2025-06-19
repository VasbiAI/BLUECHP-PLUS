import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, addMonths, format } from 'date-fns';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { CriticalDate } from '@shared/schema';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Link,
  Lock,
  Mail,
  Plus,
  Trash2,
  User,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const externalAccessSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Please enter a name"),
  organization: z.string().min(1, "Please enter an organization"),
  purpose: z.string().min(1, "Please describe the purpose"),
  accessType: z.enum(["view", "edit", "submit"]),
  expirationDays: z.number().int().min(1).max(180),
  criticalDateIds: z.array(z.number()).optional(),
  projectId: z.number().optional(),
});

type ExternalAccessForm = z.infer<typeof externalAccessSchema>;

interface ExternalAccessManagerProps {
  projectId?: number;
  criticalDateIds?: number[];
  onSuccess?: () => void;
}

interface ExternalAccessToken {
  id: number;
  token: string;
  email: string;
  name: string;
  organization: string;
  purpose: string;
  accessType: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  createdBy?: number;
  lastUsedAt?: string;
  accessCount: number;
}

const ExternalAccessManager: React.FC<ExternalAccessManagerProps> = ({ 
  projectId,
  criticalDateIds = [],
  onSuccess
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewTokenForm, setShowNewTokenForm] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [generatedTokenInfo, setGeneratedTokenInfo] = useState<{ token: string, url: string } | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date>(addDays(new Date(), 30));

  // Fetch existing access tokens
  const { data: accessTokens, isLoading } = useQuery({
    queryKey: ['/api/external-access-tokens', projectId],
    queryFn: async () => {
      const query = projectId ? `?projectId=${projectId}` : '';
      const response = await fetch(`/api/external-access-tokens${query}`);
      if (!response.ok) throw new Error('Failed to fetch access tokens');
      return response.json();
    }
  });

  // Fetch critical dates
  const { data: criticalDates } = useQuery<CriticalDate[]>({
    queryKey: ['/api/critical-dates'],
    queryFn: async () => {
      const response = await fetch('/api/critical-dates');
      if (!response.ok) throw new Error('Failed to fetch critical dates');
      return response.json();
    }
  });

  const form = useForm<ExternalAccessForm>({
    resolver: zodResolver(externalAccessSchema),
    defaultValues: {
      email: '',
      name: '',
      organization: '',
      purpose: '',
      accessType: 'edit',
      expirationDays: 30,
      criticalDateIds: criticalDateIds.length > 0 ? criticalDateIds : undefined,
      projectId: projectId,
    }
  });

  // Watch the expiration days to update the preview date
  const expirationDays = form.watch('expirationDays');
  
  // Update expiry date when expiration days changes
  React.useEffect(() => {
    setExpiryDate(addDays(new Date(), expirationDays));
  }, [expirationDays]);

  const handleCreateToken = async (data: ExternalAccessForm) => {
    try {
      const response = await apiRequest('/api/external-access-tokens', 'POST', data);
      
      if (response && response.token) {
        setGeneratedTokenInfo({
          token: response.token,
          url: `${window.location.origin}/external-access/${response.token}`
        });
        setShowTokenDialog(true);
        form.reset();
        setShowNewTokenForm(false);
        queryClient.invalidateQueries({ queryKey: ['/api/external-access-tokens'] });
        
        toast({
          title: "Access token created",
          description: "The external access token has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Error creating access token:', error);
      toast({
        title: "Error",
        description: "Failed to create access token. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    if (generatedTokenInfo?.url) {
      navigator.clipboard.writeText(generatedTokenInfo.url);
      toast({
        title: "Link copied",
        description: "The access link has been copied to your clipboard.",
      });
    }
  };

  const handleRevokeToken = async (tokenId: number) => {
    try {
      await apiRequest(`/api/external-access-tokens/${tokenId}`, 'DELETE');
      queryClient.invalidateQueries({ queryKey: ['/api/external-access-tokens'] });
      toast({
        title: "Access revoked",
        description: "The external access has been revoked successfully.",
      });
    } catch (error) {
      console.error('Error revoking access token:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">External Access Management</h2>
        <Button onClick={() => setShowNewTokenForm(!showNewTokenForm)}>
          {showNewTokenForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showNewTokenForm ? 'Cancel' : 'Create New Access'}
        </Button>
      </div>

      {showNewTokenForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create External Access</CardTitle>
            <CardDescription>
              Generate a secure link for external parties to access critical dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateToken)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Company or organization name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Type <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select access type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="edit">Edit Existing</SelectItem>
                            <SelectItem value="submit">Submit New</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the purpose of this access (e.g., Insurance renewal dates, Contract critical dates)"
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Duration (Days) <span className="text-red-500">*</span></FormLabel>
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : 30;
                              field.onChange(Math.min(180, Math.max(1, value)));
                            }}
                            className="w-24"
                          />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Expires on: {format(expiryDate, 'dd MMM yyyy')}
                        </div>
                      </div>
                      <FormDescription>
                        Access will automatically expire after this many days (maximum 180 days).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {criticalDates && criticalDates.length > 0 && (
                  <FormField
                    control={form.control}
                    name="criticalDateIds"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">
                            Select Critical Dates to Share
                          </FormLabel>
                          <FormDescription>
                            Select which critical dates this external user can access.
                          </FormDescription>
                        </div>
                        {criticalDateIds.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {criticalDateIds.map((id) => {
                              const criticalDate = criticalDates.find(d => d.id === id);
                              return criticalDate ? (
                                <div key={id} className="flex items-center space-x-2 rounded-md border p-2">
                                  <Check className="h-4 w-4 text-primary" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium leading-none">{criticalDate.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Due: {formatDateDisplay(criticalDate.dueDate)}
                                    </p>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {criticalDates.map((date) => (
                              <FormField
                                key={date.id}
                                control={form.control}
                                name="criticalDateIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={date.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(date.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), date.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== date.id
                                                  ) || []
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        <p className="text-sm font-medium">{date.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Due: {formatDateDisplay(date.dueDate)}
                                        </p>
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end pt-4">
                  <Button type="submit">Generate Secure Access Link</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Link Generated</DialogTitle>
            <DialogDescription>
              Share this secure link with the external party. For security, the link will expire on {format(expiryDate, 'dd MMM yyyy')}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
              {generatedTokenInfo?.url}
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                This link provides access to critical dates. Share it only with authorized recipients.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button variant="default" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={() => setShowTokenDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h3 className="text-lg font-medium mb-4">Active External Access</h3>
        
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading access tokens...</div>
        ) : accessTokens && accessTokens.length > 0 ? (
          <Table>
            <TableCaption>External access tokens for critical dates.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Access Type</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessTokens.map((token: ExternalAccessToken) => (
                <TableRow key={token.id}>
                  <TableCell>
                    <div className="font-medium">{token.name}</div>
                    <div className="text-sm text-muted-foreground">{token.email}</div>
                  </TableCell>
                  <TableCell>{token.organization}</TableCell>
                  <TableCell>{token.purpose}</TableCell>
                  <TableCell>
                    <Badge variant={token.accessType === 'view' ? 'outline' : 
                           token.accessType === 'edit' ? 'secondary' : 'default'}>
                      {token.accessType === 'view' ? 'View Only' : 
                       token.accessType === 'edit' ? 'Edit Access' : 'Submit Access'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateDisplay(token.expiresAt)}
                  </TableCell>
                  <TableCell>
                    {token.accessCount} times
                    {token.lastUsedAt && <div className="text-xs text-muted-foreground">
                      Last: {formatDateDisplay(token.lastUsedAt)}
                    </div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeToken(token.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Revoke</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 border rounded-md bg-muted/50">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-1">No external access links</h4>
            <p className="text-sm text-muted-foreground mb-4">
              You haven't created any external access links yet.
            </p>
            {!showNewTokenForm && (
              <Button onClick={() => setShowNewTokenForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Access Link
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalAccessManager;