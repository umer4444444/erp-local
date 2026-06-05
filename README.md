# ERP System (Backend + Frontend)

## Overview

This repository contains a full-stack Enterprise Resource Planning (ERP) system with a Node.js + Express backend and a React + Vite frontend. The backend exposes a REST API and real-time events via Socket.IO. The system covers sales, inventory, HR, payroll, attendance, leaves, pharmacy, rides, and reporting features.

## Key Services Provided

- Authentication & authorization (JWT)
- Sales & POS management
- Inventory and stock tracking
- Customer and supplier management
- Employee management, attendance, shifts
- Leaves and payroll processing
- Expenses and reporting
- Pharmacy/prescription management
- Real-time notifications via WebSockets (Socket.IO)
- Backup and seed scripts for DB initialization

## Tech Stack

- Backend: Node.js, Express, Sequelize ORM
- Database: MySQL / MariaDB (via `mysql2` + Sequelize)
- Real-time: Socket.IO
- Frontend: React, Vite, Tailwind CSS
- Auth: JSON Web Tokens (`jsonwebtoken`)
- Security & Middleware: `helmet`, `cors`, rate-limiting

## Repository Structure (top-level)

- `backend/` — Node.js API and server
  - `config/` — DB config (`database.js`)
  - `models/` — Sequelize models
  - `routes/` — Express route handlers
  - `scripts/` — helper scripts (`createDb.js`, `seed.js`, `verifySystem.js`)
- `frontend/` — React + Vite SPA
- `backups/` — SQL backups
- other docs and helper files

## Important Files

- `backend/server.js` — application entry (API + Socket.IO)
- `backend/config/database.js` — Sequelize DB connection (reads from `.env`)
- `backend/package.json` — backend scripts: `start`, `dev`, `seed`
- `frontend/package.json` — frontend scripts: `dev`, `build`, `preview`

## Environment Variables

Create a `.env` file in `backend/` and set the following variables (example values):

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_NAME=erp_db
DB_USER=root
DB_PASS=changeme
DB_HOST=localhost
DB_PORT=3306

JWT_SECRET=your_jwt_secret_here
```

The backend reads DB config from `process.env` and connects using Sequelize (dialect: `mysql`).

## Getting Started (Local Development)

Prerequisites:
- Node.js (>= 18 recommended)
- npm or pnpm
- MySQL / MariaDB server

Backend

1. Open a terminal and change to the backend folder:

```bash
cd backend
npm install
```

2. Create `.env` as described above.

3. Create the database (you can use the provided script or run MySQL manually):

```bash
# from repository root
node backend/scripts/createDb.js
```

4. Seed initial data (optional but recommended):

```bash
cd backend
npm run seed
```

5. Run the backend server:

```bash
# development with auto-reload
npm run dev

# or start (production)
npm start
```

Frontend

1. Open a terminal and change to the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

2. The frontend default dev server is Vite (usually at `http://localhost:5173`). The backend accepts requests from `FRONTEND_URL` (default `http://localhost:5173`).

## API Routes Summary

The backend mounts a number of route groups under `/api` in `backend/server.js`. Major groups include:

- `/api/auth` — login, register, token endpoints
- `/api/users` — user management
- `/api/customers` — customer CRUD
- `/api/sales` — create and manage sales and receipts
- `/api/inventory` — products, stock, variations
- `/api/hr` — HR utilities
- `/api/employees` — employee records
- `/api/attendance` — attendance recording and reports
- `/api/leaves` — leave requests and balances
- `/api/payroll` — payroll runs and payslips
- `/api/expenses` — company expenses
- `/api/pharmacy` — prescriptions, drugs
- `/api/suppliers` — suppliers management
- `/api/reports` — aggregated reports
- `/api/rides` — ride-related endpoints

For full details, inspect route files under `backend/routes/`.

## Database & Backups

- The app uses Sequelize to manage models and migrations. The connection is configured in `backend/config/database.js`.
- Backups are stored in `backups/` as SQL files. Use your preferred MySQL tooling to import them.

## Scripts and Utilities

- `backend/scripts/createDb.js` — helper to create the database
- `backend/scripts/seed.js` — populates sample data (invoked with `npm run seed` from `backend`)
- `backend/scripts/verifySystem.js` — verification utilities

## Deployment Notes

- Set `NODE_ENV=production` in production and ensure `FRONTEND_URL` points to the public frontend origin.
- Use a process manager (PM2, systemd) or containerization (Docker) for reliability.
- Configure secure DB credentials and restrict DB access to the application host.
- If deploying behind a proxy, ensure proper proxy headers and CORS origins are configured.

## Observability & Security

- Rate limiting is enabled for login endpoints to mitigate brute-force attacks.
- Helmet is used to set HTTP security headers.
- Input sanitization middleware is present in `server.js` to strip basic XSS patterns.

## Troubleshooting

- "Unable to connect to the database": verify `.env` DB settings and that the DB server accepts connections.
- Port conflicts: change `PORT` in `.env`.
- Frontend CORS issues: ensure `FRONTEND_URL` is set to your dev frontend origin.

## Contributing

- Fork the repo and open a PR. Run linters and unit tests locally before submitting.

## License & Contacts

- This repository does not include a license file. Add a license if you plan to publish or share the code.

---

If you want, I can also add a Dockerfile, Docker Compose, or a detailed environment example for production — tell me which you'd prefer.
