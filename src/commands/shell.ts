import { defineCommand } from "citty";
import { loadConfig } from "../lib/config.js";
import { resolveWorktreePath } from "../lib/paths.js";

export default defineCommand({
  meta: {
    name: "shell",
    description: "Print worktree path for shell integration",
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
    const config = await loadConfig();
    const wtPath = resolveWorktreePath(config.rootDir, name, config);
    process.stdout.write(wtPath);
  },
});
