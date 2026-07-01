const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Drop all duplicate non-PRIMARY indexes on a column, keeping only one.
 * This fixes the runaway phone_2..phone_N / email_2..email_N problem created
 * by repeated `sequelize.sync({ alter: true })` runs.
 */
async function deduplicateIndexes(tableName) {
  const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);
  // Group by Key_name, keep track of which column each index covers
  const seen = new Map(); // column_name -> count kept
  const toDrop = [];

  // Build map: colName -> [{ Key_name, Non_unique }]
  const byColumn = {};
  for (const idx of indexes) {
    if (idx.Key_name === 'PRIMARY') continue;
    const col = idx.Column_name;
    if (!byColumn[col]) byColumn[col] = [];
    byColumn[col].push(idx.Key_name);
  }

  for (const [col, keyNames] of Object.entries(byColumn)) {
    // Keep the first (shortest/original) index, drop the rest
    const sorted = [...new Set(keyNames)].sort((a, b) => a.length - b.length);
    for (let i = 1; i < sorted.length; i++) {
      toDrop.push(sorted[i]);
    }
  }

  for (const keyName of toDrop) {
    try {
      await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${keyName}\``);
      console.log(`  Dropped duplicate index: ${tableName}.${keyName}`);
    } catch (e) {
      // Already gone — ignore
    }
  }
}

/**
 * Safely add a column that must ultimately be NOT NULL to a populated table.
 * Steps:
 *   1. Add as NULL (never fails on existing rows)
 *   2. Back-fill every existing row
 *   3. Tighten to NOT NULL
 */
async function safeAddNotNullColumn(tableName, attrName, attr, tableDesc) {
  const type = attr.type.toSql();

  // 1. Add as NULL
  await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${attrName}\` ${type} NULL`);

  // 2. Back-fill
  if (tableName === 'users' && attrName === 'location') {
    // Special case: GEOMETRY — convert legacy lat/lng if present
    const hasLat = !!tableDesc.current_lat;
    const hasLng = !!tableDesc.current_lng;
    if (hasLat && hasLng) {
      await sequelize.query(
        "UPDATE `users` SET `location` = ST_GeomFromText(CONCAT('POINT(', COALESCE(`current_lng`,0), ' ', COALESCE(`current_lat`,0), ')')) WHERE `location` IS NULL"
      );
    } else {
      await sequelize.query(
        "UPDATE `users` SET `location` = ST_GeomFromText('POINT(0 0)') WHERE `location` IS NULL"
      );
    }
  } else {
    // Generic back-fill: derive a safe default value
    let defVal;
    if (attr.defaultValue !== undefined && attr.defaultValue !== null &&
        typeof attr.defaultValue !== 'function' && typeof attr.defaultValue !== 'object') {
      defVal = typeof attr.defaultValue === 'string' ? `'${attr.defaultValue}'` : attr.defaultValue;
    } else if (type.match(/INT|FLOAT|DOUBLE|DECIMAL|NUMERIC/i)) {
      defVal = '0';
    } else if (type.match(/TINYINT\(1\)|BOOLEAN/i)) {
      defVal = '0';
    } else if (type.match(/DATETIME|TIMESTAMP/i)) {
      defVal = 'CURRENT_TIMESTAMP';
    } else {
      defVal = "''";
    }
    await sequelize.query(`UPDATE \`${tableName}\` SET \`${attrName}\` = ${defVal} WHERE \`${attrName}\` IS NULL`);
  }

  // 3. Tighten to NOT NULL
  await sequelize.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${attrName}\` ${type} NOT NULL`);
  console.log(`  Migrated ${tableName}.${attrName} → NOT NULL ✓`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function initDB() {
  try {
    console.log('Connecting to the database...');
    await sequelize.authenticate();
    console.log('Connection established.');

    const queryInterface = sequelize.getQueryInterface();
    let tables = await queryInterface.showAllTables();

    // ── Step 1: Run table renames from db-migration.sql ─────────────────────
    console.log('\n[Step 1] Checking for required table renames...');
    const migrationFile = path.join(__dirname, '../db-migration.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      const queries = sql.split(';').map(q => q.trim()).filter(q => q);
      for (const query of queries) {
        const match = query.match(/RENAME TABLE `([^`]+)` TO `([^`]+)`/);
        if (match) {
          const [, oldName, newName] = match;
          if (tables.includes(oldName) && !tables.includes(newName)) {
            console.log(`  Renaming: ${oldName} → ${newName}`);
            await sequelize.query(query);
          }
        }
      }
      // Refresh table list after renames
      tables = await queryInterface.showAllTables();
    }

    // ── Step 2: Pre-sync — safely add missing NOT NULL columns ────────────────
    console.log('\n[Step 2] Pre-sync: safely adding missing NOT NULL columns...');
    const models = sequelize.models;
    for (const modelName of Object.keys(models)) {
      const model = models[modelName];
      const tableName = model.tableName;
      if (!tables.includes(tableName)) continue;

      const tableDesc = await queryInterface.describeTable(tableName);
      for (const attrName of Object.keys(model.rawAttributes)) {
        const attr = model.rawAttributes[attrName];
        const isMissing = !tableDesc[attrName];
        const isNotNull = attr.allowNull === false;
        const isPrimaryKey = !!attr.primaryKey;

        if (isMissing && isNotNull && !isPrimaryKey) {
          console.log(`  Adding missing NOT NULL column: ${tableName}.${attrName}`);
          await safeAddNotNullColumn(tableName, attrName, attr, tableDesc);
        }
      }
    }

    // ── Step 3: De-duplicate indexes caused by repeated sync runs ─────────────
    console.log('\n[Step 3] De-duplicating stale duplicate indexes...');
    const currentTables = await queryInterface.showAllTables();
    for (const tableName of currentTables) {
      await deduplicateIndexes(tableName);
    }

    // ── Step 4: sync({ alter: true }) — adds remaining nullable columns ───────
    console.log('\n[Step 4] Synchronizing schema with models (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('Schema synchronized ✓');

    // ── Step 5: Seed — ensure at least one admin exists ──────────────────────
    console.log('\n[Step 5] Seeding initial data...');
    const User = sequelize.models.User;
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'System Admin',
        email: 'admin@erp.com',
        phone: '0000000000',
        passwordHash,
        role: 'admin',
        location: { type: 'Point', coordinates: [0, 0] }
      });
      console.log('  Default admin created: admin@erp.com / admin123');
    } else {
      console.log('  Admin user already exists — skipping seed.');
    }

    console.log('\n✅  Database initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌  Failed to initialize database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initDB();
