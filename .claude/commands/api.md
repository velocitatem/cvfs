Scaffold a new API endpoint. Read apps/backend/fastapi/server.py (or flask if BACKEND_MODE=flask) first.

From the arguments, determine:
- HTTP method and path (e.g. POST /items)
- Request/response shape
- Any DB or external service calls needed

Add the route to the appropriate server.py. Follow the existing structure:
- Use Pydantic models for FastAPI request/response schemas
- Use dotenv for any config
- Add proper status codes and error responses
- Keep business logic out of the route handler; extract to a helper if more than ~15 lines

If a new dependency is needed, add it to requirements.txt.
