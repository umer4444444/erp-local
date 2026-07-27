const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js') && !['index.js', 'Company.js', 'Branch.js', 'Warehouse.js', 'User.js'].includes(f));

for (const file of files) {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has companyId
  if (content.includes('companyId:')) continue;

  // Find the exact spot to insert: usually right before `}, {` which is the start of the options object.
  // Many models have `}, {` on a new line or at the end of the last attribute.
  // Using a regex to find the end of the attributes object.
  const regex = /\s*\}, \s*\{\s*tableName:/;
  
  if (regex.test(content)) {
    const injection = `
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
  },`;
    content = content.replace(regex, `${injection}\n}, {\n  tableName:`);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find injection point for ${file}`);
  }
}
