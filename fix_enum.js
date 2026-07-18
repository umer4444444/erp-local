require('dotenv').config({ path: require('path').resolve(__dirname, 'backend/.env') });
const { sequelize, Sale } = require('./backend/models');

async function fixEnum() {
  try {
    const tableName = Sale.getTableName();
    await sequelize.query(`ALTER TABLE ${tableName} MODIFY COLUMN paymentMethod ENUM('cash', 'card', 'split', 'credit') DEFAULT 'cash';`);
    console.log('Database ENUM altered successfully on table: ' + tableName);
  } catch (err) {
    console.error('Error altering table:', err.message);
  } finally {
    process.exit(0);
  }
}

fixEnum();
