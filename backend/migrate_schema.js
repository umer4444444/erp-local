require('dotenv').config();
const { sequelize, User } = require('./models');

async function migrateAll() {
  const queryInterface = sequelize.getQueryInterface();
  const salesTable = 'sales';

  try {
    const tableInfo = await queryInterface.describeTable(salesTable);

    if (!tableInfo.discountType) {
      await queryInterface.addColumn(salesTable, 'discountType', {
        type: sequelize.Sequelize.ENUM('flat', 'percent'),
        defaultValue: 'flat'
      });
      console.log('Added column: discountType');
    }

    if (!tableInfo.extraCharges) {
      await queryInterface.addColumn(salesTable, 'extraCharges', {
        type: sequelize.Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      });
      console.log('Added column: extraCharges');
    }

    if (!tableInfo.extraChargeReason) {
      await queryInterface.addColumn(salesTable, 'extraChargeReason', {
        type: sequelize.Sequelize.STRING
      });
      console.log('Added column: extraChargeReason');
    }

    if (!tableInfo.creditReason) {
      await queryInterface.addColumn(salesTable, 'creditReason', {
        type: sequelize.Sequelize.STRING
      });
      console.log('Added column: creditReason');
    }

    if (!tableInfo.customerName) {
      await queryInterface.addColumn(salesTable, 'customerName', {
        type: sequelize.Sequelize.STRING
      });
      console.log('Added column: customerName');
    }

    if (!tableInfo.customerPhone) {
      await queryInterface.addColumn(salesTable, 'customerPhone', {
        type: sequelize.Sequelize.STRING
      });
      console.log('Added column: customerPhone');
    }

    if (!tableInfo.cashierName) {
      await queryInterface.addColumn(salesTable, 'cashierName', {
        type: sequelize.Sequelize.STRING
      });
      console.log('Added column: cashierName');
    }

    // Fix User role ENUM
    const userTable = User.getTableName();
    await sequelize.query(`ALTER TABLE ${userTable} MODIFY COLUMN role ENUM('admin', 'manager', 'cashier', 'hr', 'inventory', 'pharmacist', 'expenses', 'operations', 'finance') DEFAULT 'cashier';`).catch(() => {});
    console.log('Fixed User role ENUM');

    // Fix paymentMethod ENUM
    await sequelize.query(`ALTER TABLE ${salesTable} MODIFY COLUMN paymentMethod ENUM('cash', 'card', 'split', 'credit') DEFAULT 'cash';`);
    console.log('Fixed Sales paymentMethod ENUM');

    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrateAll();
