const { sequelize, Sale, User } = require('../models');

async function backfillSales(execute = false) {
  try {
    await sequelize.authenticate();
    console.log('Database connection verified.');

    // Find a valid admin/manager user to attribute orphan sales to
    const adminUser = await User.findOne({
      where: { role: ['admin', 'manager'] },
      order: [['createdAt', 'ASC']]
    });

    if (!adminUser) {
      console.log('No admin or manager found to attribute sales to. Exiting.');
      return;
    }

    const orphanSales = await Sale.findAll({
      where: { userId: null }
    });

    console.log(`\nFound ${orphanSales.length} sales with NULL userId.`);

    if (execute) {
      if (orphanSales.length > 0) {
        // We'll update directly using query interface to bypass validation just in case
        await sequelize.query(
          `UPDATE Sales SET userId = :userId WHERE userId IS NULL`,
          { replacements: { userId: adminUser.id } }
        );
        console.log(`Successfully attributed ${orphanSales.length} sales to User ID: ${adminUser.id} (${adminUser.name}).`);
      }
      console.log('\nEXECUTION COMPLETED.');
    } else {
      console.log(`\nDRY RUN COMPLETED. ${orphanSales.length} records would be attributed to ${adminUser.name}. Run with --execute flag to apply.`);
    }

  } catch (err) {
    console.error('Error during backfill:', err);
  } finally {
    await sequelize.close();
  }
}

const args = process.argv.slice(2);
const execute = args.includes('--execute');
backfillSales(execute);
