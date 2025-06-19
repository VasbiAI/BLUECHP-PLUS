import OpenAI from 'openai';
import { ProjectTask, Risk } from '@shared/schema';

// Initialize OpenAI client
let openai: OpenAI | null = null;

// Initialize OpenAI with API key
function initializeOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is not set. AI suggestion features will use basic keyword matching instead.');
    return null;
  }
  
  try {
    return new OpenAI({ apiKey });
  } catch (error) {
    console.error('Error initializing OpenAI:', error);
    return null;
  }
}

// Get OpenAI client (lazy initialization)
function getOpenAIClient(): OpenAI | null {
  if (openai === null) {
    openai = initializeOpenAI();
  }
  return openai;
}

// Process the AI response into the expected format
function processAIResponse(
  response: any, 
  tasks: ProjectTask[], 
  risks: Risk[]
): Array<{
  taskId: number;
  riskId: number;
  taskName: string;
  riskTitle: string;
  confidence: number;
}> {
  try {
    // Parse the JSON response
    const content = response.choices[0].message.content || '{"links":[]}';
    console.log('AI Response:', content);
    
    // Try to clean up the content if it has any extra spaces or formatting
    const cleanContent = content.trim();
    console.log('Attempting to parse JSON:', cleanContent);
    
    // First attempt standard parsing
    let contentObj;
    try {
      contentObj = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      
      // Try an alternative approach for our specific response case
      if (cleanContent.includes('"taskId"') && cleanContent.includes('"riskId"') && cleanContent.includes('"confidence"')) {
        console.log('Detected taskId/riskId format, attempting custom parsing');
        try {
          const matches = cleanContent.match(/{[^}]+}/g);
          if (matches && matches.length > 0) {
            contentObj = JSON.parse(matches[0]);
            console.log('Custom parsing successful:', contentObj);
          }
        } catch (err) {
          console.error('Custom parsing failed:', err);
          return [];
        }
      } else {
        return [];
      }
    }
    
    // Convert the response to an array format regardless of how it's returned
    let aiResponse;
    
    // Handle different response formats from OpenAI
    if (Array.isArray(contentObj)) {
      // Already an array
      aiResponse = contentObj;
      console.log('Parsed array response with length:', aiResponse.length);
    } else if (contentObj.links && Array.isArray(contentObj.links)) {
      // Has a links property that's an array
      aiResponse = contentObj.links;
      console.log('Parsed links array with length:', aiResponse.length);
    } else if (contentObj && typeof contentObj === 'object' && 
              'taskId' in contentObj && 
              'riskId' in contentObj) {
      // Single object with taskId and riskId - convert to array
      aiResponse = [contentObj];
      console.log('Converting single item to array:', aiResponse);
    } else {
      // Unknown format
      console.log('Unrecognized AI response format for:', contentObj);
      return [];
    }
    
    // Now we have a standardized array to work with
    const linksArray = aiResponse;
    console.log(`Found ${linksArray.length} potential links in AI response`);
    
    // Transform AI suggestions into the expected format
    const results = linksArray
      .filter((link: { taskId?: number; riskId?: number }) => 
        typeof link.taskId === 'number' && typeof link.riskId === 'number')
      .map((link: { taskId: number; riskId: number; confidence?: number }) => {
        // Find the corresponding task and risk to include names
        const task = tasks.find(t => t.id === link.taskId);
        const risk = risks.find(r => r.id === link.riskId);
        
        if (!task || !risk) return null;
        
        return {
          taskId: link.taskId,
          riskId: link.riskId,
          taskName: task.taskName,
          riskTitle: risk.riskEvent,
          confidence: typeof link.confidence === 'number' ? link.confidence : 0.5
        };
      })
      .filter((link: any): link is {
        taskId: number;
        riskId: number;
        taskName: string;
        riskTitle: string;
        confidence: number;
      } => link !== null) // Type guard to remove nulls
      .sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence); // Sort by confidence
    
    console.log(`Returning ${results.length} processed AI suggestions`);
    return results;
  } catch (error) {
    console.error('Error processing AI response:', error);
    return [];
  }
}

