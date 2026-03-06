# Sitemap Generator

A visual, interactive sitemap builder inspired by [Relume](https://www.relume.io/). Create, organize, and export your website's page architecture with an infinite canvas, recursive page hierarchies, and AI-powered generation.

![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

- **Infinite Canvas** — Pan and zoom across large sitemap diagrams on a dot-grid background.
- **Recursive Page Hierarchy** — Nest pages infinitely with a clean tree layout and connector lines.
- **Page Sections** — Add dynamic vertical sections (Navbar, Hero, Features, Footer, etc.) to each page with editable titles and descriptions.
- **AI Sitemap Generation** — Describe your website in plain text and let AI build the structure for you. Supports OpenCode Zen and Google Gemini.
- **Import / Export JSON** — Save your sitemap as a `.json` file and reload it anytime.
- **Export as PNG** — Download a rendered image of your sitemap with theme-aware colors.
- **Project Persistence** — Store multiple projects in PostgreSQL with auto-save.
- **Dark / Light Theme** — Toggle between themes with persisted preference.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) + [Vue 3](https://vuejs.org) |
| Database | [PostgreSQL 15](https://www.postgresql.org) via [Docker](https://www.docker.com) |
| ORM | [Prisma 7](https://www.prisma.io) |
| AI Providers | [OpenCode Zen](https://opencode.ai) / [Google Gemini](https://ai.google.dev) |
| Language | TypeScript |

## Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [Yarn](https://yarnpkg.com) (or npm)
- [Docker](https://www.docker.com) (for PostgreSQL)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/sitemap-generator.git
cd sitemap-generator
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
OPENCODE_API_KEY="your-opencode-api-key"
GEMINI_API_KEY="your-gemini-api-key"
DATABASE_URL="postgresql://root:rootpassword@localhost:5433/sitemap?schema=public"
```

> **Note:** AI keys are optional. The editor works without them — AI generation simply won't be available.

### 4. Start the database

```bash
docker compose up -d
```

### 5. Run database migrations

```bash
npx prisma migrate deploy
```

### 6. Start the development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Create a project** from the dashboard and open it.
2. **Add pages** by hovering over a node's header and clicking the `+` button.
3. **Edit titles and paths** by clicking directly on them.
4. **Add sections** by hovering over a page card and clicking `+ Add Section` at the bottom.
5. **Generate with AI** by opening the AI sidebar, selecting a provider/model, typing a description, and clicking generate.
6. **Export** your sitemap as JSON or PNG using the toolbar buttons.

## Project Structure

```
├── app/
│   ├── components/        # Vue components (SitemapBoard, SitemapNode, AIGeneratorSidebar)
│   ├── composables/       # Reactive state (useSitemap, useTheme)
│   ├── pages/             # Route pages (dashboard, project editor)
│   └── assets/css/        # Global styles and theme variables
├── server/
│   ├── api/projects/      # CRUD endpoints for projects
│   ├── api/ai/            # AI sitemap generation endpoint
│   └── utils/             # Prisma client singleton
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration history
├── docker-compose.yml     # PostgreSQL service
└── nuxt.config.ts         # Nuxt configuration
```

## Scripts

| Command | Description |
|---------|------------|
| `yarn dev` | Start the development server |
| `yarn build` | Build for production |
| `yarn preview` | Preview the production build |
| `yarn generate` | Generate a static site |

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

## License

This project is licensed under the [MIT License](LICENSE).
