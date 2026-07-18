const sequelize = require('./backend/config/database.js');

async function fixEnum() {
  try {
    await sequelize.query("ALTER TABLE sales MODIFY COLUMN paymentMethod ENUM('cash', 'card', 'split', 'credit') DEFAULT 'cash';");
    console.log('Database ENUM altered successfully!');
  } catch (err) {
    console.error('Error altering table:', err.message);
  } finally {
    process.exit(0);
  }
}

fixEnum();
