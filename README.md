# Inventory Web App MVP Scaffold

This repository contains a starter scaffold for an inventory web application using:
- Frontend: React + Vite
- Backend: Node.js + Express
- Persistence: simple JSON-backed local store for rapid local development

## What is included
- Frontend scaffold with a starter app and API proxy to `/api`
- Backend scaffold in `backend/` with auth, item CRUD, and stock transaction endpoints
- Project backlog as GitHub issue drafts in `GITHUB_ISSUES.md`
- Basic development commands and wiring for a combined frontend/backend workflow

## Quick start
1. Install root dependencies:
   ```bash
   npm install
   ```
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```
3. Start both frontend and backend together:
   ```bash
   npm run dev
   ```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on port `4000`.

## Backend details
- The backend listens on `http://localhost:4000`
- API root: `/api`
- Sample credentials:
  - `admin` / `admin123`
  - `staff` / `staff123`

## Notes
- This scaffold is designed for MVP development and local prototyping.
- The backend uses a file-backed store at `backend/data.json`.
- For a production-ready release, replace the JSON store with a database like PostgreSQL and add real password hashing.

## Backlog
See `GITHUB_ISSUES.md` for a list of issues, acceptance criteria, and point estimates.
