const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://erp.lancerstech.com';
const VIDEOS_DIR = 'C:/Users/usman/.gemini/antigravity/brain/86b4355a-ad40-4674-b719-d90de0927607/functional_videos';
const STATE_FILE = path.join(__dirname, 'state.json');

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

// Safe click: uses JS evaluate to bypass pointer-event interception
async function safeClick(page, selector) {
  try {
    const el = await page.$(selector);
    if (el) { await el.evaluate(node => node.click()); return true; }
  } catch {}
  return false;
}

// Click first matching selector from a list, safely
async function safeClickAny(page, selectors) {
  for (const sel of selectors) {
    if (await safeClick(page, sel)) return true;
  }
  return false;
}

// Scroll the page's overflow container
async function scrollDown(page, px = 400) {
  await page.evaluate((amount) => {
    const el = document.querySelector('.overflow-y-auto') || document.documentElement;
    el.scrollTop += amount;
  }, px);
}
async function scrollTop(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto') || document.documentElement;
    el.scrollTop = 0;
  });
}

async function launchBrowser() {
  return chromium.launch({ headless: true, args: ['--window-size=1440,900', '--no-sandbox'] });
}

async function newContext(browser) {
  return browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1440, height: 900 } }
  });
}

async function saveAndClose(page, context, browser, name) {
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  if (videoPath && fs.existsSync(videoPath)) {
    const dest = path.join(VIDEOS_DIR, `${name}.webm`);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(videoPath, dest);
    console.log(`✅ Saved: ${name}.webm`);
  }
}

// ─────────────────────────────────────────────
// 00. LOGIN
// ─────────────────────────────────────────────
async function record_login() {
  console.log('\n🎬 Recording: 00_login');
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1440, height: 900 } }
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await delay(1500);

  // Show the landing panel, hover over portals
  await page.mouse.move(300, 400); await delay(600);
  await page.mouse.move(300, 460); await delay(600);
  await page.mouse.move(300, 520); await delay(600);

  // Fill login form
  await page.fill('input[type="email"]', ''); 
  await page.type('input[type="email"]', 'admin@erp.com', { delay: 60 });
  await delay(500);
  await page.fill('input[type="password"]', '');
  await page.type('input[type="password"]', 'admin123', { delay: 60 });
  await delay(800);

  // Click eye icon to show password briefly
  const eyeBtn = await page.$('button[type="button"]');
  if (eyeBtn) { await eyeBtn.click(); await delay(700); await eyeBtn.click(); await delay(300); }

  await page.click('button[type="submit"]');
  await delay(3000);
  console.log(`  URL after login: ${page.url()}`);
  await context.storageState({ path: STATE_FILE });
  await delay(1500);

  const videoPath = await page.video().path();
  await context.close(); await browser.close();
  if (videoPath && fs.existsSync(videoPath)) {
    const dest = path.join(VIDEOS_DIR, '00_login.webm');
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(videoPath, dest);
    console.log('✅ Saved: 00_login.webm');
  }
}

// ─────────────────────────────────────────────
// 01. DASHBOARD
// ─────────────────────────────────────────────
async function record_dashboard() {
  console.log('\n🎬 Recording: 01_dashboard');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Hover over stat cards
  const cards = await page.$$('[style*="border-radius"]');
  for (let i = 0; i < Math.min(6, cards.length); i++) {
    try { await cards[i].hover({ timeout: 500 }); await delay(400); } catch {}
  }

  // Scroll down slowly
  const container = await page.$('.overflow-y-auto') || page;
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto') || document.documentElement;
    el.scrollTop += 400;
  });
  await delay(1500);
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto') || document.documentElement;
    el.scrollTop += 400;
  });
  await delay(1500);
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto') || document.documentElement;
    el.scrollTop = 0;
  });
  await delay(1000);
  await saveAndClose(page, context, browser, '01_dashboard');
}

