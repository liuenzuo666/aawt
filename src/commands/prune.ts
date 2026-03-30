import { defineCommand } from "citty";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../lib/config.js";
import { pruneWorktrees, listWorktrees } from "../lib/git.js";
import * as ui from "../lib/ui.js";

export default defineCommand({
  meta: {
    name: "prune",
    description: "Prune stale worktree references",
  },
  async run() {
    const config = await loadConfig();

    ui.info("Pruning stale worktree references...");
    await pruneWorktrees(config.rootDir);

    const dir = config.worktreeDir ?? ".aawt";
    const worktreeBase = path.isAbsolute(dir) ? dir : path.resolve(config.rootDir, dir);

    if (fs.existsSync(worktreeBase)) {
      const worktrees = await listWorktrees(config.rootDir);
      const activePaths = new Set(worktrees.map((wt) => wt.path));

      const entries = fs.readdirSync(worktreeBase);
      for (const entry of entries) {
        const entryPath = path.resolve(worktreeBase, entry);
        if (!activePaths.has(entryPath)) {
          ui.info(`Removing stale directory: ${entry}`);
          fs.rmSync(entryPath, { recursive: true, force: true });
        }
      }
    }

    ui.success("Prune complete");
  },
});
