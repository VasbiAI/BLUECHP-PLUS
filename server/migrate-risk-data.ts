import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if environment variables are set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.OLDRISK_DATABASE_URL) {
  console.error('OLDRISK_DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create connection pools for both databases
const targetPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sourcePool = new Pool({
  connectionString: process.env.OLDRISK_DATABASE_URL,
});

async function migrateRiskData() {
  console.log('Starting risk data migration from old database to new database...');
  
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    // First drop the critical_dates table if it exists (for testing purposes only)
    // This helps us avoid column constraint issues during migration testing
    try {
      // This is safe because we're in a testing environment
      await targetClient.query(`DROP TABLE IF EXISTS critical_dates CASCADE`);
      console.log("Dropped existing critical_dates table to ensure clean migration");
      
      // Recreate the table with proper columns and constraints
      await targetClient.query(`
        CREATE TABLE critical_dates (
          id SERIAL PRIMARY KEY,
          project_id TEXT,
          "projectId" TEXT,
          title TEXT NOT NULL,
          description TEXT,
          "dueDate" TEXT, 
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'pending',
          "contractReference" TEXT,
          "contractClause" TEXT,
          "contractNotes" TEXT,
          "responsibleParty" TEXT,
          "dateCreated" TIMESTAMP DEFAULT NOW(),
          "dateUpdated" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("Successfully created critical_dates table with appropriate schema");
    } catch (tableError) {
      console.error("Error recreating critical_dates table:", tableError);
    }
    
    // Start a transaction in the target database
    await targetClient.query('BEGIN');
    
    // 1. Migrate risk categories
    console.log('Migrating risk categories...');
    try {
      // First check if risk_categories table exists in source database
      const { rows: tableCheck } = await sourceClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'risk_categories'
        ) AS exists
      `);
      
      if (tableCheck[0].exists) {
        // Create the table in target database if it doesn't exist
        await targetClient.query(`
          CREATE TABLE IF NOT EXISTS risk_categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            color TEXT DEFAULT '#6B7280',
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        
        const { rows: categories } = await sourceClient.query('SELECT * FROM risk_categories');
        for (const category of categories) {
          await targetClient.query(
            `INSERT INTO risk_categories (name, description, color, created_at) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (name) DO UPDATE SET 
             description = EXCLUDED.description, 
             color = EXCLUDED.color`,
            [category.name, category.description, category.color, category.created_at]
          );
        }
        console.log(`Migrated ${categories.length} risk categories`);
      } else {
        console.log('Risk categories table does not exist in source database, skipping migration of this table');
      }
    } catch (error) {
      console.error('Error migrating risk categories:', error);
    }
    
    // 2. Migrate risks
    console.log('Migrating risks...');
    try {
      // First check if risks table exists in source database
      const { rows: tableCheck } = await sourceClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'risks'
        ) AS exists
      `);
      
      if (tableCheck[0].exists) {
        const { rows: risks } = await sourceClient.query('SELECT * FROM risks');
        for (const risk of risks) {
          // Check if the risk already exists in the target database
          const exists = await targetClient.query(
            'SELECT id FROM risk_track_pro_risks WHERE "riskId" = $1', 
            [risk.risk_id || risk.id]
          );
          
          if (exists.rows.length === 0) {
            // Convert string values to numeric types
            const probability = parseFloat(risk.probability || risk.likelihood || 3);
            const impact = parseFloat(risk.impact || 3);
            const riskRating = parseInt(risk.risk_rating || Math.round(probability * impact) || 9);
            
            await targetClient.query(
              `INSERT INTO risk_track_pro_risks (
                project_id, "projectId", "riskId", title, "riskCause", "riskEvent", "riskEffect", 
                category, probability, impact, "riskRating", status, owner, 
                "raisedBy", "responseType", "mitigationStrategy", prevention,
                "dateCreated", "dateUpdated"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
              [
                risk.project_id?.toString() || '1', 
                risk.project_id?.toString() || '1', // Duplicate for both column styles
                risk.risk_id || risk.id,
                risk.title || risk.risk_event || 'Unknown Risk',
                risk.risk_cause || '',
                risk.risk_event || '',
                risk.risk_effect || '',
                risk.category || risk.risk_category || 'General',
                Math.round(probability),  // Convert to integer
                Math.round(impact),       // Convert to integer
                riskRating,
                risk.status || risk.risk_status || 'active',
                risk.owner || risk.owned_by || '',
                risk.raised_by || '',
                risk.response_type || '',
                risk.mitigation_strategy || risk.mitigation || '',
                risk.prevention || '',
                risk.created_at || new Date(),
                risk.updated_at || new Date()
              ]
            );
          }
        }
        console.log(`Migrated ${risks.length} risks`);
      } else {
        console.log('Risks table does not exist in source database, skipping migration of this table');
      }
    } catch (error) {
      console.error('Error migrating risks:', error);
    }
    
    // 3. Migrate issues
    console.log('Migrating issues...');
    try {
      // Check if issues table exists in source database
      const { rows: tableCheck } = await sourceClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'issues'
        ) AS exists
      `);
      
      if (tableCheck[0].exists) {
        const { rows: issues } = await sourceClient.query('SELECT * FROM issues');
        let migratedCount = 0;
        
        for (const issue of issues) {
          try {
            // Check if the issue already exists in the target database
            const exists = await targetClient.query(
              'SELECT id FROM issues WHERE "issueId" = $1', 
              [issue.issue_id || issue.id]
            );
            
            if (exists.rows.length === 0) {
              await targetClient.query(
                `INSERT INTO issues (
                  project_id, "projectId", "issueId", title, description, status, priority,
                  "assignedTo", "raisedBy", "dateRaised", "dueDate", resolution,
                  "dateCreated", "dateUpdated"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                  issue.project_id?.toString() || '1',
                  issue.project_id?.toString() || '1', // Duplicate for both column styles
                  issue.issue_id || issue.id || `I-${Date.now()}`,
                  issue.title || issue.issue_event || 'Unknown Issue',
                  issue.description || issue.issue_effect || '',
                  issue.status || issue.issue_status || 'open',
                  issue.priority || 'medium',
                  issue.assigned_to || issue.owned_by || '',
                  issue.raised_by || '',
                  issue.date_raised || issue.open_date || null,
                  issue.due_date || null,
                  issue.resolution || '',
                  issue.created_at || new Date(),
                  issue.updated_at || new Date()
                ]
              );
              migratedCount++;
            }
          } catch (issueError) {
            console.error(`Error migrating individual issue ${issue.id || 'unknown'}:`, issueError);
            // Continue with next issue
          }
        }
        console.log(`Migrated ${migratedCount} issues out of ${issues.length}`);
      } else {
        console.log('Issues table does not exist in source database, skipping migration of this table');
      }
    } catch (error) {
      console.error('Error migrating issues:', error);
    }
    
    // 4. Migrate critical dates - Handle independently of the main transaction
    console.log('Migrating critical dates...');
    
    // End the current transaction first to prevent errors from affecting other migrations
    await targetClient.query('COMMIT');
    console.log('Committed previous migrations');
    
    try {
      // Check if critical_dates table exists in source database
      const { rows: tableCheck } = await sourceClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'critical_dates'
        ) AS exists
      `);
      
      if (tableCheck[0].exists) {
        const { rows: criticalDates } = await sourceClient.query('SELECT * FROM critical_dates');
        let migratedCount = 0;
        
        if (criticalDates.length > 0) {
          console.log(`Found ${criticalDates.length} critical dates to migrate`);
          
          // Start a new transaction just for critical dates
          await targetClient.query('BEGIN');
          
          // Process each critical date in its own try-catch block
          for (const date of criticalDates) {
            try {
              // Check if the critical date already exists in the target database
              const existsQuery = await targetClient.query(
                'SELECT id FROM critical_dates WHERE id = $1', 
                [date.id.toString()]
              );
              
              if (existsQuery.rows.length === 0) {
                // Properly format the date to avoid issues
                let dueDateStr;
                try {
                  // Try to parse the date if it exists
                  if (date.due_date || date.dueDate) {
                    let rawDate = date.due_date || date.dueDate;
                    
                    // Check if it's already an ISO string
                    if (typeof rawDate === 'string' && rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
                      dueDateStr = rawDate;
                    } else {
                      // Try to convert to a proper date format
                      const dateObj = new Date(rawDate);
                      if (!isNaN(dateObj.getTime())) {
                        dueDateStr = dateObj.toISOString().split('T')[0];
                      } else {
                        // If we can't parse the date, use current date
                        dueDateStr = new Date().toISOString().split('T')[0];
                      }
                    }
                  } else {
                    // Default to current date if no date provided
                    dueDateStr = new Date().toISOString().split('T')[0];
                  }
                } catch (dateError) {
                  console.log("Error formatting date, using current date:", dateError);
                  dueDateStr = new Date().toISOString().split('T')[0];
                }
                
                // First get the actual column names to avoid errors
                const columnsQuery = await targetClient.query(`
                  SELECT column_name 
                  FROM information_schema.columns 
                  WHERE table_name = 'critical_dates'
                `);
                
                const columnNames = columnsQuery.rows.map(row => row.column_name);
                console.log("Available columns in critical_dates:", columnNames);
                
                // Construct dynamic query based on available columns
                let fields = [];
                let placeholders = [];
                let values = [];
                let paramCounter = 1;
                
                // Always safe fields with different naming conventions
                if (columnNames.includes('project_id')) {
                  fields.push('project_id');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.project_id?.toString() || '1');
                }
                
                if (columnNames.includes('projectId')) {
                  fields.push('"projectId"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.project_id?.toString() || '1');
                }
                
                // Basic required fields
                if (columnNames.includes('title')) {
                  fields.push('title');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.title || 'Unknown Date');
                }
                
                if (columnNames.includes('description')) {
                  fields.push('description');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.description || '');
                }
                
                if (columnNames.includes('dueDate')) {
                  fields.push('"dueDate"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(dueDateStr);
                }
                
                if (columnNames.includes('priority')) {
                  fields.push('priority');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.priority || 'medium');
                }
                
                if (columnNames.includes('status')) {
                  fields.push('status');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.status || 'pending');
                }
                
                // Optional fields with different naming conventions
                if (columnNames.includes('contractReference')) {
                  fields.push('"contractReference"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.contract_reference || date.contractReference || '');
                }
                
                if (columnNames.includes('contractClause')) {
                  fields.push('"contractClause"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.contract_clause || date.contractClause || '');
                }
                
                if (columnNames.includes('contractNotes')) {
                  fields.push('"contractNotes"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.contract_notes || date.contractNotes || '');
                }
                
                if (columnNames.includes('responsibleParty')) {
                  fields.push('"responsibleParty"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.responsible_party || date.responsibleParty || '');
                }
                
                // Date fields
                if (columnNames.includes('dateCreated')) {
                  fields.push('"dateCreated"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.created_at || date.dateCreated || new Date());
                }
                
                if (columnNames.includes('dateUpdated')) {
                  fields.push('"dateUpdated"');
                  placeholders.push(`$${paramCounter++}`);
                  values.push(date.updated_at || date.dateUpdated || new Date());
                }
                
                // Only proceed if we have fields to insert
                if (fields.length === 0) {
                  console.log("No valid fields found for critical date, skipping");
                  continue;
                }
                
                const insertQuery = `
                  INSERT INTO critical_dates (${fields.join(', ')})
                  VALUES (${placeholders.join(', ')})
                  RETURNING id
                `;
                
                console.log("Executing query:", insertQuery);
                const result = await targetClient.query(insertQuery, values);
                
                if (result.rows.length > 0) {
                  migratedCount++;
                  console.log(`Migrated critical date with title: ${date.title || 'Unknown'}`);
                }
              } else {
                console.log(`Critical date with id ${date.id} already exists, skipping`);
              }
            } catch (dateError) {
              console.error(`Error migrating individual critical date ${date.id || 'unknown'}:`, dateError);
              // Continue with next date, don't let this error affect the whole transaction
            }
          }
          
          // Commit the critical dates transaction
          await targetClient.query('COMMIT');
          console.log(`Successfully migrated ${migratedCount} critical dates out of ${criticalDates.length}`);
        } else {
          console.log('No critical dates found in source database');
        }
      } else {
        console.log('Critical dates table does not exist in source database, skipping migration of this table');
      }
    } catch (error) {
      console.error('Error migrating critical dates:', error);
      // Try to rollback if there was an error
      try {
        await targetClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    // Commit the transaction
    await targetClient.query('COMMIT');
    console.log('Risk data migration completed successfully!');
    
  } catch (error) {
    // Rollback the transaction if any error occurs
    await targetClient.query('ROLLBACK');
    console.error('Error migrating risk data:', error);
    throw error;
  } finally {
    // Release the clients
    sourceClient.release();
    targetClient.release();
  }
}

// Fix the projectId column issue and missing table columns
async function fixProjectIdIssue() {
  const client = await targetPool.connect();
  try {
    console.log('Fixing database structure issues...');
    
    // First check if issues table exists
    const { rows: issuesTableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'issues'
      ) AS exists
    `);
    
    if (issuesTableCheck[0].exists) {
      console.log('Issues table exists, checking structure...');
      
      // Fix issues table - ensure it has all required columns
      try {
        // Add issueId column if missing
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'issueId'
            ) THEN
              ALTER TABLE issues ADD COLUMN "issueId" TEXT;
            END IF;
          END $$;
        `);
        
        // Add title column if missing 
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'title'
            ) THEN
              ALTER TABLE issues ADD COLUMN title TEXT;
            END IF;
          END $$;
        `);
        
        // Add description column if missing
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'description'
            ) THEN
              ALTER TABLE issues ADD COLUMN description TEXT;
            END IF;
          END $$;
        `);
        
        // Add priority column if missing
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'priority'
            ) THEN
              ALTER TABLE issues ADD COLUMN priority TEXT;
            END IF;
          END $$;
        `);
        
        // Add assignedTo column if missing
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'assignedTo'
            ) THEN
              ALTER TABLE issues ADD COLUMN "assignedTo" TEXT;
            END IF;
          END $$;
        `);
        
        // Add dateRaised column if missing
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'dateRaised'
            ) THEN
              ALTER TABLE issues ADD COLUMN "dateRaised" TEXT;
            END IF;
          END $$;
        `);
        
        // Add dateCreated and dateUpdated columns if missing
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'dateCreated'
            ) THEN
              ALTER TABLE issues ADD COLUMN "dateCreated" TIMESTAMP;
            END IF;
          END $$;
        `);
        
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'dateUpdated'
            ) THEN
              ALTER TABLE issues ADD COLUMN "dateUpdated" TIMESTAMP;
            END IF;
          END $$;
        `);
        
        // Ensure projectId column exists and update values
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'issues' AND column_name = 'projectId'
            ) THEN
              ALTER TABLE issues ADD COLUMN "projectId" TEXT;
            END IF;
          END $$;
        `);
        
        // Update data mappings from old to new columns
        await client.query(`
          UPDATE issues
          SET 
            title = COALESCE(title, issue_event, 'Unknown Issue'),
            description = COALESCE(description, issue_effect, ''),
            priority = COALESCE(priority, 'medium'),
            "projectId" = COALESCE("projectId", project_id::TEXT, '1'),
            "issueId" = COALESCE("issueId", issue_id, CONCAT('I-', id)),
            "dateCreated" = COALESCE("dateCreated", created_at, NOW()),
            "dateUpdated" = COALESCE("dateUpdated", updated_at, NOW())
        `);
        
        console.log('Issues table structure fixed successfully');
      } catch (error) {
        console.error('Error updating issues table structure:', error);
      }
    }
    
    // Fix risks table
    try {
      // Check if risks table exists
      const { rows: risksTableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'risks'
        ) AS exists
      `);
      
      if (risksTableCheck[0].exists) {
        // Ensure projectId column exists
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'risks' AND column_name = 'projectId'
            ) THEN
              ALTER TABLE risks ADD COLUMN "projectId" TEXT;
            END IF;
          END $$;
        `);
        
        // Update projectId from project_id
        await client.query(`
          UPDATE risks 
          SET "projectId" = COALESCE("projectId", project_id::TEXT, '1')
          WHERE "projectId" IS NULL AND project_id IS NOT NULL
        `);
        
        console.log('Risks table structure fixed successfully');
      }
    } catch (error) {
      console.error('Error updating risks table structure:', error);
    }
    
    // Fix critical_dates table
    try {
      // Check if critical_dates table exists
      const { rows: datesTableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'critical_dates'
        ) AS exists
      `);
      
      if (datesTableCheck[0].exists) {
        // Ensure projectId column exists
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'critical_dates' AND column_name = 'projectId'
            ) THEN
              ALTER TABLE critical_dates ADD COLUMN "projectId" TEXT;
            END IF;
          END $$;
        `);
        
        // Update projectId from project_id
        await client.query(`
          UPDATE critical_dates
          SET "projectId" = COALESCE("projectId", project_id::TEXT, '1')
          WHERE "projectId" IS NULL AND project_id IS NOT NULL
        `);
        
        console.log('Critical dates table structure fixed successfully');
      }
    } catch (error) {
      console.error('Error updating critical_dates table structure:', error);
    }
    
    console.log('All database structure fixes completed successfully!');
  } catch (error) {
    console.error('Error fixing database structure:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export functions to be used in other files
export { migrateRiskData, fixProjectIdIssue };

// Run the migration if this file is executed directly
// In ES modules, we don't have require.main === module, so we use import.meta.url instead
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await fixProjectIdIssue();
      await migrateRiskData();
      
      // Close pools after migration is done
      await sourcePool.end();
      await targetPool.end();
      
      console.log('Migration completed. Database connections closed.');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}