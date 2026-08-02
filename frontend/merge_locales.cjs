const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/locales/en/translation.json');
const arPath = path.join(__dirname, 'src/locales/ar/translation.json');
const biDir = path.join(__dirname, 'src/locales/bi');
const biPath = path.join(biDir, 'translation.json');

if (!fs.existsSync(biDir)) {
  fs.mkdirSync(biDir, { recursive: true });
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const bi = {};

function mergeTranslations(objEn, objAr, targetObj) {
  for (const key in objEn) {
    if (typeof objEn[key] === 'object' && !Array.isArray(objEn[key])) {
      targetObj[key] = {};
      mergeTranslations(objEn[key], objAr[key] || {}, targetObj[key]);
    } else {
      const enVal = objEn[key];
      const arVal = objAr[key] || '';
      if (arVal && enVal !== arVal) {
        targetObj[key] = `${enVal} / ${arVal}`;
      } else {
        targetObj[key] = enVal;
      }
    }
  }
}

mergeTranslations(en, ar, bi);

fs.writeFileSync(biPath, JSON.stringify(bi, null, 2));
console.log('Successfully generated src/locales/bi/translation.json!');
