import { defineCommand } from "citty";
import { loadConfig } from "../lib/config.js";
import { getWorktreeStatus, listWorktrees } from "../lib/git.js";
import { resolveWorktreePath, resolveWorktreeName } from "../lib/paths.js";
import { readSentinel } from "../lib/sentinel.js";
import * as ui from "../lib/ui.js";

export default defineCommand({
  meta: {
    name: "status",
    description: "Show worktree status",
  },
  args: {
    name: {
      type: "positional",
      description: "Worktree name (defaults to current)",
      required: false,
    },
  },
  async run(ctx) {
    const config = await loadConfig();
    const name = ctx.args.name as string | undefined;

    let wtPath: string;
    if (name) {
      wtPath = resolveWorktreePath(config.rootDir, name, config);
    } else {
      const worktrees = await listWorktrees(config.rootDir);
      const cwd = process.cwd();
      const current = worktrees.find((wt) => wt.path === cwd);
      if (!current) {
        ui.error("Not in a worktree directory");
        process.exit(1);
      }
      wtPath = current.path;
    }

    const [status, sentinel] = await Promise.all([
      getWorktreeStatus(wtPath),
      readSentinel(wtPath),
    ]);

    ui.header(`Worktree: ${resolveWorktreeName(wtPath, config.rootDir, config)}`);
    console.log(`  ${ui.bold("Branch:")}   ${status.branch}`);
    console.log(`  ${ui.bold("HEAD:")}      ${status.head}`);
    console.log(`  ${ui.bold("Changes:")}   ${status.changedFiles} file(s)`);
    console.log(`  ${ui.bold("Last commit:")} ${status.lastCommit}`);
    console.log(`  ${ui.bold("Init:")}      ${sentinel ? `yes (${sentinel.initializedAt})` : "no"}`);
    console.log();
  },
});
