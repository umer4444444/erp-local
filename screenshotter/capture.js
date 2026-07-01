const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/usman/.gemini/antigravity/brain/1422f9ef-5a6d-4e89-9606-1f9cff8c393e/screenshots';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

const routes = [
  { path: '/', name: 'dashboard' },
  { path: '/manager', name: 'manager' },
  { path: '/inventory', name: 'inventory' },
  { path: '/sales', name: 'sales' },
  { path: '/sales/history', name: 'sales_history' },
  { path: '/revenue', name: 'revenue' },
  { path: '/hr', name: 'hr' },
  { path: '/employees', name: 'employees' },
  { path: '/attendance', name: 'attendance' },
  { path: '/shift-audit', name: 'shift_audit' },
  { path: '/leaves', name: 'leaves' },
  { path: '/payroll', name: 'payroll' },
  { path: '/pharmacy', name: 'pharmacy' },
  { path: '/suppliers', name: 'suppliers' },
  { path: '/customers', name: 'customers' },
  { path: '/expenses', name: 'expenses' },
  { path: '/users', name: 'users' },
  { path: '/eod', name: 'eod_report' },
  { path: '/delivery', name: 'delivery' }
];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  console.log('Navigating to login...');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });

  console.log('Logging in...');
  // Fill in login form
  // Find email input
  await page.type('input[type="email"]', 'admin@erp.com');
  await page.type('input[type="password"]', 'admin123!');
  
  const submitButton = await page.$('button[type="submit"]');
  if (submitButton) {
    await submitButton.click();
  } else {
    console.log('Could not find submit button');
    await page.keyboard.press('Enter');
  }

  console.log('Waiting for login to complete...');
  await delay(3000); // Wait for API response and redirect
  
  // Wait an extra 2 seconds for dashboard to render
  await delay(2000);
  
  // Test if login succeeded by checking URL or taking a shot
  console.log(`Current URL: ${page.url()}`);
  
  for (const route of routes) {
    console.log(`Taking screenshot for ${route.name} at ${route.path}...`);
    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle0', timeout: 10000 });
      // Wait extra time for animations or data fetching
      await delay(2000);
      
      const filename = path.join(ARTIFACT_DIR, `${route.name}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`Saved ${filename}`);
    } catch (e) {
      console.error(`Failed on ${route.name}: ${e.message}`);
    }
  }

  console.log('Done capturing screenshots!');
  await browser.close();
})();
