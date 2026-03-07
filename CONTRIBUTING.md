# Contributing to gbstudio-mcp

Thanks for your interest in contributing! This project is open to PRs and issue reports.

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node.js version and OS

## Submitting Pull Requests

1. Fork the repo and create a feature branch
2. Make your changes with tests if applicable
3. Run `npm run build` to verify it compiles
4. Open a PR with a clear description of the change

## Code Style

- **TypeScript strict mode** — the project uses `strict: true` in tsconfig
- **Descriptive tool names** — tools should read like actions: `add_scene`, `update_actor`
- **JSDoc on public functions** — every exported function needs a doc comment

## Adding a New Tool

1. Create or edit the relevant file in `src/tools/` (group by domain: scenes, actors, etc.)
2. Define your tool with a clear `name`, `description`, and `inputSchema` using JSON Schema
3. Register it in `src/index.ts` by adding it to the tool list and the request handler
4. Keep tool descriptions concise but specific — they're the AI's documentation
5. Run `npm run build` to verify

Pattern to follow:

```typescript
{
  name: "my_new_tool",
  description: "One-line description of what it does",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "What this param controls" }
    },
    required: ["param"]
  }
}
```

## Questions?

Open an issue — happy to help.
