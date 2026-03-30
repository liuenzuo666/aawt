import { defineCommand } from "citty";
import { loadConfig } from "../lib/config.js";
import { resolveWorktreePath } from "../lib/paths.js";

export default defineCommand({
  meta: {
    name: "run",
    description: "Run a command in a worktree",
  },
  args: {
    name: {
      type: "positional",
      description: "Worktree name",
      required: true,
    },
  },
  async run(ctx) {
    const name = ctx.args.name as string;
    const cmdArgs = (ctx.args._ as string[]).slice(1);

    if (cmdArgs.length === 0) {
      console.error("No command specified. Usage: aawt run <name> -- <command>");
      process.exit(1);
    }

    const config = await loadConfig();
    const wtPath = resolveWorktreePath(config.rootDir, name, config);

    const proc = Bun.spawn(cmdArgs, {
      cwd: wtPath,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await proc.exited;
    process.exit(exitCode);
  },
});
