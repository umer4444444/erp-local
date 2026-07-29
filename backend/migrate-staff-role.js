require('dotenv').config();
const { sequelize } = require('./models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB...');
    const sql = [
      "ALTER TABLE users MODIFY COLUMN role",
      "ENUM('superadmin','owner','company_admin','admin','manager',",
      "'cashier','hr','inventory','pharmacist','expenses',",
      "'operations','finance','sales_rep','driver','auditor','staff')",
      "NOT NULL DEFAULT 'cashier'"
    ].join(' ');
    await sequelize.query(sql);
    console.log('Migration complete: staff added to users.role ENUM');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
