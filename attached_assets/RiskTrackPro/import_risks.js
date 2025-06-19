// Script to import risk data from CSV
import fs from 'fs';
import { Pool } from '@neondatabase/serverless';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Function to clean and parse CSV values
function parseCSVLine(line) {
  const result = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && line[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  
  result.push(cell);
  return result;
}

// Process CSV and insert data
async function importData() {
  try {
    // Read the CSV file
    const fileStream = fs.createReadStream('temp_risk_register.csv');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    // Skip header lines (first 10 lines)
    let lineCount = 0;
    const risks = [];

    for await (const line of rl) {
      lineCount++;
      
      // Skip header lines
      if (lineCount <= 10) {
        continue;
      }
      
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }
      
      // Parse CSV line
      const values = parseCSVLine(line);
      
      // Process if it has risk ID
      if (values.length >= 17 && values[2] && values[2].trim().startsWith('R -')) {
        const risk = {
          priorityRank: parseInt(values[1]) || 0,
          riskId: values[2].trim(),
          issueId: values[3].trim() !== '-' ? values[3].trim() : null,
          openDate: values[4].trim(), // Date format: DD/MM/YY
          raisedBy: values[5].trim(),
          ownedBy: values[6].trim(),
          riskCause: values[7].trim(),
          riskEvent: values[8].trim(),
          riskEffect: values[9].trim(),
          riskCategory: values[10].trim(),
          probability: parseFloat(values[11]) || 0,
          impact: parseInt(values[12]) || 0,
          riskRating: parseInt(values[13]) || 0,
          riskStatus: values[14].trim(),
          responseType: values[15].trim(),
          mitigation: values[16].trim(),
          prevention: values[17] ? values[17].trim() : '',
          projectId: 1, // Project ID
        };
        
        // Ensure risk has all required fields
        if (risk.riskId && risk.riskStatus && risk.riskCategory) {
          risks.push(risk);
        }
      }
    }

    console.log(`Found ${risks.length} risks to import`);
    
    // Insert risks into database
    for (const risk of risks) {
      const query = `
        INSERT INTO risks (
          priority_rank, risk_id, issue_id, open_date, raised_by, owned_by, 
          risk_cause, risk_event, risk_effect, risk_category, probability, 
          impact, risk_rating, risk_status, response_type, mitigation, 
          prevention, project_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING id
      `;
      
      const values = [
        risk.priorityRank, risk.riskId, risk.issueId, risk.openDate, risk.raisedBy, 
        risk.ownedBy, risk.riskCause, risk.riskEvent, risk.riskEffect, risk.riskCategory, 
        risk.probability, risk.impact, risk.riskRating, risk.riskStatus, risk.responseType, 
        risk.mitigation, risk.prevention, risk.projectId
      ];
      
      const result = await pool.query(query, values);
      console.log(`Inserted risk ${risk.riskId} with ID ${result.rows[0].id}`);
    }
    
    console.log('Risk data import completed successfully!');
  } catch (error) {
    console.error('Error importing risk data:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the import function
importData();