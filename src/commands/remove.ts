import { defineCommand } from "citty";
import { loadConfig } from "../lib/config.js";
import { removeWorktree, hasUncommittedChanges, deleteBranch } from "../lib/git.js";
import { resolveWorktreePath } from "../lib/paths.js";
import * as ui from "../lib/ui.js";

export default defineCommand({
  meta: {
    name: "remove",
    description: "Remove a worktree",
  },
  aliases: ["rm"],
  args: {
    name: {
      type: "positional",
      description: "Worktree name",
      required: true,
    },
    force: {
      type: "boolean",
      description: "Force removal even with uncommitted changes",
    },
    "keep-branch": {
      type: "boolean",
      description: "Don't delete the associated branch",
    },
  },
  async run(ctx) {
    const name = ctx.args.name as string;
    const config = await loadConfig();
    const wtPath = resolveWorktreePath(config.rootDir, name, config);

    if (!ctx.args.force) {
      const hasChanges = await hasUncommittedChanges(wtPath);
      if (hasChanges) {
        ui.error(`Worktree "${name}" has uncommitted changes. Use --force to remove anyway.`);
        process.exit(1);
      }
    }

    ui.info(`Removing worktree ${ui.bold(name)}`);
    await removeWorktree(wtPath, { force: ctx.args.force as boolean }, config.rootDir);

    if (!ctx.args["keep-branch"]) {
      try {
        await deleteBranch(name, config.rootDir);
      } catch {
        // branch may not exist or already deleted
      }
    }

    ui.success(`Worktree "${name}" removed`);
  },
});
