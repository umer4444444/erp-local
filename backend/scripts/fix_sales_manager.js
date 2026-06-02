/**
 * Fix Sales Manager Role
 * Run: node scripts/fix_sales_manager.js
 * 
 * Sets the role for sales@erp.com to 'manager'
 * and ensures manager@erp.com is also correct.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User } = require('../models');

const fix = async () => {
  try {
    // Fix sales@erp.com — was created with empty role
    const [updatedSales] = await User.update(
      { role: 'manager' },
      { where: { email: 'sales@erp.com' } }
    );
    console.log(`sales@erp.com → role set to 'manager' (rows updated: ${updatedSales})`);

    // Confirm manager@erp.com is correct
    const manager = await User.findOne({ where: { email: 'manager@erp.com' } });
    if (manager) {
      console.log(`manager@erp.com → role is '${manager.role}' ✓`);
    } else {
      console.log('manager@erp.com not found — creating...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('staff123', 10);
      await User.create({
        name: 'Store Manager',
        email: 'manager@erp.com',
        phone: '0300-0000001',
        role: 'manager',
        passwordHash: hash,
      });
      console.log('manager@erp.com created with role manager ✓');
    }

    console.log('\nDone. Both manager accounts are now operational.');
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err.message);
    process.exit(1);
  }
};

fix();
