import { db } from './db';
import { criticalDates } from '@shared/schema';
import * as fs from 'fs';

// This file is a utility to update databaseStorage.ts with proper field mappings
// It replaces all instances of:
// companyEntity -> entity
// companyDepartment -> department

async function fixMappings() {
  const filePath = './server/databaseStorage.ts';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all instances of companyEntity with entity
    content = content.replace(/companyEntity: row\.entity \|\| null,/g, 'entity: row.entity || null,');
    
    // Replace all instances of companyDepartment with department
    content = content.replace(/companyDepartment: row\.department \|\| null,/g, 'department: row.department || null,');
    
    // Write back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log('Database mappings fixed successfully!');
  } catch (error) {
    console.error('Error fixing database mappings:', error);
  }
}

fixMappings();