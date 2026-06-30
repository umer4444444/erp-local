const { sequelize } = require('./models');

async function fixDb() {
  try {
    await sequelize.authenticate();
    // Drop the problematic index if it exists
    try {
      await sequelize.query('ALTER TABLE Users DROP INDEX users_location');
    } catch (e) {}

    // We will update existing locations to a valid POINT(0 0) if they are invalid.
    await sequelize.query("UPDATE Users SET location = ST_GeomFromText('POINT(0 0)')");

    // Also alter the column to ensure it is NOT NULL
    await sequelize.query("ALTER TABLE Users MODIFY COLUMN location GEOMETRY NOT NULL");
    
    // Add the spatial index
    try {
      await sequelize.query('ALTER TABLE Users ADD SPATIAL INDEX users_location (location)');
    } catch(e) {
      console.log('Index might already exist or could not be created:', e.message);
    }

    console.log('Fixed Users table location column.');
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

fixDb();
