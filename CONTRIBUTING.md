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
2. Add your tool to the module's exported record with a `description`, `inputSchema`, and `handler`
3. If you created a **new file**, import and spread it in `src/index.ts`'s `allTools` object
4. Keep tool descriptions concise but specific — they're the AI's documentation
5. Run `npm run build && node test.mjs` to verify

Pattern to follow (tools are keyed by name in the record):

```typescript
export const myTools = {
  my_new_tool: {
    description: "One-line description of what it does",
    inputSchema: {
      type: "object" as const,
      properties: {
        param: { type: "string", description: "What this param controls" }
      },
      required: ["param"]
    },
    handler: async (args: { param: string }) => {
      // ... your logic ...
      return { content: [{ type: "text" as const, text: "Result" }] };
    }
  }
};
```

## Questions?

Open an issue — happy to help.
