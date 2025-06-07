# stayinn

**Work in progress 🚧**  
Stayinn is a full-stack monorepo app currently under development. This app will support multiple user roles, authentication with Firebase (email, Google, phone), and data persistence via MongoDB Atlas.

---

## 🧱 Project Structure

This monorepo uses **Yarn Workspaces** to manage shared packages and multiple applications:

```

stayinn/
│
├── apps/
│   ├── hosts/           # Frontend (Next.js)
│   └── backend/         # Backend (Node.js / Express)
│
├── packages/
│   ├── shared-auth/     # Firebase logic (frontend-side)
│   └── shared-types/    # Shared TypeScript types/interfaces

```

---

## ⚙️ Development Setup (No Docker)

> Docker is intentionally skipped during early development to speed up iteration (e.g. `yarn add`, live reload, hot module changes). Docker will be reintroduced during deployment or staging setup.

### Prerequisites

-   Node.js (>= 18.x)
-   Yarn (v1 or v3, depending on your setup)
-   MongoDB Atlas account (or local MongoDB for testing)
-   Firebase project setup

---

## 🧑‍💻 Getting Started

From the root of the repo:

```bash
# Install all dependencies
yarn install

# Start backend and frontend together
yarn dev
```

To run individual apps:

```bash
# Start backend API server
yarn workspace backend dev

# Start frontend (hosts - Next.js)
yarn workspace hosts dev
```

---

## 📦 Shared Packages

This repo includes shared code organized in `/packages`:

-   `shared-types`: Common types and interfaces
-   `shared-auth`: Shared Firebase logic (used in frontend)

These packages are imported using TypeScript path aliases and watched during local development for hot reload.

---

## 📌 Notes

-   All development is currently done **outside of Docker** for speed and simplicity.
-   Docker will be reintroduced later for staging, CI/CD, and production.
-   Firebase config and secrets should **not** be committed. Use `.env.local` files per app.

---

## 🚀 Upcoming

-   ✅ Monorepo with Yarn Workspaces
-   ✅ Shared type packages
-   🔜 Authentication flow (email, Google, phone via Firebase)
-   🔜 MongoDB persistence layer
-   🔜 Email verification flow
-   🔜 Session/token auth

---

## 🧠 Why no Docker yet?

> Docker adds overhead during rapid iteration (e.g., frequent `yarn add`, file watching, rebuilds). It also creates duplication between host and container `node_modules`, which can be cumbersome early on.
> We'll reintroduce Docker once the project reaches a stable milestone (e.g., production API, frontend routes, CI pipelines).

---

## 🛠️ Tools Used

-   Next.js
-   Node.js / Express
-   Firebase Auth SDK
-   MongoDB Atlas
-   TypeScript
-   TailwindCSS + daisyUI
-   Yarn Workspaces
-   Amazon S3

---

### 🌐 Internationalization (i18n)

We use **`react-i18next`** to enable translation support across apps. The translations and config are managed in a shared package: [`packages/shared-i18n`](../packages/shared-i18n).

#### Shared i18n Setup

-   Add `shared-i18n` as a workspace under `packages/`.
-   Install `i18next`, `react-i18next`, and optionally `i18next-browser-languagedetector`, `i18next-http-backend`.
-   Create locale JSON files (`en.json`, `fr.json`, etc.) under `locales/`.
-   Setup:

    ```ts
    // shared-i18n/src/config/initWeb.ts
    import i18n from 'i18next';
    import { initReactI18next } from 'react-i18next';
    import en from '../locales/en.json';
    import fr from '../locales/fr.json';

    i18n.use(initReactI18next).init({
        resources: {
            en: { translation: en },
            fr: { translation: fr },
        },
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
    });

    export default i18n;
    ```

---

### 🧠 Server-side Translations with Next.js

To support translations during SSR (e.g. in `app/page.tsx` or `layout.tsx`):

1. Add a pure `i18next` setup:

    ```ts
    // shared-i18n/src/server.ts
    import { createInstance } from 'i18next';
    import en from './locales/en.json';
    import fr from './locales/fr.json';

    const resources = { en: { translation: en }, fr: { translation: fr } };

    export async function getServerTranslation(lang: 'en' | 'fr') {
        const i18n = createInstance();
        await i18n.init({ lng: lang, fallbackLng: 'en', resources });
        return i18n.getFixedT(lang);
    }
    ```

2. ⚠️ **Important**: Export this utility separately in `package.json` under a `server` path using `"exports"`:

    ```json
    // shared-i18n/package.json
    "exports": {
      ".": "./dist/index.js",
      "./server": "./dist/server.js"
    }
    ```

    This ensures React-internal modules like `react-i18next` are not bundled accidentally in server-only contexts (which caused major debugging issues).

---
