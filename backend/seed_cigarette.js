const sequelize = require('./config/database');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const Customer = require('./models/Customer');

async function seedDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    console.log('Seeding Suppliers...');
    const suppliers = await Supplier.bulkCreate([
      { name: 'Pakistan Tobacco Company (PTC)', contactPerson: 'Asif Ali', email: 'contact@ptc.com', phone: '0300-1112233', address: 'Jhelum, Pakistan', category: 'Tobacco' },
      { name: 'Philip Morris International (PMI)', contactPerson: 'Usman Tariq', email: 'info@pmi.com.pk', phone: '0321-4445566', address: 'Karachi, Pakistan', category: 'Tobacco' },
      { name: 'Khyber Tobacco Company (KTC)', contactPerson: 'Khan Zaman', email: 'sales@khybertobacco.com', phone: '0333-7778899', address: 'Mardan, Pakistan', category: 'Tobacco' },
      { name: 'Premier Distributors', contactPerson: 'Ahmed Raza', email: 'admin@premierdist.com', phone: '0345-9990011', address: 'Lahore, Pakistan', category: 'General' }
    ]);

    console.log('Seeding Products...');
    const products = await Product.bulkCreate([
      { name: 'John Player Gold Leaf', sku: 'GL-001', price: 600, costPrice: 550, stock: 500, minStock: 50, wholesalePrice: 580, unit: 'carton', manufacturer: 'PTC' },
      { name: 'Capstan by Pall Mall', sku: 'CAP-001', price: 250, costPrice: 220, stock: 1000, minStock: 100, wholesalePrice: 235, unit: 'carton', manufacturer: 'PTC' },
      { name: 'Marlboro Red', sku: 'MBR-001', price: 750, costPrice: 690, stock: 300, minStock: 30, wholesalePrice: 720, unit: 'carton', manufacturer: 'PMI' },
      { name: 'Marlboro Gold', sku: 'MBG-001', price: 750, costPrice: 690, stock: 400, minStock: 30, wholesalePrice: 720, unit: 'carton', manufacturer: 'PMI' },
      { name: 'Dunhill Lights', sku: 'DUN-001', price: 850, costPrice: 800, stock: 200, minStock: 20, wholesalePrice: 820, unit: 'carton', manufacturer: 'PTC' },
      { name: 'Benson & Hedges', sku: 'BH-001', price: 800, costPrice: 750, stock: 150, minStock: 20, wholesalePrice: 775, unit: 'carton', manufacturer: 'PTC' },
      { name: 'Morven by Pall Mall', sku: 'MOR-001', price: 150, costPrice: 130, stock: 1500, minStock: 200, wholesalePrice: 140, unit: 'carton', manufacturer: 'PMI' },
      { name: 'Gold Flake', sku: 'GF-001', price: 120, costPrice: 105, stock: 2000, minStock: 300, wholesalePrice: 112, unit: 'carton', manufacturer: 'KTC' },
      { name: 'Red & White', sku: 'RW-001', price: 160, costPrice: 140, stock: 800, minStock: 100, wholesalePrice: 150, unit: 'carton', manufacturer: 'PMI' },
      { name: 'Diplomat', sku: 'DIP-001', price: 180, costPrice: 160, stock: 600, minStock: 50, wholesalePrice: 170, unit: 'carton', manufacturer: 'PMI' }
    ]);

    console.log('Seeding Customers...');
    const customers = await Customer.bulkCreate([
      { name: 'Al-Fatah Grocery', email: 'alfatah@example.com', phone: '0300-9998877', address: 'DHA Phase 5, Lahore', creditBalance: 50000, loyaltyPoints: 1200, tier: 'Gold' },
      { name: 'Bismillah General Store', email: 'bismillahgs@example.com', phone: '0321-6665544', address: 'Wapda Town, Lahore', creditBalance: 15000, loyaltyPoints: 300, tier: 'Silver' },
      { name: 'Madina Cash & Carry', email: 'madinacc@example.com', phone: '0333-3332211', address: 'Model Town, Lahore', creditBalance: 80000, loyaltyPoints: 2500, tier: 'VIP' },
      { name: 'Shaheen Super Store', email: 'shaheen@example.com', phone: '0345-1112233', address: 'Johar Town, Lahore', creditBalance: 5000, loyaltyPoints: 100, tier: 'Bronze' },
      { name: 'Baqir Pan Shop', email: 'baqir@example.com', phone: '0311-2223344', address: 'Liberty Market, Lahore', creditBalance: 2000, loyaltyPoints: 50, tier: 'Bronze' }
    ]);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedDatabase();
