const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function initDB() {
  try {
    console.log('Connecting to the database...');
    await sequelize.authenticate();
    console.log('Connection established.');

    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    // 1. Run Renames from migration script if old tables exist
    console.log('Checking for required table renames...');
    const migrationFile = path.join(__dirname, '../db-migration.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      const queries = sql.split(';').map(q => q.trim()).filter(q => q);
      
      for (let query of queries) {
        // e.g., RENAME TABLE `old` TO `new`
        const match = query.match(/RENAME TABLE `([^`]+)` TO `([^`]+)`/);
        if (match) {
          const oldName = match[1];
          const newName = match[2];
          if (tables.includes(oldName)) {
            console.log(`Executing: ${query}`);
            await sequelize.query(query);
          }
        }
      }
    }

    // 2. Sync all models with alter to add any missing columns safely
    console.log('Synchronizing schema with models...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized perfectly.');

    // 3. Optional: Seeding data can go here
    // e.g. check if admin user exists, if not create one.
    const User = sequelize.models.User;
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      console.log('No admin user found. Creating default admin...');
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'System Admin',
        email: 'admin@erp.com',
        phone: '0000000000',
        passwordHash,
        role: 'admin',
        location: { type: 'Point', coordinates: [0, 0] }
      });
      console.log('Default admin created (admin@erp.com / admin123).');
    }

    console.log('Database initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDB();
