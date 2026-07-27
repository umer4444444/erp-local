/**
 * Seed Script: Cigarette Distribution Products & Suppliers
 * 
 * Run with: node seeds/cigaretteProducts.js
 * 
 * This script creates:
 * - Suppliers (JTI, Imperial, Davidoff, Parliament, L&M, Chesterfield, Terea, BAT)
 * - Categories (by brand family)
 * - Products (all SKUs with pricing tiers: per case, per outer, per pack)
 */

const sequelize = require('../config/database');
const { Product, Category, Supplier } = require('../models');

// We need a companyId. Pass it as an env var or use the first company in DB.
const COMPANY_ID = process.env.COMPANY_ID || null;

async function seed() {
  await sequelize.authenticate();
  console.log('✅ Database connected.');

  // If no COMPANY_ID provided, try to find the first one
  let companyId = COMPANY_ID;
  if (!companyId) {
    const { Company } = require('../models');
    const co = await Company.findOne();
    if (co) {
      companyId = co.id;
      console.log(`Using company: ${co.name} (${co.id})`);
    } else {
      console.error('❌ No company found. Create a company first or set COMPANY_ID env var.');
      process.exit(1);
    }
  }

  // ─── SUPPLIERS ───
  const suppliers = [
    { name: 'JTI (Japan Tobacco International)', contactPerson: 'JTI Sales', phone: '+966500000001', category: 'Cigarettes', companyId },
    { name: 'Imperial Brands', contactPerson: 'Imperial Sales', phone: '+966500000002', category: 'Cigarettes', companyId },
    { name: 'Philip Morris International', contactPerson: 'PMI Sales', phone: '+966500000003', category: 'Cigarettes', companyId },
    { name: 'British American Tobacco (BAT)', contactPerson: 'BAT Sales', phone: '+966500000004', category: 'Cigarettes', companyId },
  ];

  for (const s of suppliers) {
    await Supplier.findOrCreate({ where: { name: s.name, companyId }, defaults: s });
  }
  console.log(`✅ ${suppliers.length} suppliers seeded.`);

  // ─── CATEGORIES ───
  const categories = [
    'Winston', 'Monte Carlo', 'Gold Coast', 'Imperial West', 'Imperial West Extra',
    'Davidoff', 'Parliament', 'L&M', 'L&M Selection', 'Marlboro',
    'Chesterfield', 'Terea', 'Dunhill', 'Kent', 'Vogue',
    'Benson & Hedges', 'Rothmans', 'John Player Gold Leaf', 'Pall Mall International'
  ];

  const catMap = {};
  for (const catName of categories) {
    const [cat] = await Category.findOrCreate({
      where: { name: catName, companyId },
      defaults: { name: catName, companyId, description: `${catName} cigarette brand` }
    });
    catMap[catName] = cat.id;
  }
  console.log(`✅ ${categories.length} categories seeded.`);

  // ─── PRODUCTS ───
  // Each product stores:
  //   price = SAR per pack (retail)
  //   costPrice = price per case / packs per case (wholesale cost)
  //   wholesalePrice = price per outer
  //   metadata = { pricePerCase, vatCase, totalCase, pricePerOuter, vatOuter, totalOuter, sarPerPack, packsPerOuter, outersPerCase, nameAr }

  const products = [
    // ═══════════════════════════════════════
    // TABLE 1: JTI BRANDS
    // ═══════════════════════════════════════
    // Winston
    { name: 'Winston Red', sku: 'CIG-WIN-RED', manufacturer: 'JTI', category: 'Winston', price: 9.70, costPrice: 8434.75/1000, wholesalePrice: 168.70, metadata: { pricePerCase: 8434.75, vatCase: 1265.21, totalCase: 9699.96, pricePerOuter: 168.70, vatOuter: 25.30, totalOuter: 194.00, sarPerPack: 9.70, outersPerCase: 50, packsPerOuter: 20, nameAr: 'وينستون أحمر' }},
    { name: 'Winston Blue', sku: 'CIG-WIN-BLU', manufacturer: 'JTI', category: 'Winston', price: 9.70, costPrice: 8434.75/1000, wholesalePrice: 168.70, metadata: { pricePerCase: 8434.75, vatCase: 1265.21, totalCase: 9699.96, pricePerOuter: 168.70, vatOuter: 25.30, totalOuter: 194.00, sarPerPack: 9.70, outersPerCase: 50, packsPerOuter: 20, nameAr: 'وينستون بلو' }},
    { name: 'Winston Silver', sku: 'CIG-WIN-SIL', manufacturer: 'JTI', category: 'Winston', price: 9.70, costPrice: 8434.75/1000, wholesalePrice: 168.70, metadata: { pricePerCase: 8434.75, vatCase: 1265.21, totalCase: 9699.96, pricePerOuter: 168.70, vatOuter: 25.30, totalOuter: 194.00, sarPerPack: 9.70, outersPerCase: 50, packsPerOuter: 20, nameAr: 'وينستون سيلفر' }},
    { name: 'Winston White', sku: 'CIG-WIN-WHT', manufacturer: 'JTI', category: 'Winston', price: 9.70, costPrice: 8434.75/1000, wholesalePrice: 168.70, metadata: { pricePerCase: 8434.75, vatCase: 1265.21, totalCase: 9699.96, pricePerOuter: 168.70, vatOuter: 25.30, totalOuter: 194.00, sarPerPack: 9.70, outersPerCase: 50, packsPerOuter: 20, nameAr: 'وينستون وايت' }},
    { name: 'Winston Duo Mix', sku: 'CIG-WIN-DUO', manufacturer: 'JTI', category: 'Winston', price: 0, costPrice: 0, wholesalePrice: 0, metadata: { pricePerCase: 0, vatCase: 0, totalCase: 0, pricePerOuter: 0, vatOuter: 0, totalOuter: 0, sarPerPack: 0, nameAr: 'وينستون ديو ميكس' }},
    { name: 'Winston Blue 100', sku: 'CIG-WIN-BLU100', manufacturer: 'JTI', category: 'Winston', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'وينستون بلو' }},
    { name: 'Winston Silver 100', sku: 'CIG-WIN-SIL100', manufacturer: 'JTI', category: 'Winston', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'وينستون سيلفر' }},
    { name: 'Winston Blue 100 (8043)', sku: 'CIG-WIN-BLU100B', manufacturer: 'JTI', category: 'Winston', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'وينستون بلو' }},

    // Monte Carlo
    { name: 'Monte Carlo Red', sku: 'CIG-MC-RED', manufacturer: 'JTI', category: 'Monte Carlo', price: 9.00, costPrice: 7608.50/1000, wholesalePrice: 152.18, metadata: { pricePerCase: 7608.50, vatCase: 1141.31, totalCase: 8750.06, pricePerOuter: 152.18, vatOuter: 22.83, totalOuter: 175.00, sarPerPack: 9.00, outersPerCase: 50, packsPerOuter: 18, nameAr: 'اسمر مونت كارلو' }},

    // Gold Coast
    { name: 'Gold Coast Red', sku: 'CIG-GC-RED', manufacturer: 'JTI', category: 'Gold Coast', price: 8.50, costPrice: 7235.00/1000, wholesalePrice: 144.78, metadata: { pricePerCase: 7235.00, vatCase: 1085.85, totalCase: 8324.85, pricePerOuter: 144.78, vatOuter: 21.72, totalOuter: 166.50, sarPerPack: 8.50, outersPerCase: 50, packsPerOuter: 17, nameAr: 'جولد كوست ريد' }},

    // Imperial West
    { name: 'Imperial West Red', sku: 'CIG-IW-RED', manufacturer: 'Imperial', category: 'Imperial West', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'امبريال ويست ريد' }},
    { name: 'Imperial West Blue', sku: 'CIG-IW-BLU', manufacturer: 'Imperial', category: 'Imperial West', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'امبريال ويست بلو' }},
    { name: 'Imperial West Silver', sku: 'CIG-IW-SIL', manufacturer: 'Imperial', category: 'Imperial West', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'امبريال ويست سيلفر' }},
    { name: 'Imperial West White', sku: 'CIG-IW-WHT', manufacturer: 'Imperial', category: 'Imperial West', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'امبريال ويست وايت' }},

    // Imperial West Extra
    { name: 'Imperial West Extra Red', sku: 'CIG-IWE-RED', manufacturer: 'Imperial', category: 'Imperial West Extra', price: 9.00, costPrice: 7608.50/1000, wholesalePrice: 152.17, metadata: { pricePerCase: 7608.50, vatCase: 1141.28, totalCase: 8749.78, pricePerOuter: 152.17, vatOuter: 22.83, totalOuter: 175.00, sarPerPack: 9.00, outersPerCase: 50, packsPerOuter: 18, nameAr: 'امبريال ويست إكسترا ريد' }},
    { name: 'Imperial West Extra Blue', sku: 'CIG-IWE-BLU', manufacturer: 'Imperial', category: 'Imperial West Extra', price: 9.00, costPrice: 7608.50/1000, wholesalePrice: 152.17, metadata: { pricePerCase: 7608.50, vatCase: 1141.28, totalCase: 8749.78, pricePerOuter: 152.17, vatOuter: 22.83, totalOuter: 175.00, sarPerPack: 9.00, outersPerCase: 50, packsPerOuter: 18, nameAr: 'امبريال ويست إكسترا بلو' }},
    { name: 'Imperial West Extra Silver', sku: 'CIG-IWE-SIL', manufacturer: 'Imperial', category: 'Imperial West Extra', price: 9.00, costPrice: 7608.50/1000, wholesalePrice: 152.17, metadata: { pricePerCase: 7608.50, vatCase: 1141.28, totalCase: 8749.78, pricePerOuter: 152.17, vatOuter: 22.83, totalOuter: 175.00, sarPerPack: 9.00, outersPerCase: 50, packsPerOuter: 18, nameAr: 'امبريال ويست إكسترا سيلفر' }},

    // Davidoff
    { name: 'Davidoff Evolve Red', sku: 'CIG-DVF-ERED', manufacturer: 'Imperial', category: 'Davidoff', price: 9.65, costPrice: 8391.50/1000, wholesalePrice: 167.83, metadata: { pricePerCase: 8391.50, vatCase: 1258.73, totalCase: 9650.23, pricePerOuter: 167.83, vatOuter: 25.17, totalOuter: 193.00, sarPerPack: 9.65, outersPerCase: 50, packsPerOuter: 20, nameAr: 'دافيدوف ايفولف الأحمر' }},
    { name: 'Davidoff Evolve Blue', sku: 'CIG-DVF-EBLU', manufacturer: 'Imperial', category: 'Davidoff', price: 9.65, costPrice: 8391.50/1000, wholesalePrice: 167.83, metadata: { pricePerCase: 8391.50, vatCase: 1258.73, totalCase: 9650.23, pricePerOuter: 167.83, vatOuter: 25.17, totalOuter: 193.00, sarPerPack: 9.65, outersPerCase: 50, packsPerOuter: 20, nameAr: 'دافيدوف ايفولف بلو' }},

    // ═══════════════════════════════════════
    // TABLE 2: PMI BRANDS
    // ═══════════════════════════════════════
    // Parliament
    { name: 'Parliament Aqua Blue', sku: 'CIG-PARL-AQUA', manufacturer: 'PMI', category: 'Parliament', price: 9.70, costPrice: 8434.75/1000, wholesalePrice: 168.70, metadata: { pricePerCase: 8434.75, vatCase: 1265.21, totalCase: 9699.96, pricePerOuter: 168.70, vatOuter: 25.30, totalOuter: 194.00, sarPerPack: 9.70, outersPerCase: 50, packsPerOuter: 20, nameAr: 'بارليمنت أكوا بلو' }},
    { name: 'Parliament Silver Blue', sku: 'CIG-PARL-SILBLU', manufacturer: 'PMI', category: 'Parliament', price: 9.70, costPrice: 8434.75/1000, wholesalePrice: 168.70, metadata: { pricePerCase: 8434.75, vatCase: 1265.21, totalCase: 9699.96, pricePerOuter: 168.70, vatOuter: 25.30, totalOuter: 194.00, sarPerPack: 9.70, outersPerCase: 50, packsPerOuter: 20, nameAr: 'بارليمنت سيلفر بلو' }},
    { name: 'Parliament Platinum Blue', sku: 'CIG-PARL-PLATBLU', manufacturer: 'PMI', category: 'Parliament', price: 9.70, costPrice: 8434.75/1000, wholesalePrice: 168.70, metadata: { pricePerCase: 8434.75, vatCase: 1265.21, totalCase: 9699.96, pricePerOuter: 168.70, vatOuter: 25.30, totalOuter: 194.00, sarPerPack: 9.70, outersPerCase: 50, packsPerOuter: 20, nameAr: 'بارليمنت بلاتينيوم بلو' }},

    // L&M Selection
    { name: 'L&M Selection Red', sku: 'CIG-LM-SELRED', manufacturer: 'PMI', category: 'L&M Selection', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'ال اند ام سيلكشن ريد' }},
    { name: 'L&M Selection Blue', sku: 'CIG-LM-SELBLU', manufacturer: 'PMI', category: 'L&M Selection', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'ال اند ام سيلكشن بلو' }},
    { name: 'L&M Selection Silver', sku: 'CIG-LM-SELSIL', manufacturer: 'PMI', category: 'L&M Selection', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'ال اند ام سيلكشن سيلفر' }},

    // Marlboro
    { name: 'Marlboro Red FTB', sku: 'CIG-MRL-REDFTB', manufacturer: 'PMI', category: 'Marlboro', price: 9.72, costPrice: 10565.00/1000, wholesalePrice: 211.30, metadata: { pricePerCase: 10565.00, vatCase: 1584.75, totalCase: 12149.75, pricePerOuter: 211.30, vatOuter: 31.70, totalOuter: 243.00, sarPerPack: 9.72, outersPerCase: 50, packsPerOuter: 25, nameAr: 'مارلبورو ريد' }},
    { name: 'Marlboro Gold FTB', sku: 'CIG-MRL-GLDFTB', manufacturer: 'PMI', category: 'Marlboro', price: 9.72, costPrice: 10565.00/1000, wholesalePrice: 211.30, metadata: { pricePerCase: 10565.00, vatCase: 1584.75, totalCase: 12149.75, pricePerOuter: 211.30, vatOuter: 31.70, totalOuter: 243.00, sarPerPack: 9.72, outersPerCase: 50, packsPerOuter: 25, nameAr: 'مارلبورو جولد' }},
    { name: 'Marlboro Silver', sku: 'CIG-MRL-SIL', manufacturer: 'PMI', category: 'Marlboro', price: 9.72, costPrice: 10565.00/1000, wholesalePrice: 211.30, metadata: { pricePerCase: 10565.00, vatCase: 1584.75, totalCase: 12149.75, pricePerOuter: 211.30, vatOuter: 31.70, totalOuter: 243.00, sarPerPack: 9.72, outersPerCase: 50, packsPerOuter: 25, nameAr: 'مارلبورو سيلفر' }},
    { name: 'Marlboro White', sku: 'CIG-MRL-WHT', manufacturer: 'PMI', category: 'Marlboro', price: 9.72, costPrice: 10565.00/1000, wholesalePrice: 211.30, metadata: { pricePerCase: 10565.00, vatCase: 1584.75, totalCase: 12149.75, pricePerOuter: 211.30, vatOuter: 31.70, totalOuter: 243.00, sarPerPack: 9.72, outersPerCase: 50, packsPerOuter: 25, nameAr: 'مارلبورو وايت' }},

    // L&M (regular)
    { name: 'L&M Red 20', sku: 'CIG-LM-RED20', manufacturer: 'PMI', category: 'L&M', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'ال اند ام احمر' }},
    { name: 'L&M Blue 20', sku: 'CIG-LM-BLU20', manufacturer: 'PMI', category: 'L&M', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'ال اند ام بلو 20' }},
    { name: 'L&M Silver 20', sku: 'CIG-LM-SIL20', manufacturer: 'PMI', category: 'L&M', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'ال اند ام سيلفر 20' }},
    { name: 'L&M White 20', sku: 'CIG-LM-WHT20', manufacturer: 'PMI', category: 'L&M', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'ال اند ام وايت 20' }},
    { name: 'L&M Double Forward', sku: 'CIG-LM-DBLFWD', manufacturer: 'PMI', category: 'L&M', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'ال اند ام دبل فوروورد' }},

    // Chesterfield
    { name: 'Chesterfield Red 20', sku: 'CIG-CHF-RED20', manufacturer: 'PMI', category: 'Chesterfield', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'تشيسترفيلد ريد 20' }},
    { name: 'Chesterfield Blue 20', sku: 'CIG-CHF-BLU20', manufacturer: 'PMI', category: 'Chesterfield', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'تشيسترفيلد بلو' }},
    { name: 'Chesterfield Silver 20', sku: 'CIG-CHF-SIL20', manufacturer: 'PMI', category: 'Chesterfield', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'تشيسترفيلد سيلفر' }},
    { name: 'Chesterfield White 20 1mg', sku: 'CIG-CHF-WHT20', manufacturer: 'PMI', category: 'Chesterfield', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'تشيسترفيلد وايت 20' }},

    // Terea (IQOS)
    { name: 'Terea Turquoise', sku: 'CIG-TEREA-TURQ', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا تركواز' }},
    { name: 'Terea Silver', sku: 'CIG-TEREA-SIL', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا سيلفر' }},
    { name: 'Terea Teak', sku: 'CIG-TEREA-TEAK', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا تيك' }},
    { name: 'Terea Arbor Pearl', sku: 'CIG-TEREA-ARBOR', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا آربور بيرل' }},
    { name: 'Terea Russet', sku: 'CIG-TEREA-RUSS', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا راسيت' }},
    { name: 'Terea Sun Pearl', sku: 'CIG-TEREA-SUN', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا صن بيرل' }},
    { name: 'Terea Sienna', sku: 'CIG-TEREA-SIENNA', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا سيينا' }},
    { name: 'Terea Amber', sku: 'CIG-TEREA-AMBER', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا أمبر' }},
    { name: 'Terea Purple Wave', sku: 'CIG-TEREA-PURP', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا بيربل ويف' }},
    { name: 'Terea Gold', sku: 'CIG-TEREA-GOLD', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا جولد' }},
    { name: 'Terea Oasis Pearl', sku: 'CIG-TEREA-OASIS', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا أويسس بيرل' }},
    { name: 'Twilight Pearl', sku: 'CIG-TEREA-TWIL', manufacturer: 'PMI', category: 'Terea', price: 9.64, costPrice: 9304.50/1000, wholesalePrice: 186.09, metadata: { pricePerCase: 9304.50, vatCase: 1395.68, totalCase: 10700.18, pricePerOuter: 186.09, vatOuter: 27.91, totalOuter: 214.00, sarPerPack: 9.64, outersPerCase: 50, packsPerOuter: 22, nameAr: 'تيريا تويلايت بيرل' }},

    // ═══════════════════════════════════════
    // TABLE 3: BAT BRANDS
    // ═══════════════════════════════════════
    // Dunhill
    { name: 'Dunhill Evoke Gold', sku: 'CIG-DUN-EVGLD', manufacturer: 'BAT', category: 'Dunhill', price: 9.73, costPrice: 12695.50/1000, wholesalePrice: 253.91, metadata: { pricePerCase: 12695.50, vatCase: 1904.33, totalCase: 14599.83, pricePerOuter: 253.91, vatOuter: 38.09, totalOuter: 292.00, sarPerPack: 9.73, outersPerCase: 50, packsPerOuter: 30, nameAr: 'دنهيل إيفوك جولد' }},
    { name: 'Dunhill Evoke White', sku: 'CIG-DUN-EVWHT', manufacturer: 'BAT', category: 'Dunhill', price: 9.73, costPrice: 12695.50/1000, wholesalePrice: 253.91, metadata: { pricePerCase: 12695.50, vatCase: 1904.33, totalCase: 14599.83, pricePerOuter: 253.91, vatOuter: 38.09, totalOuter: 292.00, sarPerPack: 9.73, outersPerCase: 50, packsPerOuter: 30, nameAr: 'دنهيل إيفوك وايت' }},
    { name: 'Dunhill Red', sku: 'CIG-DUN-RED', manufacturer: 'BAT', category: 'Dunhill', price: 9.75, costPrice: 8478.25/1000, wholesalePrice: 169.57, metadata: { pricePerCase: 8478.25, vatCase: 1271.74, totalCase: 9749.99, pricePerOuter: 169.57, vatOuter: 25.43, totalOuter: 195.00, sarPerPack: 9.75, outersPerCase: 50, packsPerOuter: 20, nameAr: 'دنهيل ريد' }},
    { name: 'Dunhill Blue', sku: 'CIG-DUN-BLU', manufacturer: 'BAT', category: 'Dunhill', price: 9.75, costPrice: 8478.25/1000, wholesalePrice: 169.57, metadata: { pricePerCase: 8478.25, vatCase: 1271.74, totalCase: 9749.99, pricePerOuter: 169.57, vatOuter: 25.43, totalOuter: 195.00, sarPerPack: 9.75, outersPerCase: 50, packsPerOuter: 20, nameAr: 'دنهيل بلو' }},
    { name: 'Dunhill Silver', sku: 'CIG-DUN-SIL', manufacturer: 'BAT', category: 'Dunhill', price: 9.75, costPrice: 8478.25/1000, wholesalePrice: 169.57, metadata: { pricePerCase: 8478.25, vatCase: 1271.74, totalCase: 9749.99, pricePerOuter: 169.57, vatOuter: 25.43, totalOuter: 195.00, sarPerPack: 9.75, outersPerCase: 50, packsPerOuter: 20, nameAr: 'دنهيل سيلفر' }},
    { name: 'Dunhill White', sku: 'CIG-DUN-WHT', manufacturer: 'BAT', category: 'Dunhill', price: 9.75, costPrice: 8478.25/1000, wholesalePrice: 169.57, metadata: { pricePerCase: 8478.25, vatCase: 1271.74, totalCase: 9749.99, pricePerOuter: 169.57, vatOuter: 25.43, totalOuter: 195.00, sarPerPack: 9.75, outersPerCase: 50, packsPerOuter: 20, nameAr: 'دنهيل وايت' }},
    { name: 'Dunhill Carlton', sku: 'CIG-DUN-CARL', manufacturer: 'BAT', category: 'Dunhill', price: 9.75, costPrice: 8478.25/1000, wholesalePrice: 169.57, metadata: { pricePerCase: 8478.25, vatCase: 1271.74, totalCase: 9749.99, pricePerOuter: 169.57, vatOuter: 25.43, totalOuter: 195.00, sarPerPack: 9.75, outersPerCase: 50, packsPerOuter: 20, nameAr: 'دنهيل كارلتون' }},
    { name: 'Dunhill Switch', sku: 'CIG-DUN-SWITCH', manufacturer: 'BAT', category: 'Dunhill', price: 9.73, costPrice: 12695.50/1000, wholesalePrice: 253.91, metadata: { pricePerCase: 12695.50, vatCase: 1904.33, totalCase: 14599.83, pricePerOuter: 253.91, vatOuter: 38.09, totalOuter: 292.00, sarPerPack: 9.73, outersPerCase: 50, packsPerOuter: 30, nameAr: 'دنهيل سويتش' }},

    // Kent
    { name: 'Kent Blue', sku: 'CIG-KENT-BLU', manufacturer: 'BAT', category: 'Kent', price: 9.71, costPrice: 8869.50/1000, wholesalePrice: 177.39, metadata: { pricePerCase: 8869.50, vatCase: 1330.43, totalCase: 10199.93, pricePerOuter: 177.39, vatOuter: 26.61, totalOuter: 204.00, sarPerPack: 9.71, outersPerCase: 50, packsPerOuter: 21, nameAr: 'كينت بلو' }},
    { name: 'Kent Silver', sku: 'CIG-KENT-SIL', manufacturer: 'BAT', category: 'Kent', price: 9.71, costPrice: 8869.50/1000, wholesalePrice: 177.39, metadata: { pricePerCase: 8869.50, vatCase: 1330.43, totalCase: 10199.93, pricePerOuter: 177.39, vatOuter: 26.61, totalOuter: 204.00, sarPerPack: 9.71, outersPerCase: 50, packsPerOuter: 21, nameAr: 'كينت سيلفر' }},
    { name: 'Kent White', sku: 'CIG-KENT-WHT', manufacturer: 'BAT', category: 'Kent', price: 9.71, costPrice: 8869.50/1000, wholesalePrice: 177.39, metadata: { pricePerCase: 8869.50, vatCase: 1330.43, totalCase: 10199.93, pricePerOuter: 177.39, vatOuter: 26.61, totalOuter: 204.00, sarPerPack: 9.71, outersPerCase: 50, packsPerOuter: 21, nameAr: 'كينت وايت' }},

    // Vogue
    { name: 'Vogue Lilas', sku: 'CIG-VOGUE-LILAS', manufacturer: 'BAT', category: 'Vogue', price: 9.73, costPrice: 12695.50/1000, wholesalePrice: 253.91, metadata: { pricePerCase: 12695.50, vatCase: 1904.33, totalCase: 14599.83, pricePerOuter: 253.91, vatOuter: 38.09, totalOuter: 292.00, sarPerPack: 9.73, outersPerCase: 50, packsPerOuter: 30, nameAr: 'فوج ليلاس' }},
    { name: 'Vogue Menthol', sku: 'CIG-VOGUE-MENTH', manufacturer: 'BAT', category: 'Vogue', price: 9.73, costPrice: 12695.50/1000, wholesalePrice: 253.91, metadata: { pricePerCase: 12695.50, vatCase: 1904.33, totalCase: 14599.83, pricePerOuter: 253.91, vatOuter: 38.09, totalOuter: 292.00, sarPerPack: 9.73, outersPerCase: 50, packsPerOuter: 30, nameAr: 'فوج مينثول' }},

    // Benson & Hedges
    { name: 'Benson & Hedges Gold', sku: 'CIG-BH-GOLD', manufacturer: 'BAT', category: 'Benson & Hedges', price: 7.00, costPrice: 7608.50/1000, wholesalePrice: 152.17, metadata: { pricePerCase: 7608.50, vatCase: 1141.28, totalCase: 8749.78, pricePerOuter: 152.17, vatOuter: 22.83, totalOuter: 175.00, sarPerPack: 7.00, outersPerCase: 50, packsPerOuter: 25, nameAr: 'بينسون اند هيدجز جولد' }},

    // Rothmans
    { name: 'Rothmans Blue', sku: 'CIG-ROTH-BLU', manufacturer: 'BAT', category: 'Rothmans', price: 9.71, costPrice: 8869.50/1000, wholesalePrice: 177.39, metadata: { pricePerCase: 8869.50, vatCase: 1330.43, totalCase: 10199.93, pricePerOuter: 177.39, vatOuter: 26.61, totalOuter: 204.00, sarPerPack: 9.71, outersPerCase: 50, packsPerOuter: 21, nameAr: 'روثمانز بلو' }},

    // John Player Gold Leaf
    { name: 'John Player Gold Leaf Red', sku: 'CIG-JPGL-RED', manufacturer: 'BAT', category: 'John Player Gold Leaf', price: 9.00, costPrice: 7652.25/1000, wholesalePrice: 153.05, metadata: { pricePerCase: 7652.25, vatCase: 1147.84, totalCase: 8800.09, pricePerOuter: 153.05, vatOuter: 22.96, totalOuter: 176.00, sarPerPack: 9.00, outersPerCase: 50, packsPerOuter: 18, nameAr: 'جون بلاير جولد ليف ريد' }},
    { name: 'John Player Gold Leaf Navy Blue', sku: 'CIG-JPGL-NAVY', manufacturer: 'BAT', category: 'John Player Gold Leaf', price: 9.86, costPrice: 7261.00/1000, wholesalePrice: 145.22, metadata: { pricePerCase: 7261.00, vatCase: 1089.15, totalCase: 8350.15, pricePerOuter: 145.22, vatOuter: 21.78, totalOuter: 167.00, sarPerPack: 9.86, outersPerCase: 50, packsPerOuter: 17, nameAr: 'جون بلاير جولد ليف نيفي بلو' }},

    // Pall Mall International
    { name: 'Pall Mall International Blue', sku: 'CIG-PM-INTBLU', manufacturer: 'BAT', category: 'Pall Mall International', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'بول مول انترناشيونال بلو' }},
    { name: 'Pall Mall International Silver', sku: 'CIG-PM-INTSIL', manufacturer: 'BAT', category: 'Pall Mall International', price: 9.50, costPrice: 8043.50/1000, wholesalePrice: 160.87, metadata: { pricePerCase: 8043.50, vatCase: 1206.53, totalCase: 9250.03, pricePerOuter: 160.87, vatOuter: 24.13, totalOuter: 185.00, sarPerPack: 9.50, outersPerCase: 50, packsPerOuter: 19, nameAr: 'بول مول انترناشيونال سيلفر' }},
  ];

  let created = 0;
  let skipped = 0;
  for (const p of products) {
    const catId = catMap[p.category];
    try {
      const [product, wasCreated] = await Product.findOrCreate({
        where: { sku: p.sku, companyId },
        defaults: {
          name: p.name,
          sku: p.sku,
          price: p.price,
          costPrice: p.costPrice,
          wholesalePrice: p.wholesalePrice,
          manufacturer: p.manufacturer,
          categoryId: catId,
          unit: 'carton',
          stock: 0,
          minStock: 10,
          companyId,
          metadata: p.metadata
        }
      });
      if (wasCreated) created++;
      else skipped++;
    } catch (err) {
      console.error(`❌ Failed to create ${p.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped (already exist): ${skipped}`);
  console.log(`   Total products in script: ${products.length}`);
  
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
