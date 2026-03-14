# Tire CRM & WMS - Telegram Mini Apps

Monorepo containing two Telegram Mini Apps (TMAs) for a tire and wheel store, powered by a Go backend.

## Architecture & Stack

- **Client TMA (`apps/client-tma`)**: Storefront for buyers. Includes product catalog, shopping cart, and checkout flow.
- **Staff TMA (`apps/staff-tma`)**: CRM/WMS for staff and administrators. Features a QR scanner, order management, transfers, and a P&L dashboard.
- **Shared (`packages/shared`)**: Common logic including API clients (Axios), authentication handling (Telegram `initData`), global state (Zustand), and UI components.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, Zustand, React Query, Telegram WebApp SDK.

## Prerequisites

- Node.js (v20+ recommended)
- npm (v9+)
- Docker & Docker Compose (for containerized environments)

## Local Development

1. Install dependencies across the monorepo:
   ```bash
   npm install
    ```
2. Start the development servers for both TMAs:
```bash
   npm run dev --workspace=client-tma
   npm run dev --workspace=staff-tma
   ```

## Docker Deployment
This repository uses a single multi-stage Dockerfile that accepts an APP_NAME build argument to compile and serve the specific application via Nginx.

To spin up both applications locally using Docker Compose:

```bash
docker-compose up -d --build
   ```
- Client TMA will be available on http://localhost:8080 
- Staff TMA will be available on http://localhost:8081