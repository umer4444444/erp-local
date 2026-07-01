const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');

const files = fs.readdirSync(modelsDir);

for (const file of files) {
  if (file === 'index.js' || !file.endsWith('.js')) continue;

  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  if (content.includes('DataTypes.UUIDV4')) {
    content = content.replace(/DataTypes\.UUIDV4/g, 'uuidv7');
    modified = true;
  }

  if (modified) {
    if (!content.includes("require('uuid')")) {
      const requireStatement = "const uuidv7 = () => require('crypto').randomUUID();\n";
      content = requireStatement + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

console.log('UUIDv7 migration completed.');
