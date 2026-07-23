const sequelize = require('./config/database');
const { Employee, Attendance } = require('./models');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Add columns directly via query if alter fails
    try {
      await sequelize.query('ALTER TABLE employees ADD COLUMN gender ENUM("male", "female", "other") NULL;');
      console.log('Added gender to employees');
    } catch(e) { console.log('Gender column might already exist:', e.message); }

    try {
      await sequelize.query('ALTER TABLE attendance ADD COLUMN latitude DECIMAL(10,8) NULL;');
      await sequelize.query('ALTER TABLE attendance ADD COLUMN longitude DECIMAL(11,8) NULL;');
      console.log('Added GPS to attendance');
    } catch(e) { console.log('GPS columns might already exist:', e.message); }

    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

syncDB();
