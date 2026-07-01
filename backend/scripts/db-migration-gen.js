const { sequelize } = require('../models');

async function run() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    console.log("Current Tables in DB:", tables);

    const models = sequelize.models;
    const modelTableNames = Object.values(models).map(m => m.tableName);
    console.log("Target Table Names:", modelTableNames);

    let sql = '';
    
    // Generate RENAME statements for case-insensitive matches
    for (const model of Object.values(models)) {
        const targetName = model.tableName;
        const flatTarget = targetName.toLowerCase().replace(/_/g, '');
        // Find existing table that matches case-insensitively but not exactly
        const existingTable = tables.find(t => {
            const flatExisting = t.toLowerCase().replace(/_/g, '');
            return (flatExisting === flatTarget || flatExisting === flatTarget + 's' || flatExisting + 's' === flatTarget || flatExisting.replace(/ies$/, 'y') === flatTarget || flatExisting === flatTarget.replace(/ies$/, 'y')) && t !== targetName;
        });
        
        if (existingTable) {
            sql += `RENAME TABLE \`${existingTable}\` TO \`${targetName}\`;\n`;
        }
    }

    // Sync other things? We can generate a sql file.
    const fs = require('fs');
    fs.writeFileSync('db-migration.sql', sql);
    console.log('Migration SQL generated in db-migration.sql');

  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

run();
