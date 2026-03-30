import { defineCommand } from "citty";
import { listWorktrees } from "../lib/git.js";
import { loadConfig } from "../lib/config.js";
import { resolveWorktreeName } from "../lib/paths.js";
import * as ui from "../lib/ui.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "List all worktrees",
  },
  aliases: ["ls"],
  args: {
    json: {
      type: "boolean",
      description: "Output as JSON",
    },
  },
  async run(ctx) {
    const config = await loadConfig();
    const worktrees = await listWorktrees(config.rootDir);

    const enriched = worktrees.map((wt) => {
      const name = wt.isMain ? "* (main)" : resolveWorktreeName(wt.path, config.rootDir, config);
      return { ...wt, displayName: name };
    });

    if (ctx.args.json) {
      console.log(JSON.stringify(enriched, null, 2));
      return;
    }

    if (enriched.length === 0) {
      ui.info("No worktrees found");
      return;
    }

    const rows = [
      ["NAME", "BRANCH", "HEAD", "STATUS"],
      ...enriched.map((wt) => [
        wt.displayName,
        wt.branch ?? "(detached)",
        wt.head,
        wt.initialized ? "initialized" : "new",
      ]),
    ];

    ui.printTable(rows);
    console.log();
  },
});
