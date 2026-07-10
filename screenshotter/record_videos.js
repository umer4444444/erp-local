const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://erp.lancerstech.com';
const VIDEOS_DIR = 'C:/Users/usman/.gemini/antigravity/brain/86b4355a-ad40-4674-b719-d90de0927607/videos';
const STATE_FILE = path.join(__dirname, 'state.json');

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// Helper function to rename the recorded video file
async function saveVideo(page, destName) {
  try {
    const video = page.video();
    if (!video) {
      console.log(`No video found for ${destName}`);
      return;
    }
    const videoPath = await video.path();
    console.log(`Video captured at temporary path: ${videoPath}`);
    // Wait for the context to close to make sure video file is finalized
    return videoPath;
  } catch (err) {
    console.error(`Error getting video path for ${destName}:`, err.message);
    return null;
  }
}

// Function to handle login and save authentication state
async function performLogin() {
  console.log('--- Logging In ---');
  const browser = await chromium.launch({
    headless: true,
    args: ['--window-size=1280,720']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  
  console.log(`Navigating to ${BASE_URL}/login`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await delay(1000);

  // Try user-provided password first: admin123
  console.log('Entering admin@erp.com and password admin123');
  await page.fill('input[type="email"]', 'admin@erp.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  console.log('Waiting for authentication...');
  await delay(3000);

  let currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // If login failed (still on login page or shows error), try admin123!
  if (currentUrl.includes('/login')) {
    console.log('Login with admin123 failed or page did not redirect. Trying admin123!...');
    await page.fill('input[type="email"]', 'admin@erp.com');
    await page.fill('input[type="password"]', 'admin123!');
    await page.click('button[type="submit"]');
    await delay(3000);
    currentUrl = page.url();
    console.log(`Current URL after second attempt: ${currentUrl}`);
  }

  // Hover around the dashboard to record some activity
  console.log('Navigated. Showing dashboard activity...');
  await page.mouse.move(300, 300);
  await delay(1000);
  await page.mouse.move(600, 400);
  await delay(1000);

  // Save the storage state so subsequent sessions don't need to log in
  console.log('Saving storage state...');
  await context.storageState({ path: STATE_FILE });

  const tempVideoPath = await saveVideo(page, '00_login_and_dashboard');
  
  await context.close();
  await browser.close();

  if (tempVideoPath && fs.existsSync(tempVideoPath)) {
    const finalDest = path.join(VIDEOS_DIR, '00_login_and_dashboard.webm');
    fs.renameSync(tempVideoPath, finalDest);
    console.log(`Saved login video to: ${finalDest}`);
  }
}

// Function to record specific routes
async function recordRoute(routePath, routeName) {
  console.log(`\n--- Recording Route: ${routeName} (${routePath}) ---`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--window-size=1280,720']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  
  const targetUrl = `${BASE_URL}${routePath}`;
  console.log(`Navigating directly to ${targetUrl}`);
  
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait for animations or lazy loading API calls to finish
    await delay(3000);

    // Dynamic interactions based on page
    console.log('Interacting with page...');
    
    // Slow scroll down to show the content of the page
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        const container = document.querySelector('.overflow-y-auto') || document.documentElement;
        let totalHeight = 0;
        const distance = 100;
        const limit = container.scrollHeight - container.clientHeight;
        
        // If there's nothing to scroll, resolve immediately
        if (limit <= 0) {
          resolve();
          return;
        }

        const timer = setInterval(() => {
          container.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= limit || totalHeight > 5000) { // safety limit of 5000px
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });
    
    await delay(1000);
    
    // Scroll back up slowly
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        const container = document.querySelector('.overflow-y-auto') || document.documentElement;
        let currentScroll = container.scrollTop;
        const distance = 150;
        
        if (currentScroll <= 0) {
          resolve();
          return;
        }

        const timer = setInterval(() => {
          container.scrollBy(0, -distance);
          currentScroll -= distance;

          if (currentScroll <= 0) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await delay(1000);

    // Hover over various table rows or cards if they exist
    const elementsToHover = await page.$$('tr, .card, button, a');
    if (elementsToHover.length > 0) {
      // Hover a couple of elements to show hover effects
      for (let i = 0; i < Math.min(3, elementsToHover.length); i++) {
        try {
          await elementsToHover[i].hover({ timeout: 1000 });
          await delay(500);
        } catch (e) {
          // ignore hover errors for off-screen/unhoverable elements
        }
      }
    }

    // Check if there's a button to open a modal (e.g. "Add", "New", "Create")
    if (routePath !== '/sales') {
      const actionButtons = await page.$$('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), button:has-text("Record")');
      if (actionButtons.length > 0) {
        console.log('Found action button, opening modal/form...');
        try {
          await actionButtons[0].click({ timeout: 2000 });
          await delay(2000); // Wait for modal to open
          
          // Take a video view of the modal, then press escape to close it
          await page.keyboard.press('Escape');
          await delay(1000);
        } catch (e) {
          console.log(`Failed to click action button: ${e.message}`);
        }
      }
    } else {
      // For sales terminal, click on the first two products to add them to the cart
      console.log('Interacting with sales terminal: adding items to cart...');
      try {
        // Let's find divs that look like product cards
        const productDivs = await page.$$('div:has(div:has-text("in stock"))');
        if (productDivs.length > 0) {
          await productDivs[0].click({ timeout: 2000 });
          await delay(1000);
          if (productDivs.length > 1) {
            await productDivs[1].click({ timeout: 2000 });
            await delay(1500);
          }
        }
      } catch (e) {
        console.log(`Failed POS interactions: ${e.message}`);
      }
    }

    await delay(1500);

  } catch (err) {
    console.error(`Error during recording route ${routeName}:`, err.message);
  }

  const tempVideoPath = await saveVideo(page, routeName);
  
  await context.close();
  await browser.close();

  if (tempVideoPath && fs.existsSync(tempVideoPath)) {
    const finalDest = path.join(VIDEOS_DIR, `${routeName}.webm`);
    if (fs.existsSync(finalDest)) {
      fs.unlinkSync(finalDest); // Remove existing file
    }
    fs.renameSync(tempVideoPath, finalDest);
    console.log(`Successfully saved ${routeName}.webm`);
  }
}

// Main execution flow
(async () => {
  try {
    // 1. Login and save state
    await performLogin();

    // 2. Define routes to record
    const routes = [
      { path: '/', name: '01_dashboard' },
      { path: '/manager', name: '02_manager' },
      { path: '/inventory', name: '03_inventory' },
      { path: '/sales', name: '04_sales' },
      { path: '/sales/history', name: '05_sales_history' },
      { path: '/revenue', name: '06_revenue' },
      { path: '/hr', name: '07_hr' },
      { path: '/employees', name: '08_employees' },
      { path: '/attendance', name: '09_attendance' },
      { path: '/shift-audit', name: '10_shift_audit' },
      { path: '/leaves', name: '11_leaves' },
      { path: '/payroll', name: '12_payroll' },
      { path: '/pharmacy', name: '13_pharmacy' },
      { path: '/suppliers', name: '14_suppliers' },
      { path: '/customers', name: '15_customers' },
      { path: '/expenses', name: '16_expenses' },
      { path: '/users', name: '17_users' },
      { path: '/eod', name: '18_eod_report' },
      { path: '/delivery', name: '19_delivery' }
    ];

    // 3. Sequentially record video for each route
    for (const r of routes) {
      await recordRoute(r.path, r.name);
      await delay(1000); // 1s cooling break between browser launches
    }

    console.log('\n======================================');
    console.log('All video clips successfully recorded!');
    console.log(`Find them in: ${VIDEOS_DIR}`);
    console.log('======================================');

  } catch (error) {
    console.error('Fatal error in main recording script:', error.message);
  }
})();
