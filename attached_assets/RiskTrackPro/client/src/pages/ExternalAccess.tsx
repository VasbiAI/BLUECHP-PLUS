import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, isPast } from 'date-fns';
import EnhancedCriticalDateForm from '@/components/EnhancedCriticalDateForm';
import { CriticalDate } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertCircle,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  FileText,
  LockIcon,
  Mail,
  Shield,
  User,
  Building,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExternalToken {
  id: number;
  token: string;
  email: string;
  name: string;
  organization: string;
  purpose: string;
  accessType: string;
  isActive: boolean;
  expiresAt: string;
  lastUsedAt?: string;
  accessCount: number;
  criticalDates?: CriticalDate[];
}

const ExternalAccess: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDateId, setSelectedDateId] = useState<number | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Fetch the token information
  const { data: tokenInfo, isLoading, error } = useQuery<ExternalToken>({
    queryKey: ['/api/external-access', token],
    queryFn: async () => {
      const response = await fetch(`/api/external-access/${token}/validate`);
      if (!response.ok) {
        throw new Error('Invalid or expired access token');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check if token is expired
  const isExpired = tokenInfo?.expiresAt ? isPast(new Date(tokenInfo.expiresAt)) : false;

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle selecting a critical date to edit
  const handleSelectDate = (dateId: number) => {
    setSelectedDateId(dateId);
    setSubmissionSuccess(false);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setSelectedDateId(null);
  };

  // Handle successful submission
  const handleSubmissionSuccess = () => {
    setSubmissionSuccess(true);
    setSelectedDateId(null);
    queryClient.invalidateQueries({ queryKey: ['/api/external-access', token] });

    toast({
      title: "Critical date updated",
      description: "Your changes have been saved successfully.",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tokenInfo) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>
            This access link is invalid or has expired. Please contact the sender for a new link.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Invalid Access</CardTitle>
            <CardDescription>The secure link you used is no longer valid.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <LockIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Denied</h3>
              <p className="text-center text-muted-foreground mb-6">
                The access link may have expired or been revoked. Please contact the BlueCHP representative who shared this link with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Expired</AlertTitle>
          <AlertDescription>
            This access link has expired on {formatDateDisplay(tokenInfo.expiresAt)}. Please contact the sender for a new link.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Expired Access</CardTitle>
            <CardDescription>The secure link you used has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <Clock className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Period Ended</h3>
              <p className="text-center text-muted-foreground mb-6">
                For security reasons, access links expire after a certain period. Please contact the BlueCHP representative who shared this link with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the selected critical date for editing
  if (selectedDateId !== null && tokenInfo.criticalDates) {
    const selectedDate = tokenInfo.criticalDates.find(date => date.id === selectedDateId);
    
    if (!selectedDate) {
      return <div>Critical date not found</div>;
    }

    return (
      <div className="container max-w-6xl mx-auto py-4 px-4">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={handleCancelEdit}
        >
          <X className="mr-2 h-4 w-4" /> Back to Critical Dates
        </Button>
        
        <Card className="mb-6 border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Update Critical Date</CardTitle>
            <CardDescription>
              You are updating details for: <strong>{selectedDate.title}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedCriticalDateForm 
              initialData={selectedDate}
              isEdit={true}
              onSuccess={handleSubmissionSuccess}
              onCancel={handleCancelEdit}
              readOnlyMode={tokenInfo.accessType === 'view'}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Card className="mb-6 border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">BlueCHP Critical Dates Portal</CardTitle>
              <CardDescription>
                External access for {tokenInfo.organization}
              </CardDescription>
            </div>
            <Badge className="self-start md:self-auto" variant="outline">
              {tokenInfo.accessType === 'view' ? 'View Only Access' : 
               tokenInfo.accessType === 'edit' ? 'Edit Access' : 'Submit Access'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-muted p-4 rounded-lg">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{tokenInfo.name}</p>
                  <p className="text-sm text-muted-foreground">{tokenInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                <p className="text-sm font-medium">{tokenInfo.organization}</p>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <p className="text-sm">Expires: {formatDateDisplay(tokenInfo.expiresAt)}</p>
              </div>
            </div>

            <Alert className="bg-primary/5 border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <AlertTitle>Secure Access</AlertTitle>
              <AlertDescription>
                This is a secure portal for viewing and updating critical dates for BlueCHP. Any changes you make will be recorded.
              </AlertDescription>
            </Alert>

            {submissionSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle>Update Successful</AlertTitle>
                <AlertDescription>
                  Your changes have been saved successfully. Thank you for updating the critical date information.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Critical Dates</h3>
              <p className="text-muted-foreground">
                {tokenInfo.purpose}
              </p>

              {tokenInfo.criticalDates && tokenInfo.criticalDates.length > 0 ? (
                <Table>
                  <TableCaption>Critical dates requiring your attention</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agreement</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokenInfo.criticalDates.map((date) => (
                      <TableRow key={date.id}>
                        <TableCell className="font-medium">{date.title}</TableCell>
                        <TableCell>{formatDateDisplay(date.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            date.status === 'Open' ? 'default' :
                            date.status === 'Completed' ? 'success' :
                            date.status === 'In Progress' ? 'secondary' : 'outline'
                          }>
                            {date.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{date.agreementType || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectDate(date.id)}
                            disabled={tokenInfo.accessType === 'view'}
                          >
                            {tokenInfo.accessType === 'view' ? 'View Details' : 'Update'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/50">
                  <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-1">No critical dates available</h4>
                  <p className="text-sm text-muted-foreground">
                    There are no critical dates shared with you at this time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center bg-muted/50 border-t">
          <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
            This is a secure access portal. Do not share this link with others.
          </p>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://www.bluechp.com.au/privacy-policy" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-1" /> Privacy Policy
              </a>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExternalAccess;