const { sequelize } = require('../models');

async function fixKeys() {
  const [indexes] = await sequelize.query("SHOW INDEX FROM `employees`");
  const uniqueIndexes = indexes.filter(idx => idx.Key_name.startsWith('empCode') && idx.Key_name !== 'PRIMARY');
  
  for (let idx of uniqueIndexes) {
     console.log(`Dropping index ${idx.Key_name}...`);
     try {
       await sequelize.query(`ALTER TABLE \`employees\` DROP INDEX \`${idx.Key_name}\``);
     } catch (e) {
       // ignore
     }
  }
  console.log("Done");
  process.exit(0);
}

fixKeys();
