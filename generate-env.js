const fs = require('fs');
const path = require('path');

const apiKey = process.env.API_KEY || '';
const outPath = path.resolve(__dirname, '..', 'env.js');

const content = `// This file is generated at build time. Do not commit secrets to the repo.
window.__PRISMA_ENV = {
  API_KEY: ${JSON.stringify(apiKey)}
};
`;

fs.writeFileSync(outPath, content, { encoding: 'utf8' });
console.log('Generated', outPath);