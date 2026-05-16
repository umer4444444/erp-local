const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    });
    console.log(`Connecting to MySQL to reset database: ${process.env.DB_NAME}...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\`;`);
    console.log('Database dropped and recreated successfully.');
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err);
  }
}

createDb();