// ─────────────────────────────────────────────
// 02. INVENTORY — Search + Modals + Bulk
// ─────────────────────────────────────────────
async function record_inventory() {
  console.log('\n🎬 Recording: 02_inventory');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Search
  try {
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.evaluate(el => { el.focus(); el.value = 'phar'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(1200);
      await searchInput.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(500);
    }
  } catch {}

  // Click "Movement Logs"
  if (await safeClick(page, 'button:has-text("Movement Logs")')) { await delay(2000); await page.keyboard.press('Escape'); await delay(700); }

  // Click "AI Restock Suggestions"
  if (await safeClick(page, 'button:has-text("AI Restock")')) { await delay(2000); await page.keyboard.press('Escape'); await delay(700); }

  // Click "Expiring Auto-Discounts"
  if (await safeClick(page, 'button:has-text("Expiring")')) { await delay(1800); await page.keyboard.press('Escape'); await delay(700); }

  // Click "Bulk Entry" and fill a row
  if (await safeClick(page, 'button:has-text("Bulk Entry")')) {
    await delay(1500);
    try {
      const nameInput = await page.$('input[placeholder="Product..."]');
      if (nameInput) {
        await nameInput.evaluate(el => { el.focus(); el.value = 'Demo Product'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await delay(800);
      }
    } catch {}
    await page.keyboard.press('Escape');
    await delay(700);
  }

  await scrollDown(page, 400);
  await delay(1000);
  await scrollTop(page);
  await delay(500);
  await saveAndClose(page, context, browser, '02_inventory');
}

// ─────────────────────────────────────────────
// 03. SALES — Add products to cart + checkout flow
// ─────────────────────────────────────────────
async function record_sales() {
  console.log('\n🎬 Recording: 03_sales');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/sales`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Search a product
  try {
    const searchBox = await page.$('input[placeholder*="Search products"]');
    if (searchBox) {
      await searchBox.evaluate(el => { el.focus(); el.value = 'med'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(1000);
      await searchBox.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(500);
    }
  } catch {}

  // Click first 3 product cards using JS evaluate
  const clicked = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('div')].filter(el => {
      const style = el.getAttribute('style') || '';
      const text = el.textContent || '';
      return style.includes('cursor: pointer') && style.includes('border-radius: 20px') && text.includes('in stock') && !text.includes('Out of stock');
    });
    let count = 0;
    for (const card of cards) {
      if (count >= 3) break;
      card.click(); count++;
    }
    return count;
  });
  await delay(1500);

  // Type customer search
  try {
    const custSearch = await page.$('input[placeholder*="Search customer"]');
    if (custSearch) {
      await custSearch.evaluate(el => { el.focus(); el.value = 'ali'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(1500);
      await custSearch.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(400);
    }
  } catch {}

  // Switch payment methods
  await safeClick(page, 'button:has-text("card")'); await delay(700);
  await safeClick(page, 'button:has-text("split")'); await delay(700);
  await safeClick(page, 'button:has-text("cash")'); await delay(700);

  // Enter cash tendered
  try {
    const cashInput = await page.$('input[placeholder="0.00"]');
    if (cashInput) {
      await cashInput.evaluate(el => { el.focus(); el.value = '500'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(800);
    }
  } catch {}

  await delay(1500);
  await saveAndClose(page, context, browser, '03_sales');
}

// ─────────────────────────────────────────────
// 04. SALES HISTORY — Filter + View Receipt
// ─────────────────────────────────────────────
async function record_sales_history() {
  console.log('\n🎬 Recording: 04_sales_history');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/sales/history`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  await scrollDown(page, 300); await delay(1000);

  // Click first row's View button via JS
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.match(/View|Receipt|Detail/i));
    if (btns[0]) btns[0].click();
  });
  await delay(2000);
  await page.keyboard.press('Escape');
  await delay(700);

  // Set date filter
  try {
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs[0]) { await dateInputs[0].fill('2026-01-01'); await delay(700); }
  } catch {}

  await scrollTop(page);
  await delay(1000);
  await saveAndClose(page, context, browser, '04_sales_history');
}

