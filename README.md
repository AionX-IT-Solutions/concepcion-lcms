# AionX — Electron Vite Boilerplate

A production-ready, futuristic Electron boilerplate with glassmorphism UI, full TypeScript, and a complete CI/CD pipeline.

![CI](https://github.com/your-org/aionx/actions/workflows/ci.yml/badge.svg)
![Build](https://github.com/your-org/aionx/actions/workflows/build.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Stack

| Layer           | Technology                       |
| --------------- | -------------------------------- |
| Shell           | Electron 33                      |
| Bundler         | electron-vite 3 + Vite 6         |
| UI              | React 19 + TypeScript 5          |
| Styling         | Tailwind CSS v3 + Framer Motion  |
| State           | Zustand 5 (persist)              |
| Routing         | React Router v7                  |
| Forms           | React Hook Form + Zod            |
| Components      | Radix UI primitives              |
| i18n            | i18next (EN + TL included)       |
| Logging         | electron-log                     |
| Crash reporting | Sentry (main + renderer)         |
| Analytics       | PostHog                          |
| Testing         | Vitest + Testing Library         |
| Linting         | ESLint + Prettier                |
| Git hooks       | Husky + lint-staged + commitlint |
| CI/CD           | GitHub Actions                   |

---

## Features

- **Frameless window** with custom TitleBar (minimize / maximize / close via IPC)
- **Window state persistence** — remembers size and position across restarts
- **System tray** with show/hide and quit actions
- **Auto-updater** wired to GitHub Releases via `electron-updater`
- **Typed IPC bridge** — shared channel constants and TypeScript types between main and renderer
- **Context isolation** — `contextIsolation: true`, `nodeIntegration: false` throughout
- **Global keyboard shortcut** example (`Ctrl+Shift+A`)
- **Collapsible sidebar** + **StatusBar** layout
- **Dashboard / Settings / About** pages scaffolded
- **Login page** with form validation (React Hook Form + Zod)
- **Glassmorphism / neon** design system (reusable Button, Card, Input, Modal, Badge, Tooltip, Toaster)
- **Error Boundary** wrapping the renderer tree
- **Particle background** and **GlowEffect** shared components
- **Commit linting** enforcing Conventional Commits

---

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-org/aionx.git
cd aionx

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env

# 4. Start development
npm run dev
```

The app opens with hot-reload for both the main process and renderer.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable               | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `VITE_APP_NAME`        | App display name                                   |
| `VITE_APP_VERSION`     | App version string                                 |
| `VITE_GITHUB_URL`      | URL opened by the GitHub button on the About page  |
| `VITE_DOCS_URL`        | URL opened by the Docs button on the About page    |
| `VITE_UPDATE_FEED_URL` | electron-updater feed URL (leave blank to disable) |
| `VITE_ENABLE_DEVTOOLS` | Open DevTools on startup in dev mode               |
| `VITE_SENTRY_DSN`      | Sentry project DSN for crash reporting             |
| `VITE_SENTRY_FORCE`    | Set `true` to enable Sentry in dev mode            |
| `VITE_POSTHOG_KEY`     | PostHog project API key                            |
| `VITE_POSTHOG_HOST`    | PostHog instance URL                               |

---

## Scripts

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Start Electron in development mode with HMR |
| `npm run build`         | Compile TypeScript → `out/`                 |
| `npm run dist`          | Build + package for the current platform    |
| `npm run dist:win`      | Package for Windows (NSIS installer)        |
| `npm run dist:mac`      | Package for macOS (DMG, x64 + arm64)        |
| `npm run dist:linux`    | Package for Linux (AppImage)                |
| `npm run typecheck`     | Type-check all workspaces                   |
| `npm run lint`          | Lint with zero warnings allowed             |
| `npm run lint:fix`      | Lint and auto-fix                           |
| `npm run format`        | Format all files with Prettier              |
| `npm run format:check`  | Check formatting without writing            |
| `npm run test`          | Run tests in watch mode                     |
| `npm run test:run`      | Run tests once (CI)                         |
| `npm run test:coverage` | Run tests and generate coverage report      |

---

## Project Structure

```
src/
├── main/               # Electron main process
│   ├── index.ts        # App lifecycle, window, tray, auto-updater
│   ├── ipc.ts          # IPC handler registrations
│   └── sentry.ts       # Sentry init for main process
├── preload/
│   └── index.ts        # contextBridge API exposed as window.api
├── renderer/
│   └── src/
│       ├── components/
│       │   ├── layout/ # TitleBar, Sidebar, StatusBar
│       │   ├── shared/ # GlowEffect, ParticleBackground
│       │   └── ui/     # Button, Card, Input, Modal, Badge, Tooltip, Toaster, ErrorBoundary
│       ├── hooks/      # useElectron, useTheme, useToast, useAnalytics, useUpdateStatus
│       ├── i18n/       # i18next setup + EN/TL locale files
│       ├── lib/        # Sentry + PostHog init for renderer
│       ├── pages/      # Dashboard, Settings, About, Login
│       ├── store/      # Zustand app store (persisted)
│       └── styles/     # globals.css (Tailwind base + custom CSS vars)
├── shared/
│   └── ipc-types.ts    # Shared IPC channel constants + TypeScript types
└── tests/
    ├── components/     # Component tests (Button, ...)
    ├── store/          # Store tests
    └── setup.ts        # Vitest + Testing Library setup
```

---

## Distribution

Before building a distributable, add platform icons to a `resources/` folder:

```
resources/
├── icon.ico    # Windows (256×256)
├── icon.icns   # macOS
└── icon.png    # Linux (512×512)
```

Then run:

```bash
npm run dist        # current platform
npm run dist:win    # Windows installer
npm run dist:mac    # macOS DMG (universal)
npm run dist:linux  # Linux AppImage
```

Artifacts are output to `dist/`.

For auto-updates, set `VITE_UPDATE_FEED_URL` to your GitHub Releases URL and push a `v*` tag — `build.yml` will produce signed artifacts automatically.

---

## CI/CD

| Workflow    | Trigger                                 | What it does                             |
| ----------- | --------------------------------------- | ---------------------------------------- |
| `ci.yml`    | Push to `main`/`develop`, PRs to `main` | Lint · Type check · Format check · Tests |
| `build.yml` | Push `v*` tag or manual dispatch        | Cross-platform build (Win / Mac / Linux) |

---

## Contributing

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/). The `commit-msg` hook enforces this automatically.

```
feat: add auto-update progress bar
fix: correct sidebar collapse animation
chore: update electron to 33.4
```

---

## License

MIT
