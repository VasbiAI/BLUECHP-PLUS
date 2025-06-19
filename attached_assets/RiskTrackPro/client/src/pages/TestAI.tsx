import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TestAI() {
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [isTestingSuggestions, setIsTestingSuggestions] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [suggestionsStatus, setSuggestionsStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [openAIMessage, setOpenAIMessage] = useState('');
  const [suggestionsMessage, setSuggestionsMessage] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const testOpenAIConnection = async () => {
    setIsTestingOpenAI(true);
    try {
      const response = await fetch('/api/test-openai');
      const data = await response.json();
      
      if (data.success) {
        setOpenAIStatus('success');
        setOpenAIMessage(data.message);
      } else {
        setOpenAIStatus('error');
        setOpenAIMessage(data.message || 'Unknown error');
      }
    } catch (error) {
      setOpenAIStatus('error');
      setOpenAIMessage('Failed to connect to OpenAI API');
      console.error(error);
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  const testAISuggestions = async () => {
    setIsTestingSuggestions(true);
    try {
      const response = await fetch('/api/test-ai-suggestions');
      const data = await response.json();
      
      if (data.success) {
        setSuggestionsStatus('success');
        setSuggestionsMessage('Check server logs for detailed information');
        
        // Try to get actual suggestions
        try {
          const suggestionsResponse = await fetch('/api/projects/1/suggest-links?limit=5');
          const suggestionsData = await suggestionsResponse.json();
          setSuggestions(suggestionsData);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      } else {
        setSuggestionsStatus('error');
        setSuggestionsMessage(data.message || 'Unknown error');
      }
    } catch (error) {
      setSuggestionsStatus('error');
      setSuggestionsMessage('Failed to test AI suggestions');
      console.error(error);
    } finally {
      setIsTestingSuggestions(false);
    }
  };
  
  // Check OpenAI status on load
  useEffect(() => {
    testOpenAIConnection();
  }, []);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Integration Test</h1>
      <p className="text-muted-foreground mb-6">
        This page allows you to test the AI integration features in the application.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* OpenAI Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>OpenAI API Connection</CardTitle>
            <CardDescription>
              Test if the application can connect to the OpenAI API successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            {openAIStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                <AlertDescription className="text-green-700">
                  {openAIMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {openAIStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>
                  {openAIMessage}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={testOpenAIConnection} 
              disabled={isTestingOpenAI} 
              variant={openAIStatus === 'success' ? 'outline' : 'default'}
            >
              {isTestingOpenAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test OpenAI Connection'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* AI Suggestions Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>AI Risk-Task Suggestions</CardTitle>
            <CardDescription>
              Test if the AI can successfully generate task-risk link suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suggestionsStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Test Successful</AlertTitle>
                <AlertDescription className="text-green-700">
                  {suggestionsMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {suggestionsStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Test Failed</AlertTitle>
                <AlertDescription>
                  {suggestionsMessage}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={testAISuggestions} 
              disabled={isTestingSuggestions} 
              variant={suggestionsStatus === 'success' ? 'outline' : 'default'}
            >
              {isTestingSuggestions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test AI Suggestions'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Sample Suggestions */}
      {suggestions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sample AI Suggestions</CardTitle>
            <CardDescription>
              Examples of task-risk links suggested by the AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <div className="grid grid-cols-12 p-3 bg-muted text-sm font-medium border-b">
                <div className="col-span-5">Task</div>
                <div className="col-span-5">Risk</div>
                <div className="col-span-2 text-center">Confidence</div>
              </div>
              
              <div className="divide-y">
                {suggestions.slice(0, 5).map((suggestion, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5">
                      <div className="font-medium truncate">{suggestion.taskName}</div>
                      <div className="text-xs text-muted-foreground">Task #{suggestion.taskId}</div>
                    </div>
                    
                    <div className="col-span-5">
                      <div className="font-medium truncate">{suggestion.riskTitle}</div>
                      <div className="text-xs text-muted-foreground">Risk #{suggestion.riskId}</div>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <Badge
                        variant="outline"
                        className={`${
                          suggestion.confidence > 0.7 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : suggestion.confidence > 0.4 
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        }`}
                      >
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="text-center text-sm text-muted-foreground">
        <p>If you're experiencing issues with AI features:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Verify that your OpenAI API key is correctly set</li>
          <li>Check that the API key has sufficient permissions and credits</li>
          <li>Ensure that the AI models referenced in the application are available to your account</li>
          <li>Review server logs for detailed error information</li>
        </ul>
      </div>
    </div>
  );
}