// Use AI to suggest links between tasks and risks
export async function suggestTaskRiskLinksWithAI(
  tasks: ProjectTask[], 
  risks: Risk[]
): Promise<Array<{
  taskId: number;
  riskId: number;
  taskName: string;
  riskTitle: string;
  confidence: number;
}>> {
  // Limit the number of items we analyze to prevent response size issues
  const MAX_TASKS = 100;
  const MAX_RISKS = 25;
  
  const limitedTasks = tasks.slice(0, MAX_TASKS);
  const activeRisks = risks.filter(risk => risk.riskStatus !== 'Closed');
  const limitedRisks = activeRisks.slice(0, MAX_RISKS);
  
  if (tasks.length > MAX_TASKS) {
    console.log(`Warning: Limiting task analysis from ${tasks.length} to ${MAX_TASKS} items`);
  }
  
  if (activeRisks.length > MAX_RISKS) {
    console.log(`Warning: Limiting risk analysis from ${activeRisks.length} to ${MAX_RISKS} items`);
  }
  const client = getOpenAIClient();
  
  // If OpenAI is not available, return empty array
  // The caller should fall back to keyword-based matching
  if (!client) {
    return [];
  }
  
  try {
    // Prepare data for the OpenAI request
    const taskDescriptions = limitedTasks.map(task => ({
      id: task.id,
      taskId: task.taskId,
      name: task.taskName,
      notes: task.notes || ''
    }));
    
    const riskDescriptions = limitedRisks.map(risk => ({
        id: risk.id,
        riskId: risk.riskId,
        event: risk.riskEvent,
        cause: risk.riskCause,
        effect: risk.riskEffect,
        type: risk.riskCategory,
        response: risk.responseType
      }));
    
    console.log(`AI Analysis - Tasks: ${taskDescriptions.length}, Risks: ${riskDescriptions.length}`);
    
    // Don't proceed if there are no tasks or risks to analyze
    if (taskDescriptions.length === 0 || riskDescriptions.length === 0) {
      console.log('No tasks or risks to analyze');
      return [];
    }
    
    // Generate a prompt for OpenAI
    const systemPrompt = `
      You are an expert project risk analyzer. Your task is to find connections between 
      project tasks and identified risks based on their descriptions.
      
      Consider the following when suggesting links:
      1. A task is linked to a risk if it is directly related to managing, mitigating, or addressing that risk
      2. Look for keyword matches and semantic similarity
      3. Consider the task description, risk event, cause, and effect
      4. Tasks that have a direct impact on risk outcomes are more strongly linked
      5. Analyze the task descriptions, notes, and the entire risk context
      
      For each potential task-risk link, provide:
      - The task ID
      - The risk ID
      - A confidence score between 0.0 and 1.0, where:
        - 0.0-0.3: Weak connection (unclear or indirect relationship)
        - 0.3-0.6: Moderate connection (some relationship exists)
        - 0.6-0.8: Strong connection (clearly related)
        - 0.8-1.0: Very strong connection (directly addresses the risk)
    `;
    
    const userPrompt = `
      Project Tasks:
      ${JSON.stringify(taskDescriptions, null, 2)}
      
      Project Risks:
      ${JSON.stringify(riskDescriptions, null, 2)}
      
      Analyze these tasks and risks, and return suggested task-risk links.
      Each link should have the task ID, risk ID, and a confidence score between 0 and 1.
      Only include links with a confidence score above 0.3.
      
      IMPORTANT: Your response MUST be a valid JSON object with a 'links' property containing an array,
      even if the array is empty. The format must be EXACTLY:
      { "links": [{"taskId": number, "riskId": number, "confidence": number}] }
    `;
    
    console.log('Making OpenAI API request...');
    try {
      // Make the OpenAI request
      const response = await client.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,  // Lower temperature for more consistent results
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
      console.log('OpenAI API request successful');
      return processAIResponse(response, tasks, risks);
    } catch (apiError) {
      console.error('OpenAI API request failed:', apiError);
      throw apiError;
    }
    
  } catch (error) {
    console.error('Error using OpenAI for task-risk suggestions:', error);
    // Return empty array, will fall back to keyword matching
    return [];
  }
}