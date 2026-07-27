const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix missing comma
  if (content.includes('}\n  companyId: {')) {
    content = content.replace('}\n  companyId: {', '},\n  companyId: {');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed comma in ${file}`);
  }
}
