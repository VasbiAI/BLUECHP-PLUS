
import { db } from './db';
import { risks as risksTable } from '../shared/riskTrackProSchema';

async function importRiskData() {
  try {
    console.log('Starting risk data import');
    
    // Sample risk data from the original project
    const sampleRisks = [
      {
        projectId: '1',
        riskId: 'R - 43',
        title: 'DDA compliance issues post construction',
        riskCause: 'Disability Discrimination Act (DDA) Requirements',
        riskEvent: 'DDA compliance issues post construction',
        riskEffect: 'Post construction rectification works',
        category: 'Construction',
        probability: 2,
        impact: 5,
        riskRating: 10,
        status: 'active',
        owner: 'BlueCHP',
        raisedBy: 'BlueCHP',
        responseType: 'Transfer',
        mitigationStrategy: 'Complete ongoing inspections with DDA consultant',
        prevention: 'DDA consultant to be engaged for staged inspections',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: '1',
        riskId: 'R - 17',
        title: 'Shortage of skilled and unskilled subcontractors',
        riskCause: 'Labour shortages',
        riskEvent: 'Shortage of skilled and unskilled subcontractors to complete the works',
        riskEffect: 'Increase in costs, and project and delivery timeframe impacted, delaying project handover',
        category: 'Construction',
        probability: 3,
        impact: 4,
        riskRating: 12,
        status: 'active',
        owner: 'BlueCHP',
        raisedBy: 'BlueCHP',
        responseType: 'Transfer',
        mitigationStrategy: 'Ensure Contractor gain commitment from all subcontractors during the procurement and contract execution phase',
        prevention: 'Builder to provide and maintain a trade letting schedule and monitor monthly',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: '1',
        riskId: 'R - 5',
        title: 'Cost overrun or inconsistencies in price',
        riskCause: 'Industry resourcing',
        riskEvent: 'Cost overrun or inconsistencies in price',
        riskEffect: 'Increase to construction budget, potentially undermining feasibility',
        category: 'Budget',
        probability: 4,
        impact: 5,
        riskRating: 20,
        status: 'active',
        owner: 'Developer',
        raisedBy: 'BlueCHP',
        responseType: 'Accept',
        mitigationStrategy: 'Implement Strategic Feasibility Model to make sure we get Feedback from the market',
        prevention: 'Ongoing cost monitoring throughout project',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: '1',
        riskId: 'R - 22',
        title: 'Delays on site due to severe weather',
        riskCause: 'Severe weather',
        riskEvent: 'Delays on site due to severe weather',
        riskEffect: 'Project and delivery timeframes impacted, delaying project completion and increase in project costs',
        category: 'Site',
        probability: 4,
        impact: 4,
        riskRating: 16,
        status: 'active',
        owner: 'BlueCHP',
        raisedBy: 'BlueCHP',
        responseType: 'Accept',
        mitigationStrategy: 'Ensure Contractor has sufficient dewatering pumping capacity and other measures',
        prevention: 'Craneage rated to a high level of wind tolerance',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: '1',
        riskId: 'R - 15',
        title: 'Unexpected cultural, heritage finds stopping critical path works',
        riskCause: 'Cultural, heritage or archaeological finds',
        riskEvent: 'Unexpected cultural, heritage finds stopping critical path works',
        riskEffect: 'Project and delivery timeframes impacted, potentially undermining project completion',
        category: 'Site',
        probability: 3,
        impact: 5,
        riskRating: 15,
        status: 'active',
        owner: 'BlueCHP',
        raisedBy: 'BlueCHP',
        responseType: 'Accept',
        mitigationStrategy: 'Ensure Contractor has a plan for unexpected finds',
        prevention: 'Extensive site investigation prior to site commencement',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log(`Inserting ${sampleRisks.length} sample risks`);
    
    // Insert risks into database
    try {
      // First try to create the table directly if it doesn't exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "risk_track_pro_risks" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "project_id" TEXT NOT NULL,
          "riskId" TEXT,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "riskCause" TEXT,
          "riskEvent" TEXT,
          "riskEffect" TEXT,
          "category" TEXT,
          "probability" INTEGER NOT NULL,
          "impact" INTEGER NOT NULL,
          "riskRating" INTEGER NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'active',
          "owner" TEXT,
          "raisedBy" TEXT,
          "responseOwner" TEXT,
          "responseType" TEXT,
          "responseTimeframe" TEXT,
          "mitigationStrategy" TEXT,
          "prevention" TEXT,
          "contingencyPlan" TEXT,
          "dateCreated" TIMESTAMP NOT NULL DEFAULT NOW(),
          "dateUpdated" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      console.log("Created risk_track_pro_risks table if it didn't exist");
      
      // Then insert the sample data
      for (const risk of sampleRisks) {
        try {
          await db.execute(`
            INSERT INTO risk_track_pro_risks (
              project_id, 
              "riskId", 
              title, 
              "riskCause", 
              "riskEvent", 
              "riskEffect", 
              category,
              probability,
              impact,
              "riskRating",
              status,
              owner,
              "raisedBy",
              "responseType",
              "mitigationStrategy",
              prevention,
              "dateCreated",
              "dateUpdated"
            ) VALUES (
              '${risk.projectId}',
              '${risk.riskId}',
              '${risk.title.replace(/'/g, "''")}',
              '${risk.riskCause?.replace(/'/g, "''") || ''}',
              '${risk.riskEvent?.replace(/'/g, "''") || ''}',
              '${risk.riskEffect?.replace(/'/g, "''") || ''}',
              '${risk.category}',
              ${risk.probability},
              ${risk.impact},
              ${risk.riskRating},
              '${risk.status}',
              '${risk.owner?.replace(/'/g, "''") || ''}',
              '${risk.raisedBy?.replace(/'/g, "''") || ''}',
              '${risk.responseType?.replace(/'/g, "''") || ''}',
              '${risk.mitigationStrategy?.replace(/'/g, "''") || ''}',
              '${risk.prevention?.replace(/'/g, "''") || ''}',
              NOW(),
              NOW()
            );
          `);
          console.log(`Inserted risk ${risk.riskId}`);
        } catch (err) {
          console.error(`Failed to insert risk ${risk.riskId}:`, err);
        }
      }
    } catch (error) {
      console.error("Error creating table or inserting risks:", error);
    }
    
    console.log('Risk data import completed successfully!');
  } catch (error) {
    console.error('Error importing risk data:', error);
  }
}

export { importRiskData };