// ─────────────────────────────────────────────
// 05. REVENUE — Charts + Date Range
// ─────────────────────────────────────────────
async function record_revenue() {
  console.log('\n🎬 Recording: 05_revenue');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/revenue`, { waitUntil: 'domcontentloaded' });
  await delay(3500);

  // Hover over chart areas
  await page.mouse.move(500, 350); await delay(500);
  await page.mouse.move(650, 320); await delay(500);
  await page.mouse.move(800, 380); await delay(500);

  // Click filter buttons
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.match(/Week|Month|Year|Today/i));
    btns.forEach((b, i) => setTimeout(() => b.click(), i * 900));
  });
  await delay(4000);

  await scrollDown(page, 400);
  await delay(1500);
  await scrollTop(page);
  await delay(500);
  await saveAndClose(page, context, browser, '05_revenue');
}

// ─────────────────────────────────────────────
// 06. HR — Overview + Add Shift
// ─────────────────────────────────────────────
async function record_hr() {
  console.log('\n🎬 Recording: 06_hr');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/hr`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Hover and scroll
  await page.evaluate(() => { const el = document.querySelector('.overflow-y-auto') || document.documentElement; el.scrollTop += 300; });
  await delay(1000);

  // Click any Add/New/Create button via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Add|New|Create/i));
    if (btn) btn.click();
  });
  await delay(2000);
  await page.keyboard.press('Escape');
  await delay(700);

  await scrollTop(page);
  await delay(1000);
  await saveAndClose(page, context, browser, '06_hr');
}

// ─────────────────────────────────────────────
// 07. EMPLOYEES — Add Employee (3-step form)
// ─────────────────────────────────────────────
async function record_employees() {
  console.log('\n🎬 Recording: 07_employees');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Search an employee
  try {
    const search = await page.$('input[placeholder*="Search"]');
    if (search) {
      await search.evaluate(el => { el.focus(); el.value = 'ali'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(1000);
      await search.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(500);
    }
  } catch {}

  // Click "View Profile" on first row via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('View Profile'));
    if (btn) btn.click();
  });
  await delay(2000);
  await page.keyboard.press('Escape');
  await delay(800);

  // Open Add Employee modal via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add Employee'));
    if (btn) btn.click();
  });
  await delay(1500);

  // Step 1: Fill basic info using evaluate to set values
  await page.evaluate(() => {
    const setVal = (placeholder, value) => {
      const el = document.querySelector(`input[placeholder="${placeholder}"]`);
      if (el) { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }
    };
    setVal('First Name', 'Sarah');
    setVal('Last Name', 'Ahmed');
    setVal('Email Address *', 'sarah.ahmed@erp.com');
    setVal('Phone Number', '3001234567');
    setVal('CNIC (ID Card No) *', '3520112345671');
    setVal('Address (Based on ID Card) *', 'House 12, Street 5, Lahore');
  });
  await delay(1200);

  // Click Continue (Step 1 → 2)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Continue');
    if (btn) btn.click();
  });
  await delay(1500);

  // Step 2: Select 3rd department card
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('div[style*="cursor: pointer"]')].filter(el => el.style.borderRadius === '12px');
    if (cards[2]) cards[2].click();
  });
  await delay(800);

  // Select designation
  await page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find(s => s.querySelector('option[value=""]'));
    if (sel && sel.options.length > 1) {
      sel.selectedIndex = 1;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await delay(500);

  // Joining date
  await page.evaluate(() => {
    const el = document.querySelector('input[type="date"]');
    if (el) { el.value = '2026-07-01'; el.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await delay(400);

  // Continue to Step 3
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Continue →'));
    if (btn) btn.click();
  });
  await delay(1500);

  // Step 3: Salary
  await page.evaluate(() => {
    const setVal = (placeholder, value) => {
      const el = document.querySelector(`input[placeholder="${placeholder}"]`);
      if (el) { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }
    };
    setVal('Amount', '85000');
    setVal('Bank Account Number', 'PK36SCBL0000001123456702');
  });
  await delay(1000);

  // Close modal without submitting
  await page.keyboard.press('Escape');
  await delay(800);

  await saveAndClose(page, context, browser, '07_employees');
}

// ─────────────────────────────────────────────
// 08. ATTENDANCE — Clock In/Out + Date Filter
// ─────────────────────────────────────────────
async function record_attendance() {
  console.log('\n🎬 Recording: 08_attendance');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Hover clock in button
  try {
    const clockBtn = await page.$('button:has-text("Clock In"), button:has-text("Clock Out"), button:has-text("Check In")');
    if (clockBtn) { await clockBtn.hover(); await delay(800); }
  } catch {}

  // Date filter
  try {
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs[0]) { await dateInputs[0].fill('2026-07-01'); await delay(700); }
  } catch {}

  await scrollDown(page, 400); await delay(1200);
  await scrollTop(page); await delay(800);

  await saveAndClose(page, context, browser, '08_attendance');
}

