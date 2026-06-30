const {
  Document, Packer, Paragraph, TextRun, ImageRun,
  HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, PageBreak, Header,
  Footer, PageNumber, NumberFormat, convertInchesToTwip,
  UnderlineType
} = require('docx');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = 'C:/Users/usman/.gemini/antigravity/brain/1422f9ef-5a6d-4e89-9606-1f9cff8c393e/screenshots';
const OUTPUT_PATH = 'C:/Users/usman/.gemini/antigravity/brain/1422f9ef-5a6d-4e89-9606-1f9cff8c393e/ERP_System_Documentation.docx';

function loadImage(name) {
  const filePath = path.join(SCREENSHOTS_DIR, name);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

function screenshotParagraph(filename, altText) {
  const data = loadImage(filename);
  if (!data) return new Paragraph({ text: `[Screenshot not found: ${filename}]` });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        data,
        transformation: { width: 620, height: 349 },
        altText: { title: altText, description: altText, name: altText },
      }),
    ],
    spacing: { before: 120, after: 240 },
  });
}

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 120 },
    thematicBreak: false,
  });
}

function heading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 80 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
    spacing: { before: 60, after: 60 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22, font: 'Calibri' })],
    spacing: { before: 40, after: 40 },
    indent: { left: convertInchesToTwip(0.4) },
  });
}

function sectionDivider() {
  return new Paragraph({
    children: [new TextRun({ text: '', break: 1 })],
    border: {
      bottom: { color: '3B82F6', size: 6, space: 1, style: BorderStyle.SINGLE },
    },
    spacing: { before: 200, after: 200 },
  });
}

function labelValue(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, font: 'Calibri', color: '1E40AF' }),
      new TextRun({ text: value, size: 22, font: 'Calibri' }),
    ],
    spacing: { before: 40, after: 40 },
  });
}

const summaryTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      tableHeader: true,
      children: ['#', 'Module', 'Route', 'Primary Role'].map(txt =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: txt, bold: true, color: 'FFFFFF', size: 22, font: 'Calibri' })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { type: ShadingType.SOLID, color: '1D4ED8', fill: '1D4ED8' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        })
      ),
    }),
    ...([
      ['1', 'Dashboard', '/', 'Admin'],
      ['2', 'Manager Portal', '/manager', 'Manager'],
      ['3', 'Inventory', '/inventory', 'Inventory, Admin'],
      ['4', 'Sales POS', '/sales', 'Cashier, Sales'],
      ['5', 'Sales History', '/sales/history', 'Admin, Manager'],
      ['6', 'Revenue Analytics', '/revenue', 'Admin, Manager'],
      ['7', 'HR Module', '/hr', 'HR, Admin'],
      ['8', 'Employees', '/employees', 'HR, Admin'],
      ['9', 'Attendance', '/attendance', 'HR, Admin'],
      ['10', 'Shift Audit', '/shift-audit', 'Manager, Admin'],
      ['11', 'Leave Management', '/leaves', 'HR, Admin, All'],
      ['12', 'Payroll', '/payroll', 'HR, Admin'],
      ['13', 'Pharmacy', '/pharmacy', 'Pharmacist, Admin'],
      ['14', 'Suppliers', '/suppliers', 'Admin, Manager'],
      ['15', 'Customers CRM', '/customers', 'Sales, Admin'],
      ['16', 'Expenses', '/expenses', 'Admin, Manager'],
      ['17', 'Users & Access', '/users', 'Admin only'],
      ['18', 'EOD Report', '/eod', 'Admin, Manager'],
      ['19', 'Delivery Dispatch', '/delivery', 'Admin, Manager'],
    ].map((row, i) =>
      new TableRow({
        children: row.map(cell =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: cell, size: 20, font: 'Calibri' })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'EFF6FF' : 'FFFFFF', fill: i % 2 === 0 ? 'EFF6FF' : 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
          })
        ),
      })
    )),
  ],
});

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal',
        run: { bold: true, size: 32, color: '1D4ED8', font: 'Calibri' },
        paragraph: { spacing: { before: 480, after: 120 } },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal',
        run: { bold: true, size: 26, color: '1E40AF', font: 'Calibri' },
        paragraph: { spacing: { before: 300, after: 80 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      },
    },
    children: [
      // ─── COVER PAGE ───
      new Paragraph({ children: [new TextRun({ text: '', break: 5 })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'ENTERPRISE ERP SYSTEM', bold: true, size: 56, color: '1D4ED8', font: 'Calibri' })],
        spacing: { before: 0, after: 120 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Complete System Documentation', size: 36, color: '475569', font: 'Calibri' })],
        spacing: { before: 0, after: 400 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '─────────────────────────────────────', color: '3B82F6', size: 24, font: 'Calibri' })],
        spacing: { before: 0, after: 400 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Prepared by: AI-Assisted Technical Documentation', size: 24, color: '64748B', font: 'Calibri' })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Date: June 26, 2026', size: 24, color: '64748B', font: 'Calibri' })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Version: 2.0 Enterprise Edition', size: 24, color: '64748B', font: 'Calibri' })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Modules Covered: 19 | Screenshots: 19 Live Captures', size: 24, color: '1D4ED8', font: 'Calibri', bold: true })],
        spacing: { after: 0 },
      }),
      new Paragraph({ children: [new TextRun({ text: '', break: 1 }), new PageBreak()] }),

      // ─── OVERVIEW ───
      heading1('Overview'),
      body('This document provides a comprehensive technical and functional description of the Enterprise ERP platform. All screenshots were captured live from the running application using an automated browser tool, authenticated as an Administrator for full system visibility.'),
      body('The system is built on a React (Vite) frontend with a Node.js/Express/MySQL backend, featuring real-time updates via Socket.IO, role-based access control, and a modular design supporting multiple business verticals.'),
      sectionDivider(),

      // ─── MODULE SUMMARY TABLE ───
      heading1('Module Summary'),
      new Paragraph({ spacing: { after: 200 } }),
      summaryTable,
      new Paragraph({ children: [new PageBreak()] }),

      // ─── MODULE 1: DASHBOARD ───
      heading1('1. Dashboard'),
      labelValue('Route', '/'),
      labelValue('Primary Role', 'Admin'),
      labelValue('Purpose', 'Central command center providing live KPIs and system-wide visibility'),
      body('The Dashboard is the first screen presented to administrators after login. It aggregates data from across all modules into a single, at-a-glance view.'),
      heading2('Key Features'),
      bullet('Live KPI tiles: Today\'s revenue, transactions, and active staff count'),
      bullet('Quick-access navigation shortcuts to all major ERP modules'),
      bullet('Recent activity feed showing the latest system events'),
      bullet('System-wide alerts and low-stock / expiry notifications'),
      bullet('Role-aware layout — content adapts based on logged-in user\'s role'),
      screenshotParagraph('dashboard.png', 'Dashboard Overview'),

      // ─── MODULE 2: MANAGER PORTAL ───
      heading1('2. Manager Portal'),
      labelValue('Route', '/manager'),
      labelValue('Primary Role', 'Manager, Admin'),
      labelValue('Purpose', 'Operational control center for middle management oversight'),
      heading2('Key Features'),
      bullet('Approve or reject employee leave requests with comments'),
      bullet('Review and sign off on shift handover reports'),
      bullet('Monitor real-time floor activity and operational status'),
      bullet('View departmental performance summaries and alerts'),
      bullet('Access to critical operational metrics without full admin rights'),
      screenshotParagraph('manager.png', 'Manager Portal'),

      // ─── MODULE 3: INVENTORY ───
      heading1('3. Inventory Management'),
      labelValue('Route', '/inventory'),
      labelValue('Primary Role', 'Inventory Manager, Admin'),
      labelValue('Purpose', 'Full product and stock lifecycle management'),
      heading2('Key Features'),
      bullet('Add, edit, and delete products with SKU, price, category, and stock levels'),
      bullet('Low-stock alerts with configurable reorder threshold'),
      bullet('Stock adjustment history tracking purchases, sales, and write-offs'),
      bullet('Category-based filtering (Construction, Pharmacy, General, etc.)'),
      bullet('Supplier linkage per product for quick reordering'),
      bullet('Barcode-ready product codes for POS integration'),
      screenshotParagraph('inventory.png', 'Inventory Management'),

      // ─── MODULE 4: SALES POS ───
      heading1('4. Sales POS Terminal'),
      labelValue('Route', '/sales'),
      labelValue('Primary Role', 'Cashier, Sales'),
      labelValue('Purpose', 'Fast, intuitive Point-of-Sale terminal for processing transactions'),
      heading2('Key Features'),
      bullet('Product search and barcode-ready item lookup'),
      bullet('Live shopping cart with real-time quantity and price updates'),
      bullet('Customer selection and linking for loyalty point tracking'),
      bullet('Apply percentage or fixed-amount discounts'),
      bullet('Multiple payment methods: Cash and Card'),
      bullet('Auto-generated receipts with invoice printing support'),
      bullet('Inventory stock auto-decremented on successful sale'),
      screenshotParagraph('sales.png', 'Sales POS Terminal'),

      // ─── MODULE 5: SALES HISTORY ───
      heading1('5. Sales History'),
      labelValue('Route', '/sales/history'),
      labelValue('Primary Role', 'Admin, Manager'),
      labelValue('Purpose', 'Complete transactional audit trail for all processed sales'),
      heading2('Key Features'),
      bullet('Browse all past sales with timestamps, amounts, and cashier information'),
      bullet('View full receipt breakdown for any historical transaction'),
      bullet('Process refunds and returns with reason logging'),
      bullet('Filter by date range, cashier, payment type, or amount'),
      bullet('Export transaction data to CSV for accounting purposes'),
      screenshotParagraph('sales_history.png', 'Sales History'),

      // ─── MODULE 6: REVENUE ───
      heading1('6. Revenue Analytics'),
      labelValue('Route', '/revenue'),
      labelValue('Primary Role', 'Admin, Manager'),
      labelValue('Purpose', 'Financial intelligence and income trend analysis'),
      heading2('Key Features'),
      bullet('Gross revenue vs. net profit trend charts with daily/weekly/monthly views'),
      bullet('Top-selling products and categories ranked by revenue contribution'),
      bullet('Revenue breakdown by cashier, terminal, or time period'),
      bullet('Expense deduction summary for accurate Profit & Loss calculation'),
      bullet('Visual charts for quick identification of performance patterns'),
      screenshotParagraph('revenue.png', 'Revenue Analytics'),

      // ─── MODULE 7: HR ───
      heading1('7. HR Module'),
      labelValue('Route', '/hr'),
      labelValue('Primary Role', 'HR, Admin'),
      labelValue('Purpose', 'Human resources administration and workforce policy management'),
      heading2('Key Features'),
      bullet('Headcount overview by department and role'),
      bullet('Onboarding checklists and document tracking per new hire'),
      bullet('Leave policy configuration and enforcement'),
      bullet('Staff performance and contract status overview'),
      bullet('Centralized HR communications and announcements'),
      screenshotParagraph('hr.png', 'HR Module'),

      // ─── MODULE 8: EMPLOYEES ───
      heading1('8. Employees Directory'),
      labelValue('Route', '/employees'),
      labelValue('Primary Role', 'HR, Admin'),
      labelValue('Purpose', 'Centralized database of all staff members and their profiles'),
      heading2('Key Features'),
      bullet('Full employee profiles: name, role, department, join date, salary, contact'),
      bullet('Search and filter by role, department, or employment status'),
      bullet('Edit employee details including salary, designation, and contact info'),
      bullet('View attendance and leave history directly from employee profile'),
      bullet('Activate or deactivate staff accounts for system access'),
      screenshotParagraph('employees.png', 'Employees Directory'),

      // ─── MODULE 9: ATTENDANCE ───
      heading1('9. Attendance Tracking'),
      labelValue('Route', '/attendance'),
      labelValue('Primary Role', 'HR, Admin'),
      labelValue('Purpose', 'Daily presence monitoring and timesheet management'),
      heading2('Key Features'),
      bullet('Real-time clock-in and clock-out log entries'),
      bullet('Late arrival, early departure, and absence tracking'),
      bullet('Automatic calculation of worked hours per shift'),
      bullet('Overtime detection and automatic flagging'),
      bullet('Monthly attendance summary reports per employee'),
      screenshotParagraph('attendance.png', 'Attendance Tracking'),

      // ─── MODULE 10: SHIFT AUDIT ───
      heading1('10. Shift Audit'),
      labelValue('Route', '/shift-audit'),
      labelValue('Primary Role', 'Manager, Admin'),
      labelValue('Purpose', 'Cash drawer reconciliation and shift handover verification'),
      heading2('Key Features'),
      bullet('Opening and closing cash balance logging at the start/end of each shift'),
      bullet('Variance detection comparing actual vs. expected cash in drawer'),
      bullet('Complete sales summary per shift for accountability'),
      bullet('Supervisor digital sign-off workflow'),
      bullet('Discrepancy investigation notes and resolution tracking'),
      screenshotParagraph('shift_audit.png', 'Shift Audit'),

      // ─── MODULE 11: LEAVES ───
      heading1('11. Leave Management'),
      labelValue('Route', '/leaves'),
      labelValue('Primary Role', 'All employees (request), HR/Admin (approve)'),
      labelValue('Purpose', 'Structured leave request and approval workflow'),
      heading2('Key Features'),
      bullet('Employees submit leave requests specifying type (Annual, Sick, Casual) and dates'),
      bullet('Manager/HR approval or rejection with optional comments'),
      bullet('Leave balance tracking per employee updated in real-time'),
      bullet('Calendar view of approved leaves for scheduling and capacity planning'),
      bullet('Automatic payroll impact: approved leaves deducted or marked accordingly'),
      screenshotParagraph('leaves.png', 'Leave Management'),

      // ─── MODULE 12: PAYROLL ───
      heading1('12. Payroll System'),
      labelValue('Route', '/payroll'),
      labelValue('Primary Role', 'HR, Admin'),
      labelValue('Purpose', 'Automated salary computation and payslip generation'),
      heading2('Key Features'),
      bullet('Salary calculation automatically based on attendance and leave records'),
      bullet('Deductions: Absences, salary advances, and performance penalties'),
      bullet('Additions: Overtime pay, performance bonuses, and allowances'),
      bullet('Payslip generation and PDF download per employee per month'),
      bullet('Payroll run history with approval workflow'),
      bullet('Bank transfer details management for direct deposit'),
      screenshotParagraph('payroll.png', 'Payroll System'),

      // ─── MODULE 13: PHARMACY ───
      heading1('13. Pharmacy Module'),
      labelValue('Route', '/pharmacy'),
      labelValue('Primary Role', 'Pharmacist, Admin'),
      labelValue('Purpose', 'Medical inventory and regulatory compliance management'),
      heading2('Key Features'),
      bullet('Drug inventory with batch numbers, expiry dates, and supplier information'),
      bullet('Tiered expiry alerts: 30-day and 7-day warning levels'),
      bullet('Controlled substance log with strict quantity and dispensing tracking'),
      bullet('Prescription management: create, verify, and dispense workflows'),
      bullet('Batch recall workflow for recalled or contaminated stock'),
      bullet('Regulatory compliance reporting for audits'),
      screenshotParagraph('pharmacy.png', 'Pharmacy Module'),

      // ─── MODULE 14: SUPPLIERS ───
      heading1('14. Suppliers'),
      labelValue('Route', '/suppliers'),
      labelValue('Primary Role', 'Admin, Manager'),
      labelValue('Purpose', 'Vendor relationship and procurement management'),
      heading2('Key Features'),
      bullet('Supplier directory with contact information, categories, and payment terms'),
      bullet('Purchase order (PO) creation and real-time tracking'),
      bullet('Goods Received Notes (GRN) logging for inventory reconciliation'),
      bullet('Supplier performance ratings and on-time delivery metrics'),
      bullet('Invoice and payment history per vendor for financial reconciliation'),
      screenshotParagraph('suppliers.png', 'Suppliers Management'),

      // ─── MODULE 15: CUSTOMERS ───
      heading1('15. Customers CRM'),
      labelValue('Route', '/customers'),
      labelValue('Primary Role', 'Sales, Admin'),
      labelValue('Purpose', 'Client relationship management for retail and B2B customers'),
      heading2('Key Features'),
      bullet('Customer profiles with contact details and complete purchase history'),
      bullet('Loyalty point balance tracking and redemption at POS'),
      bullet('Total spending and visit frequency analytics'),
      bullet('Add, edit, and delete customer records'),
      bullet('Direct linking of customers to sales transactions during checkout'),
      screenshotParagraph('customers.png', 'Customer CRM'),

      // ─── MODULE 16: EXPENSES ───
      heading1('16. Expenses'),
      labelValue('Route', '/expenses'),
      labelValue('Primary Role', 'Admin, Manager'),
      labelValue('Purpose', 'Operational cost logging for accurate net profit calculation'),
      heading2('Key Features'),
      bullet('Log daily business expenses by category (Utilities, Supplies, Maintenance, etc.)'),
      bullet('Attach descriptive notes and receipt references to each entry'),
      bullet('Monthly expense summaries with category breakdowns'),
      bullet('Integrated into EOD and Revenue reports for full P&L calculation'),
      bullet('Expense approval workflow for management oversight and budget control'),
      screenshotParagraph('expenses.png', 'Expenses Tracking'),

      // ─── MODULE 17: USERS ───
      heading1('17. Users & Access Control'),
      labelValue('Route', '/users'),
      labelValue('Primary Role', 'Admin only'),
      labelValue('Purpose', 'System-level user account and permission management'),
      heading2('Key Features'),
      bullet('Create new user accounts with role assignment'),
      bullet('Available roles: Admin, Manager, HR, Sales, Cashier, Pharmacist, Inventory'),
      bullet('Password management: set and reset capabilities'),
      bullet('Activate and deactivate accounts without permanent deletion'),
      bullet('Role-Based Access Control (RBAC) — each role sees only permitted modules'),
      bullet('Login audit trail for security monitoring'),
      screenshotParagraph('users.png', 'User Access Control'),

      // ─── MODULE 18: EOD ───
      heading1('18. End-of-Day (EOD) Report'),
      labelValue('Route', '/eod'),
      labelValue('Primary Role', 'Admin, Manager'),
      labelValue('Purpose', 'Daily financial reconciliation and cash management report'),
      heading2('Key Features'),
      bullet('Daily sales total vs. expected cash in drawer comparison'),
      bullet('Expense deductions for accurate net revenue calculation'),
      bullet('Shift-by-shift breakdown showing each cashier\'s contribution'),
      bullet('Discrepancy flagging with investigation workflow'),
      bullet('Exportable PDF report for accountant and auditor review'),
      bullet('Historical EOD report archive for trend analysis'),
      screenshotParagraph('eod_report.png', 'EOD Report'),

      // ─── MODULE 19: DELIVERY ───
      heading1('19. Delivery Dispatch'),
      labelValue('Route', '/delivery'),
      labelValue('Primary Role', 'Admin, Manager'),
      labelValue('Purpose', 'Logistics and last-mile delivery management'),
      heading2('Key Features'),
      bullet('Create delivery orders with customer address, items, and priority level'),
      bullet('Assign deliveries to available drivers from a central dispatch board'),
      bullet('Real-time status tracking: Pending → Assigned → In Transit → Delivered'),
      bullet('Priority levels: Standard, High, Express for SLA management'),
      bullet('Delivery history and on-time performance metrics per driver'),
      bullet('Customer notification integration for delivery updates'),
      screenshotParagraph('delivery.png', 'Delivery Dispatch'),

      // ─── FOOTER NOTE ───
      sectionDivider(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Enterprise ERP v2.0 — Confidential Documentation — June 2026', size: 18, color: '94A3B8', font: 'Calibri' })],
        spacing: { before: 200 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log('DOCX successfully written to:', OUTPUT_PATH);
}).catch(err => {
  console.error('Error generating DOCX:', err);
});
