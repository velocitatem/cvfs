Run `git diff HEAD` (or `git diff HEAD~1` if nothing staged) to get recent changes.

Review the diff for:
1. Correctness - logic errors, off-by-ones, missing error handling
2. Code style - violations of CLAUDE.md tenets (redundancy, unclear names, noisy loops)
3. Security - exposed secrets, unvalidated input, CORS issues, SQL injection surface
4. Performance - N+1 queries, blocking I/O in async context, missing indices
5. Missing edge cases or TODOs that should be addressed before shipping

Be direct. List issues with file:line references where possible. Skip praise.
