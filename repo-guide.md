# Stackiv Monorepo — Developer Onboarding Guide

Welcome to the **Stackiv** project! This document will help you understand the monorepo structure, setup your environment, and start the frontend and backend apps smoothly.

---

## 1. Overview

This is a **monorepo** managed with [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/), containing multiple apps and shared packages.

-   **Apps**: Complete runnable applications
-   **Packages**: Shared code/libraries used by apps and other packages

---

## 2. Directory Structure

```
Stackiv/
├── apps/
│   ├── hosts/           # Frontend Next.js app (React, app-router)
│   └── backend/         # Backend Node.js + Express API server
│
├── packages/
│   ├── shared-types/    # Shared TypeScript types
│   ├── shared-auth/     # Firebase client SDK auth helpers
│   ├── shared-i18n/     # Internationalization (i18n) utilities
│   ├── shared-config/   # Shared constants and config
│   ├── shared-redux/    # Redux toolkit slices and hooks
│   └── shared-api/      # Shared API helpers (axios wrappers etc.)
│
├── .nvmrc               # Node.js version (v20.x)
├── package.json         # Root workspace config & scripts
├── tsconfig.json        # Root TypeScript project references
├── yarn.lock            # Yarn lockfile
└── ...
```

---

## 3. Environment Setup

### Node.js version

-   We use **Node.js v20.x** — managed by [nvm](https://github.com/nvm-sh/nvm)
-   Make sure you have `nvm` installed, then run:

```bash
nvm use
```

This reads `.nvmrc` and switches your node version.

### Yarn

-   Use Yarn for package management

If you don’t have Yarn installed globally:

```bash
npm install -g yarn
```

---

## 4. Environment Variables

### Frontend (`apps/hosts`)

-   Use `.env.local` file for your **public** Firebase config keys and other frontend environment variables
-   Variables must start with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
-   This file is **not committed to Git** — create your own based on `.env.local.example` if provided

### Backend (`apps/backend`)

-   Use `.env` file for private keys and secrets, like Firebase Admin SDK private key, MongoDB URI, JWT secret, etc.
-   This file is **never exposed to frontend** and should be secured
-   Example keys: `FIREBASE_PRIVATE_KEY`, `MONGODB_URI`, `JWT_SECRET`

---

## 5. How to Start the App (Development)

At the root of the repo:

```bash
yarn install
```

This installs all dependencies across apps and packages.

Then, to start both frontend and backend concurrently:

```bash
yarn run dev
```

-   This runs the script defined in root `package.json` which launches:

    -   `hosts` frontend on **[http://localhost:3001](http://localhost:3001)**
    -   `backend` API server on **[http://localhost:5001](http://localhost:5001)**

Both servers will watch your code for changes and reload automatically.

---

## 6. Notes on the Stack

-   **Frontend**

    -   Next.js (latest) with the new app-router
    -   Uses Firebase Client SDK for authentication (email/password + Google login)
    -   Connects to backend API on `localhost:5001`
    -   Uses shared packages for types, Redux slices, API calls, i18n, and auth helpers

-   **Backend**

    -   Node.js with Express
    -   Uses Firebase Admin SDK to verify auth tokens securely
    -   Connects to MongoDB Atlas for database
    -   Provides REST API endpoints consumed by frontend

-   **Shared packages**

    -   Organized as buildable TypeScript projects with `composite: true`
    -   Shared logic and types to avoid duplication and ensure type safety

---

## 7. Useful Commands

| Command                      | Description                             |
| ---------------------------- | --------------------------------------- |
| `yarn install`               | Install all dependencies                |
| `yarn run dev`               | Start frontend and backend concurrently |
| `yarn workspace hosts dev`   | Start frontend only                     |
| `yarn workspace backend dev` | Start backend only                      |
| `tsc -b`                     | Build all TS packages and apps          |

---

## 8. Troubleshooting

-   If you run into version mismatches, make sure you’re running Node 20.x with `nvm use`
-   Delete `node_modules` and run `yarn install` again if dependency issues arise
-   Check `.env.local` and `.env` files for correct environment variables
-   Make sure your Firebase project configs are up-to-date

---

## 9. Additional Notes

-   The monorepo uses TypeScript project references for faster incremental builds and tight integration between packages
-   Keep `shared-` packages focused on reusable logic, avoiding app-specific code
-   Follow coding conventions in `hosts` and `backend` for consistent style and architecture

---

# You’re all set! 🎉

If you get stuck or want to improve something, please ask a senior dev or check the docs linked in the repo.

Welcome aboard and happy coding! 🚀
