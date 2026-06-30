require('dotenv').config();
const { sequelize } = require('./models');

async function migrateRides() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // 1. Expand the status ENUM to include delivery workflow statuses
    try {
      await sequelize.query(`
        ALTER TABLE Rides 
        MODIFY COLUMN status ENUM(
          'requested','bidding','accepted','in_progress','completed','cancelled',
          'pending','assigned','picked_up','in_transit','delivered','failed'
        ) NOT NULL DEFAULT 'pending'
      `);
      console.log('✅ Rides.status ENUM updated.');
    } catch (e) {
      console.log('⚠️  status ENUM error (may already exist):', e.message);
    }

    // 2. Add customerName column
    try {
      await sequelize.query(`ALTER TABLE Rides ADD COLUMN customerName VARCHAR(255) NULL`);
      console.log('✅ Added customerName column.');
    } catch (e) {
      console.log('⚠️  customerName:', e.message);
    }

    // 3. Add customerPhone column
    try {
      await sequelize.query(`ALTER TABLE Rides ADD COLUMN customerPhone VARCHAR(255) NULL`);
      console.log('✅ Added customerPhone column.');
    } catch (e) {
      console.log('⚠️  customerPhone:', e.message);
    }

    // 4. Add deliveryAddress column
    try {
      await sequelize.query(`ALTER TABLE Rides ADD COLUMN deliveryAddress VARCHAR(255) NULL`);
      console.log('✅ Added deliveryAddress column.');
    } catch (e) {
      console.log('⚠️  deliveryAddress:', e.message);
    }

    // 5. Add notes column
    try {
      await sequelize.query(`ALTER TABLE Rides ADD COLUMN notes TEXT NULL`);
      console.log('✅ Added notes column.');
    } catch (e) {
      console.log('⚠️  notes:', e.message);
    }

    // 6. Add priority column
    try {
      await sequelize.query(`ALTER TABLE Rides ADD COLUMN priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal'`);
      console.log('✅ Added priority column.');
    } catch (e) {
      console.log('⚠️  priority:', e.message);
    }

    console.log('\n🎉 Rides table migration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrateRides();
