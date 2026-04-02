# Copilot instructions for `blog-frontend`

## Build, lint, and validation commands

Use npm in this repository.

- `npm run dev` - start the Vite dev server on port `3000`
- `npm run build` - production build to `dist/`
- `npm run preview` - preview the built app
- `npm run lint` - ESLint with `--fix` for `.vue`, `.js`, `.jsx`, `.cjs`, `.mjs`
- `npm run lint:style` - Stylelint with `--fix` for `vue/scss/css`
- `npm run format` - Prettier write
- `npm run format:check` - Prettier check

There is currently no automated test runner or `npm test` script in `package.json`, so there is no repo-supported single-test command yet.

## Architecture

This is a Vue 3 + Vite + Element Plus single-page app for a personal blog plus a large “tools” section.

- App bootstrap is in `src/main.js`. It creates the Vue app, installs Pinia, Vue Router, Element Plus, `vue-particles`, and a global TDK mixin from `src/utils/tdk.js`.
- The main application shell is `src/views/Main.vue`. It renders the persistent layout (`NavBar`, `SiteInfo`, footer, scroll progress), fetches global site config on mount, restores the logged-in user from local storage, and owns the global login dialog.
- Routing is centralized in `src/router/index.js`. Most routes are children of `Main.vue`, and the toolbox is a nested route tree under `/tools`.
- API access lives in `src/apis/`. `src/apis/base.js` creates the shared axios instance, defaults requests to `baseURL: /api/frontend`, injects the bearer token from `localStorage`, and unwraps axios responses by returning `response.data`.
- Global state lives in Pinia stores under `src/store/`. `user` owns auth/session state and login-dialog coordination; `config` owns site-wide configuration such as title, description, about text, quota info, and background media.
- SEO/metadata is handled by `src/utils/tdk.js`. Pages commonly expose a `tdk()` option; composition-style pages can use `useTDK()`.

## Key codebase conventions

### Environment and dev server

- Vite loads environment variables from `.js.env`, not from the usual `.env` files. See `.js.env.example`.
- The dev server proxy in `vite.config.js` forwards `/api` to `process.env.API_HOST`.
- The `@` alias always points to `src/`.

### API response shape

- `src/apis/base.js` already returns `response.data` from axios interceptors, so API modules do **not** return the full axios response object.
- Many backend endpoints still return payloads shaped like `{ data: ... }`, so callers often read `response.data` after the interceptor unwraps once.
- When changing or adding API calls, inspect the existing endpoint usage first. Do not assume every call should use either `response` or `response.data`; both patterns exist because the backend payloads are inconsistent.
- If an endpoint path starts with `/api/`, `base.js` clears the default `baseURL`, which is how code opts out of the `/api/frontend` prefix for raw proxied endpoints.

### Vue component style

- This codebase mixes Options API and Composition API in the same component. A common pattern is:
  - `setup()` only returns stores or simple helpers
  - `data`, `computed`, `methods`, `mounted`, and watchers stay in Options API
  - Pinia helpers such as `mapState` / `mapActions` are used from Options API
- Match the existing style of the file you are editing instead of converting components wholesale.

### Global config, auth, and dialogs

- `Main.vue` is responsible for fetching site config and for restoring the current user if a token exists in local storage.
- Unauthorized API responses trigger `userStore.setShowLoginDialog(true)` from the shared axios response interceptor.
- `src/store/user.js` also coordinates a single global dialog owner with `loginDialogOwnerId`. Reuse that pattern when touching login or guest-info dialogs so only one dialog instance renders at a time.
- Successful login dispatches the custom browser event from `src/utils/auth-events.js`; some pages listen for that event instead of polling store changes.

### SEO / TDK

- Prefer the repo’s TDK system over ad hoc `document.title` updates.
- Options API pages usually expose a `tdk()` function.
- Composition API pages can use `useTDK()`.
- The global mixin appends the site title from `configStore` for option-based TDK pages.

### Routing structure

- Most page routes are lazy-loaded under the `Main.vue` shell.
- Tool pages are nested children of `/tools`, rendered through `src/views/tools/ToolsBox.vue`.
- Error pages (`403`, `404`, `500`) are regular routed views, and unknown routes redirect to `/404`.

### Styling and formatting

- Prettier config: no semicolons, single quotes, width `120`.
- ESLint intentionally allows `console` and only warns on `vue/no-mutating-props`.
- The project uses SCSS heavily; some files still use deprecated Sass `@import` and deprecated `::v-deep` combinator syntax. Keep changes consistent unless you are intentionally modernizing the surrounding file.
