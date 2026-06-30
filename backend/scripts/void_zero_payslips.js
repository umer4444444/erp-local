const { sequelize, Payslip, PayrollRun } = require('../models');

async function voidZeroPayslips(execute = false) {
  try {
    await sequelize.authenticate();
    console.log('Database connection verified.');
    
    // 1. Find and void zero-value payslips
    const zeroPayslips = await Payslip.findAll({
      where: {
        netSalary: 0,
        status: ['unpaid', 'paid']
      }
    });

    console.log(`\nFound ${zeroPayslips.length} payslips with zero net salary.`);
    
    if (execute) {
      for (const payslip of zeroPayslips) {
        await payslip.update({ status: 'voided' });
      }
      console.log(`Successfully voided ${zeroPayslips.length} zero-value payslips.`);
    } else {
      console.log('DRY RUN: Skipping voiding payslips.');
    }

    // 2. Find and delete duplicate payroll runs
    const [runs] = await sequelize.query(`
      SELECT month, year, COUNT(*) as count 
      FROM PayrollRuns 
      GROUP BY month, year 
      HAVING count > 1
    `);

    console.log(`\nFound ${runs.length} periods with duplicate payroll runs.`);

    for (const run of runs) {
      const duplicateRuns = await PayrollRun.findAll({
        where: { month: run.month, year: run.year },
        order: [['createdAt', 'ASC']]
      });

      // Keep the first one, delete the rest
      const toDelete = duplicateRuns.slice(1);
      console.log(`Month/Year: ${run.month}/${run.year} - Keeping ID ${duplicateRuns[0].id}, deleting ${toDelete.length} duplicates.`);
      
      if (execute) {
        for (const duplicate of toDelete) {
          // Find associated payslips and delete them first (if cascade is not enabled)
          await Payslip.destroy({ where: { payrollRunId: duplicate.id }});
          await duplicate.destroy();
        }
      }
    }
    
    if (execute) {
      console.log('\nDuplicates deleted.');
    } else {
      console.log('\nDRY RUN: Skipping deletion of duplicate runs.');
    }

    if (!execute) {
      console.log('\nDRY RUN COMPLETED. Run with --execute flag to actually apply changes.');
    } else {
      console.log('\nEXECUTION COMPLETED.');
    }

  } catch (err) {
    console.error('Error during processing:', err);
  } finally {
    await sequelize.close();
  }
}

const args = process.argv.slice(2);
const execute = args.includes('--execute');
voidZeroPayslips(execute);
