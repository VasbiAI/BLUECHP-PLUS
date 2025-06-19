// replit_extract_secrets.js
// Run this script on Replit to extract all secrets to a format
// that can be pasted into your local .env file

console.log('Copy the following environment variables to your local .env file:\n');

const envVariables = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'PGDATABASE',
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGPASSWORD',
  'SESSION_SECRET',
  // Add any other environment variables your project uses
];

envVariables.forEach(key => {
  if (process.env[key]) {
    console.log(`${key}=${process.env[key]}`);
  } else {
    console.log(`# ${key}=not_set`);
  }
});

console.log('\nDon\'t forget to set NODE_ENV=development in your local .env file');
console.log('\nAfter copying these values to your local .env file, run:');
console.log('npm run check-env');
