# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use npm in this repository.

- `npm install` - install dependencies
- `npm run dev` - start the Vite dev server on port `3000`
- `npm run build` - production build to `dist/`
- `npm run preview` - preview the built app
- `npm run lint` - run ESLint with `--fix` for `.vue`, `.js`, `.jsx`, `.cjs`, `.mjs`
- `npm run lint:style` - run Stylelint with `--fix` for `vue/scss/css`
- `npm run format` - format with Prettier
- `npm run format:check` - check Prettier formatting

There is currently no automated test runner and no `npm test` script in `package.json`, so there is no repository-supported single-test command yet.

## Project overview

This is a Vue 3 + Vite + Element Plus single-page app for a personal blog with content pages, user/auth flows, comments/guestbook, assets, games, topics, and a large online tools section.

- App bootstrap is in `src/main.js`. It creates the Vue app, installs Pinia, Vue Router, Element Plus, `vue-particles`, global styles, and the global TDK mixin from `src/utils/tdk.js`.
- `src/App.vue` is only the root router outlet. The main application shell is `src/views/Main.vue`.
- `src/views/Main.vue` owns the persistent layout (`NavBar`, `SiteInfo`, `ScrollProgress`, footer), background image/video rendering, global config fetch, user restoration from local storage, and the global login dialog.
- Routing is centralized in `src/router/index.js`. Most pages are lazy-loaded children under `Main.vue`; `/tools` is a nested route tree rendered through `src/views/tools/ToolsBox.vue`; unknown routes redirect to `/404`.
- API modules live in `src/apis/`. `src/apis/base.js` creates the shared axios instance and interceptors.
- Global state lives in Pinia stores under `src/store/`, mainly `user` for auth/session/dialog state and `config` for site-wide settings.
- Shared business UI lives in `src/components/`; page-level views live in `src/views/`; helpers live in `src/utils/`.

## Environment and build configuration

- Vite loads environment variables from `.js.env`, not the usual `.env` files. Use `.js.env.example` as the template.
- The dev server proxy in `vite.config.js` forwards `/api` to `process.env.API_HOST`.
- The `@` alias points to `src/` in both `vite.config.js` and `tsconfig.json`.
- `vue.config.js` is present from Vue CLI-era configuration, but active development/build scripts use Vite.

## API conventions

- `src/apis/base.js` sets `baseURL` to `/api/frontend`, injects `Authorization: Bearer <token>` from `localStorage`, and adds `apiOrigin: frontend` to request headers.
- If an API call path starts with `/api/`, the request interceptor clears `baseURL`; this opts that call out of the `/api/frontend` prefix for raw proxied endpoints such as code execution.
- The axios response interceptor returns `response.data`, so API modules do not return the full axios response object.
- Backend payloads are not fully consistent: many callers still read `response.data` after the interceptor unwraps once. Inspect nearby usage before deciding whether a caller should use `response` or `response.data`.
- Unauthorized API responses trigger `userStore.setShowLoginDialog(true)` from the shared response interceptor.

## Auth, global config, and dialogs

- `Main.vue` fetches site config on mount and restores the current user if a token exists but user data is missing.
- `src/store/user.js` owns `user`, `token`, login/logout actions, and login/guest dialog state.
- Login state is persisted in `localStorage` under `token` and `user`.
- Successful login/logout dispatch custom browser events from `src/utils/auth-events.js`; some pages listen for these events instead of polling store state.
- `userStore.loginDialogOwnerId` coordinates a single global login dialog owner. Reuse that pattern when touching login or guest-info dialogs so multiple dialog instances do not render at once.

## SEO / TDK metadata

- Prefer the repository's TDK system in `src/utils/tdk.js` over ad hoc `document.title` updates.
- Options API pages commonly expose a `tdk()` option; the global mixin appends the site title from `configStore`.
- Composition API pages can use `useTDK()` for reactive title/description/keywords updates.
- `router.afterEach` applies the site title as a fallback when no matched component defines `tdk`.

## Vue and styling conventions

- Components mix Options API and Composition API. A common pattern is to return stores/helpers from `setup()` while keeping `data`, `computed`, `methods`, lifecycle hooks, and watchers in Options API.
- Match the style of the component being edited instead of converting components wholesale.
- Pinia helpers such as `mapState` and `mapActions` are used from Options API in parts of the app.
- Prettier config uses no semicolons, single quotes, two spaces, no trailing commas, and `printWidth: 120`.
- ESLint allows `console`, disables `prefer-const`, and warns on `vue/no-mutating-props`.
- SCSS is used heavily. Some files still use deprecated Sass `@import` and older deep selector patterns; keep local consistency unless intentionally modernizing the surrounding file.
