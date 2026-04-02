Read CLAUDE.md and AGENTS.md. Read the relevant existing code before making any changes.

Implement the feature or task described in the arguments end-to-end across the full stack as needed. Follow the code style rules in CLAUDE.md strictly:
- No redundant comments, no boilerplate, no fluff
- Pure functions preferred, side effects at boundaries
- Reuse what already exists in alveslib before writing new utilities
- Type all public interfaces
- Keep modules under 400 lines

After implementing, run a quick sanity check:
- If Python changed: check imports resolve correctly
- If Next.js changed: check TypeScript compiles (bun run typecheck)
- If docker-compose changed: verify YAML is valid

Do not create documentation files. Do not add emojis. Summarize what was done in one paragraph.
