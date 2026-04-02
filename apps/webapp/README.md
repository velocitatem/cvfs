Next.js 15 webapp with React 19, Tailwind CSS 4, Supabase auth, and Turbopack.

## Start

```bash
bun dev
# or from project root: make run.webapp
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Dev server with Turbopack |
| `bun build` | Production build |
| `bun start` | Serve production build |
| `bun lint` | Run ESLint |
| `bun typecheck` | Run tsc --noEmit |

## Auth

Auth is wired to Supabase via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Set `NEXT_PUBLIC_REQUIRE_AUTH=false` in `.env` to disable auth-gating entirely (default for quick prototyping).

## Structure

```
src/
  app/           - Next.js App Router pages
  components/    - Reusable bare-bones components (style last)
  utils/supabase - Supabase client helpers
  libs/          - Shared utilities
  locales/       - i18n strings (add languages as needed)
```