// ─────────────────────────────────────────────
// 09. SHIFT AUDIT
// ─────────────────────────────────────────────
async function record_shift_audit() {
  console.log('\n🎬 Recording: 09_shift_audit');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/shift-audit`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  await scrollDown(page, 400); await delay(1500);

  // Click first table row via JS
  await page.evaluate(() => {
    const rows = document.querySelectorAll('tr');
    if (rows[1]) rows[1].click();
  });
  await delay(1500);
  await page.keyboard.press('Escape');
  await delay(500);

  await scrollTop(page); await delay(800);
  await saveAndClose(page, context, browser, '09_shift_audit');
}

// ─────────────────────────────────────────────
// 10. LEAVES — Apply Leave Form
// ─────────────────────────────────────────────
async function record_leaves() {
  console.log('\n🎬 Recording: 10_leaves');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/leaves`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Click Apply Leave via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Apply|Request|New/i));
    if (btn) btn.click();
  });
  await delay(1500);

  // Fill leave form
  try {
    await page.evaluate(() => {
      const sel = document.querySelector('select');
      if (sel && sel.options.length > 1) { sel.selectedIndex = 1; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await delay(400);
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs[0]) { await dateInputs[0].fill('2026-07-10'); await delay(300); }
    if (dateInputs[1]) { await dateInputs[1].fill('2026-07-11'); await delay(300); }
    const textarea = await page.$('textarea');
    if (textarea) { await textarea.evaluate(el => { el.value = 'Medical appointment requiring two days off.'; el.dispatchEvent(new Event('input', { bubbles: true })); }); await delay(600); }
  } catch {}

  await delay(800);
  await page.keyboard.press('Escape');
  await delay(700);

  // Filter by status via JS
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.match(/Pending|Approved|All/i));
    btns.forEach((b, i) => setTimeout(() => b.click(), i * 800));
  });
  await delay(3000);

  await saveAndClose(page, context, browser, '10_leaves');
}

// ─────────────────────────────────────────────
// 11. PAYROLL — Generate Payslips
// ─────────────────────────────────────────────
async function record_payroll() {
  console.log('\n🎬 Recording: 11_payroll');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/payroll`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  await scrollDown(page, 400); await delay(1200);

  // Hover generate button
  try {
    const genBtn = await page.$('button:has-text("Generate"), button:has-text("Process"), button:has-text("Run Payroll")');
    if (genBtn) { await genBtn.hover(); await delay(800); }
  } catch {}

  // Click a payslip row via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/View|Slip|Details/i));
    if (btn) btn.click();
  });
  await delay(2000);
  await page.keyboard.press('Escape');
  await delay(700);

  await scrollTop(page); await delay(800);
  await saveAndClose(page, context, browser, '11_payroll');
}

// ─────────────────────────────────────────────
// 12. PHARMACY — Stock Management + Add Item
// ─────────────────────────────────────────────
async function record_pharmacy() {
  console.log('\n🎬 Recording: 12_pharmacy');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/pharmacy`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Search for medicine
  try {
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.evaluate(el => { el.focus(); el.value = 'amox'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(1000);
      await searchInput.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(400);
    }
  } catch {}

  // Click Add button via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Add|New/i));
    if (btn) btn.click();
  });
  await delay(1500);

  // Fill fields
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input:not([type="checkbox"]):not([type="date"])')]
      .filter(el => !el.placeholder?.toLowerCase().includes('search'));
    if (inputs[0]) { inputs[0].value = 'Paracetamol 500mg'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '50'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(800);
  await page.keyboard.press('Escape');
  await delay(700);

  await scrollDown(page, 400); await delay(1200);
  await saveAndClose(page, context, browser, '12_pharmacy');
}

