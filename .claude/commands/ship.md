Stage all meaningful changes and create a commit with a concise, accurate message following conventional commits format (feat:, fix:, refactor:, chore:, etc.).

Steps:
1. Run `git status` and `git diff` to understand what changed
2. Skip any generated files, lockfiles (unless intentional), secrets, or build artifacts
3. Stage the relevant changes with `git add`
4. Write a commit message: one-line summary (type: description), optional body if needed
5. Commit

Do not push unless explicitly asked. Do not amend existing commits. Report what was committed.
