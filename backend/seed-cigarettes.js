require('dotenv').config();
const { Product, Category, sequelize } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB...');

    // Try to find an existing company ID from a category
    const anyCat = await Category.findOne();
    const companyId = anyCat ? anyCat.companyId : null;

    // Create a Cigarettes category if it doesn't exist
    let cat = await Category.findOne({ where: { name: 'Cigarettes' } });
    if (!cat) {
      cat = await Category.create({
        name: 'Cigarettes',
        description: 'Tobacco and Cigarettes',
        companyId: companyId
      });
      console.log('Created Category: Cigarettes');
    }

    const cigarettes = [
      { name: 'Marlboro Gold', sku: 'CIG-MAR-GLD', price: 650, costPrice: 580, stock: 150, minStock: 30, unit: 'pack' },
      { name: 'Marlboro Red', sku: 'CIG-MAR-RED', price: 650, costPrice: 580, stock: 120, minStock: 30, unit: 'pack' },
      { name: 'Dunhill Switch', sku: 'CIG-DUN-SWI', price: 600, costPrice: 530, stock: 200, minStock: 50, unit: 'pack' },
      { name: 'Dunhill Lights', sku: 'CIG-DUN-LGT', price: 580, costPrice: 520, stock: 80, minStock: 20, unit: 'pack' },
      { name: 'Gold Leaf', sku: 'CIG-GLD-LEF', price: 550, costPrice: 500, stock: 300, minStock: 100, unit: 'pack' },
      { name: 'Capstan by Pall Mall', sku: 'CIG-CAP-PML', price: 250, costPrice: 220, stock: 400, minStock: 150, unit: 'pack' },
      { name: 'Benson & Hedges', sku: 'CIG-BEN-HDG', price: 620, costPrice: 560, stock: 100, minStock: 25, unit: 'pack' },
      { name: 'Morven Gold', sku: 'CIG-MOR-GLD', price: 200, costPrice: 170, stock: 500, minStock: 200, unit: 'pack' },
      { name: 'Pine', sku: 'CIG-PINE-STD', price: 180, costPrice: 150, stock: 200, minStock: 50, unit: 'pack' }
    ];

    for (let c of cigarettes) {
      const exists = await Product.findOne({ where: { sku: c.sku } });
      if (!exists) {
        await Product.create({
          ...c,
          categoryId: cat.id,
          companyId: companyId
        });
        console.log('Added product:', c.name);
      } else {
        console.log('Skipped existing product:', c.name);
      }
    }

    console.log('? Cigarettes seed complete!');
  } catch (err) {
    console.error('? Failed:', err);
  } finally {
    await sequelize.close();
  }
}

seed();
