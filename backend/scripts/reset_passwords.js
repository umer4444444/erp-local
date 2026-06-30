const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function resetPasswords(execute = false) {
  try {
    await sequelize.authenticate();
    console.log('Database connection verified.');
    
    const users = await User.findAll();
    console.log(`\nFound ${users.length} users to reset passwords for.`);

    const newCredentials = [];

    for (const user of users) {
      // Generate a standardized password for demo/development purposes based on role
      // For a real production system, this should generate a random password and email it to the user
      const newPassword = `${user.role}123!`; 
      
      if (execute) {
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await user.update({ passwordHash });
      }

      newCredentials.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        newPassword
      });
    }

    console.log('\n--- NEW CREDENTIALS ---');
    for (const cred of newCredentials) {
      console.log(`Email: ${cred.email} | Role: ${cred.role} | Password: ${cred.newPassword}`);
    }

    if (!execute) {
      console.log('\nDRY RUN COMPLETED. Run with --execute flag to actually apply changes.');
    } else {
      console.log('\nEXECUTION COMPLETED. All passwords have been reset with bcrypt cost factor 12.');
    }

  } catch (err) {
    console.error('Error during password reset:', err);
  } finally {
    await sequelize.close();
  }
}

const args = process.argv.slice(2);
const execute = args.includes('--execute');
resetPasswords(execute);
