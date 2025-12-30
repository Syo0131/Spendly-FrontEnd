const { writeFile } = require('fs');
const { argv } = require('yargs');

// Load dotenv to read .env file
require('dotenv').config();

// Determine if we are in production mode
// Pass --prod command line flag to use production environment
const isProduction = process.argv.includes('--prod');

// The file path to write to
const targetPath = isProduction
  ? './src/environments/environment.prod.ts'
  : './src/environments/environment.ts';

// The content to write
const envConfigFile = `export const environment = {
  production: ${isProduction},
  apiUrl: '${process.env.API_URL}'
};
`;

console.log(`Writing variables to ${targetPath}`);
console.log(`API_URL: ${process.env.API_URL}`);

writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`Environment file generated correctly at ${targetPath}`);
  }
});
