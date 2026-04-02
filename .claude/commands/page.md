Scaffold a new Next.js App Router page. Read apps/webapp/src/app/layout.tsx and an existing page (e.g. apps/webapp/src/app/page.tsx) for context.

From the arguments, determine:
- Route path (maps to directory under apps/webapp/src/app/)
- Whether it needs auth (server component checking Supabase session)
- Whether it needs client interactivity (use client directive)
- Data it needs to fetch

Create the page file bare-bones with correct structure - no inline styles. Add any new strings to apps/webapp/src/locales/en/common.json. If a reusable component is needed, create it in apps/webapp/src/components/ without styling (styling is done last per CLAUDE.md).

If the page requires server actions, create an adjacent actions.ts file.
