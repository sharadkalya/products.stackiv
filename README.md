# stackiv

**Work in progress 🚧**  
Stackiv is a full-stack monorepo app currently under development. This app will support multiple user roles, authentication with Firebase (email, Google, phone), and data persistence via MongoDB Atlas.

---

## 🧱 Project Structure

This monorepo uses **Yarn Workspaces** to manage shared packages and multiple applications:

```

stackiv/
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

```
stayinn
├─ .DS_Store
├─ .eslintrc.json
├─ .nvmrc
├─ .prettierrc
├─ README.md
├─ apps
│  ├─ backend
│  │  ├─ eslint.config.mjs
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ .DS_Store
│  │  │  ├─ controllers
│  │  │  │  ├─ ask.controller.ts
│  │  │  │  ├─ auth.controller.ts
│  │  │  │  ├─ dashboard.controller.ts
│  │  │  │  ├─ dummy.controller.ts
│  │  │  │  └─ odoo.controller.ts
│  │  │  ├─ db.ts
│  │  │  ├─ graphql
│  │  │  ├─ index.ts
│  │  │  ├─ middleware
│  │  │  │  ├─ jwt.middleware.ts
│  │  │  │  └─ requireBody.middleware.ts
│  │  │  ├─ models
│  │  │  │  ├─ interactions.model.ts
│  │  │  │  ├─ messages.model.ts
│  │  │  │  ├─ odoo.model.ts
│  │  │  │  ├─ odooSyncStatus.model.ts
│  │  │  │  └─ user.model.ts
│  │  │  ├─ services
│  │  │  │  ├─ ask.service.ts
│  │  │  │  ├─ auth.service.ts
│  │  │  │  └─ odoo.service.ts
│  │  │  ├─ types
│  │  │  │  ├─ .DS_Store
│  │  │  │  ├─ ask.d.ts
│  │  │  │  ├─ auth.d.ts
│  │  │  │  ├─ express.d.ts
│  │  │  │  └─ odoo.d.ts
│  │  │  └─ utils
│  │  │     ├─ askHelpers
│  │  │     │  ├─ helper.ts
│  │  │     │  ├─ ollama.ts
│  │  │     │  └─ openAi.ts
│  │  │     ├─ commonHelper.ts
│  │  │     ├─ cookiesHelper.ts
│  │  │     ├─ firebase
│  │  │     │  ├─ firebaseAdminInit.ts
│  │  │     │  └─ firebaseHelper.ts
│  │  │     ├─ formatError.ts
│  │  │     ├─ jwtUtils.ts
│  │  │     └─ response.ts
│  │  ├─ tsconfig.json
│  │  └─ yarn.lock
│  └─ hosts
│     ├─ README.md
│     ├─ components.json
│     ├─ eslint.config.mjs
│     ├─ next-env.d.ts
│     ├─ next.config.ts
│     ├─ package.json
│     ├─ postcss.config.mjs
│     ├─ public
│     │  ├─ file.svg
│     │  ├─ globe.svg
│     │  ├─ icons
│     │  │  ├─ fb.svg
│     │  │  ├─ g-logo.png
│     │  │  └─ google.svg
│     │  ├─ next.svg
│     │  ├─ vercel.svg
│     │  └─ window.svg
│     ├─ src
│     │  ├─ app
│     │  │  ├─ App.tsx
│     │  │  ├─ dashboard
│     │  │  │  └─ page.tsx
│     │  │  ├─ favicon.ico
│     │  │  ├─ globals.css
│     │  │  ├─ login
│     │  │  │  ├─ components
│     │  │  │  │  ├─ EmailLogin.tsx
│     │  │  │  │  └─ PhoneLogin.tsx
│     │  │  │  └─ page.tsx
│     │  │  ├─ odoo
│     │  │  │  ├─ components
│     │  │  │  │  ├─ OdooApp.tsx
│     │  │  │  │  └─ OdooSidebar.tsx
│     │  │  │  └─ page.tsx
│     │  │  ├─ page.tsx
│     │  │  ├─ signup
│     │  │  │  ├─ components
│     │  │  │  │  └─ Signup.tsx
│     │  │  │  └─ page.tsx
│     │  │  ├─ stackivcharts
│     │  │  │  └─ page.tsx
│     │  │  └─ stackivdocs
│     │  │     ├─ Ask.tsx
│     │  │     ├─ [interactionId]
│     │  │     │  ├─ analysis
│     │  │     │  │  └─ page.tsx
│     │  │     │  ├─ chat
│     │  │     │  │  └─ page.tsx
│     │  │     │  ├─ faq
│     │  │     │  │  └─ page.tsx
│     │  │     │  ├─ page.tsx
│     │  │     │  └─ summary
│     │  │     │     └─ page.tsx
│     │  │     ├─ components
│     │  │     │  ├─ AskFeatures.tsx
│     │  │     │  ├─ AskFileUpload.tsx
│     │  │     │  ├─ AskHeader.tsx
│     │  │     │  ├─ AskHistory.tsx
│     │  │     │  ├─ AskTextUpload.tsx
│     │  │     │  └─ Separator.tsx
│     │  │     ├─ constants.ts
│     │  │     ├─ hooks
│     │  │     │  └─ useAsk.ts
│     │  │     ├─ page.tsx
│     │  │     └─ styles
│     │  │        └─ ask.scss
│     │  ├─ components
│     │  │  ├─ AuthProvider.tsx
│     │  │  ├─ AuthRedirect.tsx
│     │  │  ├─ I18nProvider.tsx
│     │  │  ├─ common
│     │  │  │  ├─ Alert.tsx
│     │  │  │  ├─ Breadcrumb.tsx
│     │  │  │  ├─ ConfirmModal.tsx
│     │  │  │  ├─ FormInput.tsx
│     │  │  │  ├─ FullScreenLoader.tsx
│     │  │  │  ├─ Logo.tsx
│     │  │  │  ├─ MarkdownRenderer.tsx
│     │  │  │  └─ SocialLogin.tsx
│     │  │  ├─ nav
│     │  │  │  ├─ Footer.tsx
│     │  │  │  └─ Header.tsx
│     │  │  └─ odoo
│     │  │     └─ ConnectionSetup.tsx
│     │  ├─ hooks
│     │  │  └─ useAuth.ts
│     │  ├─ lib
│     │  ├─ middleware.ts
│     │  └─ utils
│     │     ├─ cookiesUtil.ts
│     │     ├─ logUtility.ts
│     │     └─ toast.ts
│     └─ tsconfig.json
├─ automation
│  ├─ .DS_Store
│  ├─ cucumber.js
│  ├─ features
│  │  └─ first_test.feature
│  ├─ package.json
│  ├─ playwright.config.js
│  ├─ reports
│  │  ├─ .DS_Store
│  │  └─ html-report-chromium
│  │     ├─ assets
│  │     │  ├─ css
│  │     │  │  ├─ bootstrap.min.css
│  │     │  │  ├─ dataTables.bootstrap.min.css
│  │     │  │  ├─ font-awesome.min.css
│  │     │  │  ├─ responsive.bootstrap5.min.css
│  │     │  │  └─ responsive.dataTables.min.css
│  │     │  ├─ fonts
│  │     │  │  ├─ FontAwesome.otf
│  │     │  │  ├─ fontawesome-webfont.eot
│  │     │  │  ├─ fontawesome-webfont.svg
│  │     │  │  ├─ fontawesome-webfont.ttf
│  │     │  │  ├─ fontawesome-webfont.woff
│  │     │  │  ├─ fontawesome-webfont.woff2
│  │     │  │  ├─ glyphicons-halflings-regular.eot
│  │     │  │  ├─ glyphicons-halflings-regular.svg
│  │     │  │  ├─ glyphicons-halflings-regular.ttf
│  │     │  │  ├─ glyphicons-halflings-regular.woff
│  │     │  │  └─ glyphicons-halflings-regular.woff2
│  │     │  ├─ img
│  │     │  │  └─ ghost.svg
│  │     │  └─ js
│  │     │     ├─ Chart.min.js
│  │     │     ├─ bootstrap.min.js
│  │     │     ├─ darkmode.js
│  │     │     ├─ dataTables.responsive.min.js
│  │     │     ├─ datatables.bootstrap5.min.js
│  │     │     ├─ datatables.jquery.min.js
│  │     │     ├─ datatables.min.js
│  │     │     ├─ html5shiv.min.js
│  │     │     ├─ jquery.min.js
│  │     │     └─ responsive.bootstrap5.js
│  │     ├─ features
│  │     │  ├─ 5a7a5aea-d88d-490d-86b4-4e6022510f96-first-test.html
│  │     │  └─ cfc0d41b-1392-4bac-96a6-3d83e28fc5ff-first-test.html
│  │     └─ index.html
│  ├─ step_definitions
│  │  └─ first_test.js
│  ├─ test-results
│  │  └─ .last-run.json
│  ├─ utils
│  │  ├─ browserHelper.js
│  │  └─ generate-report.js
│  └─ yarn.lock
├─ package.json
├─ packages
│  ├─ shared-api
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ config.ts
│  │  │  ├─ index.ts
│  │  │  └─ modules
│  │  │     ├─ ask.ts
│  │  │     ├─ auth.ts
│  │  │     ├─ dashboard.ts
│  │  │     ├─ dummy.ts
│  │  │     └─ odoo.ts
│  │  └─ tsconfig.json
│  ├─ shared-auth
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ firebase
│  │  │  │  ├─ auth.ts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ init.ts
│  │  │  └─ index.ts
│  │  └─ tsconfig.json
│  ├─ shared-config
│  │  ├─ .eslintrc.json
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ constants
│  │  │  │  ├─ appConstants.ts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ odooConstants.ts
│  │  │  └─ index.ts
│  │  └─ tsconfig.json
│  ├─ shared-i18n
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ config
│  │  │  │  ├─ common.ts
│  │  │  │  └─ initWeb.ts
│  │  │  ├─ index.ts
│  │  │  ├─ locales
│  │  │  │  ├─ en.json
│  │  │  │  └─ fr.json
│  │  │  └─ server.ts
│  │  └─ tsconfig.json
│  ├─ shared-redux
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ hooks.ts
│  │  │  ├─ index.ts
│  │  │  ├─ modules
│  │  │  │  ├─ ask
│  │  │  │  │  ├─ askActions.ts
│  │  │  │  │  ├─ askReducer.ts
│  │  │  │  │  ├─ askSelector.ts
│  │  │  │  │  └─ askSlice.ts
│  │  │  │  ├─ auth
│  │  │  │  │  ├─ authActions.ts
│  │  │  │  │  ├─ authReducer.ts
│  │  │  │  │  ├─ authSelector.ts
│  │  │  │  │  └─ authSlice.ts
│  │  │  │  └─ dummy
│  │  │  │     ├─ dummyActions.ts
│  │  │  │     ├─ dummyReducer.ts
│  │  │  │     └─ dummySlice.ts
│  │  │  └─ store.ts
│  │  └─ tsconfig.json
│  └─ shared-types
│     ├─ package.json
│     ├─ src
│     │  ├─ index.ts
│     │  ├─ schemas
│     │  │  ├─ auth.ts
│     │  │  └─ index.ts
│     │  └─ types
│     │     ├─ auth.ts
│     │     ├─ index.ts
│     │     ├─ odoo.ts
│     │     └─ user.ts
│     └─ tsconfig.json
├─ repo-guide.md
├─ tsconfig.json
└─ yarn.lock

```