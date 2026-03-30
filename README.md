# Staffowner Dashboard

A production-ready React + TypeScript dashboard built with Vite and TailwindCSS. The project now uses a scalable feature-oriented architecture, includes authentication, protected routes, owner-only admin pages, login history tracking, toast feedback, dark mode toggle, and a customer loyalty tier system.

## Tech Stack

- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- Sonner (toast notifications)

## Installation

```bash
npm install
```

## Development Commands

```bash
npm run dev
npm run build
```

## Folder Structure

```text
src/
  app/
    App.tsx
    router.tsx
  auth/
    AuthProvider.tsx
    LoginPage.tsx
  components/
    dashboard/
    navigation/
    ui/
  pages/
    DashboardPage.tsx
    ProfilePage.tsx
    SettingsPage.tsx
    admin/
  hooks/
  services/
  utils/
  types/
  assets/
```

## Demo Accounts

- `owner@happytails.com` (role: owner)
- `staff@happytails.com` (role: staff)
- Any non-empty password for demo mode

## API Configuration

This UI expects a backend that serves endpoints under `/api/*` (dashboard, orders, menu, customers, etc.).

- **Local dev without a backend:** the app uses a built-in mock API by default when running `npm run dev` (or set `VITE_USE_MOCK_API=true`).
- **Connect a real backend:** set `VITE_API_BASE_URL` (e.g. in `.env.local`) to your API origin (example: `VITE_API_BASE_URL=http://localhost:3000`).
