const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src/pages'),
  path.join(__dirname, 'src/components')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already wrapped by this script
  if (content.includes('className="w-full overflow-x-auto"')) {
    return;
  }

  if (content.includes('<table')) {
    // We only replace exactly `<table` when it's JSX (preceded by spaces or <)
    content = content.replace(/<table/g, '<div className="w-full overflow-x-auto"><table');
    content = content.replace(/<\/table>/g, '</table></div>');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Wrapped table in ${filePath}`);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile() && dir.endsWith('.jsx')) {
    processFile(dir);
  } else if (stat.isDirectory()) {
    fs.readdirSync(dir).forEach(file => {
      traverse(path.join(dir, file));
    });
  }
}

dirs.forEach(traverse);
console.log('Table wrap complete.');