// ─────────────────────────────────────────────
// 13. SUPPLIERS — Add New Supplier
// ─────────────────────────────────────────────
async function record_suppliers() {
  console.log('\n🎬 Recording: 13_suppliers');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/suppliers`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Search
  try {
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.evaluate(el => { el.focus(); el.value = 'med'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(1000);
      await searchInput.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(400);
    }
  } catch {}

  // Open Add Supplier modal via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Add|New Supplier|Create/i));
    if (btn) btn.click();
  });
  await delay(1800);

  // Fill fields
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input:not([type="checkbox"])')];
    if (inputs[0]) { inputs[0].value = 'MediSource Pvt Ltd'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = 'contact@medisource.pk'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[2]) { inputs[2].value = '+92 300 1234567'; inputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(900);
  await page.keyboard.press('Escape');
  await delay(700);

  await scrollDown(page, 350); await delay(1200);
  await saveAndClose(page, context, browser, '13_suppliers');
}

// ─────────────────────────────────────────────
// 14. CUSTOMERS — Add New Customer + Loyalty Tiers
// ─────────────────────────────────────────────
async function record_customers() {
  console.log('\n🎬 Recording: 14_customers');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/customers`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Search customer
  try {
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.evaluate(el => { el.focus(); el.value = 'ali'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(1200);
      await searchInput.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await delay(400);
    }
  } catch {}

  // Add Customer via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Add|New Customer/i));
    if (btn) btn.click();
  });
  await delay(1500);

  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input:not([type="checkbox"])')];
    if (inputs[0]) { inputs[0].value = 'Fatima Khan'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '+92 311 9876543'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[2]) { inputs[2].value = 'fatima.khan@email.com'; inputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(900);
  await page.keyboard.press('Escape');
  await delay(700);

  // View a customer profile via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/View|Profile/i));
    if (btn) btn.click();
  });
  await delay(2000);
  await page.keyboard.press('Escape');
  await delay(700);

  await saveAndClose(page, context, browser, '14_customers');
}

// ─────────────────────────────────────────────
// 15. EXPENSES — Log New Expense
// ─────────────────────────────────────────────
async function record_expenses() {
  console.log('\n🎬 Recording: 15_expenses');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/expenses`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Click Add Expense via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Add|Log|New/i));
    if (btn) btn.click();
  });
  await delay(1500);

  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input:not([type="checkbox"]):not([type="date"])')];
    if (inputs[0]) { inputs[0].value = 'Office Supplies'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '3500'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
    const sel = document.querySelector('select');
    if (sel && sel.options.length > 1) { sel.selectedIndex = 1; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    const dateEl = document.querySelector('input[type="date"]');
    if (dateEl) { dateEl.value = '2026-07-02'; dateEl.dispatchEvent(new Event('change', { bubbles: true })); }
    const ta = document.querySelector('textarea');
    if (ta) { ta.value = 'Monthly stationery and printing supplies.'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(900);
  await page.keyboard.press('Escape');
  await delay(700);

  await scrollDown(page, 350); await delay(1200);
  await saveAndClose(page, context, browser, '15_expenses');
}

// ─────────────────────────────────────────────
// 16. USERS — Invite User + Role Assignment
// ─────────────────────────────────────────────
async function record_users() {
  console.log('\n🎬 Recording: 16_users');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/users`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  await scrollDown(page, 300); await delay(1000);

  // Invite user via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Add|Invite|New User/i));
    if (btn) btn.click();
  });
  await delay(1500);

  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input:not([type="checkbox"])')];
    if (inputs[0]) { inputs[0].value = 'newuser@erp.com'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    const sel = document.querySelector('select');
    if (sel && sel.options.length > 2) { sel.selectedIndex = 2; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await delay(900);
  await page.keyboard.press('Escape');
  await delay(700);

  // Click first user row
  await page.evaluate(() => { const rows = document.querySelectorAll('tr'); if (rows[1]) rows[1].click(); });
  await delay(1500);
  await page.keyboard.press('Escape');
  await delay(500);

  await scrollTop(page); await delay(800);
  await saveAndClose(page, context, browser, '16_users');
}

// ─────────────────────────────────────────────
// 17. EOD REPORT — Generate + View
// ─────────────────────────────────────────────
async function record_eod() {
  console.log('\n🎬 Recording: 17_eod_report');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/eod`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  await page.mouse.move(500, 400); await delay(500);
  await page.mouse.move(800, 400); await delay(500);

  // Hover generate button
  try {
    const genBtn = await page.$('button:has-text("Generate"), button:has-text("Close Day"), button:has-text("Submit")');
    if (genBtn) { await genBtn.hover(); await delay(1000); }
  } catch {}

  await scrollDown(page, 400); await delay(1200);
  await scrollTop(page); await delay(800);
  await saveAndClose(page, context, browser, '17_eod_report');
}

// ─────────────────────────────────────────────
// 18. DELIVERY — New Delivery Assignment
// ─────────────────────────────────────────────
async function record_delivery() {
  console.log('\n🎬 Recording: 18_delivery');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/delivery`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  await scrollDown(page, 300); await delay(1000);

  // New Delivery via JS
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.match(/Add|New Delivery|Create|Assign/i));
    if (btn) btn.click();
  });
  await delay(1500);

  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input:not([type="checkbox"])')];
    if (inputs[0]) { inputs[0].value = 'House 5, Garden Town, Lahore'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    if (inputs[1]) { inputs[1].value = '+92 300 9876543'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(900);
  await page.keyboard.press('Escape');
  await delay(700);

  // Status filter via JS
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.match(/Pending|Delivered|All/i));
    btns.forEach((b, i) => setTimeout(() => b.click(), i * 700));
  });
  await delay(3000);

  await scrollTop(page); await delay(800);
  await saveAndClose(page, context, browser, '18_delivery');
}

