const { sequelize } = require('./models');

async function migrate() {
  try {
    await sequelize.query('ALTER TABLE Employees ADD COLUMN address VARCHAR(255);').catch(() => console.log('address already added'));
    await sequelize.query('ALTER TABLE Designations ADD COLUMN departmentId CHAR(36);').catch(() => console.log('departmentId already added'));
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
