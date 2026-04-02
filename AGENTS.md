# UltiPlate - Agent Instructions

Scaffold for any project: webapp, API, ML pipeline, scraper, worker, CLI, or SDK. Deployable via Makefile and Docker Compose.

## Project Layout

```
apps/webapp/          Next.js 15 + React 19 + Tailwind 4 (Bun, Turbopack, auth optional)
apps/webapp-minimal/  Streamlit prototype
apps/backend/fastapi/ FastAPI server
apps/backend/flask/   Flask server
apps/worker/          Celery worker (Redis broker)
ml/                   PyTorch ML pipeline (arch, train, inference, etl)
alveslib/             Shared Python library: logger, scraper, agent
src/                  Simple scripts / CLI
```

## Rules for Agents

- Use `make init` to bootstrap. Use `make dev` to run webapp. Use `make help` for all targets.
- Python deps: use root `pyproject.toml` + `uv.lock`; `make envlink` propagates `.env` to sub-apps.
- JS/TS: Bun is the package manager for `apps/webapp`. Use `bun add` / `bun install` / `bun dev`.
- Do not create rogue files or test scripts outside the established structure.
- All shared Python utilities go in `alveslib/`. Import from there, never duplicate logic.
- No emojis in code, comments, or logs.

## AI / Agent SDK

`ANTHROPIC_API_KEY` is required for AI features. `alveslib.agent` provides:

```python
from alveslib import ask, stream, Agent

ask("prompt")            # blocking one-shot
stream("prompt")         # iterator of text chunks
Agent(system="...").chat("prompt")  # multi-turn
```

For full agentic loops with file/bash tools, use the Claude Agent SDK:
```bash
pip install claude-agent-sdk
```
```python
from claude_agent_sdk import query, ClaudeAgentOptions
async for msg in query(prompt="...", options=ClaudeAgentOptions(allowed_tools=["Read","Bash"])):
    print(msg)
```

## Slash Commands (.claude/commands/)

Use in Claude Code sessions (type `/`):
- `/plan` - plan an implementation within this boilerplate
- `/build` - implement a feature end-to-end
- `/api` - scaffold a backend endpoint
- `/page` - scaffold a Next.js page
- `/review` - review recent changes
- `/ship` - commit staged changes
