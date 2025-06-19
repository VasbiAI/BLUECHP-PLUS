import { suggestTaskRiskLinksWithAI } from './openaiService';
import { storage } from '../storage';

async function testAISuggestions() {
  try {
    console.log('Starting AI test script...');
    
    // Get tasks and risks
    const projectId = 1;
    const tasks = await storage.getProjectTasks(projectId);
    const risks = await storage.getRisks(projectId);
    
    console.log(`Found ${tasks.length} tasks and ${risks.length} risks`);
    
    // Check a sample task and risk
    if (tasks.length > 0) {
      const sampleTask = tasks[0];
      console.log('Sample task:', {
        id: sampleTask.id,
        taskId: sampleTask.taskId,
        taskName: sampleTask.taskName, 
        notes: sampleTask.notes
      });
    }
    
    if (risks.length > 0) {
      const sampleRisk = risks[0];
      console.log('Sample risk:', {
        id: sampleRisk.id,
        riskId: sampleRisk.riskId,
        event: sampleRisk.riskEvent,
        cause: sampleRisk.riskCause,
        effect: sampleRisk.riskEffect
      });
    }
    
    // Test AI suggestions with a limited subset of data
    const limitedTasks = tasks.slice(0, 5);
    const limitedRisks = risks.slice(0, 5);
    
    console.log(`Testing AI suggestions with ${limitedTasks.length} tasks and ${limitedRisks.length} risks`);
    
    const suggestions = await suggestTaskRiskLinksWithAI(limitedTasks, limitedRisks);
    console.log(`AI returned ${suggestions.length} suggestions`);
    
    if (suggestions.length > 0) {
      console.log('Sample suggestion:', suggestions[0]);
    }
    
    console.log('Test complete!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export as a route handler
export async function runAITest(req: any, res: any) {
  try {
    await testAISuggestions();
    res.json({ success: true, message: 'AI test complete, check server logs' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}