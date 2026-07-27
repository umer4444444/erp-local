const mysql = require('mysql2/promise');
async function r() { 
  const c = await mysql.createConnection({host:'localhost', user:'root', password:'', database:'erp_db_new'}); 
  try {
    await c.query(`DELETE FROM payroll_runs WHERE id != '508f74ca-0dba-4cd8-ad1b-3135921eb077'`); 
    console.log('Duplicates deleted');
  } catch (e) {
    console.error(e.message);
  }
  c.end(); 
} 
r();
