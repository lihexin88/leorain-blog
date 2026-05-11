# Self-Blog Frontend

[简体中文](./README.zh-CN.md) | English

A modern, full-featured personal blog frontend built with Vue 3, Vite, and Element Plus.

Live preview: [https://www.leorain.cn](https://www.leorain.cn)

## Features

### Content management

- **Article display**: Supports Markdown rendering and automatically generated article outlines.
- **Categories and tags**: Quickly browse content through category lists and tag clouds.
- **Guestbook**: Supports nested comments and emoji interactions.
- **Recommended articles**: Recommends related content based on the current article.

### Online toolbox

Includes a collection of practical online tools for development and learning:

- **Code runner**: Supports online execution and formatting for PHP, Java, Python, Golang, C, C++, JSON, and more.
- **Time tools**: Timestamp conversion, countdowns, and related utilities.
- **Base conversion**: Converts values between multiple number bases.
- **Schulte Grid**: Focus training tool with score statistics.
- **Drawing board**: Online drawing tool.
- **Resource management**: View system assets and file lists.
- **More tools**: Clipboard management, CPU information viewer, slack-off calendar, media tools, lottery tools, and more.

### TDK metadata system

Provides flexible page metadata management for Title, Description, and Keywords:

- **Static declaration**: Define fixed TDK metadata directly inside components.
- **Dynamic updates**: Generate SEO-friendly metadata from asynchronously loaded data, such as article details.
- **Global mixin**: Supports both Options API through the `tdk` option and Composition API through the `useTDK` hook.

### Other capabilities

- **Responsive design**: Works well on mobile phones, tablets, and desktop screens.
- **Background switching**: Supports dynamic video backgrounds and static image backgrounds.
- **User system**: Supports login and profile management.
- **Scroll progress**: Displays reading progress at the top of the page.

---

## Directory structure

```text
src/
├── apis/                  # API request wrappers based on axios
│   ├── article.js         # Article-related APIs
│   ├── schulte.js         # Schulte Grid APIs
│   └── ...
├── assets/                # Static assets
│   ├── images/            # Images and logos
│   └── styles/            # Global SCSS styles
├── components/            # Shared business components
│   ├── MarkdownParse.vue  # Markdown rendering component
│   ├── NavBar.vue         # Navigation bar
│   └── ...
├── router/                # Router configuration
├── store/                 # Pinia state management
├── utils/                 # Utility functions
│   ├── tdk.js             # Core TDK metadata logic
│   └── helpers.js         # Formatting, conversion, and common helpers
└── views/                 # Page-level components
    ├── home/              # Home page and article details
    ├── tools/             # Toolbox feature pages
    ├── user/              # Login and user center
    └── ...
```

---

## Installation and usage

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later is recommended.
- [npm](https://www.npmjs.com/)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the local environment

```bash
cp .js.env.example .js.env
```

Update `.js.env` for your local or deployment environment:

- `API_HOST`: Backend API service address. The Vite development proxy forwards `/api` requests to this address.
- `DRAW_WS_HOST`: WebSocket or tool service address for the drawing board, request logs, online terminal, and related features.
- `ARTISAN_HOST`: Local Artisan or backend helper service address.
- `BROWSERSYNC_PROXY`: Optional proxy address for BrowserSync.

`.js.env` is only for local environments and is ignored by `.gitignore`. Do not commit real deployment addresses, tokens, or secrets.

### 3. Start local development

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

### 6. Lint and format code

```bash
npm run lint
npm run lint:style
npm run format:check
npm run format
```

---

## Public release notes

- Do not commit sensitive files such as `.js.env`, `.env`, certificates, private keys, or access tokens.
- Put deployment domains, API addresses, and download URLs in local environment files, hosting platform environment variables, or backend configuration.
- This project uses npm and `package-lock.json` for dependency management. Avoid mixing lock files from other package managers.

---

## TDK system usage

### Options API

Add a `tdk` option to a component:

```javascript
export default {
  tdk() {
    return {
      title: this.article.title + ' - Details',
      description: this.article.summary,
      keywords: 'keyword1, keyword2'
    }
  }
}
```

### Composition API

Use the `useTDK` hook:

```javascript
import { useTDK } from '@/utils/tdk'

setup() {
  useTDK(() => ({
    title: 'Page title',
    description: 'Page description'
  }))
}
```
