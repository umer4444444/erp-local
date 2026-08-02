const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src/pages'),
  path.join(__dirname, 'src/components'),
  path.join(__dirname, 'src/App.jsx')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = [
    { regex: /'white'/g, replacement: "'var(--bg-panel)'" },
    { regex: /"white"/g, replacement: "'var(--bg-panel)'" },
    { regex: /'#ffffff'/ig, replacement: "'var(--bg-panel)'" },
    { regex: /"#ffffff"/ig, replacement: "'var(--bg-panel)'" },
    
    { regex: /'#f8fafc'/ig, replacement: "'var(--bg-main)'" },
    { regex: /"#f8fafc"/ig, replacement: "'var(--bg-main)'" },
    
    { regex: /'#0f172a'/ig, replacement: "'var(--text-main)'" },
    { regex: /"#0f172a"/ig, replacement: "'var(--text-main)'" },
    { regex: /'#1e293b'/ig, replacement: "'var(--text-main)'" },
    
    { regex: /'#64748b'/ig, replacement: "'var(--text-muted)'" },
    { regex: /"#64748b"/ig, replacement: "'var(--text-muted)'" },
    { regex: /'#94a3b8'/ig, replacement: "'var(--text-muted)'" },

    { regex: /'#e2e8f0'/ig, replacement: "'var(--border-color)'" },
    { regex: /"#e2e8f0"/ig, replacement: "'var(--border-color)'" },
    { regex: /rgba\(0,0,0,0\.05\)/g, replacement: "var(--border-color-rgb)" },
    { regex: /rgba\(0,0,0,0\.04\)/g, replacement: "var(--border-color-rgb)" },
    
    { regex: /rgba\(0,0,0,0\.03\)/g, replacement: "var(--shadow-color-rgb)" },
    { regex: /rgba\(0,0,0,0\.02\)/g, replacement: "var(--shadow-color-rgb)" },
    { regex: /rgba\(0,0,0,0\.1\)/g, replacement: "var(--shadow-strong-rgb)" },
    { regex: /rgba\(0,0,0,0\.08\)/g, replacement: "var(--shadow-strong-rgb)" },
    { regex: /rgba\(0,0,0,0\.2\)/g, replacement: "var(--shadow-strong-rgb)" }
  ];

  let modified = false;
  for (const { regex, replacement } of replacements) {
    if (regex.test(content)) {
      modified = true;
      content = content.replace(regex, replacement);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile() && (dir.endsWith('.jsx') || dir.endsWith('.js'))) {
    processFile(dir);
  } else if (stat.isDirectory()) {
    fs.readdirSync(dir).forEach(file => {
      traverse(path.join(dir, file));
    });
  }
}

dirs.forEach(traverse);
console.log('Migration complete.');
