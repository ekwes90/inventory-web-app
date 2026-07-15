# GitHub Issues for Inventory Web App MVP

This document contains issue drafts for the MVP backlog. Each issue includes a short description, acceptance criteria, labels, and story points.

## Epic: Setup & Infrastructure

### Issue: Initialize repository and documentation
- **Estimate:** 3 points
- **Description:** Create the repository structure, README, `.gitignore`, and developer setup documentation.
- **Acceptance criteria:**
  - Root README explains how to install dependencies and run frontend/backend.
  - `.gitignore` ignores generated files and dependencies.
  - A simple project scaffold is present.
- **Labels:** infrastructure, docs

### Issue: Configure combined frontend/backend development workflow
- **Estimate:** 3 points
- **Description:** Wire the frontend to proxy API requests to the backend and add npm scripts for combined development.
- **Acceptance criteria:**
  - `npm run dev` starts the frontend and backend together.
  - Vite config proxies `/api` to the backend.
  - Frontend shows backend health status.
- **Labels:** infrastructure, frontend, backend

## Epic: Backend Core

### Issue: Add Express backend scaffold
- **Estimate:** 5 points
- **Description:** Create a Node.js Express backend with routing, CORS, and a health endpoint.
- **Acceptance criteria:**
  - Backend starts on port 4000.
  - `/api/health` returns `{ status: 'ok' }`.
  - Backend serves JSON API routes under `/api`.
- **Labels:** backend

### Issue: Implement JSON-backed persistence and DB init
- **Estimate:** 5 points
- **Description:** Build a local file-backed persistence layer for items, stock transactions, and users.
- **Acceptance criteria:**
  - Data is persisted to `backend/data.json`.
  - The backend initializes sample data on first run.
  - CRUD operations update the file store.
- **Labels:** backend, persistence

### Issue: Implement authentication and role middleware
- **Estimate:** 5 points
- **Description:** Add login, JWT auth, and role-based route protection.
- **Acceptance criteria:**
  - `/api/auth/login` accepts credentials and returns a token.
  - Protected routes require a valid Bearer token.
  - Admin and staff roles are supported.
- **Labels:** backend, auth

### Issue: Implement item CRUD API
- **Estimate:** 8 points
- **Description:** Add create, read, update, delete endpoints for inventory items.
- **Acceptance criteria:**
  - `/api/items` supports listing, searching, and filtering.
  - `/api/items/:id` supports item retrieval.
  - POST, PUT, DELETE operations work and validate input.
- **Labels:** backend, api

### Issue: Implement stock adjustment API
- **Estimate:** 8 points
- **Description:** Add inbound/outbound stock adjustment support with an audit trail.
- **Acceptance criteria:**
  - `/api/stock/transactions` adjusts item quantity atomically.
  - Negative quantity changes are prevented.
  - Stock transactions are saved and queryable.
- **Labels:** backend, api, inventory

## Epic: Frontend Core

### Issue: Build frontend inventory shell and backend health check
- **Estimate:** 5 points
- **Description:** Create the React scaffold for the inventory app and display backend availability.
- **Acceptance criteria:**
  - App shell displays inventory branding.
  - Backend health endpoint is requested and status is shown.
  - The page loads without errors.
- **Labels:** frontend

### Issue: Add item list and search UX
- **Estimate:** 8 points
- **Description:** Build the item listing page with search and category filter support.
- **Acceptance criteria:**
  - Users can see a list of inventory items.
  - Search and filter controls are wired to the API.
  - The UI handles loading and empty states.
- **Labels:** frontend, ux

### Issue: Add stock adjustment UI
- **Estimate:** 5 points
- **Description:** Add a form for inbound/outbound stock adjustments with confirmation.
- **Acceptance criteria:**
  - Users can choose inbound or outbound adjustments.
  - Reason and quantity are required.
  - The adjustment is sent to the API and a success message is shown.
- **Labels:** frontend, ux

## Epic: Import/Export & Reporting

### Issue: Add CSV import/export endpoints and UI
- **Estimate:** 8 points
- **Description:** Implement CSV import preview and export inventory functionality.
- **Acceptance criteria:**
  - Users can upload a CSV file, preview row validation, and import valid rows.
  - Users can export the current inventory list as CSV.
  - Errors are shown clearly.
- **Labels:** backend, frontend, integration

### Issue: Add dashboard low-stock widget
- **Estimate:** 5 points
- **Description:** Provide a dashboard widget for low-stock alerts and inventory totals.
- **Acceptance criteria:**
  - Dashboard displays items below a configurable threshold.
  - Users can click through to the filtered item list.
- **Labels:** frontend, backend

## Epic: QA & Deployment

### Issue: Add end-to-end tests for core workflows
- **Estimate:** 8 points
- **Description:** Add E2E coverage for item CRUD, stock adjustment, import, and login flows.
- **Acceptance criteria:**
  - E2E tests run in CI.
  - Core workflows are covered.
  - Test failures block merges.
- **Labels:** testing, ci

### Issue: Configure staging deploy and environment setup
- **Estimate:** 5 points
- **Description:** Add deployment configuration for staging with a simple health check.
- **Acceptance criteria:**
  - Staging deploy is automated from the main branch.
  - Environment variables are documented.
  - Health check passes after deploy.
- **Labels:** devops, deploy

### Issue: Document production deployment and backups
- **Estimate:** 5 points
- **Description:** Create a production deployment guide and a backup process for persisted data.
- **Acceptance criteria:**
  - Deployment runbook exists.
  - Backup and restore steps are documented.
  - Production environment considerations are listed.
- **Labels:** docs, ops