// ─────────────────────────────────────────────
// 19. MANAGER WORKSPACE
// ─────────────────────────────────────────────
async function record_manager() {
  console.log('\n🎬 Recording: 19_manager');
  const browser = await launchBrowser();
  const context = await newContext(browser);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/manager`, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  // Hover over KPI cards and scroll
  const cards = await page.$$('div[style*="border-radius"]');
  for (let i = 0; i < Math.min(5, cards.length); i++) {
    try { await cards[i].hover({ timeout: 500 }); await delay(400); } catch {}
  }
  await page.evaluate(() => { const el = document.querySelector('.overflow-y-auto') || document.documentElement; el.scrollTop += 400; });
  await delay(1500);

  // Click any tab or filter buttons
  const tabs = await page.$$('button:has-text("Today"), button:has-text("Week"), button:has-text("Month")');
  for (const tab of tabs) { try { await tab.click(); await delay(800); } catch {} }

  await page.evaluate(() => { const el = document.querySelector('.overflow-y-auto') || document.documentElement; el.scrollTop = 0; });
  await delay(800);
  await saveAndClose(page, context, browser, '19_manager');
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
(async () => {
  console.log('🚀 Starting FUNCTIONAL video recording...');
  console.log(`📁 Output directory: ${VIDEOS_DIR}\n`);

  const recordings = [
    { name: '00_login',        fn: record_login },
    { name: '01_dashboard',    fn: record_dashboard },
    { name: '02_inventory',    fn: record_inventory },
    { name: '03_sales',        fn: record_sales },
    { name: '04_sales_history',fn: record_sales_history },
    { name: '05_revenue',      fn: record_revenue },
    { name: '06_hr',           fn: record_hr },
    { name: '07_employees',    fn: record_employees },
    { name: '08_attendance',   fn: record_attendance },
    { name: '09_shift_audit',  fn: record_shift_audit },
    { name: '10_leaves',       fn: record_leaves },
    { name: '11_payroll',      fn: record_payroll },
    { name: '12_pharmacy',     fn: record_pharmacy },
    { name: '13_suppliers',    fn: record_suppliers },
    { name: '14_customers',    fn: record_customers },
    { name: '15_expenses',     fn: record_expenses },
    { name: '16_users',        fn: record_users },
    { name: '17_eod_report',   fn: record_eod },
    { name: '18_delivery',     fn: record_delivery },
    { name: '19_manager',      fn: record_manager },
  ];

  for (const r of recordings) {
    try {
      await r.fn();
    } catch (err) {
      console.error(`❌ Failed recording ${r.name}: ${err.message}`);
    }
    await delay(1500);
  }

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  ✅ ALL FUNCTIONAL CLIPS COMPLETE!   ║');
  console.log(`║  📁 ${VIDEOS_DIR}`);
  console.log('╚══════════════════════════════════════╝');
})();
