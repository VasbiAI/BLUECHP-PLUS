const fs = require('fs');

// Path to the database storage file
const filePath = './server/databaseStorage.ts';

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of companyEntity with entity
content = content.replace(/companyEntity: row\.entity \|\| null/g, 'entity: row.entity || null');

// Replace all instances of companyDepartment with department
content = content.replace(/companyDepartment: row\.department \|\| null/g, 'department: row.department || null');

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Database field mappings updated successfully!');
