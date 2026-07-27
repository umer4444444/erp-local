const { sequelize, User, Company, Branch, Warehouse } = require('../models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    console.log('Syncing models with alter:true...');
    await sequelize.sync({ alter: true });
    
    console.log('Creating default Company...');
    const [company] = await Company.findOrCreate({
      where: { name: 'Main Company' },
      defaults: {
        name: 'Main Company',
        arabicName: 'الشركة الرئيسية',
        defaultCurrency: 'SAR',
        isActive: true
      }
    });

    console.log('Creating default Branch...');
    const [branch] = await Branch.findOrCreate({
      where: { name: 'Main Branch', companyId: company.id },
      defaults: {
        name: 'Main Branch',
        companyId: company.id,
        branchCode: 'B01',
        isActive: true
      }
    });

    console.log('Creating default Warehouse...');
    const [warehouse] = await Warehouse.findOrCreate({
      where: { name: 'Main Warehouse', companyId: company.id, branchId: branch.id },
      defaults: {
        name: 'Main Warehouse',
        companyId: company.id,
        branchId: branch.id,
        type: 'main',
        isActive: true
      }
    });

    console.log('Backfilling companyId on all tables...');
    const models = sequelize.models;
    for (const modelName of Object.keys(models)) {
      if (['Company', 'Branch', 'Warehouse'].includes(modelName)) continue;
      
      const model = models[modelName];
      const attributes = Object.keys(model.rawAttributes);
      
      if (attributes.includes('companyId')) {
        await model.update({ companyId: company.id }, { where: { companyId: null } });
        console.log(`Updated companyId for ${modelName}`);
      }
      if (attributes.includes('branchId')) {
        await model.update({ branchId: branch.id }, { where: { branchId: null } });
        console.log(`Updated branchId for ${modelName}`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
