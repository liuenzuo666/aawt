import { defineCommand } from "citty";
import fs from "node:fs";
import { loadConfig } from "../lib/config.js";
import { addWorktree, getCurrentBranch } from "../lib/git.js";
import { resolveWorktreePath } from "../lib/paths.js";
import { isInitialized, markInitialized } from "../lib/sentinel.js";
import { runHooks } from "../lib/hooks.js";
import type { TemplateConfig } from "../types.js";
import * as ui from "../lib/ui.js";

export default defineCommand({
  meta: {
    name: "new",
    description: "Create a new worktree",
  },
  aliases: ["n"],
  args: {
    name: {
      type: "positional",
      description: "Worktree name",
      required: true,
    },
    base: {
      type: "string",
      alias: "b",
      description: "Base branch",
    },
    template: {
      type: "string",
      alias: "t",
      description: "Use a named template",
    },
    detach: {
      type: "boolean",
      description: "Create detached HEAD",
    },
    "skip-init": {
      type: "boolean",
      description: "Skip init hooks",
    },
    "skip-setup": {
      type: "boolean",
      description: "Skip setup hooks",
    },
    force: {
      type: "boolean",
      description: "Force creation even if branch exists",
    },
  },
  async run(ctx) {
    const name = ctx.args.name as string;
    const config = await loadConfig();

    const templateName = ctx.args.template as string | undefined;
    let template: TemplateConfig | undefined;
    if (templateName) {
      template = config.templates?.[templateName];
      if (!template) {
        ui.error(`Template "${templateName}" not found in config`);
        process.exit(1);
      }
    }

    const base =
      (ctx.args.base as string) ??
      template?.base ??
      config.defaultBase ??
      (await getCurrentBranch());

    const branchPrefix = template?.branchPrefix ?? "";
    const branch = ctx.args.detach
      ? undefined
      : `${branchPrefix}${name}`;

    const wtPath = resolveWorktreePath(config.rootDir, name, config);

    if (fs.existsSync(wtPath) && !ctx.args.force) {
      ui.error(`Worktree already exists at ${wtPath}`);
      process.exit(1);
    }

    ui.info(`Creating worktree ${ui.bold(name)} from ${ui.bold(base)}`);

    await addWorktree({
      branch: branch ?? name,
      path: wtPath,
      base,
      detach: ctx.args.detach as boolean,
      force: ctx.args.force as boolean,
    });

    const initialized = await isInitialized(wtPath);
    const skipInit = ctx.args["skip-init"] as boolean;
    const skipSetup = ctx.args["skip-setup"] as boolean;

    if (!initialized && !skipInit) {
      const initCommands = template?.init ?? config.init ?? [];
      if (initCommands.length > 0) {
        ui.info(`Running init hooks (${initCommands.length} commands)...`);
        const results = await runHooks(initCommands, wtPath, { label: "init" });
        const allOk = results.every((r) => r.exitCode === 0);
        if (allOk) {
          await markInitialized(wtPath, name, results);
          ui.success(`Worktree initialized`);
        } else {
          ui.warn(`Worktree created but init incomplete`);
        }
      } else {
        await markInitialized(wtPath, name, []);
        ui.success(`Worktree created`);
      }
    } else if (initialized && !skipSetup) {
      const setupCommands = template?.setup ?? config.setup ?? [];
      if (setupCommands.length > 0) {
        ui.info(`Running setup hooks (${setupCommands.length} commands)...`);
        await runHooks(setupCommands, wtPath, { label: "setup" });
      }
      ui.success(`Worktree ready`);
    } else if (!initialized && skipInit) {
      ui.success(`Worktree created (init skipped)`);
    } else {
      ui.success(`Worktree created`);
    }

    console.log(`\n  ${ui.dim("path:")} ${wtPath}`);
    if (branch) console.log(`  ${ui.dim("branch:")} ${branch}`);
  },
});
