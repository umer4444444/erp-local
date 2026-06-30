const { sequelize } = require('../models');

async function cleanupDuplicates(execute = false) {
  try {
    await sequelize.authenticate();
    console.log('Database connection verified.');
    
    // 1. Cleanup Foreign Keys
    console.log('\n--- Cleaning up duplicate Foreign Keys ---');
    const [fkResults] = await sequelize.query(`
      SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_SCHEMA = DATABASE()
    `);

    const fkMap = new Map();
    for (const row of fkResults) {
      const key = `${row.TABLE_NAME}_${row.COLUMN_NAME}_${row.REFERENCED_TABLE_NAME}_${row.REFERENCED_COLUMN_NAME}`;
      if (!fkMap.has(key)) {
        fkMap.set(key, []);
      }
      fkMap.get(key).push(row.CONSTRAINT_NAME);
    }

    let fkDropped = 0;
    for (const [key, constraints] of fkMap.entries()) {
      if (constraints.length > 1) {
        // Keep the first one, drop the rest
        const [tableName] = key.split('_');
        const toDrop = constraints.slice(1);
        console.log(`Found duplicate FKs on ${tableName}: ${constraints.join(', ')}. Dropping ${toDrop.join(', ')}`);
        
        if (execute) {
          for (const constraint of toDrop) {
            await sequelize.query(`ALTER TABLE ${tableName} DROP FOREIGN KEY ${constraint}`);
            fkDropped++;
          }
        }
      }
    }
    console.log(`Total duplicate FKs dropped: ${fkDropped}`);

    // 2. Cleanup Unique Indexes
    console.log('\n--- Cleaning up duplicate Unique Indexes ---');
    const [indexResults] = await sequelize.query(`
      SELECT 
        TABLE_NAME, 
        INDEX_NAME, 
        COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE NON_UNIQUE = 0 
        AND INDEX_NAME != 'PRIMARY'
        AND TABLE_SCHEMA = DATABASE()
    `);

    const indexMap = new Map();
    // Group columns by index
    const indexCols = new Map();
    for (const row of indexResults) {
        const key = `${row.TABLE_NAME}_${row.INDEX_NAME}`;
        if (!indexCols.has(key)) {
            indexCols.set(key, []);
        }
        indexCols.get(key).push(row.COLUMN_NAME);
    }
    
    // Group indexes by table + columns
    for (const [tableIndex, columns] of indexCols.entries()) {
        const [tableName, indexName] = tableIndex.split('_');
        const key = `${tableName}_${columns.join(',')}`;
        if (!indexMap.has(key)) {
            indexMap.set(key, []);
        }
        indexMap.get(key).push(indexName);
    }

    let idxDropped = 0;
    for (const [key, indexes] of indexMap.entries()) {
      if (indexes.length > 1) {
        const [tableName] = key.split('_');
        const toDrop = indexes.slice(1);
        console.log(`Found duplicate unique indexes on ${tableName} for columns ${key.substring(tableName.length+1)}: ${indexes.join(', ')}. Dropping ${toDrop.join(', ')}`);
        
        if (execute) {
          for (const index of toDrop) {
            // Need to drop foreign keys before dropping indexes if they are related, but for simplicity, we try.
            try {
                await sequelize.query(`ALTER TABLE ${tableName} DROP INDEX ${index}`);
                idxDropped++;
            } catch (err) {
                console.log(`Failed to drop index ${index} on ${tableName}: ${err.message}`);
            }
          }
        }
      }
    }
    console.log(`Total duplicate Indexes dropped: ${idxDropped}`);

    if (!execute) {
      console.log('\nDRY RUN COMPLETED. Run with --execute flag to actually apply changes.');
    } else {
      console.log('\nEXECUTION COMPLETED.');
    }

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await sequelize.close();
  }
}

const args = process.argv.slice(2);
const execute = args.includes('--execute');
cleanupDuplicates(execute);
